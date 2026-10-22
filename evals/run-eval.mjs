#!/usr/bin/env node
// Runs the Guru eval and writes evals/results/<mode>.json.
//
//   node evals/run-eval.mjs                       # offline engine (free, deterministic)
//   node evals/run-eval.mjs --live https://likhith-ng-portfolio.vercel.app/api/chat
//
// Live mode calls the real Claude-backed endpoint, which costs API credits and
// is rate limited to 20 questions per 10 minutes per IP, so it waits between
// questions (--delay ms, default 31000).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gradeAnswer, summarize } from "./grade.js";
import { answerLocally } from "../js/local-answers.js";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_LIVE_DELAY_MS = 31000;
const LIVE_TIMEOUT_MS = 30000;
const ANSWER_PREVIEW_CHARS = 600;

function parseArgs(argv) {
  const args = { mode: "offline", url: null, delay: DEFAULT_LIVE_DELAY_MS };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--live") { args.mode = "live"; args.url = argv[++i]; }
    else if (argv[i] === "--delay") args.delay = Number(argv[++i]);
  }
  if (args.mode === "live" && !/^https?:\/\//.test(args.url ?? "")) {
    throw new Error("--live needs the full URL of the /api/chat endpoint");
  }
  return args;
}

async function askLive(url, question) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-guru-eval": "1" },
    body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
    signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.reply !== "string") throw new Error(`HTTP ${res.status}: ${data.error ?? "no reply"}`);
  return data.reply;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const suite = JSON.parse(readFileSync(join(here, "guru-eval.json"), "utf8"));
  const results = [];

  for (const [index, testCase] of suite.cases.entries()) {
    let answer = "";
    let error = null;
    try {
      answer = args.mode === "live" ? await askLive(args.url, testCase.question) : answerLocally(testCase.question);
    } catch (err) {
      error = err.message;
    }
    const grade = error ? { passed: false, reasons: [`request failed: ${error}`] } : gradeAnswer(testCase, answer);
    results.push({
      id: testCase.id,
      category: testCase.category,
      question: testCase.question,
      passed: grade.passed,
      reasons: grade.reasons,
      answer: answer.slice(0, ANSWER_PREVIEW_CHARS),
    });
    process.stdout.write(`${grade.passed ? "PASS" : "FAIL"}  ${testCase.id}  ${testCase.question}${grade.passed ? "" : `  → ${grade.reasons.join("; ")}`}\n`);
    if (args.mode === "live" && index < suite.cases.length - 1) await sleep(args.delay);
  }

  const summary = summarize(results);
  const report = { suite: suite.name, mode: args.mode, endpoint: args.url, runAt: new Date().toISOString(), ...summary, cases: results };
  mkdirSync(join(here, "results"), { recursive: true });
  writeFileSync(join(here, "results", `${args.mode}.json`), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n${summary.passed}/${summary.total} passed`);
  for (const [category, s] of Object.entries(summary.byCategory)) console.log(`  ${category.padEnd(10)} ${s.passed}/${s.total}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
