// "Data flow" background: faint pipeline lanes curve across the page and
// glowing packets stream along them left to right, lighting up the stage
// nodes they pass, like records moving through a pipeline. Packets near the
// cursor speed up and brighten; clicking empty space sends a burst of packets
// out along the nearest lanes. Pauses when the tab is hidden; renders one
// static frame for prefers-reduced-motion. On touch screens it also holds
// still while you type, so the keyboard stays responsive.

import { isTextField } from "./text-fields.js";

const MAX_DPR = 2;
const LANE_SPACING = 74;          // px between lanes
const LANE_STEP = 18;             // px between points when drawing a lane
const STAGES_PER_LANE = 3;
const PACKET_DENSITY = 1 / 26000; // packets per px²
const MAX_PACKETS = 70;
const MIN_SPEED = 0.5;
const MAX_SPEED = 1.6;
const MIN_TAIL = 40;
const MAX_TAIL = 120;
const CURSOR_RADIUS = 170;
const CURSOR_BOOST = 2.6;         // speed multiplier right under the cursor
const STAGE_GLOW_DECAY = 0.95;
const BURST_PACKETS = 10;
const BURST_LANES = 3;
const BURST_SPEED = 4.5;
const BURST_SLOWDOWN = 0.985;
const RIPPLE_SPEED = 5;
const RIPPLE_MAX_RADIUS = 220;
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
    a: read("--net-a", DEFAULT_COLORS.a), // amber packets and lit stages
    b: read("--net-b", DEFAULT_COLORS.b), // sage packets
  });
}

const random = (min, max) => min + Math.random() * (max - min);

/** Gently curved horizontal lanes, each with a few stage nodes along it. */
function createLanes(width, height) {
  const count = Math.max(4, Math.round(height / LANE_SPACING));
  return Array.from({ length: count }, (_, i) => ({
    y: ((i + 0.5) / count) * height + random(-12, 12),
    amp: random(8, 30),
    freq: random(0.0015, 0.004),
    phase: random(0, Math.PI * 2),
    stages: Array.from({ length: STAGES_PER_LANE }, (_, s) => ({
      x: ((s + random(0.3, 0.7)) / STAGES_PER_LANE) * width,
      glow: 0,
    })),
  }));
}

const laneY = (lane, x) => lane.y + lane.amp * Math.sin(x * lane.freq + lane.phase);

function createPacket(lanes, width, { x, lane, speed, burst = false } = {}) {
  const tail = random(MIN_TAIL, MAX_TAIL);
  return {
    lane: lane ?? Math.floor(Math.random() * lanes.length),
    x: x ?? random(-tail - width * 0.3, -tail),
    speed: speed ?? random(MIN_SPEED, MAX_SPEED),
    tail,
    tone: Math.random() < 0.6 ? "a" : "b",
    burst,
  };
}

const targetPackets = (width, height) => Math.min(MAX_PACKETS, Math.round(width * height * PACKET_DENSITY));

/** Packets spread across the screen, for the first frame and the reduced-motion still. */
function seedPackets(lanes, width, height) {
  return Array.from({ length: targetPackets(width, height) }, () => createPacket(lanes, width, { x: random(0, width) }));
}

function cursorBoost(packet, lanes, cursor) {
  if (!cursor.active) return 1;
  const dist = Math.hypot(packet.x - cursor.x, laneY(lanes[packet.lane], packet.x) - cursor.y);
  return dist < CURSOR_RADIUS ? 1 + (CURSOR_BOOST - 1) * (1 - dist / CURSOR_RADIUS) : 1;
}

/** Moves packets, lights the stages they cross, and tops the stream back up. */
function step(state, width, height) {
  const { lanes, cursor } = state;
  const packets = [];
  for (const p of state.packets) {
    const boost = cursorBoost(p, lanes, cursor);
    const speed = p.burst ? Math.max(p.speed * BURST_SLOWDOWN, MAX_SPEED) : p.speed;
    const x = p.x + speed * boost;
    for (const stage of lanes[p.lane].stages) {
      if (p.x < stage.x && x >= stage.x) stage.glow = 1;
    }
    if (x - p.tail < width) packets.push({ ...p, x, speed, boost });
  }
  const missing = targetPackets(width, height) - packets.filter((p) => !p.burst).length;
  for (let i = 0; i < missing; i++) packets.push(createPacket(lanes, width));
  for (const lane of lanes) for (const stage of lane.stages) stage.glow *= STAGE_GLOW_DECAY;
  const ripples = state.ripples
    .map((r) => ({ ...r, radius: r.radius + RIPPLE_SPEED }))
    .filter((r) => r.radius < RIPPLE_MAX_RADIUS);
  return { ...state, packets, ripples };
}

function drawLane(ctx, lane, width, colors) {
  ctx.strokeStyle = `rgba(${colors.link}, 0.07)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width + LANE_STEP; x += LANE_STEP) {
    const y = laneY(lane, x);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawPacket(ctx, p, lane, colors) {
  const color = colors[p.tone];
  const glow = Math.min(1, 0.55 + ((p.boost ?? 1) - 1) * 0.35 + (p.burst ? 0.3 : 0));
  const start = p.x - p.tail;
  const gradient = ctx.createLinearGradient(start, 0, p.x, 0);
  gradient.addColorStop(0, `rgba(${color}, 0)`);
  gradient.addColorStop(1, `rgba(${color}, ${glow})`);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  const segments = Math.max(2, Math.round(p.tail / 10));
  for (let i = 0; i <= segments; i++) {
    const x = start + (p.tail * i) / segments;
    const y = laneY(lane, x);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const y = laneY(lane, p.x);
  ctx.fillStyle = `rgba(${color}, ${glow * 0.25})`;
  ctx.beginPath();
  ctx.arc(p.x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(${color}, ${Math.min(1, glow + 0.3)})`;
  ctx.beginPath();
  ctx.arc(p.x, y, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawStage(ctx, stage, lane, colors) {
  const y = laneY(lane, stage.x);
  if (stage.glow > 0.05) {
    ctx.fillStyle = `rgba(${colors.a}, ${stage.glow * 0.22})`;
    ctx.beginPath();
    ctx.arc(stage.x, y, 4 + 8 * stage.glow, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(${stage.glow > 0.05 ? colors.a : colors.node}, ${0.25 + stage.glow * 0.6})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(stage.x, y, 3, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(ctx, width, height, state, colors) {
  const { lanes, packets, ripples } = state;
  ctx.clearRect(0, 0, width, height);
  for (const lane of lanes) drawLane(ctx, lane, width, colors);
  for (const p of packets) drawPacket(ctx, p, lanes[p.lane], colors);
  for (const lane of lanes) for (const stage of lane.stages) drawStage(ctx, stage, lane, colors);
  for (const r of ripples) {
    ctx.strokeStyle = `rgba(${colors.a}, ${(1 - r.radius / RIPPLE_MAX_RADIUS) * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Sends a burst of fast packets out from (x, y) along the nearest lanes. */
function burst(state, x, y, width) {
  const nearest = state.lanes
    .map((lane, i) => ({ i, dist: Math.abs(laneY(lane, x) - y) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, BURST_LANES);
  const packets = Array.from({ length: BURST_PACKETS }, (_, k) => createPacket(state.lanes, width, {
    lane: nearest[k % nearest.length].i,
    x: x - random(0, 30),
    speed: BURST_SPEED * random(0.7, 1.2),
    burst: true,
  }));
  return { ...state, packets: [...state.packets, ...packets], ripples: [...state.ripples, { x, y, radius: 0 }] };
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
  let state = { lanes: [], packets: [], ripples: [], cursor: { x: 0, y: 0, active: false } };
  let frameId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lanes = createLanes(width, height);
    state = { ...state, lanes, packets: seedPackets(lanes, width, height), ripples: [] };
  }

  function loop() {
    state = step(state, width, height);
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
  // Clicking empty background sends a burst of packets down the nearest lanes.
  window.addEventListener("pointerdown", (e) => {
    if (reducedMotion || e.target.closest("a, button, input, textarea, label, .card, .chatbot, .site-header, dialog")) return;
    state = burst(state, e.clientX, e.clientY, width);
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
