// PATCH /api/leads/:id -> update status and/or assigned provider
// Used by both the provider dashboard (updating their own lead's status)
// and the admin dashboard (reassigning/overriding).

import { query } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    const { status, assignedProviderId, isAdminAction } = req.body || {};

    // Provider-triggered status updates don't need admin auth (they're scoped
    // to their own leads client-side); reassignment does.
    if (isAdminAction) {
      const admin = requireAdmin(req, res);
      if (!admin) return; // requireAdmin already sent the 401
    }

    const fields = [];
    const params = [];
    if (status) { params.push(status); fields.push(`status = $${params.length}`); }
    if (assignedProviderId !== undefined) { params.push(assignedProviderId); fields.push(`assigned_provider_id = $${params.length}`); }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update" });

    fields.push(`updated_at = now()`);
    params.push(id);

    const { rows } = await query(
      `UPDATE leads SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "Lead not found" });
    return res.status(200).json(rows[0]);
  }

  res.setHeader("Allow", ["PATCH"]);
  return res.status(405).end();
}
