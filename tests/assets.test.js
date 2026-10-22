import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PROFILE } from "../js/profile.js";

test("every project has a logo SVG named after its id", () => {
  for (const project of PROFILE.projects) {
    const path = `assets/logos/${project.id}.svg`;
    assert.ok(existsSync(path), `missing ${path}`);
    assert.match(readFileSync(path, "utf8"), /^<svg[^>]+viewBox="0 0 64 64"/, path);
  }
});

test("profile photo and resume assets exist", () => {
  for (const path of ["assets/inchara-avatar.webp", "assets/inchara-casual.webp", "assets/inchara-portrait.webp", PROFILE.contact.resume.slice(1)]) {
    assert.ok(existsSync(path), `missing ${path}`);
  }
});

test("every school with a logo points at an existing file", () => {
  for (const school of PROFILE.education.filter((s) => s.logo)) {
    assert.ok(existsSync(school.logo.slice(1)), `missing ${school.logo}`);
  }
});

test("every contact channel has an icon and a link", async () => {
  const { ICONS, contactChannels } = await import("../js/icons.js");
  const channels = contactChannels(PROFILE.contact);
  // Channels left null in the profile (phone, Instagram) are skipped.
  assert.deepEqual(channels.map((c) => c.id), ["email", "linkedin", "github"]);
  assert.deepEqual(contactChannels({ ...PROFILE.contact, phone: "+1 (617) 555-0100", instagram: "https://www.instagram.com/someone/" }).map((c) => c.id),
    ["email", "phone", "linkedin", "github", "instagram"]);
  for (const c of channels) {
    assert.match(ICONS[c.id] ?? "", /^<svg /, `${c.id} icon`);
    assert.ok(c.href && c.text, `${c.id} link`);
  }
});
