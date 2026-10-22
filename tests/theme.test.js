import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveTheme, nextTheme, DEFAULT_THEME } from "../js/theme.js";
import { PROFILE } from "../js/profile.js";

const css = readFileSync("styles.css", "utf8");
const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `${selector} block exists`);
  return css.slice(start, css.indexOf("\n}", start));
};
const tokens = (text) => Object.fromEntries([...text.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const dark = tokens(block(":root"));
const light = tokens(block(':root[data-theme="light"]'));

function luminance(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("a saved choice wins; anything else falls back to the default theme", () => {
  assert.equal(resolveTheme("light"), "light");
  assert.equal(resolveTheme("dark"), "dark");
  assert.equal(resolveTheme(null), DEFAULT_THEME);
  assert.equal(resolveTheme("purple"), DEFAULT_THEME);
});

test("the switch alternates between the two themes", () => {
  assert.equal(nextTheme("dark"), "light");
  assert.equal(nextTheme("light"), "dark");
});

test("every color token has a light-mode value", () => {
  const themeInvariant = new Set(["--radius", "--max", "--font", "--display"]);
  const missing = Object.keys(dark).filter((name) => !themeInvariant.has(name) && !(name in light));
  assert.deepEqual(missing, []);
});

test("text, muted text and accents stay readable in both themes", () => {
  for (const [name, theme] of [["dark", dark], ["light", light]]) {
    assert.ok(contrast(theme["--text"], theme["--bg"]) >= 7, `${name} text`);
    assert.ok(contrast(theme["--text-2"], theme["--bg"]) >= 7, `${name} body text`);
    assert.ok(contrast(theme["--muted"], theme["--bg"]) >= 4.5, `${name} muted text`);
    assert.ok(contrast(theme["--accent"], theme["--bg"]) >= 4.5, `${name} accent`);
    assert.ok(contrast(theme["--teal"], theme["--bg"]) >= 4.5, `${name} teal`);
  }
});

test("every page sets its theme before any stylesheet loads, so it never flashes", () => {
  const pages = ["index.html", "experience/index.html", ...PROFILE.writing.map((p) => `writing/${p.slug}/index.html`)];
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const script = html.indexOf('localStorage.getItem("theme")');
    const firstStylesheet = html.indexOf('rel="stylesheet"');
    assert.ok(script > 0 && script < firstStylesheet, page);
  }
});

test("the switch uses crisp pixel-art sun and moon icons", async () => {
  const { ICONS } = await import("../js/icons.js");
  for (const name of ["sun", "moon"]) {
    assert.match(ICONS[name], /viewBox="0 0 11 11"/, name);
    assert.match(ICONS[name], /shape-rendering="crispEdges"/, name);
    assert.match(ICONS[name], /width="22" height="22"/, `${name} renders at exactly 2px per pixel`);
    assert.doesNotMatch(ICONS[name].match(/ d="([^"]+)"/)[1], /\./, `${name} sits on whole pixels`);
  }
});
