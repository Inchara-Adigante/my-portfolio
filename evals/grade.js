// Grades one Guru answer against one eval case. Pure and deterministic, so the
// same rules apply to the offline engine and to the live Claude endpoint.

// Phrases that show Guru declined or admitted it doesn't know.
const DECLINE_MARKERS = [
  "don't have", "do not have", "not sure", "only help", "only answer", "can only", "can't help", "cannot help",
  "not able to", "isn't something", "is not something", "no information", "not listed", "not mentioned",
  "outside the scope", "outside of what", "outside what", "i focus on", "here to help with", "stick to", "not something i",
];

/** Supports a leading "(?i)" for case-insensitive patterns, which JS RegExp lacks. */
function toRegExp(source) {
  return source.startsWith("(?i)") ? new RegExp(source.slice(4), "i") : new RegExp(source);
}

const includesCI = (text, needle) => text.toLowerCase().includes(needle.toLowerCase());

/** Returns { passed, reasons } where reasons explain every failed check. */
export function gradeAnswer(testCase, answer) {
  const text = typeof answer === "string" ? answer : "";
  const reasons = [];
  if (!text.trim()) reasons.push("empty answer");

  for (const needle of testCase.mustInclude ?? []) {
    if (!includesCI(text, needle)) reasons.push(`missing "${needle}"`);
  }
  if (testCase.anyOf?.length && !testCase.anyOf.some((needle) => includesCI(text, needle))) {
    reasons.push(`none of: ${testCase.anyOf.map((n) => `"${n}"`).join(", ")}`);
  }
  for (const needle of testCase.mustNotInclude ?? []) {
    if (includesCI(text, needle)) reasons.push(`should not say "${needle}"`);
  }
  if (testCase.mustNotMatch && toRegExp(testCase.mustNotMatch).test(text)) {
    reasons.push(`matched forbidden pattern /${testCase.mustNotMatch}/`);
  }
  if (testCase.requireDecline && !DECLINE_MARKERS.some((marker) => includesCI(text, marker))) {
    reasons.push("did not decline or admit it doesn't know");
  }
  return { passed: reasons.length === 0, reasons };
}

/** Summarizes graded cases into totals per category. */
export function summarize(results) {
  const byCategory = {};
  for (const r of results) {
    const bucket = byCategory[r.category] ?? { total: 0, passed: 0 };
    byCategory[r.category] = { total: bucket.total + 1, passed: bucket.passed + (r.passed ? 1 : 0) };
  }
  const passed = results.filter((r) => r.passed).length;
  return { total: results.length, passed, byCategory };
}
