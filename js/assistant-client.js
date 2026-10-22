// The assistant's brain for the chat window (js/chatbot.js): the Claude-backed
// /api/chat endpoint first, the offline answer engine if that's unreachable,
// plus how replies are shown and which questions to suggest.

import { answerLocally } from "./local-answers.js";
import { PROFILE } from "./profile.js";

const BOT = PROFILE.assistant;
const API_URL = "/api/chat";
const API_TIMEOUT_MS = 20000;
const MAX_HISTORY = 10;
export const MAX_INPUT_CHARS = 500;
/** Starter questions shown when the chat opens. */
export const SUGGESTIONS = [
  `What does ${PROFILE.firstName} work on?`,
  `What roles is ${PROFILE.firstName} open to?`,
  "What was the impact at Skyworks?",
  "How do I get in touch?",
];
/** Follow-ups offered after each answer. */
export const FOLLOW_UPS = [
  `Why should we hire ${PROFILE.firstName}?`,
  "Tell me about Jobzilla AI",
  "What's the data engineering experience?",
  "Which certifications?",
  `When can ${PROFILE.firstName} start?`,
  "What's the LLM / GenAI experience?",
  "Tell me about the revenue warehouse",
  "Any analytics or BI experience?",
  "Tell me about the real-time order pipeline",
  "How do I get in touch?",
];
const FOLLOW_UP_COUNT = 3;
const REVEAL_CHARS_PER_FRAME = 3;

async function askApi(history) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`chat api responded ${res.status}`);
    const data = await res.json();
    if (!data?.success || typeof data.reply !== "string") throw new Error(data?.error || "malformed reply");
    return data.reply;
  } finally {
    clearTimeout(timer);
  }
}

/** The assistant's reply to the latest message in history ({ role, content }[]). */
export async function getReply(history) {
  try {
    return await askApi(history);
  } catch (err) {
    console.warn(`${BOT.name} API unavailable, answering offline:`, err.message);
    return answerLocally(history[history.length - 1].content);
  }
}

/** Renders text safely; turns URLs and emails into links. */
export function renderRichText(container, text) {
  const pattern = /(https?:\/\/[^\s)]+|\/?assets\/[^\s)]+\.pdf|[\w.+-]+@[\w-]+\.[\w.]+)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    container.append(text.slice(last, match.index));
    // Sentence punctuation after a URL or email is not part of it.
    const value = match[0].replace(/[.,;:!?]+$/, "");
    const link = document.createElement("a");
    link.textContent = value;
    const isEmail = value.includes("@") && !value.startsWith("http");
    // Site files are root-relative so the link works from /experience/ and /writing/ too.
    link.href = isEmail ? `mailto:${value}` : value.startsWith("http") ? value : `/${value.replace(/^\//, "")}`;
    if (value.startsWith("http")) { link.target = "_blank"; link.rel = "noopener"; }
    container.append(link);
    last = match.index + value.length;
  }
  container.append(text.slice(last));
}

/** Types the reply out progressively, then swaps in the linkified version. */
export function revealText(bubble, text, onFrame) {
  return new Promise((resolve) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderRichText(bubble, text);
      resolve();
      return;
    }
    let shown = 0;
    const tick = () => {
      shown = Math.min(text.length, shown + REVEAL_CHARS_PER_FRAME);
      bubble.textContent = text.slice(0, shown);
      onFrame();
      if (shown < text.length) {
        requestAnimationFrame(tick);
        return;
      }
      bubble.textContent = "";
      renderRichText(bubble, text);
      resolve();
    };
    requestAnimationFrame(tick);
  });
}

export function pickFollowUps(asked) {
  return FOLLOW_UPS.filter((q) => !asked.has(q.toLowerCase())).slice(0, FOLLOW_UP_COUNT);
}
