import { test } from "node:test";
import assert from "node:assert/strict";
import { PROFILE } from "../js/profile.js";
import { findSkillUsage, skillTerms, placePopover } from "../js/skills.js";

const labels = (skill) => findSkillUsage(PROFILE, skill).map((u) => u.label);

test("splits combined skills and strips API suffixes and plurals", () => {
  assert.deepEqual(skillTerms("Spark / PySpark"), ["spark", "pyspark"]);
  assert.ok(skillTerms("Claude API").includes("claude"));
  assert.ok(skillTerms("LLMs").includes("llm"));
});

test("finds every project and job that used a skill", () => {
  assert.deepEqual(labels("Snowflake"), ["Accenture (Software Engineer)", "Subscription Revenue Warehouse"]);
  assert.ok(labels("FastAPI").includes("Jobzilla AI"));
  assert.ok(labels("Redis").includes("Jobzilla AI"));
  assert.ok(labels("Power BI").some((l) => l.startsWith("Bharat Electronics")));
});

test("does not count negated mentions as usage", () => {
  const profile = { experience: [], projects: [{ id: "x", name: "X", stack: [], points: ["Built with no LLM APIs."] }] };
  assert.deepEqual(findSkillUsage(profile, "LLMs"), []);
});

test("returns nothing for skills with no recorded usage", () => {
  assert.deepEqual(labels("MongoDB"), []);
});

test("keeps unspaced slashes together so A/B Testing stays one skill", () => {
  assert.deepEqual(skillTerms("A/B Testing"), ["a/b testing"]);
});

test("streaming skills point at the order pipeline", () => {
  assert.ok(labels("Kafka").includes("Real-Time Order Processing Pipeline"));
  assert.ok(labels("Airflow").includes("Subscription Revenue Warehouse"));
});

test("the AWS pipeline skills are listed and point at the order pipeline", () => {
  const cloud = PROFILE.skills.find((s) => s.group === "Cloud / Backend").items;
  for (const skill of ["AWS S3", "AWS Glue", "Athena"]) {
    assert.ok(cloud.includes(skill), `${skill} is in Cloud / Backend`);
    assert.ok(labels(skill).includes("Real-Time Order Processing Pipeline"), `${skill} links to the project`);
  }
});

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

test("the usage popover opens just below the skill, with its arrow on the skill", () => {
  const container = rect(0, 100, 1000, 900);
  const chip = rect(300, 400, 80, 28);
  const spot = placePopover(chip, container, { width: 400, height: 120 }, 900);
  assert.equal(spot.above, false);
  assert.equal(spot.top, chip.bottom - container.top + 10);
  assert.equal(spot.left + spot.arrowX, 340, "arrow points at the chip's center");
});

test("near the bottom of the window it opens above the skill instead", () => {
  const container = rect(0, -200, 1000, 1400);
  const chip = rect(300, 820, 80, 28);
  const spot = placePopover(chip, container, { width: 400, height: 120 }, 900);
  assert.equal(spot.above, true);
  assert.equal(spot.top, chip.top - container.top - 10 - 120);
});

test("the popover never spills past the section's edges", () => {
  const container = rect(20, 0, 600, 800);
  const nearLeft = placePopover(rect(24, 300, 60, 28), container, { width: 400, height: 100 }, 900);
  assert.equal(nearLeft.left, 0);
  const nearRight = placePopover(rect(580, 300, 40, 28), container, { width: 400, height: 100 }, 900);
  assert.equal(nearRight.left, 600 - 400);
  assert.ok(nearRight.arrowX <= 400 - 16 && nearLeft.arrowX >= 16, "arrow stays on the popover");
});
