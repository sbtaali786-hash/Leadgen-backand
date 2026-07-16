// lib/db.js
// Single shared Postgres connection pool.
// Set DATABASE_URL in .env.local, e.g.:
// DATABASE_URL=postgres://user:password@host:5432/dbname

import { Pool } from "pg";

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false }, // needed for most managed Postgres (Supabase, Railway, etc.)
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== "production") {
    console.log("query", { text, duration: Date.now() - start, rows: res.rowCount });
  }
  return res;
}
