// Anonymous log of questions visitors ask Ada. No IPs or identifiers are
// stored, and emails/phone numbers are redacted. Every entry goes to the
// function logs; if an Upstash Redis store is connected (Vercel Marketplace),
// the newest entries are also kept there so they outlive log retention.

import { redact } from "./redact.js";

const LIST_KEY = "assistant:questions";
const MAX_STORED = 1000;
const STORE_TIMEOUT_MS = 2000;
const RETENTION_SECONDS = 90 * 24 * 60 * 60;

function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/** Never throws: logging must not break the chat. */
export async function logQuestion(question, { turns }) {
  const entry = { at: new Date().toISOString(), question: redact(question), turns };
  console.log(JSON.stringify({ event: "assistant_question", ...entry }));
  const store = storeConfig();
  if (!store) return;
  try {
    const res = await fetch(`${store.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${store.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["LPUSH", LIST_KEY, JSON.stringify(entry)],
        ["LTRIM", LIST_KEY, "0", String(MAX_STORED - 1)],
        ["EXPIRE", LIST_KEY, String(RETENTION_SECONDS)],
      ]),
      signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
    });
    // Upstash returns 200 with per-command errors, so check both layers.
    const results = res.ok ? await res.json().catch(() => []) : [];
    const failed = !res.ok || (Array.isArray(results) && results.some((r) => r?.error));
    if (failed) console.error("question-log: store rejected entry", res.status);
  } catch (err) {
    console.error("question-log: store failed", err.message);
  }
}
