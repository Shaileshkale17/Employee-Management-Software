import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET = "meeting-test-secret";

const {
  generateMeetingId,
  isValidMeetingId,
  generateOtp,
  signMeetingLink,
  verifyMeetingLink,
  signGuestToken,
  verifyGuestToken,
} = await import("../utils/meetingSecurity.js");

test("generateMeetingId returns the abc-def-ghi shape", () => {
  const id = generateMeetingId();
  assert.match(id, /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/);
  assert.notEqual(id, generateMeetingId());
});

test("isValidMeetingId accepts only matching ids", () => {
  assert.equal(isValidMeetingId("a1bcd-ef234-gh5ij"), true);
  assert.equal(isValidMeetingId("abc"), false);
  assert.equal(isValidMeetingId("abcdef-abcdef-abcdefgh"), false);
  assert.equal(isValidMeetingId(""), false);
});

test("generateOtp returns numeric string of requested length", () => {
  const otp = generateOtp(6);
  assert.match(otp, /^\d{6}$/);
  const otp4 = generateOtp(4);
  assert.match(otp4, /^\d{4}$/);
});

test("meeting links sign and verify with the same secret", () => {
  const token = signMeetingLink({ meetingId: "abc12-def34-ghi56", purpose: "join" });
  const decoded = verifyMeetingLink(token);
  assert.equal(decoded.meetingId, "abc12-def34-ghi56");
  assert.equal(decoded.purpose, "join");
});

test("meeting links reject tampered tokens", () => {
  const token = signMeetingLink({ meetingId: "abc12-def34-ghi56", purpose: "join" });
  const tampered = `${token.slice(0, -4)}xxxx`;
  assert.equal(verifyMeetingLink(tampered), null);
  assert.equal(verifyMeetingLink(""), null);
});

test("guest tokens only verify when flagged as guest", () => {
  const token = signGuestToken({
    meetingId: "abc12-def34-ghi56",
    email: "a@b.com",
    sessionId: "sess123",
  });
  const decoded = verifyGuestToken(token);
  assert.equal(decoded.guest, true);
  assert.equal(decoded.email, "a@b.com");
  assert.equal(decoded.sessionId, "sess123");
});
