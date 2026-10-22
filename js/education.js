// Education section: the journey drawn as a hiking trail map from a Bengaluru
// trailhead to a Boston summit (switchbacks through each milestone, a flight
// across the ocean, a live "You are here" marker), plus school cards with
// animated GPA rings and coursework.

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

// ── Trail map (desktop) ──────────────────────────────────────────────────────
// Drawn in a 1000×460 viewBox that stretches to the card; HTML markers sit on
// the same points as percentages, so nothing needs re-measuring on resize.
const MAP_W = 1000;
const MAP_H = 460;
const LOW_Y = 300;
const HIGH_Y = 172;
const FLAG = { x: 990, y: 290 };

/** Trail points: India stops spread over the left, Boston stops over the right, alternating low and high. */
export function trailPoints(stops) {
  const firstBoston = stops.findIndex((s) => s.place === "boston");
  const india = firstBoston < 0 ? stops.length : firstBoston;
  const spread = (count, from, to) => Array.from({ length: count }, (_, i) => (count === 1 ? from : from + ((to - from) * i) / (count - 1)));
  const xs = [...spread(india, 60, 390), ...spread(stops.length - india, 600, 905)];
  return xs.map((x, i) => ({ x, y: i % 2 ? HIGH_Y : LOW_Y }));
}

/** Catmull-Rom spline through points, as cubic Bézier segments [p0, c1, c2, p1]. */
function splineSegments(pts) {
  const at = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  return pts.slice(0, -1).map((p, i) => {
    const prev = at(i - 1), next = at(i + 1), after = at(i + 2);
    return [p, { x: p.x + (next.x - prev.x) / 6, y: p.y + (next.y - prev.y) / 6 }, { x: next.x - (after.x - p.x) / 6, y: next.y - (after.y - p.y) / 6 }, next];
  });
}

const pathOf = (segments) => segments.map(([p, c1, c2, q], i) => `${i ? "" : `M${p.x},${p.y}`} C${c1.x},${c1.y} ${c2.x},${c2.y} ${q.x},${q.y}`).join(" ");
// The flight swoops low across the "ocean", under the cards.
const flightControl = (a, b) => ({ x: (a.x + b.x) / 2 - 15, y: Math.max(a.y, b.y) + 95 });

function bezierPoint([p, c1, c2, q], t) {
  const u = 1 - t;
  return {
    x: u * u * u * p.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * q.x,
    y: u * u * u * p.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * q.y,
  };
}

/** Today's point on the trail: between the two stops it falls between, by months elapsed. */
export function trailToday(stops, pts, today = new Date()) {
  const now = nowMonth(today);
  const months = stops.map((s) => monthIndex(s.date));
  if (now <= months[0]) return pts[0];
  if (now >= months.at(-1)) return pts.at(-1);
  const k = months.findIndex((m, i) => now >= m && now < months[i + 1]);
  const t = (now - months[k]) / (months[k + 1] - months[k]);
  const firstBoston = stops.findIndex((s) => s.place === "boston");
  if (k === firstBoston - 1) { // mid-flight: a quadratic arc
    const a = pts[k], b = pts[k + 1], c = flightControl(a, b), u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }
  const leg = k < firstBoston ? splineSegments(pts.slice(0, firstBoston))[k] : splineSegments(pts.slice(firstBoston))[k - firstBoston];
  return bezierPoint(leg, t);
}

/** Faint, wobbly contour rings: a topographic map texture behind the trail. */
function contours() {
  const ring = (cx, cy, r, wobble, seed) => {
    const pts = Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      const rr = r * (1 + wobble * Math.sin(a * 3 + seed) + wobble * 0.6 * Math.cos(a * 5 - seed));
      return `${(cx + rr * Math.cos(a) * 1.6).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
    });
    return `M${pts.join(" L")} Z`;
  };
  return [[230, 470, 4], [800, 0, 4], [520, 260, 2]].flatMap(([cx, cy, n], g) =>
    Array.from({ length: n }, (_, k) => ring(cx, cy, 40 + k * 34, 0.08, g * 2 + k)));
}

const pct = (p) => `left: ${((p.x / MAP_W) * 100).toFixed(2)}%; top: ${((p.y / MAP_H) * 100).toFixed(2)}%`;

function trailMap(stops) {
  const pts = trailPoints(stops);
  const firstBoston = stops.findIndex((s) => s.place === "boston");
  const india = pts.slice(0, firstBoston), boston = pts.slice(firstBoston);
  const a = india.at(-1), b = boston[0], c = flightControl(a, b);
  const today = trailToday(stops, pts);
  const map = svg("svg", { class: "trail-svg", viewBox: `0 0 ${MAP_W} ${MAP_H}`, preserveAspectRatio: "none", "aria-hidden": "true" });
  // The map keeps its aspect ratio, so strokes scale evenly (and pathLength-based drawing stays exact).
  const path = (d, cls, extra = {}) => svg("path", { d, class: cls, ...extra });
  for (const d of contours()) map.append(path(d, "trail-contour"));
  map.append(
    svg("text", { x: "150", y: "430", class: "trail-region" }), svg("text", { x: "760", y: "430", class: "trail-region" }),
    path(pathOf(splineSegments(india)), "trail-path is-india", { pathLength: "1" }),
    path(`M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`, "trail-flight"),
    path(pathOf(splineSegments(boston)), "trail-path is-boston", { pathLength: "1" }),
    path(`M${pts.at(-1).x},${pts.at(-1).y} Q${FLAG.x - 10},${pts.at(-1).y + 10} ${FLAG.x},${FLAG.y}`, "trail-future"));
  const [regionA, regionB] = map.querySelectorAll(".trail-region");
  regionA.textContent = "INDIA";
  regionB.textContent = "USA";
  const flightMid = { x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y };
  return el("div", { class: "trail-map" },
    map,
    el("span", { class: "trail-plane", style: pct(flightMid), "aria-hidden": "true" }, icon("move", "plane-icon"), el("small", {}, "≈ 13,500 km")),
    el("span", { class: "trail-trailhead", style: pct({ x: pts[0].x, y: pts[0].y - 44 }), "aria-hidden": "true" }, "Trailhead"),
    el("ol", { class: "trail-stops" }, stops.map((s, i) =>
      el("li", { class: `trail-stop is-${s.place} ${pts[i].y === HIGH_Y ? "is-above" : "is-below"}`, style: `${pct(pts[i])}; --i: ${i}` },
        el("button", { type: "button", class: "stop", "data-link": s.link ?? "", "aria-label": `${s.label}: ${s.title}. ${s.detail}` },
          icon(s.type, `stop-icon type-${s.type}`),
          el("span", { class: "stop-card" },
            el("span", { class: "stop-when" }, s.label),
            el("span", { class: "stop-title" }, s.title),
            el("span", { class: "stop-detail" }, s.detail)))))),
    el("span", { class: "trail-you", style: pct(today), "aria-hidden": "true" }, el("i"), el("b", {}, "You are here")),
    el("a", { class: "trail-flag", href: "#contact", style: pct(FLAG), title: "Next stop: your team. Get in touch" },
      el("span", { class: "flag-icon", "aria-hidden": "true" }), el("span", { class: "flag-label" }, "Next stop: your team →")));
}

/** Phones and tablets: the same milestones as a vertical trail. */
function trailList(stops) {
  return el("ol", { class: "trail-list" }, stops.map((s) =>
    el("li", { class: `journey-stop is-${s.place}` },
      el("button", { type: "button", class: "stop", "data-link": s.link ?? "" },
        icon(s.type, `stop-icon type-${s.type}`),
        el("span", { class: "stop-card" },
          el("span", { class: "stop-when" }, s.label),
          el("span", { class: "stop-title" }, s.title),
          el("span", { class: "stop-detail" }, s.detail))))));
}

function renderJourney(container, stops) {
  const left = countdown(stops);
  const now = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
  const firstBoston = stops.findIndex((s) => s.place === "boston");
  container.style.setProperty("--split", `${((firstBoston < 0 ? stops.length : firstBoston) / stops.length) * 100}%`);
  container.replaceChildren(
    el("div", { class: "journey-head" },
      el("span", { class: "journey-pin is-india" }, icon("pin", "pin-icon"), "Bengaluru, India"),
      left && el("span", { class: "journey-today" }, el("i", { "aria-hidden": "true" }), `Today · ${now} · ${left}`),
      el("span", { class: "journey-pin is-boston" }, icon("pin", "pin-icon"), "Boston, MA")),
    trailMap(stops),
    trailList(stops));
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
