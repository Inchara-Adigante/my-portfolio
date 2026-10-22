import { test } from "node:test";
import assert from "node:assert/strict";
import { getReply, pickFollowUps } from "../js/assistant-client.js";
import { answerLocally } from "../js/local-answers.js";

test("Ada answers through the API when it's up", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, reply: "From Claude." }) });
  try {
    assert.equal(await getReply([{ role: "user", content: "hi" }]), "From Claude.");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("Ada falls back to the offline engine when the API is down", async () => {
  const realFetch = globalThis.fetch;
  const realWarn = console.warn;
  globalThis.fetch = async () => { throw new Error("offline"); };
  console.warn = () => {};
  try {
    const question = "How do I get in touch?";
    assert.equal(await getReply([{ role: "user", content: question }]), answerLocally(question));
  } finally {
    globalThis.fetch = realFetch;
    console.warn = realWarn;
  }
});

test("follow-up suggestions skip what was already asked", () => {
  const first = pickFollowUps(new Set());
  assert.equal(first.length, 3);
  const next = pickFollowUps(new Set([first[0].toLowerCase()]));
  assert.ok(!next.includes(first[0]));
});

test("every question Ada suggests gets a real answer even offline", async () => {
  const { SUGGESTIONS, FOLLOW_UPS } = await import("../js/assistant-client.js");
  const unanswered = [...SUGGESTIONS, ...FOLLOW_UPS].filter((q) => answerLocally(q).startsWith("I'm not sure"));
  assert.deepEqual(unanswered, []);
});
