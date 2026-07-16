// GET  /api/leads         -> list leads (admin/provider use, supports ?status=&category_id=&city=)
// POST /api/leads         -> create a new lead (public — from the customer inquiry form)

import { query } from "../../../lib/db";
import { notifyAdminNewLead, notifyProviderMatched } from "../../../lib/notify";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { status, category_id, service_area_id } = req.query;
    const conditions = [];
    const params = [];
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (category_id) { params.push(category_id); conditions.push(`category_id = $${params.length}`); }
    if (service_area_id) { params.push(service_area_id); conditions.push(`service_area_id = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT l.*, c.name AS category_name, s.city AS city_name
       FROM leads l
       LEFT JOIN categories c ON c.id = l.category_id
       LEFT JOIN service_areas s ON s.id = l.service_area_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT 200`,
      params
    );
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { fullName, email, phone, categoryId, serviceAreaId, description, budgetRange, urgency, source } = req.body || {};

    if (!fullName || !phone || !categoryId || !serviceAreaId || !description) {
      return res.status(400).json({ error: "fullName, phone, categoryId, serviceAreaId, and description are required" });
    }

    // Upsert customer by phone
    const customerResult = await query(
      `INSERT INTO customers (full_name, email, phone, city)
       VALUES ($1, $2, $3, (SELECT city FROM service_areas WHERE id = $4))
       ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [fullName, email || null, phone, serviceAreaId]
    );
    const customerId = customerResult.rows[0].id;

    const leadResult = await query(
      `INSERT INTO leads (customer_id, category_id, service_area_id, description, budget_range, urgency, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerId, categoryId, serviceAreaId, description, budgetRange || null, urgency || "flexible", source || "web_form"]
    );
    const lead = leadResult.rows[0];

    // Notify admin (fire-and-forget — don't block the response on email delivery)
    notifyAdminNewLead({ ...lead, customer_name: fullName }).catch(console.error);

    // Auto-match approved providers in the same category + area, log the match,
    // and notify them. This replaces the MVP's manual admin-only assignment.
    const matches = await query(
      `SELECT p.* FROM providers p
       JOIN provider_categories pc ON pc.provider_id = p.id AND pc.category_id = $1
       JOIN provider_service_areas psa ON psa.provider_id = p.id AND psa.service_area_id = $2
       WHERE p.status = 'approved'
       LIMIT 5`,
      [categoryId, serviceAreaId]
    );
    for (const provider of matches.rows) {
      await query(
        `INSERT INTO lead_matches (lead_id, provider_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [lead.id, provider.id]
      );
      notifyProviderMatched(provider, { ...lead, customer_name: fullName }).catch(console.error);
    }
    if (matches.rows.length > 0) {
      await query(`UPDATE leads SET status = 'matched' WHERE id = $1`, [lead.id]);
    }

    return res.status(201).json({ ...lead, matchedProviders: matches.rows.length });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
