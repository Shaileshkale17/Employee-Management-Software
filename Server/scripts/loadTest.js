import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Employee } from "../model/Employee.model.js";
import { Company } from "../model/Company.model.js";
import { Attendance } from "../model/Attendance.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(SERVER_DIR, ".env") });

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const has = (name) => args.includes(name);

const USERS = Math.max(1, Number(flag("--users", "1000")));
const MODE = flag("--mode", "clockin");
const SAME_USER = has("--same-user");
const SERVER_URL = has("--server-url") ? flag("--server-url") : null;
const REQUEST_TIMEOUT_MS = 30000;
const SERVER_START_TIMEOUT_MS = 30000;

if (has("--help") || has("-h")) {
  console.log(`
Load test the backend with concurrent users.

Usage: node scripts/loadTest.js [options]

Options:
  --users N         number of concurrent requests/users (default: 1000)
  --mode MODE       'clockin' (POST /api/attendance/clock-in, default) or
                    'read'    (GET /api/attendance/today)
  --same-user       hammer the SAME user N times (tests the unique-index race
                    guard in clock-in; expects exactly 1 success)
  --port N          port for the spawned server (default: free port)
  --server-url URL  hit an already-running server instead of spawning one
  --help            show this help
`);
  process.exit(0);
}

if (!["clockin", "read"].includes(MODE)) {
  console.error("Invalid --mode. Use 'clockin' or 'read'.");
  process.exit(1);
}
if (SAME_USER && MODE !== "clockin") {
  console.error("--same-user only applies to --mode clockin");
  process.exit(1);
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

const startServer = (port) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["index.js"], {
      cwd: SERVER_DIR,
      env: {
        ...process.env,
        PORT: String(port),
        ATTENDANCE_CUTOFF_TIME: "23:59",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let settled = false;
    let out = "";
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(
          new Error(`Server did not start within ${SERVER_START_TIMEOUT_MS}ms\n${out}`)
        );
      }
    }, SERVER_START_TIMEOUT_MS);
    const onData = (chunk) => {
      out += chunk;
      if (!settled && out.includes(`Listening on port: ${port}`)) {
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
        reject(new Error(`Server exited early (code ${code})\n${out}`));
      }
    });
  });

const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

const report = (label, results, totalMs) => {
  const statuses = {};
  const lat = [];
  let ok = 0;
  for (const r of results) {
    statuses[r.status] = (statuses[r.status] || 0) + 1;
    if (r.status >= 200 && r.status < 300) ok++;
    lat.push(r.ms);
  }
  lat.sort((a, b) => a - b);
  console.log(`\n===== ${label} =====`);
  console.log(`requests   : ${results.length}`);
  console.log(
    `wall time  : ${totalMs} ms  (${Math.round((results.length / totalMs) * 1000)} req/s)`
  );
  console.log(`success    : ${ok}`);
  console.log(`statuses   : ${JSON.stringify(statuses)}`);
  console.log(
    `latency(ms): min=${lat[0]}  p50=${percentile(lat, 50)}  p95=${percentile(lat, 95)}  p99=${percentile(lat, 99)}  max=${lat[lat.length - 1]}`
  );
  const firstErr = results.find((r) => r.status >= 400);
  if (firstErr) {
    console.log(
      `sample err : HTTP ${firstErr.status} ${JSON.stringify(firstErr.body || {}).slice(0, 200)}`
    );
  }
  return ok;
};

const main = async () => {
  const port = has("--port")
    ? Number(flag("--port"))
    : SERVER_URL
      ? null
      : await getFreePort();
  const base = SERVER_URL || `http://127.0.0.1:${port}`;

  console.log(`Connecting to DB and seeding ${USERS} temp user(s)...`);

  let child = null;
  let createdIds = [];
  let createdCompany = null;
  try {
    await mongoose.connect(process.env.URL);

    let company = await Company.findOne().select("_id");
    if (!company) {
      const suffix = Date.now();
      company = await Company.create({
        name: `Load Test ${suffix}`,
        slug: `loadtest-${suffix}`,
        email: `loadtest-${suffix}@example.com`,
      });
      createdCompany = company;
    }

    const tag = `lt${Date.now()}`;
    const docs = Array.from({ length: USERS }, (_, i) => ({
      name: `Load Test User ${i + 1}`,
      email: `${tag}_${i}@example.com`,
      password: "LoadTest@123",
      role: "Employee",
      companyId: company._id,
      status: "Active",
      employeeId: `${tag}${i}`,
    }));
    const inserted = await Employee.insertMany(docs);
    createdIds = inserted.map((e) => e._id);

    const tokens = createdIds.map((id) =>
      jwt.sign(
        { id: String(id), role: "Employee", companyId: String(company._id) },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      )
    );

    if (SERVER_URL) {
      console.log(`Using already-running server at ${SERVER_URL}`);
    } else {
      console.log(`Starting server on port ${port}...`);
      child = await startServer(port);
    }

    const endpoint =
      MODE === "clockin" ? "/api/attendance/clock-in" : "/api/attendance/today";
    const method = MODE === "clockin" ? "POST" : "GET";
    const label =
      MODE === "clockin"
        ? SAME_USER
          ? `CLOCK-IN x${USERS} (single user, race)`
          : `CLOCK-IN x${USERS} (${USERS} users)`
        : `TODAY x${USERS} (${USERS} users, read)`;

    console.log(`Firing ${USERS} concurrent request(s) -> ${method} ${endpoint}`);
    const started = Date.now();
    const results = await Promise.all(
      Array.from({ length: USERS }, (_, i) => {
        const token = SAME_USER ? tokens[0] : tokens[i];
        const t0 = Date.now();
        return fetch(`${base}${endpoint}`, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
          .then(async (res) => {
            let body = null;
            try {
              body = await res.json();
            } catch {}
            return { status: res.status, ms: Date.now() - t0, body };
          })
          .catch((err) => ({
            status: 0,
            ms: Date.now() - t0,
            body: { error: err.message },
          }));
      })
    );
    const wallMs = Date.now() - started;
    const ok = report(label, results, wallMs);

    const expectedOk = MODE === "read" || !SAME_USER ? USERS : 1;
    process.exitCode = ok === expectedOk ? 0 : 1;
    if (ok !== expectedOk) {
      console.log(`\nExpected ${expectedOk} success(es), got ${ok}.`);
    }
  } catch (error) {
    console.error("\nLoad test failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (child) {
      child.kill();
    }
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
