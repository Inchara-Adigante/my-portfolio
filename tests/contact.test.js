import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContact } from "../lib/contact-validate.js";
import { buildFallback } from "../js/contact.js";
import { createRateLimiter } from "../lib/rate-limit.js";

const valid = { name: "Ada Lovelace", email: "ada@example.com", message: "Loved your FinSight project!" };

test("accepts a normal submission and trims fields", () => {
  const result = validateContact({ ...valid, name: "  Ada Lovelace  " });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Ada Lovelace");
});

test("email is required and must be a real address", () => {
  assert.match(validateContact({ ...valid, email: "" }).error, /Enter your email/);
  for (const bad of ["not-an-email", "a@b", "a@b.c", "a b@example.com", "a@@example.com", ".a@example.com", "a..b@example.com", "a@-example.com", "a@example.c0m"]) {
    assert.equal(validateContact({ ...valid, email: bad }).fields?.email, "Enter a valid email address, like name@company.com.", bad);
  }
  for (const good of ["ada@example.com", "first.last+jobs@sub.example.co", "o'neil@northeastern.edu"]) {
    assert.equal(validateContact({ ...valid, email: good }).ok, true, good);
  }
});

test("rejects missing name, short or missing message, and over-long input", () => {
  assert.equal(validateContact({ ...valid, name: " " }).fields.name, "Enter your name.");
  assert.equal(validateContact({ ...valid, message: "" }).fields.message, "Write a message.");
  assert.match(validateContact({ ...valid, message: "hi" }).fields.message, /at least 10 characters/);
  assert.match(validateContact({ ...valid, message: "x".repeat(2001) }).fields.message, /under 2,000 characters/);
});

test("reports every invalid field at once", () => {
  const result = validateContact({ name: "", email: "nope", message: "" });
  assert.deepEqual(Object.keys(result.fields), ["name", "email", "message"]);
});

test("suggests fixes for common email domain typos", async () => {
  const { suggestEmail } = await import("../lib/contact-validate.js");
  assert.equal(suggestEmail("jane@gmial.com"), "jane@gmail.com");
  assert.equal(suggestEmail("jane@gmail.co"), "jane@gmail.com");
  assert.equal(suggestEmail("jane@outlok.com"), "jane@outlook.com");
  assert.equal(suggestEmail("jane@gmail.com"), "");
  assert.equal(suggestEmail("jane@company.io"), "");
});

test("strips newlines from the name so it can't break the subject line", () => {
  const result = validateContact({ ...valid, name: "Ada\r\nBcc: spam@example.com" });
  assert.equal(result.value.name.includes("\n"), false);
});

test("flags the honeypot field as spam", () => {
  assert.deepEqual(validateContact({ ...valid, website: "http://spam.example" }), { ok: false, spam: true });
});

test("fallback links carry the full message to the right address", () => {
  const fb = buildFallback({ to: "me@example.com", ...valid });
  assert.ok(fb.mailto.startsWith("mailto:me@example.com?subject=Portfolio%20message%20from%20Ada%20Lovelace"));
  const gmail = new URL(fb.gmail);
  assert.equal(gmail.searchParams.get("to"), "me@example.com");
  assert.match(gmail.searchParams.get("body"), /Loved your FinSight project!\n\n— Ada Lovelace \(ada@example.com\)/);
  assert.match(fb.text, /^To: me@example.com\nSubject: Portfolio message from Ada Lovelace/);
});

test("rate limiter blocks after the limit and frees up after the window", () => {
  const limited = createRateLimiter({ windowMs: 1000, max: 2 });
  assert.equal(limited("ip", 0), false);
  assert.equal(limited("ip", 10), false);
  assert.equal(limited("ip", 20), true);
  assert.equal(limited("ip", 1500), false);
});

test("redacts emails and phone numbers before logging", async () => {
  const { redact } = await import("../lib/redact.js");
  assert.equal(redact("Email me at jane.doe@example.com or +1 (617) 555-0199"), "Email me at [email] or [phone]");
  assert.equal(redact("What did he build in 2025?"), "What did he build in 2025?");
  assert.equal(redact("x".repeat(500)).length, 300);
});

test("redaction handles non-ASCII emails and keeps date ranges", async () => {
  const { redact } = await import("../lib/redact.js");
  assert.equal(redact("write to josé@example.com"), "write to [email]");
  assert.equal(redact("He worked there 2024-2026"), "He worked there 2024-2026");
});
