// POST /api/admin/login -> { email, password } -> { token }
// Replaces the MVP's hardcoded "admin123" passcode.
// Seed an admin user first (see README) with a bcrypt-hashed password.

import bcrypt from "bcryptjs";
import { query } from "../../../lib/db";
import { signAdminToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const { rows } = await query(`SELECT * FROM admin_users WHERE email = $1`, [email]);
  const admin = rows[0];
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAdminToken(admin);
  return res.status(200).json({ token, admin: { id: admin.id, email: admin.email, role: admin.role } });
}
