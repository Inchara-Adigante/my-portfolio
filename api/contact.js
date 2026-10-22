// Vercel serverless function: POST /api/contact
// Body: { name: string, email?: string, message: string, website?: "" (honeypot) }
// Response: { success: boolean, error: string | null }
// Sends the message to the site owner through Resend (https://resend.com).
// Requires RESEND_API_KEY (or resend_api_key). Optional: CONTACT_TO (defaults to the profile email)
// and CONTACT_FROM (defaults to Resend's shared onboarding sender, which can only
// deliver to the email address the Resend account was created with).

import { PROFILE } from "../js/profile.js";
import { validateContact } from "../lib/contact-validate.js";
import { createRateLimiter, clientIp } from "../lib/rate-limit.js";

const RESEND_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10000;
const DEFAULT_FROM = "Portfolio Contact <onboarding@resend.dev>";
const isRateLimited = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });
// Accept the conventional uppercase name and the lowercase one used in this project.
const resendApiKey = () => process.env.RESEND_API_KEY || process.env.resend_api_key;

function respond(res, status, error = null) {
  res.status(status).json({ success: status === 200, error });
}

function buildEmail({ name, email, message }) {
  const replyLine = email ? `Reply to: ${email}` : "No email given; they can't be replied to directly.";
  return {
    from: process.env.CONTACT_FROM || DEFAULT_FROM,
    to: [process.env.CONTACT_TO || PROFILE.contact.email],
    subject: `Portfolio message from ${name}`,
    text: `${message}\n\n— ${name}\n${replyLine}\nSent from your portfolio contact form.`,
    ...(email ? { reply_to: email } : {}),
  };
}

async function sendEmail(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respond(res, 405, "Method not allowed");
  }
  if (!resendApiKey()) {
    return respond(res, 503, "Contact form is not configured");
  }
  if (isRateLimited(clientIp(req))) {
    return respond(res, 429, "Too many messages from your network. Please try again later.");
  }

  const result = validateContact(req.body);
  // Pretend success for bots that fill the honeypot, so they don't adapt.
  if (result.spam) return respond(res, 200);
  if (!result.ok) return res.status(400).json({ success: false, error: result.error, fields: result.fields });

  try {
    await sendEmail(buildEmail(result.value));
    return respond(res, 200);
  } catch (err) {
    console.error("contact: send failed", err.message);
    return respond(res, 502, "Couldn't send your message right now.");
  }
}
