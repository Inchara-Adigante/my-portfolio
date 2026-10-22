// Experience section: one compact card per job (company, role, dates and the
// headline number). Clicking a card opens the full story in a pop-up: what
// Inchara owned, every impact number, the tools and the teams she worked with.
// Other parts of the page (impact links, the trail map, the skills popover)
// point at #exp-<id>, the compact card.

import { el } from "./dom.js";
import { detailsDialog } from "./details.js";

const details = (x) => [
  el("header", { class: "exp-head" },
    el("div", {}, el("h3", {}, x.role), el("p", { class: "accent exp-company" }, x.company)),
    el("div", { class: "meta" }, el("span", {}, x.dates), el("span", {}, x.place))),
  x.summary && el("p", { class: "exp-summary" }, x.summary),
  el("dl", { class: "exp-impact" }, (x.impact ?? []).map((m) => el("div", {}, el("dt", {}, m.value), el("dd", {}, m.label)))),
  el("div", { class: "exp-split" },
    el("section", { class: "exp-block exp-owned" },
      el("h4", {}, "What I owned"),
      el("ul", { class: "bullets" }, x.points.map((pt) => el("li", {}, pt)))),
    el("div", { class: "exp-side" },
      el("section", { class: "exp-block" },
        el("h4", {}, "Tools"),
        el("ul", { class: "chips" }, (x.tags ?? []).map((t) => el("li", {}, t)))),
      x.teams?.length && el("section", { class: "exp-block" },
        el("h4", {}, "Who I worked with"),
        el("ul", { class: "exp-teams" }, x.teams.map((t) => el("li", {}, t)))))),
];

export function renderExperience(container, profile) {
  if (!container) return;
  const open = detailsDialog(container.closest("section") ?? container, "Job details");
  const cards = profile.experience.map((x) => {
    const [top] = x.impact ?? [];
    const card = el("button", {
      type: "button", class: "card exp-card", id: `exp-${x.id}`, "data-roles": (x.roles ?? []).join(" "),
      "aria-haspopup": "dialog", "aria-label": `${x.role} at ${x.company}, ${x.dates}. Open details.`,
    },
      el("span", { class: "exp-card-dates" }, x.dates),
      el("span", { class: "exp-card-company" }, x.company.replace(" Limited", "")),
      el("span", { class: "exp-card-role" }, x.role),
      top && el("span", { class: "exp-card-stat" }, el("strong", {}, top.value), el("span", {}, top.label)),
      el("span", { class: "card-more", "aria-hidden": "true" }, "View details →"));
    card.addEventListener("click", () => open(card, ...details(x)));
    return card;
  });
  container.replaceChildren(...cards);
}
