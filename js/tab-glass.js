// Liquid-glass tab bar for phones. A glass lens sits under the current tab
// and springs between tabs, stretching as it moves. Press a tab and the lens
// turns into clear glass and swells; drag along the bar and it follows your
// finger; let go and the tab under it opens. Keyboard and screen-reader use is
// unchanged: the tabs stay ordinary links.

export const DRAG_THRESHOLD_PX = 8;
export const MAX_STRETCH = 1.3;
const STRETCH_PER_PX = 0.025;  // stretch added per px the finger moves in one event
const PRESS_SCALE = 1.14;
const NAV_DELAY_MS = 180;      // lets the lens land before another page loads
const SCROLL_SETTLE_MS = 180;  // a tapped section counts as reached once scrolling pauses this long
const MAX_LOCK_MS = 1500;
const HAPTIC_MS = 6;

/** Index of the tab center closest to x (fingers past either end pick the end tab). */
export const nearestIndex = (centers, x) =>
  centers.reduce((best, center, i) => (Math.abs(center - x) < Math.abs(centers[best] - x) ? i : best), 0);

/** Left edge for a lens of `width` centered on the finger, kept between min and max. */
export const lensLeft = (fingerX, width, min, max) => Math.min(max, Math.max(min, fingerX - width / 2));

/** How much the lens stretches along its direction of travel for a given speed. */
export const stretchFor = (velocity) => Math.min(MAX_STRETCH, 1 + Math.abs(velocity) * STRETCH_PER_PX);

/** True once a press has moved far enough, and mostly sideways, to count as a drag. */
export const isHorizontalDrag = (dx, dy) => Math.abs(dx) > DRAG_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy);

const isCurrent = (tab) => tab.classList.contains("active") || tab.getAttribute("aria-current") === "page";
const opensAnotherPage = (tab) => new URL(tab.href).pathname !== window.location.pathname;
const isThisPage = (tab) => { const url = new URL(tab.href); return !url.hash && url.pathname + url.search === window.location.pathname + window.location.search; };
const isModifiedClick = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

export function initTabGlass(bar) {
  const tabs = [...bar.querySelectorAll("a")];
  if (!tabs.length) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lens = document.createElement("span");
  lens.className = "tab-lens";
  lens.setAttribute("aria-hidden", "true");
  bar.prepend(lens);
  bar.classList.add("has-lens");

  let press = null;      // { startX, startY, lastX, index, dragging, pointerId }
  let lockedTab = null;  // tab the user picked, held while the page scrolls (or navigates) to it
  let lockStarted = 0;
  let unlockTimer = 0;
  let navigating = false;

  const centers = () => tabs.map((t) => t.offsetLeft + t.offsetWidth / 2);
  const fingerX = (clientX) => clientX - bar.getBoundingClientRect().left - bar.clientLeft;

  function setLens(left, sx = 1, sy = 1) {
    lens.style.setProperty("--lens-x", `${left}px`);
    lens.style.setProperty("--lens-sx", sx);
    lens.style.setProperty("--lens-sy", sy);
  }

  function markUnder(tab) {
    for (const t of tabs) t.classList.toggle("under-lens", t === tab);
  }

  function moveTo(tab, scale = 1) {
    bar.classList.toggle("lens-off", !tab);
    markUnder(tab);
    if (tab) setLens(tab.offsetLeft, scale, scale);
  }

  /** Lens size and resting place, with no animation (first paint, rotation, breakpoints). */
  function layout() {
    const [first] = tabs;
    lens.style.width = `${first.offsetWidth}px`;
    lens.style.height = `${first.offsetHeight}px`;
    lens.style.top = `${first.offsetTop}px`;
    bar.classList.add("lens-instant");
    moveTo(lockedTab ?? tabs.find(isCurrent));
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.remove("lens-instant")));
  }

  /** Follows the current tab (scrollspy or page) unless the user is pressing or just picked one. */
  function sync() {
    if (press || lockedTab) return;
    moveTo(tabs.find(isCurrent));
  }

  function unlock() {
    lockedTab = null;
    sync();
  }

  function armUnlock() {
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(unlock, SCROLL_SETTLE_MS);
  }

  /** Holds the lens on `tab`. Same-page picks let go once scrolling settles; other pages hold until they load. */
  function hold(tab, { untilScrollSettles = true } = {}) {
    lockedTab = tab;
    lockStarted = performance.now();
    moveTo(tab);
    if (untilScrollSettles) armUnlock();
    else clearTimeout(unlockTimer);
  }

  function release() {
    press = null;
    bar.classList.remove("pressing", "dragging");
    window.removeEventListener("pointerup", onPointerEnd);
    window.removeEventListener("pointercancel", onPointerEnd);
  }

  // A mouse or pen can let go outside the bar, where the bar never hears it.
  function onPointerEnd(e) {
    if (press && e.pointerId === press.pointerId && !bar.contains(e.target)) {
      release();
      sync();
    }
  }

  bar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !e.isPrimary || press) return;
    const tab = e.target.closest("a");
    press = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, index: tabs.indexOf(tab), dragging: false, pointerId: e.pointerId };
    bar.classList.add("pressing");
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    if (tab) moveTo(tab, PRESS_SCALE);
  });

  bar.addEventListener("pointermove", (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    if (e.buttons === 0 && e.pointerType !== "touch") {
      release();
      sync();
      return;
    }
    if (!press.dragging) {
      if (!isHorizontalDrag(e.clientX - press.startX, e.clientY - press.startY)) return;
      try {
        bar.setPointerCapture(e.pointerId);
      } catch {
        return; // the pointer is already gone; its pointerup or pointercancel ends the press
      }
      press.dragging = true;
      bar.classList.add("dragging");
    }
    const x = fingerX(e.clientX);
    const stretch = reducedMotion ? 1 : stretchFor(e.clientX - press.lastX);
    press.lastX = e.clientX;
    const first = tabs[0];
    const last = tabs[tabs.length - 1];
    // Stretch along the drag and thin out a little, like a drop of liquid.
    setLens(lensLeft(x, first.offsetWidth, first.offsetLeft, last.offsetLeft), PRESS_SCALE * stretch, PRESS_SCALE / Math.sqrt(stretch));
    const index = nearestIndex(centers(), x);
    if (index !== press.index) {
      press.index = index;
      markUnder(tabs[index]);
      navigator.vibrate?.(HAPTIC_MS);
    }
  });

  bar.addEventListener("pointerup", (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const { dragging, index } = press;
    release();
    // A drag picks the tab under the lens. A tap is finished by the link's own click,
    // so hold the lens on the tapped tab until then rather than letting scrollspy pull it back.
    if (dragging && tabs[index]) tabs[index].click();
    else if (tabs[index]) hold(tabs[index]);
    else sync();
  });

  bar.addEventListener("pointercancel", (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    release();
    sync();
  });

  bar.addEventListener("click", (e) => {
    const tab = e.target.closest("a");
    if (!tab || isModifiedClick(e)) return;
    if (navigating) {
      e.preventDefault();
      return;
    }
    // The tab for the page you're already on scrolls back to the top instead of reloading.
    if (isThisPage(tab)) {
      e.preventDefault();
      hold(tab);
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }
    // Same-page section links scroll natively; other pages wait for the lens to land.
    if (!opensAnotherPage(tab)) {
      hold(tab);
      return;
    }
    e.preventDefault();
    hold(tab, { untilScrollSettles: false });
    navigating = true;
    setTimeout(() => window.location.assign(tab.href), reducedMotion ? 0 : NAV_DELAY_MS);
  });

  // Coming back with the Back button can restore this page from the cache, lens and all.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    navigating = false;
    unlock();
  });

  window.addEventListener("scroll", () => {
    if (lockedTab && performance.now() - lockStarted < MAX_LOCK_MS) armUnlock();
  }, { passive: true });

  new MutationObserver(sync).observe(bar, { subtree: true, attributes: true, attributeFilter: ["class", "aria-current"] });
  new ResizeObserver(layout).observe(bar);
  layout();
}
