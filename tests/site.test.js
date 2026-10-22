import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { PROFILE } from "../js/profile.js";

const SKIP_DIRS = new Set(["node_modules", "tests", ".git", ".vercel", ".claude"]);

function htmlFiles(dir = ".") {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return SKIP_DIRS.has(name) ? [] : htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

/** Maps a site path like "/writing/" or "/styles.css" to the file that serves it. */
function fileForPath(path) {
  const clean = path.split(/[?#]/)[0].replace(/^\//, "");
  if (clean === "") return "index.html";
  return clean.endsWith("/") ? `${clean}index.html` : clean;
}

test("every root-relative link and asset in the HTML pages exists", () => {
  const broken = [];
  for (const file of htmlFiles()) {
    const html = readFileSync(file, "utf8");
    for (const [, path] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (path.startsWith("/api/") || path.startsWith("/_vercel/")) continue;
      if (!existsSync(fileForPath(path))) broken.push(`${file} → ${path}`);
    }
  }
  assert.deepEqual(broken, []);
});

test("every post in the profile has a page whose title matches", () => {
  for (const post of PROFILE.writing) {
    const file = `writing/${post.slug}/index.html`;
    assert.ok(existsSync(file), `missing ${file}`);
    assert.match(readFileSync(file, "utf8"), new RegExp(`<h1>${post.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h1>`));
  }
});

test("no file in the repo still carries the template's owner, school or assistant name", () => {
  // Every tracked text file, README included; this test is the one place the old names appear.
  const files = execSync("git ls-files", { encoding: "utf8" }).split("\n")
    .filter((f) => f && !/\.(png|jpe?g|webp|pdf|ico|woff2?)$/.test(f) && f !== "tests/site.test.js");
  for (const file of files) assert.doesNotMatch(readFileSync(file, "utf8"), /likhith|\bguru\b|bnmit/i, file);
});

test("sitemap lists every page", () => {
  const sitemap = readFileSync("sitemap.xml", "utf8");
  for (const path of ["/", "/experience/", ...PROFILE.writing.map((p) => `/writing/${p.slug}/`)]) {
    assert.match(sitemap, new RegExp(`vercel\\.app${path.replace(/\//g, "\\/")}<`), path);
  }
});

test("each post has takeaways, a metrics strip, a diagram, and a code sketch", () => {
  for (const post of PROFILE.writing) {
    const html = readFileSync(`writing/${post.slug}/index.html`, "utf8");
    assert.match(html, /class="takeaways card"/, `${post.slug} takeaways`);
    assert.equal((html.match(/<li><strong>/g) ?? []).length >= 4, true, `${post.slug} content`);
    assert.match(html, /class="stat-strip"/, `${post.slug} stats`);
    assert.match(html, /<figure class="diagram card">\s*<svg [^>]*role="img"/, `${post.slug} diagram`);
    assert.match(html, /Simplified sketch of the pattern \(not production code\)/, `${post.slug} sketch label`);
    assert.match(html, /initPost\("[a-z-]+"\)/, `${post.slug} enhancements`);
  }
});

test("every page's share image exists and post structured data is valid", () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, "utf8");
    const image = html.match(/property="og:image" content="https:\/\/[^/]+(\/[^"]+)"/);
    if (image) assert.ok(existsSync(image[1].slice(1)), `${file} → ${image[1]}`);
    const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (ld) assert.equal(JSON.parse(ld[1])["@type"], "BlogPosting", file);
  }
  for (const post of PROFILE.writing) assert.ok(existsSync(`assets/og/${post.slug}.png`), post.slug);
});

test("nothing redraws every frame over the animated background", () => {
  const css = ["styles.css", "pages.css", "chatbot.css"].map((f) => readFileSync(f, "utf8")).join("\n");
  // Blur is re-rendered on every canvas frame, so only the small phone glass (tab bar, assistant button) may use it.
  const blurred = [...css.matchAll(/([^{}]+)\{[^{}]*backdrop-filter\s*:/g)].map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim());
  assert.ok(blurred.length > 0 && blurred.every((sel) => /^\.(tab-bar|chat-launcher)$/.test(sel)), `blurred selectors: ${blurred.join(" | ")}`);
  assert.match(css, /animation: flow [^;]*\bpaused\b/, "pipeline arrows flow only on hover");
  assert.doesNotMatch(readFileSync("js/background.js", "utf8"), /documentElement\.style\.setProperty/, "per-move root style writes restyle the whole page");
});

test("text fields are at least 16px on touch screens, so iPhones don't zoom in on focus", () => {
  const touchRules = (file) => [...readFileSync(file, "utf8").matchAll(/@media \(pointer: coarse\), \(max-width: 767px\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join("\n");
  const css = touchRules("styles.css") + touchRules("chatbot.css");
  for (const selector of ["input", "textarea", ".chat-input"]) {
    const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, sel]) => sel.split(",").map((s) => s.trim()).includes(selector));
    assert.ok(rule, `${selector} has a touch-screen rule`);
    assert.match(rule[2], /font-size:\s*16px/, selector);
  }
});

test("the hero has no photo, only the certification and availability", () => {
  const hero = readFileSync("index.html", "utf8").match(/<div class="hero-id">([\s\S]*?)<\/div>/)[1];
  assert.doesNotMatch(hero, /<img src="\/assets\/inchara-|avatar-badge/);
  assert.match(hero, /class="hero-creds"/);
  assert.match(hero, /id="hero-availability"/);
});

test("the hero holds the owl-post letter, and the old game and hat are gone", async () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /<aside class="card owl-window" id="owl-letter"/);
  assert.doesNotMatch(html, /dino|game-window|sorting-hat/);
  assert.ok(!existsSync("js/dino") && !existsSync("js/sorting-hat.js"));
  assert.match(html, /family=Pinyon\+Script/, "the signature's script font is loaded");
  const { LETTER, PROFILE } = await import("../js/profile.js");
  assert.match(LETTER.greeting[0], /^Dear /);
  // The letter's numbers are the same ones the rest of the site shows.
  const text = [...LETTER.paragraphs, ...LETTER.spells, ...LETTER.closing].join(" ");
  for (const fact of ["3-hour report to 10 minutes", "15+ pipelines 45% faster", "34% of failures", "January 2027"]) assert.ok(text.includes(fact), fact);
  assert.match(PROFILE.availableFrom, /January 2027/);
  // Bold markers are balanced, so no stray ** shows on the page.
  for (const t of [...LETTER.paragraphs, ...LETTER.spells, ...LETTER.closing]) assert.equal(t.split("**").length % 2, 1, t);
});

test("certifications have their own section, and clicking a card opens no certificate", () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /<section id="certifications" class="section">[\s\S]*?<div id="cert-list"><\/div>/);
  assert.doesNotMatch(html, /<ul id="cert-list"|<dialog|cert-viewer/, "no old list and no certificate viewer");
  // The only link is the issuer's public verification page; no certificate images or viewers.
  assert.doesNotMatch(readFileSync("js/certifications.js", "utf8"), /View certificate|showModal|window\.open/);
});

test("hero headlines are short enough for two lines on phones and match the screen-reader text", () => {
  const srText = readFileSync("index.html", "utf8").match(/<h1><span class="sr-only">([^<]+)<\/span>/)[1];
  for (const phrase of PROFILE.headlinePhrases) {
    assert.ok(phrase.length <= 32, `"${phrase}" is ${phrase.length} characters`);
    // Lowercase start (or an acronym like RAG) and a full stop: it finishes "I build ...".
    assert.match(phrase, /^([a-z]|[A-Z]{2,}\b).*\.$/, `"${phrase}" finishes "I build ..." as a sentence`);
    assert.ok(srText.includes(phrase.slice(0, -1)), `screen-reader text includes "${phrase}"`);
  }
});

test("the hero badge stickers match the featured certifications and the +N count", () => {
  const html = readFileSync("index.html", "utf8");
  const creds = html.match(/<a class="hero-creds" href="#certifications" aria-label="([^"]+)">([\s\S]*?)<\/a>/);
  assert.ok(creds, "hero badges link to the Certifications section");
  const featured = PROFILE.certifications.filter((c) => c.featured);
  const more = PROFILE.certifications.length - featured.length;
  assert.deepEqual([...creds[2].matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]), featured.map((c) => c.badge));
  assert.deepEqual([...creds[2].matchAll(/<span class="cred-name">([^<]+)<\/span>/g)].map((m) => m[1]), featured.map((c) => c.featured));
  for (const c of featured) assert.ok(creds[1].includes(c.featured), `aria-label names ${c.featured}`);
  if (more > 0) {
    assert.match(creds[2], new RegExp(`<span class="cred-more">\\+${more}</span>`));
    assert.match(creds[1], new RegExp(`plus ${more} more`));
  } else {
    assert.doesNotMatch(creds[2], /cred-more/, "no +N bubble when every certification is featured");
  }
});

test("side by side, the About photo and text cards stretch to the same height", () => {
  const css = readFileSync("styles.css", "utf8");
  assert.match(css, /\.about-grid \{[^}]*align-items: stretch/);
  assert.match(css, /\.portrait-frame img \{[^}]*object-fit: cover/);
});

