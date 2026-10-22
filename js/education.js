// Education section: a journey map from Bengaluru to Boston (milestone cards
// alternating above and below a line that draws itself in, a plane where the
// move happened, and a live "today" marker), plus school cards with animated
// GPA rings and coursework.

import { el } from "./dom.js";
import { flashCard } from "./interactive.js";

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SVG_NS = "http://www.w3.org/2000/svg";

const svg = (tag, attrs) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

const stroke = (paths) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
  pin: stroke('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  school: stroke('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/>'),
  grad: stroke('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>'),
  work: stroke('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
  move: stroke('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
  cert: stroke('<circle cx="12" cy="9" r="6"/><path d="m9 14.5-1.5 7.5 4.5-2.5 4.5 2.5-1.5-7.5"/>'),
};

const icon = (name, className) => {
  const node = el("span", { class: className, "aria-hidden": "true" });
  node.innerHTML = ICONS[name];
  return node;
};

const monthIndex = (iso) => { const [y, m] = iso.split("-").map(Number); return y * 12 + (m - 1); };
const nowMonth = (today) => today.getFullYear() * 12 + today.getMonth();

/**
 * Where "today" sits along the evenly spaced stops, as a percentage of the track:
 * between the two stops it falls between, proportional to the months elapsed.
 */
export function todayPosition(stops, today = new Date()) {
  const now = nowMonth(today);
  const months = stops.map((s) => monthIndex(s.date));
  const n = stops.length;
  const center = (i) => ((i + 0.5) / n) * 100;
  if (now <= months[0]) return center(0);
  if (now >= months[n - 1]) return center(n - 1);
  const k = months.findIndex((m, i) => now >= m && now < months[i + 1]);
  const frac = (now - months[k]) / (months[k + 1] - months[k]);
  return center(k) + (frac * 100) / n;
}

/** "2 months to graduation", or null once the last stop has passed. */
export function countdown(stops, today = new Date()) {
  const left = monthIndex(stops.at(-1).date) - nowMonth(today);
  if (left < 0) return null;
  const what = stops.at(-1).title.replace(/^MS /, "").toLowerCase();
  if (left === 0) return `${what} this month`;
  return `${left} month${left === 1 ? "" : "s"} to ${what}`;
}

function renderJourney(container, stops) {
  const n = stops.length;
  const firstBoston = stops.findIndex((s) => s.place === "boston");
  // The move sits on the line halfway between the last India stop and the first Boston stop.
  const split = firstBoston < 1 ? 100 : (firstBoston / n) * 100;
  const left = countdown(stops);
  const now = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
  const track = el("div", { class: "journey-track", style: `--stops: ${n}; --split: ${split}%; --now: ${todayPosition(stops).toFixed(2)}%` },
    el("span", { class: "journey-line", "aria-hidden": "true" }),
    firstBoston > 0 && icon("move", "journey-plane"),
    el("span", { class: "journey-now", "aria-hidden": "true" }),
    el("ol", { class: "journey-stops" }, stops.map((s, i) =>
      el("li", { class: `journey-stop is-${s.place} ${i % 2 ? "is-below" : "is-above"}`, style: `--i: ${i}` },
        el("button", { type: "button", class: "stop", "data-link": s.link ?? "", "aria-label": `${s.label}: ${s.title}. ${s.detail}` },
          icon(s.type, `stop-icon type-${s.type}`),
          el("span", { class: "stop-card" },
            el("span", { class: "stop-when" }, s.label),
            el("span", { class: "stop-title" }, s.title),
            el("span", { class: "stop-detail" }, s.detail)))))));
  container.replaceChildren(
    el("div", { class: "journey-head" },
      el("span", { class: "journey-pin is-india" }, icon("pin", "pin-icon"), "Bengaluru, India"),
      left && el("span", { class: "journey-today" }, el("i", { "aria-hidden": "true" }), `Today · ${now} · ${left}`),
      el("span", { class: "journey-pin is-boston" }, icon("pin", "pin-icon"), "Boston, MA")),
    track);
  container.addEventListener("click", (e) => {
    const target = document.getElementById(e.target.closest(".stop")?.dataset.link || "");
    if (!target) return;
    if (target.classList.contains("card")) flashCard(target);
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function gpaRing({ score, max }) {
  const shown = max === 10 ? "10" : max.toFixed(1);
  const ring = svg("svg", { viewBox: "0 0 64 64", width: "72", height: "72", class: "gpa-ring", "aria-hidden": "true" });
  ring.append(
    svg("circle", { cx: "32", cy: "32", r: String(RING_RADIUS), class: "gpa-track" }),
    svg("circle", {
      cx: "32", cy: "32", r: String(RING_RADIUS), class: "gpa-fill",
      "stroke-dasharray": RING_CIRCUMFERENCE.toFixed(2),
      style: `--full: ${RING_CIRCUMFERENCE.toFixed(2)}; --offset: ${(RING_CIRCUMFERENCE * (1 - score / max)).toFixed(2)}`,
    }));
  return el("div", { class: "gpa", role: "img", "aria-label": `GPA ${score} out of ${shown}` },
    ring,
    el("span", { class: "gpa-value" }, el("strong", {}, String(score)), el("small", {}, `/ ${shown}`)),
    el("span", { class: "gpa-label" }, "GPA"));
}

function schoolMark(e) {
  if (e.logo) return el("img", { class: "school-logo", src: e.logo, alt: "", width: "56", height: "56", loading: "lazy" });
  return el("span", { class: "school-logo school-initials", "aria-hidden": "true" }, e.short);
}

export function renderEducation(journeyEl, listEl, profile) {
  if (journeyEl && profile.journey?.length) renderJourney(journeyEl, profile.journey);
  if (!listEl) return;
  listEl.replaceChildren(...profile.education.map((e) =>
    el("article", { class: "card school reveal", id: `edu-${e.short.toLowerCase()}` },
      el("div", { class: "school-head" },
        schoolMark(e),
        el("div", { class: "school-text" },
          el("h3", {}, e.school),
          el("p", { class: "muted" }, e.degree),
          el("p", { class: "school-meta" }, `${e.dates} · ${e.place}`)),
        e.gpa && gpaRing(e.gpa)),
      el("p", { class: "small school-detail" }, e.detail),
      e.coursework?.length > 0 && el("div", { class: "coursework" },
        el("p", { class: "coursework-title" }, "Coursework"),
        el("ul", { class: "chips" }, e.coursework.map((c) => el("li", {}, c)))))));
}
