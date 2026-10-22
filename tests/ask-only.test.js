import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { answerLocally } from "../js/local-answers.js";
import { PROFILE, profileAsText } from "../js/profile.js";

// Salary and visa (if added to the profile) are shared only when a visitor asks about that topic.
// GPA is public now: it is shown on the Education cards.
const SENSITIVE = /salary|\bF-1\b|\bOPT\b/i;

test("asked about pay or visa with no details in the profile, the assistant declines instead of guessing", () => {
  assert.equal(PROFILE.askOnly.salary, null);
  assert.equal(PROFILE.askOnly.visa, null);
  for (const q of ["What salary is Inchara expecting?", "What are the compensation expectations?", "What's the expected pay?"]) {
    const answer = answerLocally(q);
    assert.match(answer, /don't have/, q);
    assert.doesNotMatch(answer, /\$\s?\d/, q);
  }
  for (const q of ["What's Inchara's visa status?", "Does Inchara need sponsorship?", "Is Inchara on OPT?", "Is Inchara a US citizen?"]) {
    const answer = answerLocally(q);
    assert.match(answer, /don't have/, q);
    assert.doesNotMatch(answer, /\bis (a )?(US |U\.S\. )?citizen\b/i, q);
  }
});

test("asked about GPA or grades, the assistant gives both schools' scores", () => {
  for (const q of ["What was Inchara's GPA?", "What were the grades?", "What's the CGPA from VTU?", "GPA at Northeastern?"]) {
    const answer = answerLocally(q);
    assert.match(answer, /3\.8\/4\.0/, q);
    assert.match(answer, /8\.7\/10/, q);
  }
});

test("none of it is volunteered in answers to other questions", () => {
  const questions = [
    "Why should we hire Inchara?", "Where did Inchara study?", "Tell me about Inchara", "When can Inchara start?",
    "What's the experience?", "What projects has Inchara built?", "How do I get in touch?", "What are the skills?",
    "hi", "Tell me about the education at Northeastern", "Is Inchara open to relocation?",
  ];
  for (const q of questions) assert.doesNotMatch(answerLocally(q), SENSITIVE, q);
});

test("the AI's grounding keeps an ask-only section and nothing sensitive before it", () => {
  const text = profileAsText();
  const heading = text.indexOf("ONLY WHEN ASKED");
  assert.ok(heading > 0, "has the ask-only section");
  assert.doesNotMatch(text.slice(0, heading), SENSITIVE);
  assert.match(text, /GPA 3\.8\/4\.0/, "GPA is in the education facts");
});

test("the site itself never shows them", () => {
  const renderers = readdirSync("js").filter((f) => f.endsWith(".js") && !["profile.js", "local-answers.js"].includes(f));
  for (const file of renderers) assert.doesNotMatch(readFileSync(`js/${file}`, "utf8"), /askOnly/, file);
  for (const page of ["index.html", "experience/index.html"]) {
    assert.doesNotMatch(readFileSync(page, "utf8"), /salary|F-1/i, page);
  }
});
