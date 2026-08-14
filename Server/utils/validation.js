import mongoose from "mongoose";

export const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password) =>
  typeof password === "string" && password.length >= 6;

export const isValidObjectId = (id) => mongoose.isValidObjectId(id);

export const toObjectId = (id) =>
  mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;

export const isInEnum = (value, allowed) =>
  Array.isArray(allowed) && allowed.includes(value);

export const isDate = (value) =>
  value instanceof Date
    ? !Number.isNaN(value.getTime())
    : !Number.isNaN(new Date(value).getTime());

export const normalizeSkills = (value) =>
  Array.isArray(value)
    ? value.map((s) => String(s).trim()).filter(Boolean)
    : String(value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

export const sanitizeString = (value, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const sanitizeBody = (body, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (body[key] !== undefined && body[key] !== null) out[key] = body[key];
  }
  return out;
};

export const startOfDayUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const endOfDayUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};
