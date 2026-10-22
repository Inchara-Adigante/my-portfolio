// Recruiter-facing interactions on the homepage: the "Hiring for…" role switch,
// clickable impact numbers with before/after bars, and the Jobzilla agent-debate demo.

import { el } from "./dom.js";

const FLASH_MS = 1300;
const TURN_DELAY_MS = 1100;
const TYPING_MS = 700;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scrolls to a card and makes it pulse once so the eye lands on it. */
export function flashCard(card) {
  if (!card) return;
  card.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  card.classList.remove("flash");
  void card.offsetWidth; // restart the animation if it's already running
  card.classList.add("flash");
  setTimeout(() => card.classList.remove("flash"), FLASH_MS);
}

/** Which roles an element supports, from its data-roles attribute. */
const rolesOf = (node) => (node.dataset.roles ?? "").split(" ").filter(Boolean);

/**
 * Turns the hero role pills into a switch. Picking a role dims experience, projects and
 * skill groups that don't support it; picking it again shows everything.
 */
export function initRoleFocus(list, note, focus) {
  if (!list || !note) return;
  let active = null;
  const buttons = focus.map((f) => el("button", { type: "button", class: "focus-chip", "aria-pressed": "false", "data-focus": f.id }, f.label));
  list.replaceChildren(...buttons.map((b) => el("li", {}, b)));

  const apply = (id) => {
    active = id;
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.focus === id));
    for (const node of document.querySelectorAll("[data-roles]")) {
      node.classList.toggle("is-dimmed", Boolean(id) && !rolesOf(node).includes(id));
    }
    const picked = focus.find((f) => f.id === id);
    if (!picked) {
      note.replaceChildren(el("span", { class: "muted" }, "Tap a role to highlight the matching work below."));
      return;
    }
    const matching = [...document.querySelectorAll(`[data-roles~="${id}"]`)];
    // Jump to the first section that has a match (Experience for data roles, Projects for AI).
    const firstSection = matching[0]?.closest("section[id]")?.id ?? "experience";
    note.replaceChildren(
      el("span", {}, picked.pitch),
      " ",
      el("a", { href: `#${firstSection}`, class: "link-arrow" }, `See ${matching.length} matching ${matching.length === 1 ? "item" : "items"} ↓`),
      " ",
      el("button", { type: "button", class: "focus-clear" }, "Show everything"),
    );
  };

  list.addEventListener("click", (e) => {
    const button = e.target.closest(".focus-chip");
    if (button) apply(active === button.dataset.focus ? null : button.dataset.focus);
  });
  note.addEventListener("click", (e) => {
    if (e.target.closest(".focus-clear")) apply(null);
  });
  apply(null);
}

/**
 * Adds before/after bars to impact numbers that have them, and makes every number
 * with a source jump to the experience card it came from.
 */
export function enhanceImpact(list, stats) {
  if (!list) return;
  [...list.children].forEach((item, i) => {
    const stat = stats[i];
    if (!stat) return;
    if (stat.compare) {
      const { before, after, ratio } = stat.compare;
      item.append(el("div", { class: "impact-compare", "aria-label": `Before ${before}, after ${after}` },
        el("div", { class: "bar-row" }, el("span", { class: "bar-label" }, "Before"),
          el("span", { class: "bar" }, el("i", { style: "--w: 100%" })), el("span", { class: "bar-value" }, before)),
        el("div", { class: "bar-row is-after" }, el("span", { class: "bar-label" }, "After"),
          el("span", { class: "bar" }, el("i", { style: `--w: ${Math.max(ratio * 100, 3).toFixed(1)}%` })), el("span", { class: "bar-value" }, after))));
    }
    if (stat.source) {
      item.classList.add("is-link");
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `${stat.value}${stat.suffix} ${stat.label}. Show where this comes from.`);
      item.append(el("span", { class: "impact-source", "aria-hidden": "true" }, "See where →"));
      const go = () => flashCard(document.getElementById(`exp-${stat.source}`));
      item.addEventListener("click", go);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    }
  });
}

/** Plays a project's scripted agent debate in a modal, one turn at a time. */
export function initDebate(projectList, projects) {
  if (!projectList) return;
  const dialog = document.createElement("dialog");
  dialog.className = "debate";
  dialog.setAttribute("aria-labelledby", "debate-title");
  document.body.append(dialog);
  let timers = [];
  const stop = () => { timers.forEach(clearTimeout); timers = []; };
  dialog.addEventListener("close", stop);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.closest(".debate-close")) dialog.close();
  });

  const play = (project) => {
    stop();
    const { role, candidate, turns } = project.demo;
    const log = el("ol", { class: "debate-log", "aria-live": "polite" });
    const replay = el("button", { type: "button", class: "btn btn-ghost small debate-replay", hidden: "" }, "↺ Replay");
    replay.addEventListener("click", () => play(project));
    dialog.replaceChildren(
      el("header", { class: "debate-head" },
        el("div", {},
          el("p", { class: "debate-kicker" }, `${project.name.split(" — ")[0]} · agent debate`),
          el("h3", { id: "debate-title" }, role),
          el("p", { class: "small muted" }, candidate)),
        el("button", { type: "button", class: "debate-close", "aria-label": "Close" }, "✕")),
      el("ul", { class: "debate-cast", "aria-hidden": "true" },
        ...[...new Set(turns.map((t) => t.agent))].map((a) => el("li", { "data-agent": slug(a) }, a))),
      log,
      el("footer", { class: "debate-foot" },
        el("p", { class: "small muted" }, "Illustrative example with a sample candidate. In Jobzilla, these turns come from GPT-4 agents orchestrated by LangGraph."),
        replay));
    if (!dialog.open) dialog.showModal();

    const say = (turn) => log.append(el("li", { class: "debate-turn", "data-agent": slug(turn.agent) },
      el("strong", {}, turn.agent), el("p", {}, turn.text)));
    if (reducedMotion()) {
      turns.forEach(say);
      replay.hidden = false;
      return;
    }
    turns.forEach((turn, i) => {
      timers.push(setTimeout(() => {
        const typing = el("li", { class: "debate-turn is-typing", "data-agent": slug(turn.agent) },
          el("strong", {}, turn.agent), el("p", {}, el("span", { class: "dots" }, el("i"), el("i"), el("i"))));
        log.append(typing);
        typing.scrollIntoView({ block: "nearest" });
        timers.push(setTimeout(() => {
          typing.remove();
          say(turn);
          log.lastElementChild.scrollIntoView({ block: "nearest" });
          if (i === turns.length - 1) replay.hidden = false;
        }, TYPING_MS));
      }, i * (TURN_DELAY_MS + TYPING_MS)));
    });
  };

  projectList.addEventListener("click", (e) => {
    const button = e.target.closest("[data-demo]");
    const project = button && projects.find((p) => p.id === button.dataset.demo);
    if (project?.demo) play(project);
  });
}

const slug = (text) => text.toLowerCase().replace(/[^a-z]+/g, "-");
