// The hero's Sorting Hat: a visitor says what their team needs most, the hat
// wobbles and thinks out loud, then sorts Inchara into the matching "house"
// (one of the FOCUS roles) and offers to highlight the work that proves it.
// An owl perched on spellbooks keeps it company.
// The hat is an original drawing (an old, patched wizard hat whose folds form a
// face) and its lines are original, not book quotes.

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
<svg viewBox="0 0 260 240" class="hat-svg" aria-hidden="true">
  <defs>
    <linearGradient id="hat-cloth" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#9a7a55"/><stop offset="0.45" stop-color="#6e5136"/><stop offset="1" stop-color="#3f2c1c"/>
    </linearGradient>
    <linearGradient id="hat-tip-cloth" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a6a48"/><stop offset="1" stop-color="#4a3422"/>
    </linearGradient>
    <linearGradient id="hat-brim-cloth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7d5f40"/><stop offset="1" stop-color="#3a2819"/>
    </linearGradient>
    <radialGradient id="hat-shade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#1a110a" stop-opacity="0.9"/><stop offset="1" stop-color="#1a110a" stop-opacity="0"/>
    </radialGradient>
    <filter id="hat-grain" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" result="wobbly"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="grey"/>
      <feComponentTransfer in="grey" result="soft"><feFuncR type="linear" slope="0.3" intercept="0.78"/><feFuncG type="linear" slope="0.3" intercept="0.78"/><feFuncB type="linear" slope="0.3" intercept="0.78"/></feComponentTransfer>
      <feComposite in="soft" in2="wobbly" operator="in" result="grain"/>
      <feBlend in="wobbly" in2="grain" mode="multiply"/>
    </filter>
  </defs>
  <ellipse class="hat-shadow" cx="130" cy="230" rx="100" ry="8"/>
  <g filter="url(#hat-grain)">
    <path class="hat-brim" d="M240.1,205.0 L238.6,207.2 L240.4,209.3 L234.8,210.9 L234.7,212.6 L230.0,213.9 L223.9,215.1 L221.1,216.7 L213.0,217.7 L208.3,219.6 L199.7,220.9 L192.3,222.5 L185.3,224.5 L177.8,226.4 L167.2,226.8 L158.3,227.8 L149.4,228.8 L139.9,229.3 L130.0,228.6 L120.4,227.8 L110.2,227.7 L102.0,225.6 L91.2,225.7 L83.6,224.1 L75.5,223.2 L67.6,222.4 L59.3,221.8 L50.0,221.4 L46.4,219.8 L38.5,218.8 L33.0,217.2 L30.0,215.1 L25.3,213.0 L25.2,210.4 L23.2,207.9 L21.1,205.4 L17.7,203.0 L19.7,200.7 L21.7,198.8 L21.9,196.9 L25.1,195.4 L29.3,194.0 L32.5,192.5 L38.0,191.1 L45.0,189.9 L50.9,188.2 L58.1,186.6 L65.3,184.8 L73.8,183.2 L83.0,182.0 L91.3,180.4 L101.4,180.0 L110.6,179.3 L120.2,179.0 L130.0,179.6 L139.7,180.0 L149.2,181.1 L159.0,181.6 L168.5,182.5 L177.3,183.5 L186.4,184.1 L193.8,185.2 L202.2,185.8 L209.2,186.8 L215.8,187.9 L221.4,189.2 L227.6,190.7 L232.4,192.7 L234.9,195.0 L238.4,197.4 L236.8,200.1 L242.0,202.5 Z" fill="url(#hat-brim-cloth)"/>
    <ellipse cx="130" cy="205" rx="70" ry="9" fill="url(#hat-shade)" opacity="0.8"/>
    <g class="hat-body">
      <path d="M66 204 C72 172 84 142 96 118 C104 100 108 86 112 72 C122 66 140 64 154 68 C160 92 170 122 176 148 C182 172 188 190 194 204 C150 214 110 214 66 204 Z" fill="url(#hat-cloth)"/>
      <path d="M107 98 C118 94 136 94 151 98" fill="none" stroke="#2a1b10" stroke-opacity="0.4" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M105 107 C118 103 138 103 154 108" fill="none" stroke="#c9a77c" stroke-opacity="0.2" stroke-width="2" stroke-linecap="round"/>
      <!-- Folds: dark creases and soft highlights give the cloth weight. -->
      <path d="M101 112 C110 140 107 170 100 198" fill="none" stroke="#2a1b10" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
      <path d="M158 86 C154 120 161 160 171 198" fill="none" stroke="#2a1b10" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>
      <path d="M108 104 C118 132 116 166 110 196" fill="none" stroke="#c9a77c" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>
      <!-- Patch with stitching. -->
      <path d="M77 174 L101 170 L104 193 L80 197 Z" fill="#856743" stroke="#3a2819" stroke-width="1"/>
      <path d="M81 177 L98 174 L100 190 L83 193 Z" fill="none" stroke="#e8d5b5" stroke-opacity="0.7" stroke-width="1" stroke-dasharray="3 3"/>
      <!-- The face, made of folds. -->
      <g class="hat-eyes">
        <path d="M86 128 C95 116 112 116 121 125 C112 121 97 121 86 128 Z" fill="#24170e"/>
        <path d="M91 133 C100 128 110 128 117 133" fill="none" stroke="#1a110a" stroke-width="3" stroke-linecap="round"/>
        <path d="M139 123 C148 114 165 114 173 123 C165 119 150 119 139 123 Z" fill="#24170e"/>
        <path d="M143 129 C150 124 160 124 167 129" fill="none" stroke="#1a110a" stroke-width="3" stroke-linecap="round"/>
      </g>
      <path d="M127 138 C132 146 133 150 128 155" fill="none" stroke="#2a1b10" stroke-opacity="0.6" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="131" cy="168" rx="40" ry="11" fill="url(#hat-shade)"/>
      <path class="hat-mouth" d="M95 162 C110 168 150 168 167 160 C157 177 108 179 95 162 Z" fill="#160d07"/>
      <path d="M90 160 C110 167 150 167 172 157" fill="none" stroke="#2a1b10" stroke-width="3" stroke-linecap="round"/>
      <path d="M100 174 C116 182 146 182 160 173" fill="none" stroke="#c9a77c" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g class="hat-tip">
      <path d="M106 82 C110 60 121 43 140 34 C162 25 187 33 203 53 C215 69 219 92 215 122 C211 107 205 93 195 81 C185 69 173 65 163 71 C159 75 157 79 157 84 C140 77 123 77 106 82 Z" fill="url(#hat-tip-cloth)"/>
      <path d="M108 82 C124 75 142 75 157 84" fill="none" stroke="#2a1b10" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round"/>
      <path d="M112 77 C126 71 142 71 155 77" fill="none" stroke="#c9a77c" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round"/>
      <path d="M126 58 C140 50 156 50 168 56" fill="none" stroke="#2a1b10" stroke-opacity="0.45" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M190 52 C200 66 205 84 207 104" fill="none" stroke="#c9a77c" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round"/>
      <path d="M164 38 L180 41 L178 55 L162 52 Z" fill="#7a5c3c" stroke="#3a2819" stroke-width="1"/>
      <path d="M167 41 L177 43 L176 52 L165 50 Z" fill="none" stroke="#e8d5b5" stroke-opacity="0.65" stroke-width="1" stroke-dasharray="2.5 2.5"/>
    </g>
  </g>
</svg>`;

// The hat's companion: an owl on a stack of spellbooks.
const OWL = `
<svg viewBox="0 0 120 150" class="owl-svg" aria-hidden="true">
  <defs>
    <linearGradient id="owl-feather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a88a66"/><stop offset="1" stop-color="#6b5139"/></linearGradient>
    <linearGradient id="owl-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8c6f50"/><stop offset="1" stop-color="#4f3b29"/></linearGradient>
    <radialGradient id="owl-eye" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e09a2c"/></radialGradient>
  </defs>
  <!-- Spellbooks to perch on. -->
  <g class="owl-books">
    <rect x="18" y="128" width="84" height="14" rx="2" fill="#7a2f2a"/><rect x="18" y="128" width="84" height="3" fill="#a24a3f"/>
    <rect x="96" y="128" width="6" height="14" fill="#e3c58e"/>
    <rect x="26" y="116" width="70" height="12" rx="2" fill="#2f4a5c"/><rect x="26" y="116" width="70" height="3" fill="#466a80"/>
    <rect x="90" y="116" width="6" height="12" fill="#e3c58e"/>
    <path d="M40 142 L40 147 L44 145 L48 147 L48 142" fill="#e2b04a"/>
  </g>
  <g class="owl">
    <g class="owl-wing owl-wing-l"><path d="M30 64 C16 76 14 98 24 116 C30 106 34 90 36 74 Z" fill="url(#owl-wing)"/></g>
    <g class="owl-wing owl-wing-r"><path d="M90 64 C104 76 106 98 96 116 C90 106 86 90 84 74 Z" fill="url(#owl-wing)"/></g>
    <ellipse cx="60" cy="88" rx="32" ry="32" fill="url(#owl-feather)"/>
    <ellipse cx="60" cy="96" rx="21" ry="22" fill="#e7d4b4"/>
    <g fill="none" stroke="#a88a66" stroke-width="1.6" stroke-linecap="round">
      <path d="M50 92 l3 3 3-3"/><path d="M62 92 l3 3 3-3"/><path d="M56 100 l3 3 3-3"/><path d="M48 104 l3 3 3-3"/><path d="M64 104 l3 3 3-3"/><path d="M56 110 l3 3 3-3"/>
    </g>
    <path d="M48 116 l-3 6 M52 117 l0 6 M68 117 l0 6 M72 116 l3 6" stroke="#e2a03a" stroke-width="2.5" stroke-linecap="round"/>
    <g class="owl-head">
      <path d="M32 40 L38 22 L46 36 Z" fill="#7a5d41"/><path d="M88 40 L82 22 L74 36 Z" fill="#7a5d41"/>
      <ellipse cx="60" cy="48" rx="30" ry="24" fill="url(#owl-feather)"/>
      <circle cx="47" cy="48" r="13" fill="#ead9bb"/><circle cx="73" cy="48" r="13" fill="#ead9bb"/>
      <g class="owl-eyes">
        <circle cx="47" cy="48" r="8.5" fill="url(#owl-eye)"/><circle cx="73" cy="48" r="8.5" fill="url(#owl-eye)"/>
        <circle class="owl-pupil" cx="48" cy="48" r="4.2" fill="#1a120b"/><circle class="owl-pupil" cx="74" cy="48" r="4.2" fill="#1a120b"/>
        <circle cx="50" cy="46" r="1.4" fill="#fff"/><circle cx="76" cy="46" r="1.4" fill="#fff"/>
      </g>
      <path d="M56 56 L64 56 L60 64 Z" fill="#e2a03a"/>
      <path d="M36 38 C42 34 50 34 54 38" fill="none" stroke="#5a4330" stroke-width="2" stroke-linecap="round"/>
      <path d="M84 38 C78 34 70 34 66 38" fill="none" stroke="#5a4330" stroke-width="2" stroke-linecap="round"/>
    </g>
  </g>
</svg>
`;

/**
 * Builds the hat into `slot`. `focus` is PROFILE.focus-style [{ id, label, pitch }];
 * `onSorted(houseId)` lets the page highlight matching work.
 */
export function initSortingHat(slot, focus, onSorted) {
  if (!slot) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stage = el("div", { class: "hat-stage" });
  stage.innerHTML = HAT;
  const owl = el("div", { class: "owl-stage", title: "Hoo!" });
  owl.innerHTML = OWL;
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
  // Poke the owl and it hops and flaps.
  owl.addEventListener("click", () => {
    owl.classList.remove("hop"); void owl.offsetWidth; owl.classList.add("hop");
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
    el("div", { class: "hat-body" }, el("div", { class: "hat-visual" }, owl, el("div", { class: "hat-spot" }, sparkles, stage)), speech, choices, result));
}
