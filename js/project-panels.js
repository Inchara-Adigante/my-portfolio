// Each project card gets a two-tab panel: "Architecture" (the stack as an
// animated flow, data packets moving stage to stage) and "Try it" (a small
// interactive demo). Real figures come from PROFILE; anything simulated says
// so on screen. Animations only run while the card is on screen.

import { el } from "./dom.js";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SVG_NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, ...kids) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...kids);
  return node;
};

// ── Architecture: stack stages with packets flowing between them ────────────
function architecture(stack) {
  const list = el("ol", { class: "arch", "aria-label": `Architecture: ${stack.join(" → ")}` },
    stack.map((stage, i) => el("li", { class: "arch-node", style: `--i: ${i}` },
      el("span", { class: "arch-step" }, String(i + 1)),
      el("span", { class: "arch-name" }, stage),
      i < stack.length - 1 && el("span", { class: "arch-link", "aria-hidden": "true" }, el("i"), el("i"), el("i")))));
  // When the flow wraps, the last node on a line would point at empty space; hide its link.
  new ResizeObserver(() => {
    const nodes = [...list.children];
    nodes.forEach((n, i) => n.classList.toggle("row-end", i < nodes.length - 1 && nodes[i + 1].offsetTop > n.offsetTop));
  }).observe(list);
  return list;
}

// ── Demos ───────────────────────────────────────────────────────────────────
// Each returns { node, start?, stop? }; start/stop run the animation while visible.

function evDemo(x) {
  const max = Math.max(...x.reliability.map((r) => r.rate));
  const note = el("p", { class: "demo-readout", "aria-live": "polite" }, "Hover a part to see its mean time between failures.");
  const bars = el("ul", { class: "ev-bars" }, x.reliability.map((r) =>
    el("li", { class: `pattern-${r.pattern}`, tabindex: "0", "data-part": r.part },
      el("span", { class: "ev-part" }, r.part),
      el("span", { class: "ev-track" }, el("i", { style: `--w: ${((r.rate / max) * 100).toFixed(1)}%` })),
      el("span", { class: "ev-rate" }, r.rate.toFixed(2)))));
  const show = (li) => {
    const r = x.reliability.find((y) => y.part === li.dataset.part);
    note.textContent = `${r.part}: ${r.rate} failures per 100 unit-years, MTBF ${r.mtbf} years, ${r.pattern === "infant" ? "infant-mortality" : r.pattern} pattern.`;
  };
  bars.addEventListener("pointerover", (e) => { const li = e.target.closest("li"); if (li) show(li); });
  bars.addEventListener("focusin", (e) => { const li = e.target.closest("li"); if (li) show(li); });

  const [calm, harsh] = x.climate;
  const climateBar = el("span", { class: "ev-climate-bar" }, el("i"));
  const climateText = el("span", { class: "ev-climate-text" });
  const toggle = el("button", { type: "button", class: "ev-toggle", "aria-pressed": "false" }, "Switch to hot climate");
  const setClimate = (hot) => {
    const c = hot ? harsh : calm;
    toggle.setAttribute("aria-pressed", String(hot));
    toggle.textContent = hot ? "Switch to moderate climate" : "Switch to hot climate";
    climateBar.style.setProperty("--w", `${(c.rate / harsh.rate) * 100}%`);
    climateBar.classList.toggle("is-hot", hot);
    climateText.textContent = `Battery pack · ${c.label}: ${c.rate} failures per 100 unit-years`;
  };
  toggle.addEventListener("click", () => setClimate(toggle.getAttribute("aria-pressed") !== "true"));
  setClimate(false);

  return { node: el("div", { class: "demo ev-demo" },
    el("p", { class: "demo-title" }, "Failures per 100 unit-years, by component"),
    bars,
    el("p", { class: "ev-legend" }, el("span", { class: "pattern-wear-out" }, "wear-out"), el("span", { class: "pattern-random" }, "random"), el("span", { class: "pattern-infant" }, "infant mortality")),
    note,
    el("div", { class: "ev-climate" }, climateText, climateBar, toggle),
    el("p", { class: "demo-note" }, "Real results from the project's simulated 2,000-vehicle fleet.")) };
}

function jobzillaDemo(x) {
  const agents = ["Recruiter", "Career Coach", "Judge"];
  return { node: el("div", { class: "demo jobzilla-demo" },
    el("p", { class: "demo-title" }, "Three agents argue a candidate's fit"),
    el("ul", { class: "jz-cast" }, agents.map((a, i) => el("li", { "data-agent": a.toLowerCase().replace(/ /g, "-"), style: `--i: ${i}` },
      el("strong", {}, a),
      el("span", {}, ["finds the gaps", "makes the case", "weighs both, gives a verdict"][i])))),
    el("button", { type: "button", class: "btn btn-light small", "data-demo": x.id }, "▶ Watch the agents debate"),
    el("p", { class: "demo-note" }, "Plays a scripted sample debate.")) };
}

function eegDemo() {
  const canvas = el("canvas", { class: "eeg-canvas", width: "560", height: "200", "aria-label": "Animated EEG channels and the connections between them" });
  const button = el("button", { type: "button", class: "btn btn-ghost small" }, "Simulate a seizure");
  const readout = el("p", { class: "demo-readout", "aria-live": "polite" }, "Normal activity: channels mostly independent.");
  const CH = 6;
  const nodes = [[440, 40], [500, 70], [520, 130], [470, 175], [400, 150], [390, 85]];
  let raf = 0, t = 0, seizure = 0;
  const buf = Array.from({ length: CH }, () => []);
  const ctx = canvas.getContext("2d");
  const color = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const signal = (c, k) => {
    const sync = Math.sin(k * 0.35) * 1.4;           // shared rhythm during a seizure
    const own = Math.sin(k * (0.11 + c * 0.037) + c * 1.7) * 0.6 + (Math.random() - 0.5) * 0.9;
    return own * (1 - seizure) + sync * seizure + (Math.random() - 0.5) * 0.2;
  };
  const corr = (a, b) => {
    const n = Math.min(a.length, b.length, 60); if (n < 10) return 0;
    const xa = a.slice(-n), xb = b.slice(-n);
    const ma = xa.reduce((s, v) => s + v, 0) / n, mb = xb.reduce((s, v) => s + v, 0) / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) { num += (xa[i] - ma) * (xb[i] - mb); da += (xa[i] - ma) ** 2; db += (xb[i] - mb) ** 2; }
    return num / Math.sqrt(da * db || 1);
  };
  function draw() {
    const [accent, teal, muted] = [color("--accent"), color("--teal"), color("--muted")];
    ctx.clearRect(0, 0, 560, 200);
    for (let c = 0; c < CH; c++) {
      const y0 = 20 + c * 30;
      ctx.strokeStyle = seizure > 0.3 ? accent : teal; ctx.globalAlpha = 0.85; ctx.lineWidth = 1.3; ctx.beginPath();
      buf[c].forEach((v, i) => { const x = 10 + i * 3.4, y = y0 - v * 9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    let strong = 0;
    for (let a = 0; a < CH; a++) for (let b = a + 1; b < CH; b++) {
      const r = Math.abs(corr(buf[a], buf[b]));
      if (r > 0.6) strong++;
      ctx.strokeStyle = r > 0.6 ? accent : muted; ctx.globalAlpha = 0.15 + r * 0.8; ctx.lineWidth = 0.6 + r * 2.4;
      ctx.beginPath(); ctx.moveTo(...nodes[a]); ctx.lineTo(...nodes[b]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    nodes.forEach(([x, y]) => { ctx.fillStyle = teal; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); });
    return strong;
  }
  function tick() {
    t++;
    for (let c = 0; c < CH; c++) { buf[c].push(signal(c, t)); if (buf[c].length > 105) buf[c].shift(); }
    seizure = Math.max(0, seizure - 0.0025);
    const strong = draw();
    if (t % 15 === 0) readout.textContent = strong >= 8
      ? `Seizure-like activity: ${strong} of 15 channel pairs strongly synchronized.`
      : `Normal activity: ${strong} of 15 channel pairs strongly synchronized.`;
    raf = requestAnimationFrame(tick);
  }
  button.addEventListener("click", () => { seizure = 1; });
  // Pre-fill so the first frame isn't empty.
  for (let k = 0; k < 105; k++) { t++; for (let c = 0; c < CH; c++) buf[c].push(signal(c, t)); }
  return {
    node: el("div", { class: "demo eeg-demo" },
      el("p", { class: "demo-title" }, "EEG channels as a graph: edges light up when signals synchronize"),
      canvas, el("div", { class: "demo-row" }, readout, button),
      el("p", { class: "demo-note" }, "Illustration with synthetic signals, not patient data. The model learns these relationships with DCRNN and contrastive learning.")),
    start() { cancelAnimationFrame(raf); if (reducedMotion()) draw(); else raf = requestAnimationFrame(tick); },
    stop() { cancelAnimationFrame(raf); },
  };
}

function ordersDemo() {
  const stages = ["Kafka", "S3", "Glue", "Athena"];
  const lane = el("div", { class: "orders-lane" }, stages.map((s) => el("span", { class: "orders-stage" }, s)));
  const stats = { total: 0, revenue: 0, failed: 0, regions: { NA: 0, EU: 0, APAC: 0 } };
  const out = {
    total: el("strong", {}, "0"), revenue: el("strong", {}, "$0"), failed: el("strong", {}, "0"),
  };
  const regionBars = Object.fromEntries(Object.keys(stats.regions).map((r) => [r, el("i")]));
  let timer = 0;
  function spawn() {
    const failed = Math.random() < 0.06;
    const dot = el("span", { class: `order-dot${failed ? " is-failed" : ""}` });
    lane.append(dot);
    dot.addEventListener("animationend", () => dot.remove());
    const amount = 20 + Math.round(Math.random() * 180);
    const region = ["NA", "NA", "EU", "EU", "APAC"][Math.floor(Math.random() * 5)];
    stats.total++; stats.regions[region]++;
    if (failed) stats.failed++; else stats.revenue += amount;
    out.total.textContent = stats.total.toLocaleString();
    out.revenue.textContent = `$${stats.revenue.toLocaleString()}`;
    out.failed.textContent = `${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`;
    const top = Math.max(...Object.values(stats.regions));
    for (const [r, bar] of Object.entries(regionBars)) bar.style.setProperty("--w", `${(stats.regions[r] / top) * 100}%`);
  }
  return {
    node: el("div", { class: "demo orders-demo" },
      el("p", { class: "demo-title" }, "Transactions streaming through the pipeline"),
      lane,
      el("dl", { class: "orders-stats" },
        el("div", {}, el("dt", {}, "Processed"), el("dd", {}, out.total)),
        el("div", {}, el("dt", {}, "Revenue"), el("dd", {}, out.revenue)),
        el("div", {}, el("dt", {}, "Failed payments"), el("dd", {}, out.failed))),
      el("ul", { class: "orders-regions" }, Object.entries(regionBars).map(([r, bar]) =>
        el("li", {}, el("span", {}, r), el("span", { class: "region-track" }, bar)))),
      el("p", { class: "demo-note" }, "Simulated stream, like the 10,000+ test transactions the project processed.")),
    start() { clearInterval(timer); if (!reducedMotion()) timer = setInterval(spawn, 420); else for (let i = 0; i < 40; i++) spawn(); },
    stop() { clearInterval(timer); },
  };
}

function revenueDemo() {
  const dims = [
    { id: "customer", name: "dim_customer", x: 70, y: 40, ask: "Churn by customer segment" },
    { id: "plan", name: "dim_plan", x: 430, y: 40, ask: "Recurring revenue by plan" },
    { id: "date", name: "dim_date", x: 70, y: 170, ask: "Retention by signup month" },
    { id: "segment", name: "dim_segment", x: 430, y: 170, ask: "Revenue mix by segment" },
  ];
  const fact = { x: 250, y: 105 };
  const readout = el("p", { class: "demo-readout", "aria-live": "polite" }, "Hover a dimension to see a question it answers.");
  const map = svg("svg", { viewBox: "0 0 500 210", class: "star-svg", role: "img", "aria-label": "Star schema: a revenue fact table joined to four dimensions" });
  for (const d of dims) map.append(svg("line", { x1: fact.x, y1: fact.y, x2: d.x, y2: d.y, class: "star-link", "data-dim": d.id }));
  const box = (x, y, label, cls, dim) => {
    const g = svg("g", { class: cls, tabindex: "0", ...(dim ? { "data-dim": dim } : {}) });
    const w = label.length * 7.4 + 22;
    g.append(svg("rect", { x: x - w / 2, y: y - 15, width: w, height: 30, rx: 8 }), svg("text", { x, y: y + 4, "text-anchor": "middle" }));
    g.lastChild.textContent = label;
    return g;
  };
  map.append(box(fact.x, fact.y, "fact_revenue", "star-fact"));
  for (const d of dims) map.append(box(d.x, d.y, d.name, "star-dim", d.id));
  const pick = (id) => {
    map.querySelectorAll("[data-dim]").forEach((n) => n.classList.toggle("is-on", n.dataset.dim === id));
    const d = dims.find((y) => y.id === id);
    if (d) readout.textContent = `fact_revenue ⋈ ${d.name} → "${d.ask}"`;
  };
  map.addEventListener("pointerover", (e) => { const g = e.target.closest("[data-dim]"); if (g) pick(g.dataset.dim); });
  map.addEventListener("focusin", (e) => { const g = e.target.closest("[data-dim]"); if (g) pick(g.dataset.dim); });
  return { node: el("div", { class: "demo revenue-demo" },
    el("p", { class: "demo-title" }, "A star schema: one fact table, joined to its dimensions"),
    map, readout,
    el("p", { class: "demo-note" }, "Simplified sketch of the dbt model layout.")) };
}

const DEMOS = { ev: evDemo, jobzilla: jobzillaDemo, eeg: eegDemo, orders: ordersDemo, revenue: revenueDemo };

/** The tabbed Architecture / Try it panel for one project. */
export function projectPanel(x) {
  const make = DEMOS[x.id];
  const demo = make ? make(x) : null;
  const tabs = el("div", { class: "panel-tabs", role: "tablist" },
    el("button", { type: "button", role: "tab", "aria-selected": "true", "data-tab": "arch" }, "Architecture"),
    demo && el("button", { type: "button", role: "tab", "aria-selected": "false", "data-tab": "try" }, "▶ Try it"));
  const archView = el("div", { class: "panel-view", "data-view": "arch" }, architecture(x.stack));
  const tryView = demo && el("div", { class: "panel-view", "data-view": "try", hidden: "" }, demo.node);
  const panel = el("div", { class: "project-panel" }, tabs, archView, tryView);
  let visible = false, tab = "arch";
  const sync = () => { if (visible && tab === "try") demo?.start?.(); else demo?.stop?.(); };
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    tabs.querySelectorAll("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t === b)));
    archView.hidden = tab !== "arch";
    if (tryView) tryView.hidden = tab !== "try";
    sync();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    panel.classList.toggle("in-view", visible);
    sync();
  }, { threshold: 0.2 }).observe(panel);
  return panel;
}
