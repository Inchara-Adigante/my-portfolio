// Hero owl post: a floating envelope sealed with Inchara's initials. Breaking the seal opens
// the flap, the letter rises out and then rests alone in the middle of a blanked-out screen,
// writing itself line by line. Closing folds it back into the envelope, mends the seal and
// thanks the reader. The words live in LETTER (js/profile.js).

import { el } from "./dom.js";

const RISE_MS = 750;
const POP_MS = 1650;
const LINE_MS = 420;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "Made **15+ pipelines** faster" -> ["Made ", <b>15+ pipelines</b>, " faster"] */
export const inline = (text) => text.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? el("b", {}, part) : part)).filter(Boolean);

export function initOwlLetter(slot, letter, profile) {
  if (!slot) return;
  const { contact, name } = profile;
  const initials = name.split(" ").map((w) => w[0]).join("");
  const line = (tag, attrs, ...kids) => el(tag, { ...attrs, class: `owl-line ${attrs.class ?? ""}`.trim() }, ...kids);

  const sign = el("div", { class: "owl-sign" }, name);
  const inner = el("div", { class: "owl-letter-inner" },
    el("div", { class: "owl-crest" },
      el("span", { class: "owl-shield", "aria-hidden": "true" }, el("i"), el("i"), el("i"), el("i"), el("b", {}, "✦")),
      el("div", {}, el("strong", {}, name), el("small", {}, letter.letterhead))),
    el("div", { class: "owl-text" },
      line("p", {}, letter.greeting[0], " ", el("em", { class: "owl-aside" }, letter.greeting[1]), ","),
      letter.paragraphs.map((p) => line("p", {}, ...inline(p))),
      el("ul", {}, letter.spells.map((s) => line("li", {}, ...inline(s)))),
      letter.closing.map((p) => line("p", {}, ...inline(p))),
      line("p", { class: "owl-before-sign" }, letter.signOff),
      sign,
      line("p", { class: "owl-credential" }, letter.credential),
      line("p", { class: "owl-ps" }, letter.postscript),
      line("div", { class: "owl-actions" },
        el("a", { class: "owl-reply", href: `mailto:${contact.email}?subject=${encodeURIComponent("Reply to your letter")}` }, "Write back"),
        el("a", { class: "owl-cv", href: contact.resume, target: "_blank", rel: "noopener" }, "Read my résumé"),
        el("button", { type: "button", class: "owl-fold", "data-close": "" }, "Fold it away ✦"))));
  const paper = el("div", { class: "owl-letter", role: "dialog", "aria-modal": "true", "aria-label": `A letter from ${name}` },
    el("button", { type: "button", class: "owl-close", "data-close": "", "aria-label": "Fold the letter away" }, "✕"), inner);
  const seal = el("button", { type: "button", class: "owl-seal", "aria-label": `Break the seal and read ${name.split(" ")[0]}'s letter` },
    el("span", { class: "l" }, initials), el("span", { class: "r" }, initials));
  const back = el("div", { class: "owl-env-back" });
  const envelope = el("div", { class: "owl-envelope" },
    back, paper, el("div", { class: "owl-flap" }), el("div", { class: "owl-env-front" }),
    el("div", { class: "owl-address" }, el("b", {}, letter.envelope[0]), letter.envelope.slice(1).flatMap((t, i) => (i ? [el("br"), t] : [t]))),
    seal);
  const hint = el("p", { class: "owl-hint", "aria-live": "polite" }, "Break the seal");
  const stage = el("div", { class: "owl-stage" },
    el("div", { class: "owl-dust", "aria-hidden": "true" }, Array.from({ length: 24 }, (_, i) => el("i", {
      style: `left:${(i * 37) % 100}%; top:${60 + ((i * 53) % 45)}%; --d:${5 + (i % 6)}s; --delay:${-i * 0.45}s; --x:${((i * 29) % 60) - 30}px`,
    }))),
    envelope, hint);
  const veil = el("div", { class: "owl-veil", "aria-hidden": "true" });
  document.body.append(veil);
  slot.replaceChildren(el("div", { class: "window-bar" }, el("span", { class: "window-dots", "aria-hidden": "true" }, el("i"), el("i"), el("i")), el("em", {}, "an owl has arrived")), stage);

  let timers = [];
  let busy = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, reducedMotion() ? 0 : ms));
  const place = (r) => Object.assign(paper.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  // The open letter fits its text at the pop-up width (measured on a hidden copy), capped by the screen.
  const centred = () => {
    const width = Math.min(620, innerWidth - 32);
    const probe = paper.cloneNode(true);
    Object.assign(probe.style, { position: "fixed", left: "-9999px", top: "0", width: `${width}px`, height: "auto", visibility: "hidden", transition: "none" });
    probe.classList.add("is-popped");
    probe.querySelector(".owl-letter-inner").style.height = "auto";
    document.body.append(probe);
    const height = Math.min(probe.offsetHeight, innerHeight - 48);
    probe.remove();
    return { left: (innerWidth - width) / 2, top: (innerHeight - height) / 2, width, height };
  };

  const open = () => {
    if (busy || stage.classList.contains("is-open")) return;
    busy = true;
    timers.forEach(clearTimeout);
    timers = [];
    stage.classList.remove("is-resting");
    stage.classList.add("is-open");
    later(() => stage.classList.add("is-rising"), RISE_MS);
    later(() => {
      // Lift the letter out where it is, blank the page and bring it to the middle.
      const r = paper.getBoundingClientRect();
      document.body.append(paper);
      paper.style.transition = "none";
      place(r);
      paper.classList.add("is-popped");
      void paper.offsetWidth;
      paper.style.transition = "";
      veil.classList.add("is-on");
      document.body.classList.add("owl-reading");
      place(centred());
      busy = false;
      const lines = [...paper.querySelectorAll(".owl-line")];
      lines.forEach((l, i) => {
        const at = 900 + i * LINE_MS + (l.classList.contains("owl-credential") ? 1500 : 0);
        later(() => {
          l.classList.add("is-in");
          inner.scrollTo({ top: l.offsetTop - inner.clientHeight + l.offsetHeight + 30, behavior: reducedMotion() ? "auto" : "smooth" });
        }, at);
        if (l.classList.contains("owl-before-sign")) later(() => sign.classList.add("is-in"), at + 450);
      });
      later(() => paper.querySelector(".owl-close").focus({ preventScroll: true }), 1200);
    }, POP_MS);
  };

  const close = () => {
    if (busy || !paper.classList.contains("is-popped")) return;
    busy = true;
    timers.forEach(clearTimeout);
    timers = [];
    // Fold the letter back to the mouth of the envelope, let it slip in, then mend the seal.
    paper.classList.add("is-folding");
    const e = envelope.getBoundingClientRect();
    place({ left: e.left + 12, top: e.top - 140, width: 296, height: 190 });
    veil.classList.remove("is-on");
    document.body.classList.remove("owl-reading");
    later(() => {
      paper.style.transition = "none";
      paper.classList.remove("is-popped", "is-folding");
      paper.removeAttribute("style");
      back.after(paper);
      void paper.offsetWidth;
      paper.style.transition = "";
      stage.classList.remove("is-rising");
    }, 1050);
    later(() => {
      stage.classList.remove("is-open");
      paper.querySelectorAll(".is-in").forEach((l) => l.classList.remove("is-in"));
      sign.classList.remove("is-in");
      inner.scrollTop = 0;
    }, 1900);
    later(() => {
      stage.classList.add("is-resting");
      hint.textContent = "✦ Thank you for reading ✦";
      busy = false;
      seal.focus({ preventScroll: true });
    }, 2600);
    later(() => {
      stage.classList.remove("is-resting");
      hint.textContent = "Read it again";
    }, 6500);
  };

  envelope.addEventListener("click", open);
  paper.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  veil.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  addEventListener("resize", () => { if (paper.classList.contains("is-popped") && !paper.classList.contains("is-folding")) place(centred()); });
}
