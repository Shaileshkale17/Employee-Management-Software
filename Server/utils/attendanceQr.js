import jwt from "jsonwebtoken";

export const QR_TOKEN_TTL_SECONDS = 90;

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET must be set in the environment.");
  }
  return s;
};

/**
 * Short-lived signed token displayed by a Smart Check-In terminal. Carries the
 * company id so a token captured from one company's terminal cannot be replayed
 * against another. Expiry forces the terminal QR to rotate.
 */
export const signAttendanceQrToken = ({
  companyId,
  label,
  expiresIn = QR_TOKEN_TTL_SECONDS,
}) => jwt.sign({ purpose: "attendance-qr", companyId, label }, secret(), { expiresIn });

export const verifyAttendanceQrToken = (token) => {
  try {
    const decoded = jwt.verify(token, secret());
    return decoded?.purpose === "attendance-qr" ? decoded : null;
  } catch {
    return null;
  }
};
