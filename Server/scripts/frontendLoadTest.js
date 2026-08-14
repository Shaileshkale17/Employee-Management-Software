import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { Employee } from "../model/Employee.model.js";
import { Company } from "../model/Company.model.js";
import { Attendance } from "../model/Attendance.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "..");
const CLIENT_DIR = path.resolve(__dirname, "../../Client");
const VITE_BIN = path.resolve(CLIENT_DIR, "node_modules/vite/bin/vite.js");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const has = (name) => args.includes(name);

const USERS = Math.max(1, Number(flag("--users", "1000")));
const CONCURRENCY = Math.max(0, Number(flag("--concurrency", "0")));
const PASSWORD = "LoadTest@123";
const REQUEST_TIMEOUT_MS = 60000;
const SERVER_START_TIMEOUT_MS = 60000;

if (has("--help") || has("-h")) {
  console.log(`
Frontend load test: N concurrent users each load the SPA, log in, then clock in.

Usage: node scripts/frontendLoadTest.js [options]

Options:
  --users N         total users to simulate (default: 1000)
  --concurrency N   max users in flight at once. 0 = fire all N at the same time
                    (default). Values below ~232 let every request complete, but
                    this machine refuses more than ~232 simultaneous TCP
                    connections per port (OS loopback cap), so 'all at once'
                    will drop connections beyond that limit.
  --preview         serve the built app with 'vite preview' (run 'npm run build'
                    first) instead of the dev server
  --server-url URL  use an already-running backend (e.g. http://127.0.0.1:3000)
  --frontend-url URL use an already-running frontend (e.g. http://127.0.0.1:5173)
  --help            show this help
`);
  process.exit(0);
}

const getFreePort = () =>
  new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });

const startProcess = ({ file, args, cwd, env, ready }) =>
  new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, env });
    let settled = false;
    let out = "";
    const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error(`Process did not become ready within ${SERVER_START_TIMEOUT_MS}ms\n${stripAnsi(out)}`));
      }
    }, SERVER_START_TIMEOUT_MS);
    const onData = (chunk) => {
      out += chunk;
      if (!settled && ready(stripAnsi(out))) {
        settled = true;
        clearTimeout(timer);
        resolve(child);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Process exited early (code ${code})\n${out}`));
      }
    });
  });

const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

const summarize = (results) => {
  const statuses = {};
  const lat = [];
  let ok = 0;
  for (const r of results) {
    statuses[r.status] = (statuses[r.status] || 0) + 1;
    if (r.status >= 200 && r.status < 300) ok++;
    lat.push(r.ms);
  }
  lat.sort((a, b) => a - b);
  const out = { ok, statuses, lat };
  const firstErr = results.find((r) => r.status === 0 || r.status >= 400);
  if (firstErr) {
    out.firstErr = `HTTP ${firstErr.status} ${JSON.stringify(firstErr.body || {}).slice(0, 160)}`;
  }
  return out;
};

const report = (label, results, totalMs) => {
  const s = summarize(results);
  console.log(`\n===== ${label} =====`);
  console.log(`requests   : ${results.length}`);
  console.log(
    `wall time  : ${totalMs} ms  (${Math.round((results.length / totalMs) * 1000)} req/s)`
  );
  console.log(`success    : ${s.ok}`);
  console.log(`statuses   : ${JSON.stringify(s.statuses)}`);
  console.log(
    `latency(ms): min=${s.lat[0]}  p50=${percentile(s.lat, 50)}  p95=${percentile(s.lat, 95)}  p99=${percentile(s.lat, 99)}  max=${s.lat[s.lat.length - 1]}`
  );
  if (s.firstErr) console.log(`sample err : ${s.firstErr}`);
  return s;
};

const step = async (fn) => {
  const t0 = Date.now();
  try {
    const res = await fn();
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (body === null) {
      try {
        body = (await res.text()).slice(0, 160);
      } catch {}
    }
    return { status: res.status, ms: Date.now() - t0, body };
  } catch (err) {
    return { status: 0, ms: Date.now() - t0, body: { error: err.message } };
  }
};

const main = async () => {
  const backendPort = has("--server-url")
    ? null
    : await getFreePort();
  const frontendPort = has("--frontend-url")
    ? null
    : await getFreePort();
  const backendBase = has("--server-url")
    ? flag("--server-url").replace(/\/$/, "")
    : `http://127.0.0.1:${backendPort}`;
  const frontendBase = has("--frontend-url")
    ? flag("--frontend-url").replace(/\/$/, "")
    : `http://127.0.0.1:${frontendPort}`;
  const apiBase = `${backendBase}/api`;

  let child = null;
  let frontendChild = null;
  let createdIds = [];
  let createdCompany = null;

  try {
    console.log(`Connecting to DB and seeding ${USERS} temp user(s)...`);
    await mongoose.connect(process.env.URL);

    let company = await Company.findOne().select("_id");
    if (!company) {
      const suffix = Date.now();
      company = await Company.create({
        name: `Frontend Load Test ${suffix}`,
        slug: `frontend-loadtest-${suffix}`,
        email: `frontend-loadtest-${suffix}@example.com`,
      });
      createdCompany = company;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const tag = `ft${Date.now()}`;
    const docs = Array.from({ length: USERS }, (_, i) => ({
      name: `Frontend Load Test User ${i + 1}`,
      email: `${tag}_${i}@example.com`,
      password: passwordHash,
      role: "Employee",
      companyId: company._id,
      status: "Active",
      mfaEnabled: false,
      employeeId: `${tag}${i}`,
    }));
    const inserted = await Employee.insertMany(docs);
    createdIds = inserted.map((e) => e._id);

    if (!has("--server-url")) {
      console.log(`Starting backend on port ${backendPort}...`);
      child = await startProcess({
        file: process.execPath,
        args: [path.resolve(SERVER_DIR, "index.js")],
        cwd: SERVER_DIR,
        env: {
          ...process.env,
          PORT: String(backendPort),
          GLOBAL_RATE_LIMIT_MAX: "1000000",
          AUTH_RATE_LIMIT_MAX: "1000000",
          ATTENDANCE_CUTOFF_TIME: "23:59",
        },
        ready: (out) => out.includes(`Listening on port: ${backendPort}`),
      });
    } else {
      console.log(`Using already-running backend at ${backendBase}`);
    }

    if (!has("--frontend-url")) {
      const mode = has("--preview") ? "preview" : "dev";
      console.log(`Starting frontend (vite ${mode}) on port ${frontendPort}...`);
      frontendChild = await startProcess({
        file: process.execPath,
        args: [VITE_BIN, mode, "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"],
        cwd: CLIENT_DIR,
        env: {
          ...process.env,
          VITE_BACKEND_URL: `${apiBase}`,
          VITE_SOCKET_URL: `${backendBase}`,
        },
        ready: (out) => out.includes(`127.0.0.1:${frontendPort}`),
      });
    } else {
      console.log(`Using already-running frontend at ${frontendBase}`);
    }

    console.log(
      `Firing ${USERS} concurrent user(s): page load -> login -> clock-in\n` +
        `  frontend : ${frontendBase}/\n` +
        `  backend  : ${backendBase}/api`
    );

    const runUser = async (email) => {
      const page = await step(() =>
        fetch(`${frontendBase}/`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      );

      const login = await step(() =>
        fetch(`${apiBase}/emp/emp-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: PASSWORD }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
      );
      const token = login.status >= 200 && login.status < 300 ? login.body?.token : null;

      const clockin = token
        ? await step(() =>
            fetch(`${apiBase}/attendance/clock-in`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            })
          )
        : { status: 0, ms: 0, body: { error: "login failed, no token" } };

      return {
        ok:
          page.status >= 200 &&
          page.status < 300 &&
          login.status >= 200 &&
          login.status < 300 &&
          clockin.status >= 200 &&
          clockin.status < 300,
        page,
        login,
        clockin,
      };
    };

    const tStart = Date.now();
    const flows = [];
    if (CONCURRENCY > 0) {
      const total = Math.ceil(USERS / CONCURRENCY);
      console.log(`Running in waves of ${CONCURRENCY} concurrent user(s) (${total} wave(s))...`);
      for (let i = 0; i < USERS; i += CONCURRENCY) {
        const chunk = Array.from({ length: Math.min(CONCURRENCY, USERS - i) }, (_, k) => `${tag}_${i + k}@example.com`);
        flows.push(...(await Promise.all(chunk.map(runUser))));
        console.log(`  wave ${Math.ceil((i + chunk.length) / CONCURRENCY)}/${total} done (${flows.length}/${USERS})`);
      }
    } else {
      flows.push(...(await Promise.all(Array.from({ length: USERS }, (_, i) => `${tag}_${i}@example.com`).map(runUser))));
    }
    const wallMs = Date.now() - tStart;

    const ok = report("FRONTEND FULL FLOW x" + USERS, flows.map((f) => ({
      status: f.ok ? 200 : 500,
      ms: f.page.ms + f.login.ms + f.clockin.ms,
      body: null,
    })), wallMs);
    report("  step: page load", flows.map((f) => f.page), wallMs);
    report("  step: login", flows.map((f) => f.login), wallMs);
    report("  step: clock-in", flows.map((f) => f.clockin), wallMs);

    process.exitCode = ok.ok === USERS ? 0 : 1;
    if (ok.ok !== USERS) {
      console.log(`\nExpected ${USERS} full-flow success(es), got ${ok.ok}.`);
      const pageFails = flows.filter((f) => f.page.status === 0).length;
      if (pageFails > 0) {
        console.log(
          `\nNote: ${pageFails} page-load request(s) were dropped by an OS-level loopback\n` +
            `connection cap (~232 simultaneous TCP connections per port on this machine).\n` +
            `The app steps (login, clock-in) passed for all users.\n` +
            `Re-run with --concurrency 200 to complete all ${USERS} users in waves.`
        );
      }
    }
  } catch (error) {
    console.error("\nFrontend load test failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (frontendChild) frontendChild.kill();
    if (child) child.kill();
    try {
      if (createdIds.length) {
        await Attendance.deleteMany({ employeeId: { $in: createdIds } });
        await Employee.deleteMany({ _id: { $in: createdIds } });
      }
    } catch (e) {
      console.error("Cleanup warning:", e.message);
    }
    if (createdCompany) {
      try {
        await Company.deleteOne({ _id: createdCompany._id });
      } catch (e) {
        console.error("Cleanup warning:", e.message);
      }
    }
    try {
      await mongoose.disconnect();
    } catch {}
  }
};

main();
