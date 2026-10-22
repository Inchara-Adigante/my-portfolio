// Certifications section. A certification with a verify link becomes a full
// "digital credential" card (badge with a shine, validity, the domains it
// covers, a Credly link); anything else uses the plain card grid.

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

function credential(c) {
  return el("article", { class: "card credential reveal" },
    el("div", { class: "credential-badge", style: `--badge: url(${c.badge})` },
      el("img", { src: c.badge, alt: `${c.name} badge`, width: 132, height: 132, loading: "lazy", decoding: "async" }),
      el("span", { class: "credential-shine", "aria-hidden": "true" })),
    el("div", { class: "credential-body" },
      el("p", { class: "credential-kicker" }, el("span", { class: "credential-status" }, "Active"), c.issuer),
      el("h3", {}, c.name),
      el("dl", { class: "credential-dates" },
        el("div", {}, el("dt", {}, "Issued"), el("dd", {}, c.date)),
        c.validUntil && el("div", {}, el("dt", {}, "Valid through"), el("dd", {}, c.validUntil))),
      c.domains?.length && el("div", { class: "credential-domains" },
        el("p", { class: "credential-label" }, "What it validates"),
        el("ul", {}, c.domains.map((d) => el("li", {}, d)))),
      el("a", { class: "btn btn-light small credential-verify", href: c.verify, target: "_blank", rel: "noopener" }, "Verify on Credly ↗")));
}

export function renderCertifications(container, certifications) {
  const credentials = certifications.filter((c) => c.verify);
  const rest = certifications.filter((c) => !c.verify);
  const restGroups = groupCertifications(rest);
  const grid = el("div", { class: "cert-grid" }, restGroups.flatMap(({ group, items }) => items.map((c) => card(c, group))));
  container.replaceChildren(...credentials.map(credential), ...(restGroups.length ? [grid] : []));
}
