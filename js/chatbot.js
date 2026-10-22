// The assistant's chat window. The answering itself lives in js/guru-client.js.

import { PROFILE } from "./profile.js";
import { MAX_INPUT_CHARS, SUGGESTIONS, getReply, renderRichText, revealText, pickFollowUps } from "./guru-client.js";

const BOT = PROFILE.assistant;

const GREETING = `Hi, I'm ${BOT.name}. Ask me anything about ${PROFILE.firstName}'s projects, experience, skills, or how to get in touch.`;

const ICON_SEND = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';

const TEMPLATE = `
  <button class="chat-launcher" type="button" aria-expanded="false" aria-controls="chat-panel">
    <span class="launcher-avatar"><img src="/assets/assistant.svg" alt="" width="26" height="26" /></span><span>Ask ${BOT.name}</span>
  </button>
  <section id="chat-panel" class="chat-panel" role="dialog" aria-label="Chat with ${BOT.name}, ${PROFILE.firstName}'s assistant" hidden>
    <header class="chat-header">
      <img class="chat-avatar" src="/assets/assistant.svg" alt="" width="32" height="32" />
      <div>
        <p class="chat-title">${BOT.name} <span class="chat-online" aria-hidden="true"></span></p>
        <p class="chat-subtitle">${BOT.tagline}</p>
      </div>
      <button class="chat-reset" type="button" aria-label="Start a new conversation" title="New conversation">↺</button>
      <button class="chat-close" type="button" aria-label="Close chat">✕</button>
    </header>
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-suggestions"></div>
    <form class="chat-form">
      <input class="chat-input" type="text" maxlength="${MAX_INPUT_CHARS}" autocomplete="off"
             placeholder="Ask about projects, experience, skills…" aria-label="Your question" />
      <button class="chat-send" type="submit" aria-label="Send">${ICON_SEND}</button>
    </form>
    <p class="chat-privacy">Questions are logged anonymously (no IPs) to improve ${BOT.name}, so please don't include personal details.</p>
  </section>`;

export function initChatbot(root) {
  if (!root) return null;
  root.className = "chatbot";
  root.innerHTML = TEMPLATE;

  const launcher = root.querySelector(".chat-launcher");
  const panel = root.querySelector(".chat-panel");
  const log = root.querySelector(".chat-log");
  const suggestions = root.querySelector(".chat-suggestions");
  const form = root.querySelector(".chat-form");
  const input = root.querySelector(".chat-input");
  const send = root.querySelector(".chat-send");
  let history = [];
  let asked = new Set();
  let busy = false;

  const scrollToEnd = () => { log.scrollTop = log.scrollHeight; };

  function addBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    renderRichText(bubble, text);
    log.append(bubble);
    scrollToEnd();
    return bubble;
  }

  function showChips(questions) {
    suggestions.replaceChildren(...questions.map((q) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-chip";
      chip.textContent = q;
      chip.addEventListener("click", () => ask(q));
      return chip;
    }));
    suggestions.hidden = questions.length === 0;
  }

  function reset() {
    if (busy) return;
    history = [];
    asked = new Set();
    log.replaceChildren();
    addBubble("assistant", GREETING);
    showChips(SUGGESTIONS);
    input.focus();
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
    else launcher.focus();
  }

  async function ask(question) {
    const text = question.trim().slice(0, MAX_INPUT_CHARS);
    if (!text || busy) return;
    busy = true;
    send.disabled = true;
    suggestions.hidden = true;
    input.value = "";
    asked = new Set([...asked, text.toLowerCase()]);
    addBubble("user", text);
    history = [...history, { role: "user", content: text }];
    const typing = addBubble("assistant typing", "");
    typing.innerHTML = "<span></span><span></span><span></span>";
    const reply = await getReply(history);
    typing.classList.remove("typing");
    typing.textContent = "";
    typing.setAttribute("aria-hidden", "true");
    await revealText(typing, reply, scrollToEnd);
    typing.removeAttribute("aria-hidden");
    history = [...history, { role: "assistant", content: reply }];
    showChips(pickFollowUps(asked));
    scrollToEnd();
    busy = false;
    send.disabled = false;
    input.focus();
  }

  addBubble("assistant", GREETING);
  showChips(SUGGESTIONS);

  launcher.addEventListener("click", () => setOpen(true));
  root.querySelector(".chat-close").addEventListener("click", () => setOpen(false));
  root.querySelector(".chat-reset").addEventListener("click", reset);
  // "/" opens the assistant from anywhere, unless the visitor is typing.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.target.closest("input, textarea, [contenteditable]")) return;
    e.preventDefault();
    setOpen(true);
  });
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
  document.querySelectorAll("[data-open-chat]").forEach((btn) => btn.addEventListener("click", () => setOpen(true)));

  return Object.freeze({
    open: () => setOpen(true),
    ask: (question) => { setOpen(true); return ask(question); },
  });
}
