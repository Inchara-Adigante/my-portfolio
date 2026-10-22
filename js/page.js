// Entry point for secondary pages (Experience, Writing): shared chrome,
// background, analytics, and Ada, without the homepage sections.

import { renderChrome, initReveal, initAnalytics } from "./chrome.js";
import { startBackground } from "./background.js";
import { initChatbot } from "./chatbot.js";
import { initScrollUI } from "./effects.js";
import { initCursor } from "./cursor.js";

export function bootPage() {
  renderChrome({ page: document.body.dataset.page ?? "" });
  initAnalytics();
  initCursor();
  initReveal();
  initScrollUI(document.getElementById("scroll-progress"), null);
  startBackground(document.getElementById("bg-canvas"));
  const assistant = initChatbot(document.getElementById("chatbot"));
  document.querySelectorAll("[data-ask]").forEach((button) =>
    button.addEventListener("click", () => assistant?.ask(button.dataset.ask)));
  return assistant;
}
