// Magnetic cursor: a teal dot tracks the pointer exactly, and a violet ring
// trails behind it. Over small clickable things (buttons, nav links, tabs,
// logos, chips) the ring snaps around the element's outline, matching its
// shape and leaning a little toward the pointer; over large targets (project
// cards) it just grows. Text fields keep the native text cursor. Mouse and
// trackpad only, never on touch screens.

import { TEXT_FIELD } from "./text-fields.js";

const EASE = 0.22;            // fraction of the remaining distance covered per frame
const PULL = 0.15;            // how far a snapped ring leans toward the pointer
const SNAP_PADDING = 8;       // px of breathing room around a snapped element
const SNAP_MAX = { width: 360, height: 140 }; // bigger targets grow instead of snapping
const IDLE_SIZE = 34;
const GROW_SIZE = 56;
const PRESS_SCALE = 0.9;
const CLICKABLE = "a, button, [role='button'], summary, label, select, .skill-chip, .chat-chip, .card.project, .portrait";

const canUseCustomCursor = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function makeLayer(className) {
  const node = document.createElement("div");
  node.className = className;
  node.setAttribute("aria-hidden", "true");
  document.body.append(node);
  return node;
}

const isSnappable = (rect) => rect.width <= SNAP_MAX.width && rect.height <= SNAP_MAX.height;

/** Corner radius for the ring: the element's own radius plus the padding, or a circle. */
function ringRadius(el) {
  const radius = getComputedStyle(el).borderTopLeftRadius;
  if (radius.endsWith("%")) return "50%";
  const px = Number.parseFloat(radius) || 0;
  return `${px + SNAP_PADDING}px`;
}

/** Where the ring should be this frame: around the snapped element, or a circle at the pointer. */
function ringTarget(pointer, snapEl, growing) {
  if (snapEl) {
    const r = snapEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return {
      x: cx + (pointer.x - cx) * PULL,
      y: cy + (pointer.y - cy) * PULL,
      w: r.width + SNAP_PADDING * 2,
      h: r.height + SNAP_PADDING * 2,
    };
  }
  const size = growing ? GROW_SIZE : IDLE_SIZE;
  return { x: pointer.x, y: pointer.y, w: size, h: size };
}

export function initCursor() {
  if (!canUseCustomCursor() || document.querySelector(".cursor-dot")) return;
  const root = document.documentElement;
  const dot = makeLayer("cursor-dot");
  const ring = makeLayer("cursor-ring");
  // A modal dialog sits in the browser's top layer, above everything in the page,
  // so the cursor moves into the topmost open one and back to the body when it closes.
  const followTopLayer = () => {
    const host = [...document.querySelectorAll("dialog[open]")].filter((d) => d.matches(":modal")).at(-1) ?? document.body;
    if (dot.parentNode !== host) host.append(dot, ring);
  };
  new MutationObserver(followTopLayer).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  const animate = !prefersReducedMotion();
  let pointer = { x: -100, y: -100 };
  let ringBox = { x: -100, y: -100, w: IDLE_SIZE, h: IDLE_SIZE };
  let snapEl = null;
  let growing = false;
  let pressed = false;
  let frame = 0;

  function draw() {
    const scale = pressed ? PRESS_SCALE : 1;
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.width = `${ringBox.w}px`;
    ring.style.height = `${ringBox.h}px`;
    ring.style.transform = `translate3d(${ringBox.x - ringBox.w / 2}px, ${ringBox.y - ringBox.h / 2}px, 0) scale(${scale})`;
  }

  function tick() {
    const target = ringTarget(pointer, snapEl, growing);
    const next = animate
      ? Object.fromEntries(Object.entries(ringBox).map(([k, v]) => [k, v + (target[k] - v) * EASE]))
      : target;
    const settled = Object.keys(next).every((k) => Math.abs(target[k] - next[k]) < 0.1);
    ringBox = settled ? target : next;
    draw();
    // Keep running while snapped, since the element can move (scrolling, hover lift).
    frame = settled && !snapEl ? 0 : requestAnimationFrame(tick);
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pointer = { x: e.clientX, y: e.clientY };
    root.classList.add("cursor-visible");
    wake();
  }, { passive: true });

  document.addEventListener("pointerover", (e) => {
    const el = e.target instanceof Element ? e.target : null;
    const overText = Boolean(el?.closest(TEXT_FIELD));
    const target = overText ? null : el?.closest(CLICKABLE);
    const snap = target && isSnappable(target.getBoundingClientRect()) ? target : null;
    snapEl = snap;
    growing = Boolean(target) && !snap;
    ring.style.borderRadius = snap ? ringRadius(snap) : "50%";
    root.classList.toggle("cursor-text", overText);
    root.classList.toggle("cursor-snap", Boolean(snap));
    root.classList.toggle("cursor-hover", growing);
    wake();
  });
  window.addEventListener("pointerdown", () => { pressed = true; draw(); });
  window.addEventListener("pointerup", () => { pressed = false; draw(); });
  root.addEventListener("pointerleave", () => root.classList.remove("cursor-visible"));
  window.addEventListener("blur", () => root.classList.remove("cursor-visible"));

  root.classList.add("has-custom-cursor");
}
