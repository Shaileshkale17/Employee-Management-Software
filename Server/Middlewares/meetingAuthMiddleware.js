import { verifyGuestToken } from "../utils/meetingSecurity.js";

/**
 * Validates a guest access token for a meeting.
 * Expects `Authorization: Bearer <guest-token>` where the token carries `{ guest: true, meetingId, email, sessionId }`.
 */
export const meetingGuestAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ status: 401, message: "Guest token not found" });
  }
  const decoded = verifyGuestToken(token);
  if (!decoded) {
    return res.status(401).json({ status: 401, message: "Invalid or expired guest token" });
  }
  if (req.params.meetingId && decoded.meetingId !== req.params.meetingId) {
    return res.status(403).json({ status: 403, message: "Token is not valid for this meeting" });
  }
  req.guest = decoded;
  next();
};

/**
 * Tries a guest token first; if valid, sets `req.guest` and short-circuits.
 * Otherwise passes through to the regular auth pipeline (authMiddleware +
 * tenantMiddleware), which must be placed after this middleware.
 */
export const authOrGuest = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return next();
  const guest = verifyGuestToken(token);
  if (guest) {
    req.guest = guest;
    return next();
  }
  next();
};

/**
 * Accepts either an authenticated employee JWT (via the normal auth pipeline)
 * or a guest token. Runs after authMiddleware/tenantMiddleware for employees.
 */
export const eitherAuth = (req, res, next) => {
  const header = req.headers["authorization"]?.split(" ")[1];
  if (!header) {
    return res.status(401).json({ status: 401, message: "Authentication required" });
  }
  const guest = verifyGuestToken(header);
  if (guest) {
    req.guest = guest;
    return next();
  }
  next();
};
