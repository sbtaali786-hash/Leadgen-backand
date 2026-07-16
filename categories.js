// GET /api/categories -> list active categories (for populating the inquiry form)

import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  const { rows } = await query(
    `SELECT id, name, slug, icon FROM categories WHERE is_active = TRUE ORDER BY name`
  );
  return res.status(200).json(rows);
}
