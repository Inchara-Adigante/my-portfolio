import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NAV_ITEMS } from "../js/chrome.js";
import { ICONS, contactChannels } from "../js/icons.js";
import { PROFILE } from "../js/profile.js";

const sectionOrder = [...readFileSync("index.html", "utf8").matchAll(/<section id="([a-z-]+)"/g)].map((m) => m[1]);

test("nav items follow the homepage section order exactly", () => {
  const positions = NAV_ITEMS.map((item) => sectionOrder.indexOf(item.section));
  assert.ok(positions.every((p) => p >= 0), `every nav item maps to a homepage section: ${positions}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, "nav order matches page order");
  assert.deepEqual(NAV_ITEMS.map((i) => i.id), ["home", "about", "experience", "projects", "contact"]);
});

test("the assistant is the chat button, not a nav page", () => {
  assert.ok(!NAV_ITEMS.some((i) => i.id === "assistant" || i.id === "ada"));
});

test("every tab has an icon from the site's own set", () => {
  for (const item of NAV_ITEMS) assert.match(ICONS[item.id] ?? "", /^<svg /, item.id);
});

test("hero social icons appear in the same order as the Find me list", () => {
  const all = contactChannels(PROFILE.contact).map((c) => c.id);
  const hero = contactChannels(PROFILE.contact).filter((c) => c.hero).map((c) => c.id);
  assert.deepEqual(hero, all.filter((id) => hero.includes(id)));
});
