// "Neural field" background: drifting nodes joined by faint synapses.
// Near the cursor, nodes fire signals that travel along the links like
// activations through a network; clicking sends a shockwave that pushes
// nodes outward and fires everything it passes. Pauses when the tab is
// hidden; renders one static frame for prefers-reduced-motion. On touch
// screens it also holds still while you type, so the keyboard stays responsive.

import { isTextField } from "./text-fields.js";

const MAX_DPR = 2;
const NODE_DENSITY = 1 / 13000; // nodes per px²
const MAX_NODES = 130;
const LINK_DISTANCE = 135;
const CURSOR_RADIUS = 190;
const DRIFT_SPEED = 0.14;
const CURSOR_PULL = 0.005;
const FRICTION = 0.965;
const FIRE_CHANCE = 0.035;     // per frame, per node near the cursor
const AMBIENT_FIRE_CHANCE = 0.0006;
const SIGNAL_SPEED = 0.035;    // fraction of a link travelled per frame
const MAX_SIGNALS = 90;
const GLOW_DECAY = 0.94;
const RIPPLE_SPEED = 6;
const RIPPLE_MAX_RADIUS = 460;
const RIPPLE_FORCE = 2.2;
const RIPPLE_BAND = 26;
const RESIZE_DEBOUNCE_MS = 150;
const MIN_HEIGHT_CHANGE_PX = 150; // mobile URL bar show/hide is smaller than this

// Fallbacks for the theme's --net-* colors ("r, g, b"), which styles.css sets per theme.
const DEFAULT_COLORS = Object.freeze({ node: "200, 202, 215", link: "170, 174, 190", a: "244, 162, 89", b: "155, 212, 168" });

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return Object.freeze({
    node: read("--net-node", DEFAULT_COLORS.node),
    link: read("--net-link", DEFAULT_COLORS.link),
    a: read("--net-a", DEFAULT_COLORS.a), // violet: cursor links and most signals
    b: read("--net-b", DEFAULT_COLORS.b), // teal signals
  });
}

function createNodes(width, height) {
  const count = Math.min(MAX_NODES, Math.round(width * height * NODE_DENSITY));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * DRIFT_SPEED,
    vy: (Math.random() - 0.5) * DRIFT_SPEED,
    size: Math.random() * 1.1 + 0.5,
    glow: 0,
  }));
}

function findNeighbors(nodes) {
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < LINK_DISTANCE) links.push({ a: i, b: j, strength: 1 - dist / LINK_DISTANCE });
    }
  }
  return links;
}

function stepNode(node, width, height, cursor, ripples) {
  let { vx, vy, glow } = node;
  if (cursor.active) {
    const dx = cursor.x - node.x;
    const dy = cursor.y - node.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CURSOR_RADIUS && dist > 24) {
      vx += (dx / dist) * CURSOR_PULL;
      vy += (dy / dist) * CURSOR_PULL;
    }
  }
  for (const r of ripples) {
    const dx = node.x - r.x;
    const dy = node.y - r.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (Math.abs(dist - r.radius) < RIPPLE_BAND) {
      const strength = RIPPLE_FORCE * (1 - r.radius / RIPPLE_MAX_RADIUS);
      vx += (dx / dist) * strength;
      vy += (dy / dist) * strength;
      glow = 1;
    }
  }
  if (Math.hypot(vx, vy) > DRIFT_SPEED) {
    vx *= FRICTION;
    vy *= FRICTION;
  }
  return {
    ...node,
    x: (node.x + vx + width) % width,
    y: (node.y + vy + height) % height,
    vx, vy,
    glow: glow * GLOW_DECAY,
  };
}

/** Spawns signals from nodes that are near the cursor, recently hit, or randomly ambient. */
function spawnSignals(nodes, links, cursor, signals) {
  if (signals.length >= MAX_SIGNALS || links.length === 0) return signals;
  const spawned = [];
  for (const link of links) {
    const from = nodes[link.a];
    const nearCursor = cursor.active && Math.hypot(from.x - cursor.x, from.y - cursor.y) < CURSOR_RADIUS;
    const chance = nearCursor ? FIRE_CHANCE : from.glow > 0.6 ? FIRE_CHANCE * 2 : AMBIENT_FIRE_CHANCE;
    if (Math.random() < chance * link.strength) {
      const forward = Math.random() < 0.5;
      spawned.push({
        from: forward ? link.a : link.b,
        to: forward ? link.b : link.a,
        t: 0,
        tone: Math.random() < 0.6 ? "a" : "b",
      });
    }
    if (signals.length + spawned.length >= MAX_SIGNALS) break;
  }
  return [...signals, ...spawned];
}

/** Advances signals; a signal that arrives lights up its target node. */
function stepSignals(signals, nodes) {
  const arrived = new Set();
  const moving = [];
  for (const s of signals) {
    const next = { ...s, t: s.t + SIGNAL_SPEED };
    if (next.t >= 1) arrived.add(s.to);
    else if (nodes[s.to] && nodes[s.from]) moving.push(next);
  }
  const lit = nodes.map((n, i) => (arrived.has(i) ? { ...n, glow: Math.max(n.glow, 0.9) } : n));
  return { signals: moving, nodes: lit };
}

function line(ctx, x1, y1, x2, y2, rgb, alpha, width = 0.6) {
  ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function draw(ctx, width, height, state, colors) {
  const { nodes, links, signals, ripples, cursor } = state;
  ctx.clearRect(0, 0, width, height);

  for (const { a, b, strength } of links) {
    const glow = Math.max(nodes[a].glow, nodes[b].glow);
    line(ctx, nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y,
      glow > 0.05 ? colors.a : colors.link, strength * (0.14 + glow * 0.4));
  }
  if (cursor.active) {
    for (const n of nodes) {
      const dist = Math.hypot(n.x - cursor.x, n.y - cursor.y);
      if (dist < CURSOR_RADIUS) line(ctx, n.x, n.y, cursor.x, cursor.y, colors.a, (1 - dist / CURSOR_RADIUS) * 0.28);
    }
  }

  for (const s of signals) {
    const from = nodes[s.from];
    const to = nodes[s.to];
    const x = from.x + (to.x - from.x) * s.t;
    const y = from.y + (to.y - from.y) * s.t;
    const tail = Math.max(0, s.t - 0.25);
    const color = colors[s.tone];
    line(ctx, from.x + (to.x - from.x) * tail, from.y + (to.y - from.y) * tail, x, y, color, 0.55, 1.2);
    ctx.fillStyle = `rgba(${color}, 0.95)`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const n of nodes) {
    if (n.glow > 0.05) {
      ctx.fillStyle = `rgba(${colors.a}, ${n.glow * 0.25})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size + 6 * n.glow, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(${colors.node}, ${0.45 + n.glow * 0.5})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.size + n.glow, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const r of ripples) {
    ctx.strokeStyle = `rgba(${colors.a}, ${(1 - r.radius / RIPPLE_MAX_RADIUS) * 0.35})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function startBackground(canvas) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pauseWhileTyping = window.matchMedia("(pointer: coarse)").matches;
  let typing = false;
  let colors = readColors();
  let width = 0;
  let height = 0;
  let state = { nodes: [], links: [], signals: [], ripples: [], cursor: { x: 0, y: 0, active: false } };
  let frameId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const nodes = createNodes(width, height);
    state = { ...state, nodes, links: findNeighbors(nodes), signals: [], ripples: [] };
  }

  function loop() {
    const ripples = state.ripples
      .map((r) => ({ ...r, radius: r.radius + RIPPLE_SPEED }))
      .filter((r) => r.radius < RIPPLE_MAX_RADIUS);
    const moved = state.nodes.map((n) => stepNode(n, width, height, state.cursor, ripples));
    const links = findNeighbors(moved);
    // Signals reference node indices; drop any whose link no longer exists.
    const linked = new Set(links.map((l) => `${l.a}-${l.b}`));
    const alive = state.signals.filter((s) => linked.has(`${Math.min(s.from, s.to)}-${Math.max(s.from, s.to)}`));
    const stepped = stepSignals(alive, moved);
    const signals = spawnSignals(stepped.nodes, links, state.cursor, stepped.signals);
    state = { ...state, nodes: stepped.nodes, links, signals, ripples };
    draw(ctx, width, height, state, colors);
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frameId);
    if (reducedMotion || typing) draw(ctx, width, height, state, colors);
    else frameId = requestAnimationFrame(loop);
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const widthChanged = window.innerWidth !== width;
      const heightChanged = Math.abs(window.innerHeight - height) >= MIN_HEIGHT_CHANGE_PX;
      if (!widthChanged && !heightChanged) return;
      resize();
      start();
    }, RESIZE_DEBOUNCE_MS);
  });
  window.addEventListener("pointermove", (e) => {
    state = { ...state, cursor: { x: e.clientX, y: e.clientY, active: true } };
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    state = { ...state, cursor: { ...state.cursor, active: false } };
  });
  // Clicking empty background sends a shockwave through the network.
  window.addEventListener("pointerdown", (e) => {
    if (reducedMotion || e.target.closest("a, button, input, textarea, label, .card, .chatbot, .site-header")) return;
    state = { ...state, ripples: [...state.ripples, { x: e.clientX, y: e.clientY, radius: 0 }] };
  });
  if (pauseWhileTyping) {
    document.addEventListener("focusin", (e) => {
      if (!isTextField(e.target)) return;
      typing = true;
      start();
    });
    document.addEventListener("focusout", () => {
      // Focus may be hopping to the next field; check once it lands.
      setTimeout(() => {
        if (!typing || isTextField(document.activeElement)) return;
        typing = false;
        if (!document.hidden) start();
      }, 0);
    });
  }
  window.addEventListener("themechange", () => {
    colors = readColors();
    if (reducedMotion || typing) draw(ctx, width, height, state, colors);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else start();
  });

  resize();
  start();
}
