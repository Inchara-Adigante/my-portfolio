import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PROFILE, FOCUS } from "../js/profile.js";

const focusIds = FOCUS.map((f) => f.id);
const tagged = [...PROFILE.experience, ...PROFILE.projects, ...PROFILE.skills];

test("the hero role pills come from FOCUS, and every role has a short pitch", () => {
  assert.deepEqual(PROFILE.roles, FOCUS.map((f) => f.label));
  for (const f of FOCUS) assert.ok(f.pitch.length > 40 && f.pitch.length <= 140, `${f.id} pitch is ${f.pitch.length} chars`);
});

test("every experience, project and skill group names only known roles", () => {
  for (const item of tagged) {
    const name = item.company ?? item.name ?? item.group;
    assert.ok(item.roles?.length, `${name} has roles`);
    for (const r of item.roles) assert.ok(focusIds.includes(r), `${name}: unknown role ${r}`);
  }
});

test("picking any role still leaves at least one project and one job highlighted", () => {
  for (const id of focusIds) {
    assert.ok(PROFILE.projects.some((p) => p.roles.includes(id)) || PROFILE.experience.some((x) => x.roles.includes(id)), id);
    assert.ok(PROFILE.skills.some((s) => s.roles.includes(id)), `${id} skills`);
  }
});

test("every impact number points at a real experience card, and its bars are to scale", () => {
  const ids = PROFILE.experience.map((x) => x.id);
  for (const stat of PROFILE.impact) {
    assert.ok(ids.includes(stat.source), `${stat.label} → ${stat.source}`);
    if (stat.compare) assert.ok(stat.compare.ratio > 0 && stat.compare.ratio <= 1, stat.label);
  }
  // 3 hours to 10 minutes is the 94% headline number.
  const report = PROFILE.impact.find((s) => s.compare?.before === "3h");
  assert.equal(Math.round((1 - report.compare.ratio) * 100), report.value);
});

test("the debate demo is clearly marked as a sample and ends with the Judge", () => {
  const demo = PROFILE.projects.find((p) => p.id === "jobzilla").demo;
  assert.match(demo.candidate, /^Sample candidate/);
  assert.equal(demo.turns.at(-1).agent, "Judge");
  assert.deepEqual([...new Set(demo.turns.map((t) => t.agent))].sort(), ["Career Coach", "Judge", "Recruiter"]);
  assert.match(readFileSync("js/interactive.js", "utf8"), /Illustrative example with a sample candidate/);
});

test("the homepage has the role switch and its live note", () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /<ul id="hero-roles" class="pill-row focus-row"/);
  assert.match(html, /id="focus-note"[^>]*aria-live="polite"/);
});
