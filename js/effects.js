// Hero and card micro-interactions: typewriter headline, count-up stats, cursor spotlight on cards, and subtle 3D tilt on projects.

const TYPE_DELAY_MS = 55;
const DELETE_DELAY_MS = 30;
const HOLD_MS = 1800;
const COUNT_DURATION_MS = 1400;
const MAX_TILT_DEG = 5;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns a function that resolves right away while `el` is on screen, and
 * otherwise waits until it scrolls back into view.
 */
function onScreenGate(el) {
  if (!("IntersectionObserver" in window)) return () => Promise.resolve();
  let visible = true;
  let wake = null;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && wake) {
      wake();
      wake = null;
    }
  }).observe(el);
  return () => (visible ? Promise.resolve() : new Promise((resolve) => { wake = resolve; }));
}

export async function typewriter(target, phrases) {
  if (!target || phrases.length === 0) return;
  if (reducedMotion()) {
    target.textContent = phrases[0];
    return;
  }
  // Each letter re-lays out the page, so stop typing while the headline is scrolled away.
  const untilOnScreen = onScreenGate(target);
  const show = async (text, delay) => {
    await untilOnScreen();
    target.textContent = text;
    await sleep(delay);
  };
  for (let i = 0; ; i = (i + 1) % phrases.length) {
    const phrase = phrases[i];
    for (let n = 1; n <= phrase.length; n++) await show(phrase.slice(0, n), TYPE_DELAY_MS);
    await sleep(HOLD_MS);
    for (let n = phrase.length; n >= 0; n--) await show(phrase.slice(0, n), DELETE_DELAY_MS);
  }
}

function animateCount(node, value, suffix) {
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / COUNT_DURATION_MS);
    const eased = 1 - (1 - progress) ** 3;
    node.textContent = `${Math.round(value * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function renderImpact(list, stats) {
  if (!list) return;
  const items = stats.map(({ value, suffix, label }) => {
    const li = document.createElement("li");
    li.className = "impact-item reveal";
    const num = document.createElement("strong");
    num.textContent = `${value}${suffix}`;
    const text = document.createElement("span");
    text.textContent = label;
    li.append(num, text);
    return { li, num, value, suffix };
  });
  list.replaceChildren(...items.map((i) => i.li));
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    items.forEach((i) => animateCount(i.num, i.value, i.suffix));
    observer.disconnect();
  }, { threshold: 0.4 });
  observer.observe(list);
}

/** Cards light up where the cursor is; project cards also tilt toward it. */
export function initCardEffects() {
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".card, .portrait");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    if (card.matches(".project, .portrait") && !reducedMotion()) {
      const rx = ((y / rect.height) - 0.5) * -2 * MAX_TILT_DEG;
      const ry = ((x / rect.width) - 0.5) * 2 * MAX_TILT_DEG;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  });
  document.addEventListener("pointerout", (e) => {
    const card = e.target.closest?.(".card.project, .portrait");
    if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
  });
}

/** Reading-progress bar plus nav links that light up for the section in view. */
export function initScrollUI(bar, nav) {
  if (bar) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
  if (!nav || !("IntersectionObserver" in window)) return;
  // Every nav (header pill and mobile tab bar) marks section links with data-section.
  const sectionLinks = [...document.querySelectorAll("a[data-section]")];
  if (!sectionLinks.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      // Sections without a nav link (skills, achievements) keep the last highlight.
      if (!entry.isIntersecting || !sectionLinks.some((a) => a.dataset.section === entry.target.id)) continue;
      for (const a of sectionLinks) a.classList.toggle("active", a.dataset.section === entry.target.id);
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((section) => observer.observe(section));
}
