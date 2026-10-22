// A pop-up for the details behind a compact card (Experience and Projects). The
// dialog grows out of the card that was clicked and shrinks back into it on close.
// It lives inside its section, so delegated clicks (Ask Ada, the debate demo)
// still reach the section's listeners.

import { el } from "./dom.js";

const OPEN_MS = 320;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Returns open(trigger, title, ...content); one dialog serves a whole section. */
export function detailsDialog(host, label) {
  const body = el("div", { class: "details-body" });
  const dialog = el("dialog", { class: "details", "aria-label": label },
    el("button", { type: "button", class: "details-close", "aria-label": "Close details" }, "✕"), body);
  host.append(dialog);
  let trigger = null;

  // The offset and scale that make the dialog sit exactly over the card.
  const fromCard = () => {
    const a = trigger.getBoundingClientRect(), b = dialog.getBoundingClientRect();
    return `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${a.width / b.width}, ${a.height / b.height})`;
  };
  const close = () => {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (reducedMotion() || !trigger?.isConnected) return finish();
    dialog.classList.add("is-closing");
    dialog.animate([{ transform: "none", opacity: 1 }, { transform: fromCard(), opacity: 0 }], { duration: OPEN_MS * 0.8, easing: "cubic-bezier(.5,0,.75,0)" }).finished.then(finish);
  };
  const finish = () => {
    dialog.classList.remove("is-closing");
    dialog.close();
  };
  dialog.addEventListener("close", () => {
    document.body.classList.remove("details-open");
    trigger?.focus({ preventScroll: true });
  });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  dialog.addEventListener("click", (e) => {
    // A click on the backdrop lands on the dialog itself, outside its box.
    const r = dialog.getBoundingClientRect();
    const outside = e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
    if (outside || e.target.closest(".details-close")) close();
    // Asking Ada opens the chat, which must not sit behind this pop-up.
    else if (e.target.closest("[data-ask]")) finish();
  });

  return (card, ...content) => {
    trigger = card;
    body.replaceChildren(...content);
    dialog.showModal();
    document.body.classList.add("details-open");
    body.scrollTop = 0;
    if (!reducedMotion()) dialog.animate([{ transform: fromCard(), opacity: 0.4 }, { transform: "none", opacity: 1 }], { duration: OPEN_MS, easing: "cubic-bezier(.2,.8,.2,1)" });
  };
}
