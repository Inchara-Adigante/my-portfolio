// Validation for contact-form submissions. Pure functions shared by the
// browser form (js/contact.js), the /api/contact endpoint, and the tests, so
// both sides always apply exactly the same rules.

import { editDistance } from "./edit-distance.js";

export const CONTACT_LIMITS = Object.freeze({ name: 100, email: 254, message: 2000, minMessage: 10 });

// name@domain.tld: allowed local-part characters, dot-separated domain labels
// (no leading/trailing hyphen), and a letters-only top-level domain of 2+.
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
// Control characters (including newlines) have no place in a name or email.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
// Domains people often mistype; a near-miss gets a "did you mean" suggestion.
const COMMON_DOMAINS = Object.freeze([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com",
  "aol.com", "proton.me", "protonmail.com", "northeastern.edu",
]);
const MAX_TYPO_DISTANCE = 2;

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const cleanName = (value) => clean(value).replace(CONTROL_CHARS, " ").replace(/\s+/g, " ");
const cleanEmail = (value) => clean(value).replace(CONTROL_CHARS, "");

export const isValidEmail = (email) => email.length <= CONTACT_LIMITS.email && EMAIL_PATTERN.test(email);

/** "jane@gmial.com" -> "jane@gmail.com"; returns "" when there is nothing to suggest. */
export function suggestEmail(raw) {
  const email = cleanEmail(raw).toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return "";
  const domain = email.slice(at + 1);
  if (!domain || COMMON_DOMAINS.includes(domain)) return "";
  let best = { domain: "", distance: Infinity };
  for (const candidate of COMMON_DOMAINS) {
    const distance = editDistance(domain, candidate);
    if (distance < best.distance) best = { domain: candidate, distance };
  }
  return best.distance <= MAX_TYPO_DISTANCE ? `${cleanEmail(raw).slice(0, at)}@${best.domain}` : "";
}

/** Returns an error message for one field, or "" when it's valid. */
export function validateField(field, raw) {
  if (field === "name") {
    const name = cleanName(raw);
    if (!name) return "Enter your name.";
    if (name.length > CONTACT_LIMITS.name) return `Keep your name under ${CONTACT_LIMITS.name} characters.`;
    return "";
  }
  if (field === "email") {
    const email = cleanEmail(raw);
    if (!email) return "Enter your email so Inchara can reply.";
    if (!isValidEmail(email)) return "Enter a valid email address, like name@company.com.";
    return "";
  }
  if (field === "message") {
    const message = clean(raw);
    if (!message) return "Write a message.";
    if (message.length < CONTACT_LIMITS.minMessage) return `Add a bit more detail (at least ${CONTACT_LIMITS.minMessage} characters).`;
    if (message.length > CONTACT_LIMITS.message) return `Keep your message under ${CONTACT_LIMITS.message.toLocaleString("en-US")} characters.`;
    return "";
  }
  return "";
}

/**
 * Returns { ok: true, value } with cleaned fields, { ok: false, spam: true }
 * when the hidden honeypot field was filled, or { ok: false, error, fields }
 * where `fields` maps each invalid field to its message.
 */
export function validateContact(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request body", fields: {} };
  if (clean(body.website)) return { ok: false, spam: true };

  const fields = Object.fromEntries(
    ["name", "email", "message"]
      .map((field) => [field, validateField(field, body[field])])
      .filter(([, error]) => error),
  );
  const firstError = Object.values(fields)[0];
  if (firstError) return { ok: false, error: firstError, fields };

  return { ok: true, value: { name: cleanName(body.name), email: cleanEmail(body.email), message: clean(body.message) } };
}
