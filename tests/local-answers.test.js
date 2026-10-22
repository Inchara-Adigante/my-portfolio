import { test } from "node:test";
import assert from "node:assert/strict";
import { answerLocally } from "../js/local-answers.js";
import { PROFILE, profileAsText } from "../js/profile.js";

test("returns contact details when asked how to reach Inchara", () => {
  const reply = answerLocally("How do I get in touch?");
  assert.match(reply, new RegExp(PROFILE.contact.email.replace(".", "\\.")));
  // Channels left out of the profile are not listed.
  assert.doesNotMatch(reply, /Phone|Instagram/);
});

test("describes a specific role when the company is named", () => {
  assert.match(answerLocally("What was the role at Skyworks?"), /Data Engineer Co-op at Skyworks Solutions/);
  assert.match(answerLocally("tell me about accenture"), /Software Engineer at Accenture/);
  assert.match(answerLocally("tell me about bharat electronics"), /Data Engineering Intern/);
});

test("describes a specific project when it is named", () => {
  assert.match(answerLocally("Explain Jobzilla"), /Recruiter, a Career Coach and a Judge/);
  assert.match(answerLocally("Tell me about the real-time order pipeline"), /10,000\+ simulated transactions/);
  assert.match(answerLocally("Tell me about the subscription revenue warehouse"), /dbt fact and dimension models/);
});

test("answers availability questions with graduation and start date", () => {
  const reply = answerLocally("When can Inchara start full-time?");
  assert.match(reply, /December 2026/);
  assert.match(reply, /January 2027/);
});

test("names the roles Inchara is open to", () => {
  const reply = answerLocally("What roles is Inchara open to?");
  for (const role of ["AI/ML engineering", "data engineering", "analytics engineering", "data analyst"]) assert.match(reply, new RegExp(role), role);
  assert.match(answerLocally("Is Inchara open to relocation?"), /open to relocation/);
});

test("falls back to a helpful message for unrelated questions", () => {
  assert.match(answerLocally("what is the weather on mars"), /can only answer|not sure/);
  assert.match(answerLocally("what's the best pizza topping"), /not sure/);
});

test("profile text includes every employer and project for LLM grounding", () => {
  const text = profileAsText();
  for (const job of PROFILE.experience) assert.ok(text.includes(job.company));
  for (const project of PROFILE.projects) assert.ok(text.includes(project.name));
});

test("routes every follow-up chip to a specific answer, not the fallback", async () => {
  const cases = {
    "Where did Inchara study?": /Northeastern/,
    "What's the data engineering experience?": /Snowflake/,
    "What's the LLM / GenAI experience?": /Jobzilla/,
    "Any analytics or BI experience?": /Power BI/,
    "Why should we hire Inchara?": /reasons/,
    "Which certifications?": /AWS Certified/,
  };
  for (const [question, expected] of Object.entries(cases)) {
    assert.match(answerLocally(question), expected, question);
  }
});

test("does not match short keys inside longer words", () => {
  const reply = answerLocally("Can you help me with my homework on this?");
  assert.doesNotMatch(reply, /^Hi!/);
});

test("introduces itself by name when asked who it is", () => {
  for (const q of ["What's your name?", "Who are you?", "are you a bot?"]) {
    assert.match(answerLocally(q), new RegExp(`I'm ${PROFILE.assistant.name}`), q);
  }
});

test("still answers questions about Inchara rather than the bot", () => {
  assert.match(answerLocally("Who is Inchara?"), /AI\/ML and data engineer/);
});

test("admits what it doesn't know instead of inventing hobbies or awards", () => {
  assert.match(answerLocally("What does Inchara do outside work?"), /don't have/);
  assert.match(answerLocally("What awards has Inchara won?"), /don't have awards listed/);
});

test("lists projects in résumé order", () => {
  assert.match(answerLocally("What projects has Inchara built?"), /Jobzilla AI[\s\S]*Real-Time Order Processing Pipeline[\s\S]*Subscription Revenue Warehouse/);
});

test("guards don't block legitimate recruiter questions", () => {
  assert.match(answerLocally("What is Inchara's email address?"), /adiganteinchara@gmail\.com/);
  assert.doesNotMatch(answerLocally("Did Inchara act as a tech lead?"), /can't change or reveal/);
  assert.doesNotMatch(answerLocally("Did Inchara write the system prompt for the assistant?"), /can't change or reveal/);
  assert.doesNotMatch(answerLocally("How old is the warehouse project?"), /don't have that detail/);
});
