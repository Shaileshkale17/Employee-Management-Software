import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET = "attendance-qr-test-secret";

import {
  signAttendanceQrToken,
  verifyAttendanceQrToken,
  QR_TOKEN_TTL_SECONDS,
} from "../utils/attendanceQr.js";

test("attendance QR tokens sign and verify with the same secret", () => {
  const token = signAttendanceQrToken({ companyId: "c1", label: "Acme HQ" });
  const decoded = verifyAttendanceQrToken(token);
  assert.equal(decoded.purpose, "attendance-qr");
  assert.equal(decoded.companyId, "c1");
  assert.equal(decoded.label, "Acme HQ");
});

test("attendance QR tokens reject tampered or empty tokens", () => {
  const token = signAttendanceQrToken({ companyId: "c1", label: "Acme HQ" });
  const tampered = `${token.slice(0, -4)}xxxx`;
  assert.equal(verifyAttendanceQrToken(tampered), null);
  assert.equal(verifyAttendanceQrToken(""), null);
});

test("attendance QR tokens expire", () => {
  const token = signAttendanceQrToken({ companyId: "c1", label: "Acme HQ", expiresIn: 0 });
  assert.equal(verifyAttendanceQrToken(token), null);
});

test("QR_TOKEN_TTL_SECONDS is a positive number", () => {
  assert.ok(Number.isInteger(QR_TOKEN_TTL_SECONDS) && QR_TOKEN_TTL_SECONDS > 0);
});
