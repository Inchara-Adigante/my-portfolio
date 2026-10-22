// Experience section: company tabs. Each tab shows a split view of what Inchara
// owned, the headline impact numbers, the tools and the teams she worked with.
// Other parts of the page (impact links, the trail map, the skills popover)
// point at #exp-<id>; asking for a hidden panel switches to its tab first.

import { el } from "./dom.js";

const panelId = (x) => `exp-${x.id}`;

export function renderExperience(container, profile) {
  if (!container) return;
  const jobs = profile.experience;
  const tabs = el("div", { class: "exp-tabs", role: "tablist", "aria-label": "Companies" },
    jobs.map((x, i) => el("button", {
      type: "button", role: "tab", id: `tab-${x.id}`, class: "exp-tab", "data-roles": (x.roles ?? []).join(" "),
      "aria-selected": String(i === 0), "aria-controls": panelId(x), tabindex: i === 0 ? "0" : "-1",
    },
      el("span", { class: "exp-tab-company" }, x.company.replace(" Limited", "")),
      el("span", { class: "exp-tab-meta" }, `${x.role} · ${x.dates.split(" – ")[0].split(" ")[1]}`))));

  const panels = jobs.map((x, i) => el("article", {
    class: "card exp-panel", id: panelId(x), role: "tabpanel", "aria-labelledby": `tab-${x.id}`,
    "data-roles": (x.roles ?? []).join(" "), ...(i === 0 ? {} : { hidden: "" }),
  },
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
          el("ul", { class: "exp-teams" }, x.teams.map((t) => el("li", {}, t))))))));

  const show = (id, focus = false) => {
    jobs.forEach((x, i) => {
      const on = x.id === id;
      const tab = tabs.children[i];
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && focus) tab.focus();
    });
  };
  tabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".exp-tab");
    if (tab) show(tab.id.slice(4));
  });
  // Arrow keys move between tabs, as in any tablist.
  tabs.addEventListener("keydown", (e) => {
    const i = [...tabs.children].indexOf(document.activeElement);
    if (i < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const n = jobs.length;
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    show(jobs[next].id, true);
  });
  // Anything that wants to show a job (flashCard, #exp-… links) asks via this event.
  container.addEventListener("exp:show", (e) => show(e.detail));
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#exp-"]');
    if (link) show(link.getAttribute("href").slice(5));
  });

  container.replaceChildren(tabs, el("div", { class: "exp-panels" }, panels));
}
