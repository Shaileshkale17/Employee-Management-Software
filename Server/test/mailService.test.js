import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  sendEmail,
  sendWelcomeEmail,
  sendAttendanceEmail,
  sendPasswordResetEmail,
  sendAdminNotificationEmail,
  sendOtpEmail,
  sendLeaveStatusEmail,
  escapeHtml,
  appBaseUrl,
  validateEmailConfig,
  setTransporterForTest,
  resetTransporter,
} from "../utils/mailService.js";

const ENV_KEYS = [
  "EMAIL_ADDRESS",
  "EMAIL_PASSWORD",
  "YOURSELF_EMAIL_ADDRESS",
  "FRONTEND_URL",
  "EMAIL_HOST",
  "EMAIL_PORT",
];

const snapshot = {};

const withEnv = (values, fn) => {
  const prev = {};
  for (const key of ENV_KEYS) prev[key] = process.env[key];
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
  try {
    return fn();
  } finally {
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, prev);
  }
};

const makeFakeTransporter = () => {
  const sent = [];
  return {
    sent,
    sendMail: async (opts) => {
      sent.push(opts);
      return { messageId: "test-message-id", accepted: [opts.to] };
    },
  };
};

beforeEach(() => {
  for (const key of ENV_KEYS) snapshot[key] = process.env[key];
});

afterEach(() => {
  resetTransporter();
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, snapshot);
});

test("sendEmail sends successfully and returns the transporter result", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      const result = await sendEmail({
        to: "employee@example.com",
        subject: "Hello",
        text: "Plain body",
        html: "<p>HTML body</p>",
      });
      assert.equal(result.messageId, "test-message-id");
      assert.equal(fake.sent.length, 1);
      assert.equal(fake.sent[0].to, "employee@example.com");
      assert.equal(fake.sent[0].subject, "Hello");
      assert.equal(fake.sent[0].text, "Plain body");
      assert.equal(fake.sent[0].html, "<p>HTML body</p>");
      assert.equal(fake.sent[0].from, "noreply@example.com");
    }
  );
});

test("sendEmail derives plain-text fallback when only html is provided", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendEmail({
        to: "employee@example.com",
        subject: "Fallback",
        html: "<p>Hello <strong>World</strong></p>",
      });
      assert.ok(fake.sent[0].text.includes("Hello World"));
    }
  );
});

test("sendEmail rejects a missing recipient", async () => {
  await assert.rejects(
    sendEmail({ to: undefined, subject: "x", text: "y" }),
    /recipient \(to\) is required/
  );
});

test("sendEmail rejects an invalid recipient", async () => {
  await assert.rejects(
    sendEmail({ to: "not-an-email", subject: "x", text: "y" }),
    /Invalid email recipient/
  );
});

test("sendEmail rejects a missing subject", async () => {
  await assert.rejects(
    sendEmail({ to: "a@b.com", subject: "", text: "y" }),
    /subject is required/
  );
});

test("sendEmail rejects missing content", async () => {
  await assert.rejects(
    sendEmail({ to: "a@b.com", subject: "x" }),
    /text or html content/
  );
});

test("sendEmail resolves with skipped when SMTP credentials are missing", async () => {
  withEnv(
    { YOURSELF_EMAIL_ADDRESS: "admin@example.com" },
    async () => {
      const result = await sendEmail({
        to: "employee@example.com",
        subject: "Skip",
        text: "body",
      });
      assert.deepEqual(result, { skipped: true });
    }
  );
});

test("sendEmail rejects and logs when the SMTP transporter fails", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const failing = {
        sendMail: async () => {
          const err = new Error("5.7.8 Authentication failed");
          err.code = "EAUTH";
          throw err;
        },
      };
      setTransporterForTest(failing);
      await assert.rejects(
        sendEmail({ to: "a@b.com", subject: "Fail", text: "body" }),
        /Authentication failed/
      );
    }
  );
});

test("sendWelcomeEmail builds a welcome email with name, email and login link", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
      FRONTEND_URL: "https://app.example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendWelcomeEmail({
        to: "new@example.com",
        name: "Jane Doe",
        email: "new@example.com",
        employeeId: "42",
        companyName: "Acme Inc",
      });
      const mail = fake.sent[0];
      assert.equal(mail.to, "new@example.com");
      assert.match(mail.subject, /Welcome aboard/);
      assert.ok(mail.html.includes("Jane Doe"));
      assert.ok(mail.html.includes("Acme Inc"));
      assert.ok(mail.html.includes("42"));
      assert.ok(mail.html.includes("https://app.example.com/"));
      assert.ok(mail.text.includes("new@example.com"));
    }
  );
});

test("sendWelcomeEmail escapes user-controlled values to prevent HTML injection", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendWelcomeEmail({
        to: "new@example.com",
        name: "<img src=x onerror=alert(1)>",
        companyName: "&<script>bad()</script>",
      });
      const mail = fake.sent[0];
      assert.ok(!mail.html.includes("<img"));
      assert.ok(mail.html.includes("&lt;img"));
      assert.ok(mail.html.includes("&lt;script&gt;"));
    }
  );
});

test("escapeHtml escapes HTML metacharacters", () => {
  assert.equal(escapeHtml(`<b>&"'</b>`), "&lt;b&gt;&amp;&quot;&#39;&lt;/b&gt;");
});

test("sendAttendanceEmail late variant", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendAttendanceEmail({
        to: "a@b.com",
        name: "Alex",
        type: "late",
        data: { lateMinutes: 45 },
      });
      assert.match(fake.sent[0].subject, /Late clock-in/);
      assert.ok(fake.sent[0].html.includes("45 minute(s)"));
    }
  );
});

test("sendAttendanceEmail absent variant", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendAttendanceEmail({
        to: "a@b.com",
        name: "Alex",
        type: "absent",
      });
      assert.match(fake.sent[0].subject, /marked absent/i);
    }
  );
});

test("sendAttendanceEmail confirm variant includes work summary", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendAttendanceEmail({
        to: "a@b.com",
        name: "Alex",
        type: "confirm",
        data: { checkIn: "2026-01-05T09:00:00Z", totalMinutes: 480 },
      });
      assert.match(fake.sent[0].subject, /attendance summary/i);
      assert.ok(fake.sent[0].text.includes("480 minute(s)"));
    }
  );
});

test("sendPasswordResetEmail sends an OTP-based reset code", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendPasswordResetEmail({
        to: "a@b.com",
        name: "Alex",
        otp: "123456",
      });
      assert.match(fake.sent[0].subject, /Password reset verification code/);
      assert.ok(fake.sent[0].html.includes("123456"));
    }
  );
});

test("sendOtpEmail MFA variant", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendOtpEmail({ to: "a@b.com", name: "Alex", otp: "654321", purpose: "mfa" });
      assert.match(fake.sent[0].subject, /one-time verification code/);
    }
  );
});

test("sendLeaveStatusEmail builds a leave status email", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendLeaveStatusEmail("a@b.com", "Alex", "Sick", "Approved");
      assert.match(fake.sent[0].subject, /Leave request Approved/);
      assert.ok(fake.sent[0].html.includes("Sick"));
    }
  );
});

test("sendAdminNotificationEmail sends to YOURSELF_EMAIL_ADDRESS", async () => {
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendAdminNotificationEmail({
        subject: "Daily report",
        text: "2 employees absent",
      });
      assert.equal(fake.sent[0].to, "admin@example.com");
    }
  );
});

test("sendAdminNotificationEmail falls back to the sender when no admin address is configured", async () => {
  withEnv(
    { EMAIL_ADDRESS: "noreply@example.com", EMAIL_PASSWORD: "secret" },
    async () => {
      const fake = makeFakeTransporter();
      setTransporterForTest(fake);
      await sendAdminNotificationEmail({ subject: "x", text: "y" });
      assert.equal(fake.sent[0].to, "noreply@example.com");
    }
  );
});

test("validateEmailConfig reports missing variables without printing values", async () => {
  withEnv(
    { EMAIL_ADDRESS: "noreply@example.com", EMAIL_PASSWORD: "secret" },
    () => {
      const result = validateEmailConfig();
      assert.equal(result.ok, false);
      assert.deepEqual(result.missing, ["YOURSELF_EMAIL_ADDRESS"]);
    }
  );
  withEnv(
    {
      EMAIL_ADDRESS: "noreply@example.com",
      EMAIL_PASSWORD: "secret",
      YOURSELF_EMAIL_ADDRESS: "admin@example.com",
    },
    () => {
      const result = validateEmailConfig();
      assert.equal(result.ok, true);
      assert.deepEqual(result.missing, []);
    }
  );
});

test("appBaseUrl defaults and strips trailing slashes", () => {
  withEnv({}, () => {
    assert.equal(appBaseUrl(), "http://localhost:5173");
  });
  withEnv({ FRONTEND_URL: "https://app.example.com/" }, () => {
    assert.equal(appBaseUrl(), "https://app.example.com");
  });
});
