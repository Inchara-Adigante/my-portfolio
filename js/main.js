import { PROFILE, FOCUS, LETTER } from "./profile.js";
import { initRoleFocus, enhanceImpact, initDebate } from "./interactive.js";
import { renderEducation } from "./education.js";
import { projectPanel } from "./project-panels.js";
import { renderExperience } from "./experience.js";
import { startBackground } from "./background.js";
import { initChatbot } from "./chatbot.js";
import { typewriter, renderImpact, initCardEffects, initScrollUI } from "./effects.js";
import { initOwlLetter } from "./owl-letter.js";
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


function renderProjects(p) {
  document.getElementById("project-list").replaceChildren(...p.projects.map((x) =>
    el("article", { class: "card project reveal", id: `proj-${x.id}`, "data-roles": (x.roles ?? []).join(" ") },
      el("div", { class: "card-head" },
        el("div", { class: "project-title" }, projectLogo(x.id, 48), el("h3", {}, x.name)),
        x.date && el("span", { class: "meta" }, x.date)),
      bullets(x.points),
      el("div", { class: "project-footer" },
        projectPanel(x),
        el("div", { class: "project-actions" },
          el("button", { type: "button", class: "ask-assistant", "data-ask": `Tell me about ${shortName(x.name)}` }, `✦ Ask ${p.assistant.name} about this`),
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

/** A skill chip; hovering or tapping it shows where the skill was used (js/skills.js). */
function skillChip(p, skill) {
  return el("li", {}, el("button", { type: "button", class: "skill-chip", "data-skill": skill, "aria-pressed": "false" }, skill));
}

/** Skills as the stages of a data pipeline, with the shared foundations underneath. */
function renderSkills(p) {
  const stages = p.stack.map((stage, i) =>
    el("li", { class: "stack-stage reveal", "data-roles": stage.roles.join(" "), style: `--i: ${i}` },
      el("div", { class: "stage-head" },
        el("span", { class: "stage-num" }, String(i + 1).padStart(2, "0")),
        el("h3", {}, stage.title),
        el("p", {}, stage.blurb)),
      el("ul", { class: "chips" }, stage.items.map((skill) => skillChip(p, skill)))));
  document.getElementById("skill-list").replaceChildren(
    el("ol", { class: "stack-flow" }, stages),
    el("div", { class: "stack-base reveal" },
      el("span", { class: "base-label" }, "Runs on"),
      el("ul", { class: "chips" }, p.foundations.map((skill) => skillChip(p, skill)))));
}

function renderAchievements(p) {
  // Hide the whole section until there is something to show.
  if (!p.achievements.length) {
    document.getElementById("achievements")?.remove();
    return;
  }
  document.getElementById("achievement-list").replaceChildren(...p.achievements.map((a) =>
    el("article", { class: "card reveal" },
      el("div", { class: "card-head" }, el("h3", {}, a.title), el("span", { class: "meta" }, a.year)),
      el("p", { class: "accent small" }, a.where),
      el("p", { class: "small" }, a.detail))));
}

/** "Omprakash B, Ayush Kumar, Harshitha V and Inchara A" with Inchara's name in bold. */
function authorLine(x) {
  const names = x.authors.map((a) => (a === x.me ? el("strong", {}, a) : a));
  return names.flatMap((n, i) => (i === 0 ? [n] : [i === names.length - 1 ? " and " : ", ", n]));
}

/** APA-style citation for the "Copy citation" button. */
const citation = (x) => `${x.authors.join(", ")} (${x.year}). ${x.title}. ${x.venue}, ${x.volume}(${x.issue}), ${x.pages}. ${x.url}`;

function renderPublications(p, getAssistant) {
  const list = document.getElementById("publication-list");
  if (!p.publications.length) {
    document.getElementById("publications")?.remove();
    return;
  }
  list.replaceChildren(...p.publications.map((x) =>
    el("article", { class: "card pub reveal", id: `pub-${x.id}` },
      el("div", { class: "pub-main" },
        el("p", { class: "pub-kicker" }, el("span", { class: "pub-tag" }, "Research paper"), `${x.venueShort} · Vol. ${x.volume}, Issue ${x.issue} · ${x.date}`),
        el("h3", {}, x.title),
        el("p", { class: "pub-authors" }, ...authorLine(x), el("span", { class: "muted" }, ` · ${x.affiliation}`)),
        el("p", { class: "pub-summary" }, x.summary),
        el("div", { class: "pub-actions" },
          el("a", { class: "btn btn-light small", href: x.url, target: "_blank", rel: "noopener" }, "Read paper ↗"),
          el("button", { type: "button", class: "btn btn-ghost small", "data-cite": x.id }, "Copy citation"),
          el("button", { type: "button", class: "ask-assistant", "data-ask": `Tell me about the ${x.venueShort} paper` }, `✦ Ask ${p.assistant.name} about this`))),
      el("dl", { class: "pub-stats" }, x.stats.map((s) => el("div", {}, el("dt", {}, s.value), el("dd", {}, s.label)))))));
  list.addEventListener("click", async (e) => {
    const ask = e.target.closest("[data-ask]");
    if (ask) return getAssistant()?.ask(ask.dataset.ask);
    const cite = e.target.closest("[data-cite]");
    if (!cite) return;
    const x = p.publications.find((y) => y.id === cite.dataset.cite);
    try {
      await navigator.clipboard.writeText(citation(x));
      cite.textContent = "Copied ✓";
    } catch {
      cite.textContent = "Copy failed";
    }
    setTimeout(() => { cite.textContent = "Copy citation"; }, 2000);
  });
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
renderExperience(document.getElementById("experience-list"), PROFILE);
renderProjects(PROFILE);
renderSkills(PROFILE);
renderAchievements(PROFILE);
renderCertifications(document.getElementById("cert-list"), PROFILE.certifications);
// Rendered before initReveal so the card fades in; the assistant is looked up when a button is clicked.
renderPublications(PROFILE, () => assistant);
renderContact(PROFILE);
const nav = renderChrome({ onHome: true });
initAnalytics();
initCursor();
initReveal();
initCardEffects();
initScrollUI(document.getElementById("scroll-progress"), nav);
startBackground(document.getElementById("bg-canvas"));
const assistant = initChatbot(document.getElementById("chatbot"));
initOwlLetter(document.getElementById("owl-letter"), LETTER, PROFILE);
initSkillExplorer(document.getElementById("skill-list"), document.getElementById("skill-insight"), PROFILE, assistant);
initProjectQuestions(document.getElementById("project-list"), assistant);
initRoleFocus(document.getElementById("hero-roles"), document.getElementById("focus-note"), FOCUS);
initDebate(document.getElementById("project-list"), PROFILE.projects);
