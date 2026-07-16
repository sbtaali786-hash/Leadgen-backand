// lib/notify.js
// Real email sending via Resend (https://resend.com — free tier available).
// WhatsApp: automated sending requires WhatsApp Business Cloud API approval from Meta.
// Until that's set up, sendWhatsApp() just logs — the frontend's wa.me links
// handle the manual/interim flow.

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log("[email:skipped — no RESEND_API_KEY set]", { to, subject });
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || "notifications@yourdomain.com",
      to,
      subject,
      html,
    });
    return result;
  } catch (err) {
    console.error("email send failed", err);
    return { error: err.message };
  }
}

export async function notifyAdminNewLead(lead) {
  return sendEmail({
    to: process.env.ADMIN_EMAIL || "admin@yourdomain.com",
    subject: `New lead: ${lead.category} in ${lead.city}`,
    html: `<p><strong>${lead.customer_name}</strong> (${lead.phone}) needs help with:</p><p>${lead.description}</p>`,
  });
}

export async function notifyProviderMatched(provider, lead) {
  return sendEmail({
    to: provider.email,
    subject: `New matching lead: ${lead.category} in ${lead.city}`,
    html: `<p>A customer in ${lead.city} needs ${lead.category}. Log in to your dashboard to respond.</p>`,
  });
}

// WhatsApp Business Cloud API stub — fill in once you have a verified
// WhatsApp Business number + Meta app credentials.
export async function sendWhatsApp({ to, message }) {
  if (!process.env.WHATSAPP_TOKEN) {
    console.log("[whatsapp:skipped — no WHATSAPP_TOKEN set]", { to, message });
    return { skipped: true };
  }
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );
  return res.json();
}
