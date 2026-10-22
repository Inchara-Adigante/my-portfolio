// Education section: a journey map from Karnataka to Boston, school cards with
// animated GPA rings, and (once courses are listed in PROFILE.education) a
// "Where I used it" map linking each course to the project that applied it.

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

const PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

function pin(label, side) {
  const node = el("span", { class: `journey-pin is-${side}` });
  node.innerHTML = PIN;
  node.append(label);
  return node;
}

const monthIndex = (iso) => { const [y, m] = iso.split("-").map(Number); return y * 12 + (m - 1); };

/**
 * Where "today" sits along the evenly spaced stops, as a percentage of the track:
 * between the two stops it falls between, proportional to the months elapsed.
 */
export function todayPosition(stops, today = new Date()) {
  const now = today.getFullYear() * 12 + today.getMonth();
  const months = stops.map((s) => monthIndex(s.date));
  const n = stops.length;
  const center = (i) => ((i + 0.5) / n) * 100;
  if (now <= months[0]) return center(0);
  if (now >= months[n - 1]) return center(n - 1);
  const k = months.findIndex((m, i) => now >= m && now < months[i + 1]);
  const frac = (now - months[k]) / (months[k + 1] - months[k]);
  return center(k) + (frac * 100) / n;
}

function renderJourney(container, stops) {
  const firstBoston = stops.findIndex((s) => s.place === "boston");
  const split = firstBoston < 0 ? 100 : (firstBoston / stops.length) * 100;
  const track = el("div", { class: "journey-track", style: `--stops: ${stops.length}; --split: ${split}%; --now: ${todayPosition(stops).toFixed(2)}%` },
    el("span", { class: "journey-line", "aria-hidden": "true" }),
    el("span", { class: "journey-now", "aria-hidden": "true" }, el("i"), el("b", {}, "Today")),
    el("ol", { class: "journey-stops" }, stops.map((s) =>
      el("li", { class: `journey-stop is-${s.place}` },
        el("button", { type: "button", class: "stop", "aria-expanded": "false" },
          el("span", { class: "stop-when" }, s.label),
          el("span", { class: "stop-dot", "aria-hidden": "true" }),
          el("span", { class: "stop-title" }, s.title),
          el("span", { class: "stop-detail" }, s.detail))))));
  container.replaceChildren(
    el("div", { class: "journey-pins" }, pin("Karnataka, India", "india"), pin("Boston, MA", "boston")),
    track);
  // Tap (or Enter) pins a stop's detail open on touch screens; hover shows it on desktop.
  container.addEventListener("click", (e) => {
    const button = e.target.closest(".stop");
    if (!button) return;
    const open = button.getAttribute("aria-expanded") !== "true";
    container.querySelectorAll(".stop").forEach((b) => b.setAttribute("aria-expanded", "false"));
    button.setAttribute("aria-expanded", String(open));
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

function courseMap(e, projects) {
  if (!e.courses?.length) return null;
  const name = (id) => { const p = projects.find((x) => x.id === id); return p?.short ?? p?.name.split(" — ")[0] ?? id; };
  return el("div", { class: "course-map" },
    el("p", { class: "course-map-title" }, "Where I used it"),
    el("ul", {}, e.courses.map((c) => el("li", {},
      el("span", { class: "course" }, c.name),
      el("span", { class: "course-arrow", "aria-hidden": "true" }, "→"),
      el("button", { type: "button", class: "course-project", "data-project": c.project }, name(c.project))))));
}

const unmapped = (e) => (e.coursework ?? []).filter((c) => !e.courses?.some((m) => m.name === c));

export function renderEducation(journeyEl, listEl, profile) {
  if (journeyEl && profile.journey?.length) renderJourney(journeyEl, profile.journey);
  if (!listEl) return;
  listEl.replaceChildren(...profile.education.map((e) =>
    el("article", { class: "card school reveal" },
      el("div", { class: "school-head" },
        schoolMark(e),
        el("div", { class: "school-text" },
          el("h3", {}, e.school),
          el("p", { class: "muted" }, e.degree),
          el("p", { class: "school-meta" }, `${e.dates} · ${e.place}`)),
        e.gpa && gpaRing(e.gpa)),
      el("p", { class: "small school-detail" }, e.detail),
      courseMap(e, profile.projects),
      // Courses already shown in the "Where I used it" map aren't repeated as chips.
      unmapped(e).length > 0 && el("div", { class: "coursework" },
        el("p", { class: "course-map-title" }, e.courses?.length ? "Also studied" : "Coursework"),
        el("ul", { class: "chips" }, unmapped(e).map((c) => el("li", {}, c)))))));
  listEl.addEventListener("click", (e) => {
    const button = e.target.closest(".course-project");
    if (button) flashCard(document.getElementById(`proj-${button.dataset.project}`));
  });
}
