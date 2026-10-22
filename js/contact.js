// Contact form: sends through /api/contact. If direct sending isn't available
// (not configured, rate limited, offline), the visitor gets one-click ways to
// send the same message from Gmail, their email app, or the clipboard.

import { validateField, validateContact, suggestEmail } from "../lib/contact-validate.js";

const API_URL = "/api/contact";
const FIELDS = ["name", "email", "message"];
const API_TIMEOUT_MS = 12000;

/** Pure helper (unit-tested): prefilled mailto/Gmail links plus a plain-text copy. */
export function buildFallback({ to, name, email, message }) {
  const subject = `Portfolio message from ${name}`;
  const signature = email ? `— ${name} (${email})` : `— ${name}`;
  const body = `${message}\n\n${signature}`;
  const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return {
    subject,
    mailto: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    gmail: `https://mail.google.com/mail/?${params.toString()}`,
    text: `To: ${to}\nSubject: ${subject}\n\n${body}`,
  };
}

async function postMessage(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success === true, status: res.status, error: data.error ?? null };
  } catch {
    return { ok: false, status: 0, error: null };
  } finally {
    clearTimeout(timer);
  }
}

function link(text, href, external) {
  const a = document.createElement("a");
  a.className = "btn btn-ghost small";
  a.href = href;
  a.textContent = text;
  if (external) { a.target = "_blank"; a.rel = "noopener"; }
  return a;
}

function renderFallback(status, fallback, to, reason) {
  const intro = document.createElement("p");
  intro.textContent = `${reason} Send it another way. Your message is already filled in:`;
  const actions = document.createElement("div");
  actions.className = "contact-fallback";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "btn btn-ghost small";
  copy.textContent = "Copy message";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(fallback.text);
      copy.textContent = `Copied. Paste it into an email to ${to}`;
    } catch {
      copy.textContent = `Couldn't copy. Email ${to} directly`;
    }
  });
  actions.append(link("Open in Gmail", fallback.gmail, true), link("Use my email app", fallback.mailto, false), copy);
  status.replaceChildren(intro, actions);
}

/** Shows (or clears) one field's error and keeps aria-invalid in sync. */
function showFieldError(form, field, message) {
  const input = form.elements[field];
  const slot = form.querySelector(`#err-${field}`);
  input.setAttribute("aria-invalid", message ? "true" : "false");
  input.classList.toggle("is-invalid", Boolean(message));
  if (!slot) return;
  // An error replaces any typo suggestion; clearing an error keeps the suggestion.
  const keepSuggestion = !message && slot.querySelector(".email-suggest");
  if (!keepSuggestion) slot.textContent = message;
}

/** Offers a one-click fix for common domain typos (gmial.com -> gmail.com). */
function showEmailSuggestion(form) {
  const input = form.elements.email;
  const slot = form.querySelector("#err-email");
  const suggestion = input.value && !validateField("email", input.value) ? suggestEmail(input.value) : "";
  slot.querySelector(".email-suggest")?.remove();
  if (!suggestion) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "email-suggest";
  button.append("Did you mean ", Object.assign(document.createElement("strong"), { textContent: suggestion }), "?");
  button.addEventListener("click", () => {
    input.value = suggestion;
    button.remove();
    showFieldError(form, "email", "");
    input.focus();
  });
  slot.append(button);
}

function wireFieldValidation(form) {
  for (const field of FIELDS) {
    const input = form.elements[field];
    // Validate when the visitor leaves a field they've typed in...
    input.addEventListener("blur", () => {
      if (!input.value.trim()) return;
      showFieldError(form, field, validateField(field, input.value));
      if (field === "email") showEmailSuggestion(form);
    });
    // ...and re-check while they fix a field that's showing an error.
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") showFieldError(form, field, validateField(field, input.value));
    });
  }
}

export function initContactForm(form, status, profile) {
  if (!form || !status) return;
  const to = profile.contact.email;
  const submit = form.querySelector('button[type="submit"]');
  wireFieldValidation(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      message: String(data.get("message") || "").trim(),
      website: String(data.get("website") || ""),
    };
    status.className = "contact-status small";
    status.textContent = "";

    // Same rules the server uses; stop at the first problem and point to it.
    const check = validateContact(payload);
    if (!check.ok && !check.spam) {
      for (const field of FIELDS) showFieldError(form, field, check.fields[field] ?? "");
      form.elements[FIELDS.find((f) => check.fields[f])]?.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";
    const result = await postMessage(payload);
    submit.disabled = false;
    submit.textContent = "Send Message";

    if (result.ok) {
      status.textContent = `Thanks, ${payload.name}! Your message is on its way to ${profile.firstName}.`;
      status.classList.add("is-success");
      form.reset();
      for (const field of FIELDS) showFieldError(form, field, "");
      return;
    }
    if (result.status === 400 && result.error) {
      status.textContent = result.error;
      status.classList.add("is-error");
      return;
    }
    const reason = result.status === 429 ? "Too many messages from your network right now." : "Direct sending isn't available right now.";
    renderFallback(status, buildFallback({ to, ...payload }), to, reason);
  });
}
