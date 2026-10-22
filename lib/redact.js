// Strips personal contact details from free text before it is logged.

const EMAIL = /[^\s@＠]+[@＠][^\s@＠]+\.[^\s@＠]+/gu;
// Phone-like runs: 10+ digits with optional separators (so "2024-2026" survives).
const PHONE = /\+?\(?\d[\d\s().-]{8,}\d/g;
const MAX_LOGGED_CHARS = 300;

export function redact(text) {
  return String(text ?? "")
    .replace(EMAIL, "[email]")
    .replace(PHONE, (match) => (match.replace(/\D/g, "").length >= 10 ? "[phone]" : match))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LOGGED_CHARS);
}
