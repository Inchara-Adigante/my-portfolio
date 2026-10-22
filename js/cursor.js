// Glowing arrow cursor: a real arrow pointer in the site's teal-to-coral
// gradient with a soft glow, so it is always easy to find. It tilts a little
// with sideways movement. Over something clickable it leans in and a small
// coral tag says what a click will do ("View details", "Ask Ada"); a click
// taps the arrow down and sends out a coral ripple. Text fields keep the
// native text cursor. Mouse and trackpad only, never on touch screens.

import { TEXT_FIELD } from "./text-fields.js";

const CLICKABLE = "a, button, [role='button'], summary, label, select, .skill-chip, .chat-chip, .owl-envelope";
const MAX_TILT_DEG = 12;
const LEAN_DEG = -10;
const SVG_NS = "http://www.w3.org/2000/svg";

const canUseCustomCursor = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// What a click does, for the tag beside the arrow. The first matching rule wins;
// an element can also say it itself with data-cursor-label.
const LABELS = [
  [".details-close, .debate-close, .owl-close, .owl-fold, .chat-close", () => "Close"],
  [".owl-envelope, .owl-seal", () => "Break the seal"],
  [".exp-card, .project-card", () => "View details"],
  ["[data-demo]", () => "Play the debate"],
  ["[data-ask], [data-open-chat], .chat-launcher", () => "Ask Ada"],
  [".focus-chip", () => "Highlight matching work"],
  [".skill-chip", () => "See where it's used"],
  [".impact .is-link", () => "See where it came from"],
  [".theme-toggle", () => "Switch theme"],
  ["a[href^='mailto:']", () => "Send an email"],
  ["a[href$='.pdf']", () => "Open résumé"],
  ["a[href*='github.com']", () => "Open GitHub"],
  ["a[href*='linkedin.com']", () => "Open LinkedIn"],
  ["a[href^='#'], a[href^='/']", (el) => (el.textContent.trim().length <= 14 ? `Go to ${el.textContent.trim()}` : "Open")],
  ["a[target='_blank']", () => "Open in new tab"],
];
export function cursorLabel(el) {
  if (el.dataset.cursorLabel) return el.dataset.cursorLabel;
  const rule = LABELS.find(([selector]) => el.matches(selector));
  return rule ? rule[1](el) : "";
}

function makeLayer(className) {
  const node = document.createElement("div");
  node.className = className;
  node.setAttribute("aria-hidden", "true");
  document.body.append(node);
  return node;
}

function arrowShape() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 26 30");
  svg.innerHTML = `<defs><linearGradient id="cursor-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fd1c5"/><stop offset="1" stop-color="#ff9a85"/></linearGradient></defs>
    <path d="M2 2 L2 24 L8 18.5 L12.5 28 L16.5 26.2 L12 17 L20 17 Z" fill="url(#cursor-grad)" stroke="#071a24" stroke-width="1.6" stroke-linejoin="round"/>`;
  return svg;
}

export function initCursor() {
  if (!canUseCustomCursor() || document.querySelector(".cursor-arrow")) return;
  const root = document.documentElement;
  const arrow = makeLayer("cursor-arrow");
  arrow.append(arrowShape());
  const tag = makeLayer("cursor-tag");
  let host = document.body;
  // A modal dialog sits in the browser's top layer, above everything in the page,
  // so the cursor moves into the topmost open one and back to the body when it closes.
  const followTopLayer = () => {
    host = [...document.querySelectorAll("dialog[open]")].filter((d) => d.matches(":modal")).at(-1) ?? document.body;
    if (arrow.parentNode !== host) host.append(arrow, tag);
  };
  new MutationObserver(followTopLayer).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

  const animate = !prefersReducedMotion();
  let pointer = { x: -100, y: -100 };
  let tilt = 0;
  let target = null;
  let pressed = false;
  let frame = 0;

  function draw() {
    const lean = target ? LEAN_DEG : 0;
    const scale = pressed ? 0.85 : target ? 1.08 : 1;
    arrow.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) rotate(${tilt + lean}deg) scale(${scale})`;
    tag.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
  }
  // The tilt eases back to upright once the pointer stops moving sideways.
  function tick() {
    tilt *= 0.85;
    draw();
    frame = Math.abs(tilt) > 0.1 ? requestAnimationFrame(tick) : 0;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (animate) tilt = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, tilt * 0.6 + e.movementX * 0.8));
    pointer = { x: e.clientX, y: e.clientY };
    root.classList.add("cursor-visible");
    draw();
    if (!frame) frame = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener("pointerover", (e) => {
    const el = e.target instanceof Element ? e.target : null;
    const overText = Boolean(el?.closest(TEXT_FIELD));
    target = overText ? null : el?.closest(CLICKABLE) ?? null;
    const label = target ? cursorLabel(target) : "";
    tag.textContent = label;
    root.classList.toggle("cursor-text", overText);
    root.classList.toggle("cursor-hover", Boolean(target));
    root.classList.toggle("cursor-tagged", Boolean(label));
    draw();
  });
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    pressed = true;
    draw();
    if (!animate) return;
    const ripple = document.createElement("span");
    ripple.className = "cursor-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    host.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
  window.addEventListener("pointerup", () => { pressed = false; draw(); });
  root.addEventListener("pointerleave", () => root.classList.remove("cursor-visible"));
  window.addEventListener("blur", () => root.classList.remove("cursor-visible"));

  root.classList.add("has-custom-cursor");
}
