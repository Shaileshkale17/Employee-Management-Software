import nodemailer from "nodemailer";
import { isValidEmail } from "./validation.js";

const BRAND_COLOR = "#3354F4";
const DEFAULT_FROM_NAME = "Employee Management System";

let transporter = null;

/**
 * Escapes user-controlled values before interpolating them into HTML so email
 * templates cannot be used for HTML/script injection.
 */
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Base URL for application links built into emails. */
export const appBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const mailConfig = () => ({
  user: process.env.EMAIL_ADDRESS,
  pass: process.env.EMAIL_PASSWORD,
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  admin: process.env.YOURSELF_EMAIL_ADDRESS || process.env.EMAIL_ADDRESS,
});

/**
 * Validates that the email environment variables required for sending exist.
 * Only used for server-side startup diagnostics; values are never printed.
 */
export const validateEmailConfig = () => {
  const required = ["EMAIL_ADDRESS", "EMAIL_PASSWORD", "YOURSELF_EMAIL_ADDRESS"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(
      `[mail] Missing required email environment variable(s): ${missing.join(", ")}. ` +
        "Email sending will be skipped until they are configured."
    );
    return { ok: false, missing };
  }
  return { ok: true, missing: [] };
};

const createTransporter = () => {
  const { user, pass, host, port } = mailConfig();
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
};

export const getTransporter = () => {
  if (transporter) return transporter;
  return createTransporter();
};

/** Verifies the SMTP connection/credentials without sending a message. */
export const verifyConnection = async () => {
  const t = getTransporter();
  if (!t) return false;
  return t.verify();
};

/** Test hooks - never used outside the test suite. */
export const setTransporterForTest = (mock) => {
  transporter = mock;
};

export const resetTransporter = () => {
  transporter = null;
};

const validatePayload = ({ to, subject, text, html }) => {
  if (!to) throw new Error("Email recipient (to) is required");
  if (!isValidEmail(to)) throw new Error("Invalid email recipient address");
  if (!subject || !String(subject).trim()) throw new Error("Email subject is required");
  if (!text && !html) throw new Error("Email must include text or html content");
};

const toPlainText = (html) =>
  String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Core reusable send function. Supports both `text` and `html`; if only html is
 * provided a plain-text version is derived automatically.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  validatePayload({ to, subject, text, html });
  const t = getTransporter();
  if (!t) {
    console.log(`[mail-skip] ${subject} -> ${to} (SMTP not configured)`);
    return { skipped: true };
  }
  try {
    return await t.sendMail({
      from: process.env.EMAIL_ADDRESS,
      to,
      subject,
      text: text || toPlainText(html),
      html,
    });
  } catch (error) {
    console.error(`[mail-error] Failed to send "${subject}" to ${to}: ${error.message}`);
    throw error;
  }
};

const emailLayout = ({ title, body, cta }) => `
  <div style="background:#f4f6fb; padding:24px 12px;">
    <div style="font-family:Arial, Helvetica, sans-serif; max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
      <div style="padding:22px 24px 0;">
        <span style="display:inline-block; background:${BRAND_COLOR}; color:#ffffff; font-weight:700; font-size:13px; padding:7px 14px; border-radius:8px; letter-spacing:0.3px;">Employee Management System</span>
      </div>
      <div style="padding:18px 24px 26px;">
        <h2 style="color:#1f2937; font-size:20px; margin:0 0 14px;">${title}</h2>
        ${body}
        ${
          cta
            ? `<div style="margin:22px 0 6px; text-align:center;">
                 <a href="${cta.url}" style="background:${BRAND_COLOR}; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; display:inline-block;">${cta.label}</a>
               </div>`
            : ""
        }
      </div>
      <div style="padding:14px 24px; background:#fafbfc; border-top:1px solid #eef2f7; color:#6b7280; font-size:12px;">
        <p style="margin:0;">Sent by your Employee Management System.</p>
        <p style="margin:4px 0 0;">If you did not expect this email, you can safely ignore it.</p>
      </div>
    </div>
  </div>`;

const metaTable = (rows) => `
  <table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:14px; color:#374151;">
    ${rows
      .filter((r) => r?.value)
      .map(
        (r) => `<tr>
          <td style="padding:6px 0; color:#6b7280; width:130px;">${r.label}</td>
          <td><strong>${r.value}</strong></td>
        </tr>`
      )
      .join("")}
  </table>`;

export const sendWelcomeEmail = async ({ to, name, email, employeeId, companyName, loginUrl }) => {
  const displayName = escapeHtml(name || "there");
  const org = companyName ? escapeHtml(companyName) : null;
  const signIn = loginUrl || `${appBaseUrl()}/`;
  const body = `
    <p style="color:#4b5563; margin:0 0 12px;">Hi ${displayName},</p>
    <p style="color:#4b5563; margin:0 0 12px;">Your account has been created${org ? ` for <strong>${org}</strong>` : ""}. Use the details below to sign in.</p>
    ${metaTable([
      { label: "Employee ID", value: employeeId ? escapeHtml(employeeId) : "" },
      { label: "Email address", value: escapeHtml(email || to) },
    ])}
    <p style="color:#6b7280; font-size:13px; margin:0;">
      For security, use the password reset option on the sign-in screen to set your own password before your first login. Never share your password with anyone.
    </p>`;
  const html = emailLayout({
    title: `Welcome aboard${org ? `, ${org}` : ""}!`,
    body,
    cta: { url: signIn, label: "Go to login" },
  });
  return sendEmail({
    to,
    subject: `Welcome aboard${org ? ` — ${org}` : ""}!`,
    text:
      `Hi ${name || "there"},\n\n` +
      `Your account has been created${companyName ? ` for ${companyName}` : ""}.\n\n` +
      `Employee ID: ${employeeId || "—"}\n` +
      `Email address: ${email || to}\n\n` +
      `Sign in at: ${signIn}\n\n` +
      `For security, use the password reset option to set your own password before your first login.`,
    html,
  });
};

export const sendOtpEmail = async ({ to, name, otp, purpose }) => {
  const subject =
    purpose === "mfa"
      ? "Your one-time verification code"
      : "Password reset verification code";
  const displayName = escapeHtml(name || "there");
  const body = `
    <p style="color:#4b5563; margin:0 0 12px;">Hello ${displayName},</p>
    <p style="color:#4b5563; margin:0;">Your one-time verification code is:</p>
    <div style="background:#eef1ff; color:${BRAND_COLOR}; font-size:30px; font-weight:700; text-align:center; padding:16px; border-radius:8px; letter-spacing:8px; margin:16px 0;">${escapeHtml(otp)}</div>
    <p style="color:#6b7280; font-size:13px; margin:0;">This code is valid for 10 minutes. Please do not share it with anyone.</p>`;
  const html = emailLayout({ title: subject, body });
  const text =
    `Hello ${name || "there"},\n\n` +
    `Your one-time verification code is: ${otp}\n` +
    `This code is valid for 10 minutes. Please do not share it with anyone.\n\n` +
    `Best regards,\nEmployee Management System`;
  return sendEmail({ to, subject, text, html });
};

/** Password reset email - follows the existing OTP-based reset flow. */
export const sendPasswordResetEmail = async ({ to, name, otp }) =>
  sendOtpEmail({ to, name, otp, purpose: "password" });

export const sendLeaveStatusEmail = async (to, name, leaveType, status) => {
  const subject = `Leave request ${status}`;
  const displayName = escapeHtml(name || "there");
  const body = `
    <p style="color:#4b5563; margin:0 0 12px;">Hello ${displayName},</p>
    <p style="color:#4b5563; margin:0;">Your <strong>${escapeHtml(leaveType || "leave")}</strong> request has been <strong>${escapeHtml(status || "updated")}</strong>.</p>`;
  const html = emailLayout({ title: `Leave Request ${escapeHtml(status || "Updated")}`, body });
  const text =
    `Hello ${name || "there"},\n\n` +
    `Your ${leaveType} leave request has been ${status}.\n\n` +
    `Best regards,\nEmployee Management System`;
  return sendEmail({ to, subject, text, html });
};

/**
 * Attendance emails.
 *  - type "late":    employee clocked in after the scheduled start
 *  - type "absent":  employee was marked absent after the cutoff time
 *  - type "confirm": daily attendance summary sent after clock-out
 */
export const sendAttendanceEmail = async ({ to, name, type = "confirm", data = {} }) => {
  const displayName = escapeHtml(name || "there");
  const fmtTime = (value) =>
    value
      ? new Date(value).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })
      : "";
  const minutes = (m) => (Number.isFinite(m) && m > 0 ? `${m} minute(s)` : "0 minutes");

  if (type === "late") {
    const late = Number(data.lateMinutes) || 0;
    const subject = "Late clock-in notification";
    const body = `
      <p style="color:#4b5563; margin:0 0 12px;">Hello ${displayName},</p>
      <p style="color:#4b5563; margin:0;">You clocked in <strong>${minutes(late)}</strong> late today. Please plan your day to arrive by the scheduled start time.</p>`;
    const html = emailLayout({ title: "Late Clock-In", body });
    return sendEmail({
      to,
      subject,
      text: `Hello ${name || "there"},\n\nYou clocked in ${late} minute(s) late today. Please plan your day to arrive by the scheduled start time.`,
      html,
    });
  }

  if (type === "absent") {
    const subject = "Attendance marked absent";
    const body = `
      <p style="color:#4b5563; margin:0 0 12px;">Hello ${displayName},</p>
      <p style="color:#4b5563; margin:0;">You have been marked <strong>absent</strong> for today because no attendance was recorded before the cutoff time. If this is incorrect, please contact your administrator.</p>`;
    const html = emailLayout({ title: "Attendance Marked Absent", body });
    return sendEmail({
      to,
      subject,
      text: `Hello ${name || "there"},\n\nYou have been marked absent for today because no attendance was recorded before the cutoff time. If this is incorrect, please contact your administrator.`,
      html,
    });
  }

  const subject = "Today's attendance summary";
  const body = `
    <p style="color:#4b5563; margin:0 0 12px;">Hello ${displayName},</p>
    <p style="color:#4b5563; margin:0;">Your attendance has been recorded for today. Here is your summary:</p>
    ${metaTable([
      { label: "Date", value: escapeHtml(data.date ? new Date(data.date).toDateString() : new Date().toDateString()) },
      { label: "Clock in", value: fmtTime(data.checkIn) },
      { label: "Clock out", value: fmtTime(data.checkOut) },
      { label: "Work time", value: `${minutes(data.totalMinutes)}` },
      { label: "Overtime", value: Number(data.overtimeMinutes) > 0 ? minutes(data.overtimeMinutes) : "" },
    ])}`;
  const html = emailLayout({ title: "Attendance Confirmation", body });
  return sendEmail({
    to,
    subject,
    text:
      `Hello ${name || "there"},\n\n` +
      `Your attendance has been recorded for today.\n` +
      `Clock in: ${fmtTime(data.checkIn)}\n` +
      `Clock out: ${fmtTime(data.checkOut)}\n` +
      `Work time: ${minutes(data.totalMinutes)}\n` +
      (Number(data.overtimeMinutes) > 0 ? `Overtime: ${minutes(data.overtimeMinutes)}\n` : ""),
    html,
  });
};

/** System/admin notification using YOURSELF_EMAIL_ADDRESS as the recipient. */
export const sendAdminNotificationEmail = async ({ subject, text, html }) => {
  const to = mailConfig().admin;
  if (!to) {
    console.log("[mail-skip] Admin notification (YOURSELF_EMAIL_ADDRESS not configured)");
    return { skipped: true };
  }
  return sendEmail({ to, subject, text, html });
};
