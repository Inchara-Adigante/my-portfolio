// Shared pixel-art drawing for the runner game and its dock icon.

/** Pre-draws a sprite grid onto its own small canvas ("#" main color, "s" accent), repeated side by side. */
export function spriteCanvas(rows, main, accent, repeat = 1) {
  const w = rows[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = repeat * w + (repeat - 1);
  canvas.height = rows.length;
  const ctx = canvas.getContext("2d");
  for (let k = 0; k < repeat; k++) {
    rows.forEach((row, y) => {
      for (let x = 0; x < w; x++) {
        if (row[x] === ".") continue;
        ctx.fillStyle = row[x] === "s" ? accent : main;
        ctx.fillRect(k * (w + 1) + x, y, 1, 1);
      }
    });
  }
  return canvas;
}

/** The site's game colors for the current theme. */
export function readPalette() {
  const style = getComputedStyle(document.documentElement);
  const read = (name) => style.getPropertyValue(name).trim();
  return { dino: read("--teal"), accent: read("--accent"), flyer: read("--text-3"), ground: read("--muted"), text: read("--text"), cloud: read("--border"), bg: read("--bg") };
}
