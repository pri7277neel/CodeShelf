// helpers/getSession.js
import jwt from "jsonwebtoken";

export function getSession(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .find((c) => c.trim().startsWith("cs_session="));
  if (!cookie) return null;
  const token = cookie.split("=")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
