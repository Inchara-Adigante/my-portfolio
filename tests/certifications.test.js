import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PROFILE, CERT_GROUPS, certLabel, profileAsText } from "../js/profile.js";
import { certMeta, groupCertifications } from "../js/certifications.js";
import { answerLocally } from "../js/local-answers.js";

const groupIds = CERT_GROUPS.map((g) => g.id);

test("every certification has a known group, a name and an issuer", () => {
  for (const c of PROFILE.certifications) {
    assert.ok(groupIds.includes(c.group), `${c.name}: unknown group ${c.group}`);
    assert.ok(c.name && c.issuer, JSON.stringify(c));
  }
});

test("every badge and logo is a file in assets/certs, and no certificate images are shipped", () => {
  for (const c of PROFILE.certifications) {
    assert.equal(c.certificate, undefined, `${c.name} still points at a certificate image`);
    for (const src of [c.badge, c.logo].filter(Boolean)) {
      assert.match(src, /^\/assets\/certs\//, c.name);
      assert.ok(existsSync(src.slice(1)), `${c.name}: missing ${src}`);
    }
  }
});

test("the AWS certification shows its badge", () => {
  const badged = PROFILE.certifications.filter((c) => c.badge).map((c) => c.issuer);
  assert.deepEqual(badged, ["Amazon Web Services"]);
});

test("every card has the issuer's badge or logo, and none links to a certificate", () => {
  for (const c of PROFILE.certifications) {
    assert.ok(c.badge || c.logo, `${c.name} has no badge or logo`);
    if (c.verify) assert.match(c.verify, /^https:\/\/www\.credly\.com\/badges\//, `${c.name} verify link`);
    assert.ok([undefined, "fill", "wordmark"].includes(c.logoStyle), `${c.name}: unknown logoStyle ${c.logoStyle}`);
  }
});

test("cards sit in one even grid: equal rows, and badges and logos share one size", () => {
  const css = readFileSync("styles.css", "utf8");
  const grid = css.match(/\.cert-grid \{([^}]*)\}/);
  assert.ok(grid, ".cert-grid rule exists");
  assert.match(grid[1], /grid-auto-rows: 1fr/, "every row is as tall as the tallest card");
  assert.match(css, /\.cert-badge, \.cert-logo \{ width: var\(--cert-mark\); height: var\(--cert-mark\);/);
  assert.doesNotMatch(css, /\.cert-group|\.cert-logo\.is-wide/, "no per-group grids or wider tiles");
  for (const group of CERT_GROUPS) assert.ok(group.label, `${group.id} has a card label`);
});

test("certMeta and certLabel join issuer and date, skipping a missing date", () => {
  assert.equal(certMeta({ issuer: "MongoDB University", date: "Dec 2021" }), "MongoDB University · Dec 2021");
  assert.equal(certMeta({ issuer: "Google" }), "Google");
  assert.equal(certLabel({ name: "X", issuer: "Google" }), "X (Google)");
});

test("groups come out in CERT_GROUPS order and hold only their own items", () => {
  const groups = groupCertifications(PROFILE.certifications);
  const present = groupIds.filter((id) => PROFILE.certifications.some((c) => c.group === id));
  assert.deepEqual(groups.map((g) => g.group.id), present);
  for (const { group, items } of groups) assert.ok(items.every((c) => c.group === group.id), group.id);
  assert.equal(groups.reduce((n, g) => n + g.items.length, 0), PROFILE.certifications.length);
  assert.deepEqual(groupCertifications([{ group: "course", name: "A", issuer: "B" }]).map((g) => g.group.id), ["course"]);
});

test("the assistant lists certifications when asked", () => {
  assert.match(answerLocally("Which certifications does Inchara have?"), /^Certifications:\n• AWS Certified Data Engineer – Associate/);
  assert.match(answerLocally("Show me the badges"), /AWS Certified Data Engineer/);
  // Questions about the degree still go to education.
  assert.match(answerLocally("What courses did Inchara take at Northeastern?"), /Northeastern/);
});

test("the AI's grounding text has every certification", () => {
  const text = profileAsText();
  for (const c of PROFILE.certifications) assert.ok(text.includes(c.name), c.name);
});
