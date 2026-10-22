// Site chrome shared by every page: header (desktop pill nav), the floating
// mobile tab bar, footer, and scroll-reveal. Both navs come from NAV_ITEMS.
// Section links are anchors on the homepage and "/#section" elsewhere.

import { ICONS } from "./icons.js";
import { initTabGlass } from "./tab-glass.js";
import { createThemeToggle } from "./theme.js";

// One order for everything: the homepage section order. The desktop nav, the
// mobile tab bar and the footer all use NAV_ITEMS. The assistant is the chat button,
// not a page.
// `section` = homepage section it highlights; `page`/`href` = its own page.
export const NAV_ITEMS = Object.freeze([
  { id: "home", label: "Home", section: "home" },
  { id: "about", label: "About", section: "about" },
  { id: "experience", label: "Experience", page: "experience", href: "/experience/", section: "experience" },
  { id: "projects", label: "Projects", section: "projects" },
  { id: "contact", label: "Contact", section: "contact" },
]);

function hrefFor(item, onHome) {
  if (item.href) return item.href;
  if (item.section === "home") return onHome ? "#home" : "/";
  return onHome ? `#${item.section}` : `/#${item.section}`;
}

function navLink(item, { onHome, page, withIcon }) {
  const a = document.createElement("a");
  a.href = hrefFor(item, onHome);
  if (item.section) a.dataset.section = item.section;
  if (item.page && item.page === page) {
    a.setAttribute("aria-current", "page");
    a.classList.add("active");
  }
  if (withIcon) {
    a.setAttribute("aria-label", item.label);
    a.title = item.label;
    a.innerHTML = ICONS[item.id];
  } else {
    a.textContent = item.label;
  }
  return a;
}

function renderHeader(header, { onHome, page }) {
  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = onHome ? "#home" : "/";
  brand.innerHTML = "<strong>Inchara Adigante</strong>";
  const nav = document.createElement("nav");
  nav.id = "site-nav";
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Main");
  nav.append(...NAV_ITEMS.map((item) => navLink(item, { onHome, page })));
  header.replaceChildren(brand, nav, createThemeToggle());
  return nav;
}

/** Floating liquid-glass tab bar shown on phones in place of the header links. */
function renderTabBar({ onHome, page }) {
  const bar = document.createElement("nav");
  bar.className = "tab-bar";
  bar.setAttribute("aria-label", "Main");
  bar.append(...NAV_ITEMS.map((item) => navLink(item, { onHome, page, withIcon: true })));
  document.body.append(bar);
  initTabGlass(bar);
  return bar;
}

function renderFooter(footer) {
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <p>© ${year} Inchara Adigante. All rights reserved.</p>
    <p class="footer-links">${NAV_ITEMS.slice(1).map((item) => `<a href="${hrefFor(item, false)}">${item.label}</a>`).join(" · ")}</p>
    <p class="credits">School logo: <a href="https://commons.wikimedia.org/wiki/File:NU_RGB_seal_R.png" target="_blank" rel="noopener">Northeastern University</a> via Wikimedia Commons, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</p>`;
}

/** Renders header, footer and mobile tab bar. Pages pass `page` to mark the current one. */
export function renderChrome({ onHome = false, page = "" } = {}) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (!header || !footer) return null;
  if (onHome && !page) document.body.dataset.page = "home";
  const nav = renderHeader(header, { onHome, page });
  renderTabBar({ onHome, page });
  renderFooter(footer);
  return nav;
}

export function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((i) => i.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });
  items.forEach((i) => observer.observe(i));
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Loads Vercel Web Analytics (cookie-free page views) on the deployed site only. */
export function initAnalytics() {
  if (LOCAL_HOSTS.has(location.hostname) || document.querySelector("script[data-analytics]")) return;
  window.va = window.va || function va(...args) { (window.vaq = window.vaq || []).push(args); };
  const script = document.createElement("script");
  script.defer = true;
  script.src = "/_vercel/insights/script.js";
  script.dataset.analytics = "vercel";
  document.head.append(script);
}
