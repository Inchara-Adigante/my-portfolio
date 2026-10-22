// The hero's Sorting Hat: a visitor says what their team needs most, the hat
// wobbles and thinks out loud, then sorts Inchara into the matching "house"
// (one of the FOCUS roles) and offers to highlight the work that proves it.
// The hat is an original drawing and the lines are original, not book quotes.

import { el } from "./dom.js";

const THINK_MS = 1100;

// What the visitor can pick, and the house each one sorts into.
export const NEEDS = Object.freeze([
  { id: "pipelines", label: "Reliable pipelines", house: "data" },
  { id: "models", label: "Smarter models", house: "ai" },
  { id: "dashboards", label: "Clear dashboards", house: "analytics" },
  { id: "cloud", label: "Scalable cloud data", house: "data" },
]);

// The hat's musings while it decides, per house.
const THOUGHTS = Object.freeze({
  data: ["Hmm… plenty of SQL in this head…", "A three-hour report, down to ten minutes? Bold…", "Spark, Snowflake, Airflow… I see a builder of pipelines…"],
  ai: ["Hmm… I sense a curious mind…", "Three agents arguing about a résumé? Clever…", "Weibull curves and TensorFlow… quite the model-maker…"],
  analytics: ["Hmm… a talent for making numbers talk…", "Dashboards that teams check every day…", "dbt models, data quality checks… ah, yes…"],
});

const HAT = `
<svg viewBox="0 0 220 200" class="hat-svg" aria-hidden="true">
  <defs>
    <linearGradient id="hat-cloth" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a6b4f"/><stop offset="0.55" stop-color="#5e4632"/><stop offset="1" stop-color="#3c2b1e"/>
    </linearGradient>
    <linearGradient id="hat-band" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--teal)"/></linearGradient>
  </defs>
  <ellipse class="hat-shadow" cx="110" cy="186" rx="86" ry="9"/>
  <path class="hat-brim" d="M18 168c18-14 60-20 92-20s74 6 92 20c-14 10-50 16-92 16s-78-6-92-16z" fill="url(#hat-cloth)"/>
  <g class="hat-cone">
    <path d="M52 158c4-34 16-62 30-86 10-18 14-40 34-56 8-6 22-8 30-2-12 2-20 10-22 22-2 16 10 34 14 56 6 30 14 50 30 66-40 8-82 8-116 0z" fill="url(#hat-cloth)"/>
    <path d="M58 150c34 6 72 6 104-1" fill="none" stroke="url(#hat-band)" stroke-width="7" stroke-linecap="round"/>
    <path class="hat-crease" d="M72 112c8-4 14-4 20 0" fill="none" stroke="#2b1f15" stroke-width="3" stroke-linecap="round"/>
    <path class="hat-crease" d="M118 108c8-4 14-4 20 0" fill="none" stroke="#2b1f15" stroke-width="3" stroke-linecap="round"/>
    <path class="hat-mouth" d="M86 132c10 6 30 6 42 0" fill="none" stroke="#2b1f15" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M100 60c6 10 4 22-2 30" fill="none" stroke="#2b1f15" stroke-opacity="0.45" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;

/**
 * Builds the hat into `slot`. `focus` is PROFILE.focus-style [{ id, label, pitch }];
 * `onSorted(houseId)` lets the page highlight matching work.
 */
export function initSortingHat(slot, focus, onSorted) {
  if (!slot) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = el("div", { class: "hat-stage" });
  stage.innerHTML = HAT;
  const sparkles = el("div", { class: "hat-sparkles", "aria-hidden": "true" }, Array.from({ length: 10 }, (_, i) => el("i", { style: `--i: ${i}` })));
  const speech = el("p", { class: "hat-speech", "aria-live": "polite" }, "Ah, a visitor! Tell me what your team needs, and I shall sort Inchara where she belongs.");
  const choices = el("div", { class: "hat-choices", role: "group", "aria-label": "What does your team need most?" },
    NEEDS.map((n) => el("button", { type: "button", class: "hat-choice", "data-need": n.id }, n.label)));
  const result = el("div", { class: "hat-result", hidden: "" });
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  function reset() {
    clear();
    slot.classList.remove("is-thinking", "is-sorted");
    result.hidden = true;
    choices.hidden = false;
    speech.textContent = "Back for another sorting? What does your team need most?";
  }

  function sort(need) {
    clear();
    const house = focus.find((f) => f.id === need.house);
    choices.hidden = true;
    slot.classList.add("is-thinking");
    const lines = THOUGHTS[house.id];
    const step = reduce ? 0 : THINK_MS;
    lines.forEach((line, i) => timers.push(setTimeout(() => { speech.textContent = line; }, i * step)));
    timers.push(setTimeout(() => {
      slot.classList.remove("is-thinking");
      slot.classList.add("is-sorted");
      speech.textContent = "I have decided…";
      result.replaceChildren(
        el("p", { class: "hat-house" }, house.label.toUpperCase() + "!"),
        el("p", { class: "hat-pitch" }, house.pitch),
        el("div", { class: "hat-actions" },
          el("button", { type: "button", class: "btn btn-light small", "data-proof": house.id }, "Show me the proof ↓"),
          el("button", { type: "button", class: "btn btn-ghost small hat-again" }, "Sort again")));
      result.hidden = false;
    }, lines.length * step));
  }

  choices.addEventListener("click", (e) => {
    const b = e.target.closest("[data-need]");
    if (b) sort(NEEDS.find((n) => n.id === b.dataset.need));
  });
  result.addEventListener("click", (e) => {
    if (e.target.closest(".hat-again")) return reset();
    const proof = e.target.closest("[data-proof]");
    if (proof) onSorted?.(proof.dataset.proof);
  });
  // Poke the hat for a little wobble.
  stage.addEventListener("click", () => {
    if (slot.classList.contains("is-thinking")) return;
    stage.classList.remove("poke"); void stage.offsetWidth; stage.classList.add("poke");
  });

  slot.replaceChildren(
    el("div", { class: "window-bar" },
      el("span", { class: "window-dots", "aria-hidden": "true" }, el("i"), el("i"), el("i")),
      el("em", {}, "the sorting hat")),
    el("div", { class: "hat-body" }, el("div", { class: "hat-visual" }, sparkles, stage), speech, choices, result));
}
