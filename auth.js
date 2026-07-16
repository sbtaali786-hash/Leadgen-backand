// lib/auth.js
// Minimal JWT-based admin auth. Replace with Clerk/Auth.js for a real multi-admin
// setup with proper user management — this is enough to stop the MVP's
// hardcoded-passcode approach from shipping to production.

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "change-this-in-production";

export function signAdminToken(adminUser) {
  return jwt.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.role }, SECRET, {
    expiresIn: "12h",
  });
}

export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function requireAdmin(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = token && verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return payload;
}
