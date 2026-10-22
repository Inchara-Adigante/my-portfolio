import { PROFILE, FOCUS } from "./profile.js";
import { initRoleFocus, enhanceImpact, initDebate } from "./interactive.js";
import { renderEducation } from "./education.js";
import { startBackground } from "./background.js";
import { initChatbot } from "./chatbot.js";
import { typewriter, renderImpact, initCardEffects, initScrollUI } from "./effects.js";
import { initDinoGame } from "./dino/runner.js";
import { initGameWindow } from "./dino/window.js";
import { initSkillExplorer } from "./skills.js";
import { initContactForm } from "./contact.js";
import { renderChrome, initReveal, initAnalytics } from "./chrome.js";
import { initCursor } from "./cursor.js";
import { ICONS, contactChannels } from "./icons.js";
import { renderCertifications } from "./certifications.js";
import { el } from "./dom.js";

const chips = (items) => el("ul", { class: "chips" }, items.map((i) => el("li", {}, i)));
const bullets = (items) => el("ul", { class: "bullets" }, items.map((i) => el("li", {}, i)));
/** Decorative project logo; the project name always sits next to it. */
const projectLogoSrc = (id) => `/assets/logos/${id}.svg`;
const projectLogo = (id, size) => el("img", {
  class: "project-logo", src: projectLogoSrc(id), alt: "", width: String(size), height: String(size), loading: "lazy",
});
/** A project's stack drawn as connected pipeline stages. */
const pipeline = (stages) => el("ol", { class: "pipeline", "aria-label": "Tech stack" },
  stages.map((stage, i) => el("li", { style: `--i: ${i}` }, stage)));

function renderHero(p) {
  document.getElementById("hero-tagline").textContent = p.tagline;
  document.getElementById("hero-availability").textContent =
    `Graduating ${p.graduation} · open to full-time roles from ${p.availableFrom}`;
  const [month, year] = p.availableFrom.split(" ");
  document.getElementById("avatar-text").textContent = `OPEN TO WORK · ${month.slice(0, 3).toUpperCase()} ${year} · AI + DATA ENGINEER ·`;
  typewriter(document.getElementById("hero-typed"), p.headlinePhrases);
  renderImpact(document.getElementById("impact-stats"), p.impact);
  enhanceImpact(document.getElementById("impact-stats"), p.impact);
}

function renderAbout(p) {
  document.getElementById("about-body").replaceChildren(
    el("p", { class: "about-hook" }, p.aboutHook),
    ...p.about.map((para) => el("p", {}, para)),
    el("dl", { class: "about-facts" }, p.aboutFacts.map((f) => el("div", {}, el("dt", {}, f.label), el("dd", {}, f.value)))),
    p.hobbies.length ? chips(p.hobbies) : "",
  );
}

function renderExperience(p) {
  document.getElementById("experience-list").replaceChildren(...p.experience.map((x) =>
    el("article", { class: "timeline-item reveal", "data-roles": (x.roles ?? []).join(" ") },
      el("span", { class: "dot", "aria-hidden": "true" }),
      el("div", { class: "card", id: `exp-${x.id}` },
        el("div", { class: "card-head" },
          el("div", {}, el("h3", {}, x.role), el("p", { class: "accent" }, x.company)),
          el("div", { class: "meta" }, el("span", {}, x.dates), el("span", {}, x.place))),
        bullets(x.points)))));
}

function renderProjects(p) {
  document.getElementById("project-list").replaceChildren(...p.projects.map((x) =>
    el("article", { class: `card project reveal${x.featured ? " is-featured" : ""}`, id: `proj-${x.id}`, "data-roles": (x.roles ?? []).join(" ") },
      el("div", { class: "card-head" },
        el("div", { class: "project-title" }, projectLogo(x.id, 48), el("div", {}, x.featured && el("span", { class: "featured-tag" }, "Featured"), el("h3", {}, x.name))),
        x.date && el("span", { class: "meta" }, x.date)),
      bullets(x.points),
      el("div", { class: "project-footer" },
        pipeline(x.stack),
        el("div", { class: "project-actions" },
          x.demo && el("button", { type: "button", class: "ask-guru demo-btn", "data-demo": x.id }, "▶ Watch the agents debate"),
          el("button", { type: "button", class: "ask-guru", "data-ask": `Tell me about ${shortName(x.name)}` }, `✦ Ask ${p.assistant.name} about this`),
          x.repo && el("a", { class: "link-arrow small", href: x.repo, target: "_blank", rel: "noopener" }, x.repoLabel ?? "Code on GitHub →"))))));
}

/** "FinSight — RBAC RAG Chatbot" -> "FinSight" */
const shortName = (name) => name.split(" — ")[0];

/** Project-card "Ask" buttons hand a starter question to the assistant. */
function initProjectQuestions(list, assistant) {
  list?.addEventListener("click", (e) => {
    const button = e.target.closest("[data-ask]");
    if (button && assistant) assistant.ask(button.dataset.ask);
  });
}

function renderSkills(p) {
  document.getElementById("skill-list").replaceChildren(...p.skills.map((s) =>
    el("article", { class: "card reveal", "data-roles": (s.roles ?? []).join(" ") }, el("h3", {}, s.group),
      el("ul", { class: "chips" }, s.items.map((item) =>
        el("li", {}, el("button", { type: "button", class: "skill-chip", "data-skill": item, "aria-pressed": "false" }, item)))))));
}

function renderAchievements(p) {
  // Hide the whole section until there is something to show.
  if (!p.achievements.length && !p.publication) {
    document.getElementById("achievements")?.remove();
    return;
  }
  document.getElementById("achievement-list").replaceChildren(...p.achievements.map((a) =>
    el("article", { class: "card reveal" },
      el("div", { class: "card-head" }, el("h3", {}, a.title), el("span", { class: "meta" }, a.year)),
      el("p", { class: "accent small" }, a.where),
      el("p", { class: "small" }, a.detail))));
  document.getElementById("publication").textContent = p.publication;
}

/** An icon element from the shared, static SVG set. */
function icon(id, className) {
  const span = el("span", { class: className, "aria-hidden": "true" });
  span.innerHTML = ICONS[id];
  return span;
}

const opensInNewTab = (href) => href.startsWith("http") || href.endsWith(".pdf");
const linkAttrs = (href) => (opensInNewTab(href) ? { href, target: "_blank", rel: "noopener" } : { href });

function renderSocials(channels) {
  // Same order as the "Find me" list, so icons never appear in two orders.
  document.getElementById("hero-socials").replaceChildren(...channels.filter((c) => c.hero).map((c) =>
    el("a", { ...linkAttrs(c.href), "aria-label": c.label }, icon(c.id, "social-icon"))));
}

function renderContact(p) {
  const channels = contactChannels(p.contact);
  renderSocials(channels);
  document.getElementById("contact-lead").textContent =
    `I'm looking for full-time AI/ML, data engineering and analytics roles starting ${p.availableFrom}. If you have a role, a project or just a question, send me a message or reach out directly.`;
  document.getElementById("contact-meta").textContent = `${p.location.split(",").slice(0, 2).join(",")} · ${p.relocation}`;
  // Logos only; the label and handle live in the tooltip and screen-reader text.
  document.getElementById("contact-links").replaceChildren(...channels.map((c) =>
    el("li", {},
      el("a", { ...linkAttrs(c.href), class: `contact-logo contact-${c.id}`, "aria-label": `${c.label}: ${c.text}`, title: `${c.label}: ${c.text}` },
        icon(c.id, "contact-icon")))));

  initContactForm(document.getElementById("contact-form"), document.getElementById("contact-status"), p);
}

renderHero(PROFILE);
renderAbout(PROFILE);
renderEducation(document.getElementById("journey"), document.getElementById("education-list"), PROFILE);
renderExperience(PROFILE);
renderProjects(PROFILE);
renderSkills(PROFILE);
renderAchievements(PROFILE);
renderCertifications(document.getElementById("cert-list"), PROFILE.certifications);
renderContact(PROFILE);
const nav = renderChrome({ onHome: true });
initAnalytics();
initCursor();
initReveal();
initCardEffects();
initScrollUI(document.getElementById("scroll-progress"), nav);
startBackground(document.getElementById("bg-canvas"));
const assistant = initChatbot(document.getElementById("chatbot"));
const dinoStatus = document.getElementById("dino-status");
initGameWindow(document.querySelector(".game-slot"), initDinoGame(document.getElementById("dino-game"), dinoStatus), dinoStatus);
initSkillExplorer(document.getElementById("skill-list"), document.getElementById("skill-insight"), PROFILE, assistant);
initProjectQuestions(document.getElementById("project-list"), assistant);
initRoleFocus(document.getElementById("hero-roles"), document.getElementById("focus-note"), FOCUS);
initDebate(document.getElementById("project-list"), PROFILE.projects);
