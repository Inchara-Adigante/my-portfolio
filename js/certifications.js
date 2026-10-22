// Certifications section: one even grid of same-size cards, certifications
// first, then courses, then volunteering. Each card shows the issuer's
// official badge or logo and a small label for its kind. Cards are plain:
// nothing on them links to or opens a certificate.

import { CERT_GROUPS } from "./profile.js";
import { el } from "./dom.js";

export const certMeta = (c) => [c.issuer, c.date].filter(Boolean).join(" · ");

/** Certifications in CERT_GROUPS order: [{ group, items }], empty groups left out. */
export function groupCertifications(certifications) {
  return CERT_GROUPS
    .map((group) => ({ group, items: certifications.filter((cert) => cert.group === group.id) }))
    .filter(({ items }) => items.length > 0);
}

/** The official badge, else the issuer's logo on a white tile; both fill the same square. */
function mark(c) {
  if (c.badge) return el("img", { class: "cert-badge", src: c.badge, alt: "", width: 56, height: 56, loading: "lazy", decoding: "async" });
  return el("span", { class: `cert-logo${c.logoStyle ? ` is-${c.logoStyle}` : ""}` },
    el("img", { src: c.logo, alt: "", loading: "lazy", decoding: "async" }));
}

function card(c, group) {
  return el("article", { class: "card cert reveal" }, mark(c),
    el("div", { class: "cert-title" },
      el("p", { class: "cert-kind" }, group.label),
      el("h3", { title: c.name }, c.name),
      el("p", { class: "cert-meta" }, certMeta(c))));
}

export function renderCertifications(container, certifications) {
  container.replaceChildren(el("div", { class: "cert-grid" },
    groupCertifications(certifications).flatMap(({ group, items }) => items.map((c) => card(c, group)))));
}
