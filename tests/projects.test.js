import { test } from "node:test";
import assert from "node:assert/strict";
import { PROFILE } from "../js/profile.js";

// Project cards are laid out at one fixed size, so each must carry the same
// amount of content. Extra context belongs in `details` (used only by the assistant).
const POINTS_PER_CARD = 2;
const STAGES_PER_CARD = 5;
const POINT_LENGTH = { min: 130, max: 175 };

test("every project card shows exactly 2 bullets and 5 stack stages", () => {
  for (const p of PROFILE.projects) {
    assert.equal(p.points.length, POINTS_PER_CARD, `${p.id} bullets`);
    assert.equal(p.stack.length, STAGES_PER_CARD, `${p.id} stages`);
  }
});

test("bullets are similar in length so cards stay balanced", () => {
  for (const p of PROFILE.projects) {
    for (const point of p.points) {
      assert.ok(
        point.length >= POINT_LENGTH.min && point.length <= POINT_LENGTH.max,
        `${p.id}: ${point.length} chars (want ${POINT_LENGTH.min}-${POINT_LENGTH.max})`,
      );
    }
  }
});

test("the assistant still knows the details that don't fit on the cards", async () => {
  const { profileAsText } = await import("../js/profile.js");
  const text = profileAsText();
  assert.match(text, /Bronze-Silver-Gold pipeline/);
  assert.match(text, /star schema/);
  assert.match(text, /3-person team/);
});

test("the EV platform leads the list and its numbers are known to the assistant", async () => {
  const { answerLocally } = await import("../js/local-answers.js");
  const ev = PROFILE.projects[0];
  assert.equal(ev.id, "ev");
  assert.equal(ev.repo, "https://github.com/Inchara-Adigante/ev-reliability-platform");
  const reply = answerLocally("Tell me about the EV reliability platform");
  assert.match(reply, /2,000-vehicle/);
  assert.match(reply, /34% of 90-day failures/);
  assert.match(reply, /ROC-AUC 0\.755/);
});

test("Jobzilla AI is known to the assistant", async () => {
  const { answerLocally } = await import("../js/local-answers.js");
  const project = PROFILE.projects.find((p) => p.id === "jobzilla");
  assert.equal(project.repo, "https://github.com/Inchara-Adigante/JobzillaAI");
  assert.deepEqual(project.stack, ["Streamlit", "FastAPI", "LangGraph", "GPT-4", "Pinecone"]);
  const reply = answerLocally("Tell me about Jobzilla AI");
  assert.match(reply, /Recruiter, a Career Coach and a Judge/);
  assert.match(reply, /LangGraph/);
  assert.match(reply, /Pinecone/);
  // AWS questions about the certification still go to the certification answer.
  assert.match(answerLocally("Is Inchara AWS certified?"), /Certifications/);
});
