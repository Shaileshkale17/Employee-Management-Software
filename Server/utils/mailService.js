import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[mail-skip] ${subject} -> ${to} (SMTP not configured)`);
    return { skipped: true };
  }
  return t.sendMail({
    from: process.env.EMAIL_ADDRESS,
    to,
    subject,
    text,
    html,
  });
};

export const sendOtpEmail = async ({ to, name, otp, purpose }) => {
  const subject =
    purpose === "mfa"
      ? "Your one-time verification code"
      : "Password reset verification code";
  const text = `Hello ${name},\n\nYour one-time verification code is: ${otp}\nThis code is valid for 10 minutes. Please do not share it with anyone.\n\nBest regards,\nEmployee Management System`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 12px;">${subject}</h2>
    <p style="color: #4b5563;">Hello ${name},</p>
    <p style="color: #4b5563;">Your one-time verification code is:</p>
    <div style="background: #eef1ff; color: #3354f4; font-size: 28px; font-weight: 700; text-align: center; padding: 16px; border-radius: 8px; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
    <p style="color: #6b7280; font-size: 13px;">This code is valid for 10 minutes. Please do not share it with anyone.</p>
  </div>`;
  return sendEmail({ to, subject, text, html });
};

export const sendLeaveStatusEmail = async (to, name, leaveType, status) => {
  const subject = `Leave request ${status}`;
  const text = `Hello ${name},\n\nYour ${leaveType} leave request has been ${status}.\n\nBest regards,\nEmployee Management System`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 12px;">Leave Request ${status}</h2>
    <p style="color: #4b5563;">Hello ${name},</p>
    <p style="color: #4b5563;">Your <strong>${leaveType}</strong> leave request has been <strong>${status}</strong>.</p>
  </div>`;
  return sendEmail({ to, subject, text, html });
};

export const sendAttendanceEmail = async (to, name, status) => {
  const subject = `Marked ${status} for today`;
  const text = `Hello ${name},\n\nYour attendance has been recorded as ${status} for today.\n\nBest regards,\nEmployee Management System`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <h2 style="color: #1f2937; margin: 0 0 12px;">Attendance ${status}</h2>
    <p style="color: #4b5563;">Hello ${name},</p>
    <p style="color: #4b5563;">Your attendance has been recorded as <strong>${status}</strong> for today.</p>
  </div>`;
  return sendEmail({ to, subject, text, html });
};
