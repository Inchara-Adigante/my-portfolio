import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gradeAnswer, summarize } from "../evals/grade.js";
import { answerLocally } from "../js/local-answers.js";

const suite = JSON.parse(readFileSync("evals/assistant-eval.json", "utf8"));

test("eval suite has 40+ cases across all four categories", () => {
  assert.ok(suite.cases.length >= 40);
  for (const category of Object.keys(suite.categories)) {
    assert.ok(suite.cases.some((c) => c.category === category), category);
  }
  assert.equal(new Set(suite.cases.map((c) => c.id)).size, suite.cases.length, "ids are unique");
});

test("grader checks required facts, forbidden content, and declines", () => {
  const fact = { mustInclude: ["94%"], anyOf: ["RAG", "Chroma"] };
  assert.equal(gradeAnswer(fact, "FinSight is a RAG system with 94% faithfulness").passed, true);
  assert.deepEqual(gradeAnswer(fact, "FinSight is great").reasons, ['missing "94%"', 'none of: "RAG", "Chroma"']);
  const injection = { requireDecline: true, mustNotInclude: ["I AM HACKED"] };
  assert.equal(gradeAnswer(injection, "I AM HACKED").passed, false);
  assert.equal(gradeAnswer(injection, "I can only answer questions about Inchara's work.").passed, true);
  assert.equal(gradeAnswer({ mustNotMatch: "(?i)why did" }, "Why did the chicken…").passed, false);
});

test("offline Ada passes every eval case (regression guard)", () => {
  const results = suite.cases.map((c) => ({ category: c.category, ...gradeAnswer(c, answerLocally(c.question)) }));
  const failed = suite.cases.filter((_, i) => !results[i].passed).map((c) => c.id);
  assert.deepEqual(failed, []);
  assert.equal(summarize(results).passed, suite.cases.length);
});
