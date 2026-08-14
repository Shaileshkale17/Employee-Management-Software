import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "meeting-secret-fallback";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

const pick = (source, count) => {
  const bytes = crypto.randomBytes(count);
  let out = "";
  for (let i = 0; i < count; i += 1) {
    out += source[bytes[i] % source.length];
  }
  return out;
};

/**
 * Human friendly secure meeting ID in the shape `abc-def-ghi`.
 */
export const generateMeetingId = () => {
  const part = () => `${pick(DIGITS, 1)}${pick(ALPHABET, 2)}${pick(DIGITS, 2)}`;
  return `${part()}-${part()}-${part()}`;
};

export const isValidMeetingId = (value) =>
  typeof value === "string" && /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/i.test(value);

export const generateOtp = (length = 6) => pick(DIGITS, length);

export const generateToken = (length = 32) =>
  crypto.randomBytes(length).toString("hex");

export const hashValue = async (value) => bcrypt.hash(String(value), 10);

export const verifyHash = async (value, hash) => {
  if (!hash) return false;
  try {
    return await bcrypt.compare(String(value), hash);
  } catch {
    return false;
  }
};

/**
 * A signed, expiring "encrypted" meeting link token.
 * Carries the meetingId + a purpose so a token cannot be replayed elsewhere.
 */
export const signMeetingLink = ({ meetingId, purpose = "join", expiresIn = "7d" }) =>
  jwt.sign({ meetingId, purpose }, JWT_SECRET, { expiresIn });

export const verifyMeetingLink = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

/**
 * Short-lived signed token handed to verified guests so they can join a meeting.
 * Carries the meeting id, guest email and a session id.
 */
export const signGuestToken = ({ meetingId, email, name, sessionId, expiresIn = "12h" }) =>
  jwt.sign({ meetingId, email, name, guest: true, sessionId }, JWT_SECRET, { expiresIn });

export const verifyGuestToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.guest) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const signEmployeeMeetingToken = ({ meetingId, userId, role, expiresIn = "12h" }) =>
  jwt.sign({ meetingId, userId, meetingRole: role }, JWT_SECRET, { expiresIn });

export const verifyEmployeeMeetingToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

/**
 * Deterministic digest used for device fingerprints.
 */
export const fingerprint = (parts = []) =>
  crypto
    .createHash("sha256")
    .update(parts.filter(Boolean).join("|"))
    .digest("hex");
