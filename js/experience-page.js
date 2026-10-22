// Full-history Experience page: every role, then education, rendered from
// PROFILE so it always matches the homepage and the assistant.

import { PROFILE } from "./profile.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function entry({ dates, title, org, place, points, logo }) {
  const item = el("article", "history-item reveal");
  const meta = el("p", "history-dates", dates);
  const heading = el("h3", "history-title");
  if (logo) {
    const img = el("img", "history-logo");
    img.src = logo;
    img.alt = "";
    img.width = 28;
    img.height = 28;
    heading.append(img);
  }
  heading.append(el("span", null, title), el("span", "history-org", ` · ${org}`));
  const where = el("p", "history-place small muted", place);
  const list = el("ul", "bullets");
  list.append(...points.map((p) => el("li", null, p)));
  item.append(meta, heading, where, list);
  return item;
}

export function renderExperiencePage() {
  const jobs = document.getElementById("history-jobs");
  const schools = document.getElementById("history-education");
  jobs?.replaceChildren(...PROFILE.experience.map((x) => entry({
    dates: x.dates, title: x.role, org: x.company, place: x.place, points: x.points,
  })));
  schools?.replaceChildren(...PROFILE.education.map((e) => entry({
    dates: e.dates, title: e.degree, org: e.school, place: `${e.place} · ${e.detail}`,
    points: e.coursework.length ? [`Coursework: ${e.coursework.join(", ")}.`] : [], logo: e.logo,
  })));
}
