// Skill explorer: hovering (or tapping, or pressing Enter on) a skill opens a
// small popover beside it listing where Inchara actually used it, and lights
// up those experience/project cards. Moving off the skill closes it, unless
// the pointer moves into the popover to follow one of its links.

const OPEN_DELAY_MS = 120;   // hover intent, so sweeping across chips doesn't flicker
const CLOSE_DELAY_MS = 220;  // time to move from a chip into its popover
const POPOVER_GAP = 10;
const ARROW_INSET = 16;
const HIGHLIGHT_MS = 4000;

/** "Spark / PySpark" -> ["spark", "pyspark"] (only spaced slashes split, so "PL/SQL" stays whole); "Claude API" -> ["claude api", "claude"]; "LLMs" -> ["llms", "llm"]. */
export function skillTerms(skill) {
  return skill
    .split(/\s+\/\s+/)
    .map((part) => part.replace(/\(.*?\)/g, "").trim().toLowerCase())
    .filter(Boolean)
    .flatMap((term) => [term, term.replace(/\s+api$/, ""), term.length > 3 ? term.replace(/s$/, "") : term])
    .filter((term, i, all) => term && all.indexOf(term) === i);
}

/** Returns [{ id, label }] for every experience or project mentioning the skill. */
export function findSkillUsage(profile, skill) {
  const terms = skillTerms(skill);
  // Drop negations like "no LLM APIs" so they don't count as usage.
  const mentions = (parts) => {
    const haystack = parts.join(" ").toLowerCase().replace(/\bno\s+\S+/g, "");
    return terms.some((t) => haystack.includes(t));
  };
  const jobs = profile.experience
    .filter((x) => mentions([x.role, x.company, ...x.points, ...(x.tags ?? [])]))
    .map((x) => ({ id: `exp-${x.id}`, label: `${x.company} (${x.role})` }));
  const projects = profile.projects
    .filter((x) => mentions([x.name, ...x.stack, ...x.points, ...(x.details ?? []), ...(x.tags ?? [])]))
    .map((x) => ({ id: `proj-${x.id}`, label: x.name.split(" — ")[0] }));
  return [...jobs, ...projects];
}

/**
 * Where the popover goes, in the container's coordinates: below the chip,
 * or above it when the window has no room below; clamped inside the
 * container; with the arrow over the chip's center. Rects are viewport rects.
 */
export function placePopover(chip, container, size, viewportHeight, gap = POPOVER_GAP) {
  const roomBelow = chip.bottom + gap + size.height <= viewportHeight;
  const roomAbove = chip.top - gap - size.height >= 0;
  const above = !roomBelow && roomAbove;
  const top = above ? chip.top - container.top - gap - size.height : chip.bottom - container.top + gap;
  const chipCenter = chip.left - container.left + chip.width / 2;
  const maxLeft = Math.max(0, container.width - size.width);
  const left = Math.min(maxLeft, Math.max(0, chipCenter - size.width / 2));
  const arrowX = Math.min(size.width - ARROW_INSET, Math.max(ARROW_INSET, chipCenter - left));
  return { top, left, arrowX, above };
}

export function initSkillExplorer(root, panel, profile, assistant) {
  if (!root || !panel) return;
  const container = panel.parentElement;
  let clearTimer = 0;
  let openTimer = 0;
  let closeTimer = 0;
  let activeChip = null;

  function highlight(ids) {
    document.querySelectorAll(".match").forEach((n) => n.classList.remove("match"));
    ids.forEach((id) => document.getElementById(id)?.classList.add("match"));
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => document.querySelectorAll(".match").forEach((n) => n.classList.remove("match")), HIGHLIGHT_MS);
  }

  function fill(skill) {
    const usage = findSkillUsage(profile, skill);
    const title = document.createElement("p");
    title.className = "insight-title";
    title.textContent = usage.length ? `${skill}: used in ${usage.length} place${usage.length > 1 ? "s" : ""}` : `${skill}: on the resume`;
    const list = document.createElement("div");
    list.className = "insight-links";
    if (usage.length) {
      list.append(...usage.map(({ id, label }) => {
        const link = document.createElement("a");
        link.href = `#${id}`;
        if (id.startsWith("proj-")) {
          const logo = document.createElement("img");
          logo.src = `/assets/logos/${id.slice("proj-".length)}.svg`;
          logo.alt = "";
          logo.width = 18;
          logo.height = 18;
          link.append(logo);
        }
        link.append(label);
        return link;
      }));
    } else {
      const askBtn = document.createElement("button");
      askBtn.type = "button";
      askBtn.className = "btn btn-ghost small";
      askBtn.textContent = `Ask ${profile.assistant.name} about ${skill}`;
      askBtn.addEventListener("click", () => assistant?.ask(`What has ${profile.firstName} done with ${skill}?`));
      list.append(askBtn);
    }
    panel.replaceChildren(title, list);
    return usage;
  }

  function place(chip) {
    const spot = placePopover(chip.getBoundingClientRect(), container.getBoundingClientRect(),
      { width: panel.offsetWidth, height: panel.offsetHeight }, window.innerHeight);
    panel.style.top = `${spot.top}px`;
    panel.style.left = `${spot.left}px`;
    panel.style.setProperty("--arrow-x", `${spot.arrowX}px`);
    panel.classList.toggle("is-above", spot.above);
  }

  function open(chip) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    root.querySelectorAll(".skill-chip[aria-pressed='true']").forEach((b) => b.setAttribute("aria-pressed", "false"));
    chip.setAttribute("aria-pressed", "true");
    activeChip = chip;
    const usage = fill(chip.dataset.skill);
    panel.hidden = false;
    place(chip);
    highlight(usage.map((u) => u.id));
  }

  function close() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    panel.hidden = true;
    activeChip?.setAttribute("aria-pressed", "false");
    activeChip = null;
  }

  const closeSoon = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(close, CLOSE_DELAY_MS);
  };
  const inPopover = (node) => Boolean(node) && panel.contains(node);
  const isMouse = (e) => e.pointerType === "mouse" || e.pointerType === "pen";

  // Mouse and pen: hover opens, moving off the skill (anywhere but its popover) closes.
  root.addEventListener("pointerover", (e) => {
    const chip = e.target.closest(".skill-chip");
    if (!chip || !isMouse(e)) return;
    clearTimeout(closeTimer);
    if (chip === activeChip) return;
    clearTimeout(openTimer);
    // Already showing one: switch right away. Otherwise wait a beat, so a quick sweep doesn't flicker.
    if (activeChip) open(chip);
    else openTimer = setTimeout(() => open(chip), OPEN_DELAY_MS);
  });
  root.addEventListener("pointerout", (e) => {
    const chip = e.target.closest(".skill-chip");
    if (!chip || !isMouse(e) || chip.contains(e.relatedTarget)) return;
    if (inPopover(e.relatedTarget) || e.relatedTarget?.closest?.(".skill-chip")) return;
    if (chip === activeChip) closeSoon();
    else clearTimeout(openTimer);
  });
  panel.addEventListener("pointerenter", (e) => { if (isMouse(e)) clearTimeout(closeTimer); });
  panel.addEventListener("pointerleave", (e) => {
    if (isMouse(e) && !activeChip?.contains(e.relatedTarget)) closeSoon();
  });

  // Click, tap or Enter: open. Tapping or pressing Enter on the open skill again closes it;
  // a mouse click on a skill its hover already opened just keeps it open.
  let pressedWith = "mouse";
  root.addEventListener("pointerdown", (e) => { pressedWith = e.pointerType || "mouse"; });
  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".skill-chip");
    if (!chip) return;
    const byKeyboard = e.detail === 0;
    const toggles = byKeyboard || pressedWith === "touch";
    if (chip === activeChip && !panel.hidden && toggles) close();
    else open(chip);
  });

  // A tap or click anywhere else closes it; so do Escape and tabbing away.
  document.addEventListener("pointerdown", (e) => {
    if (!panel.hidden && !inPopover(e.target) && !e.target.closest?.(".skill-chip")) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });
  for (const area of [root, panel]) {
    area.addEventListener("focusout", (e) => {
      if (!panel.hidden && !root.contains(e.relatedTarget) && !inPopover(e.relatedTarget)) close();
    });
  }
  window.addEventListener("resize", () => { if (!panel.hidden) close(); });
}
