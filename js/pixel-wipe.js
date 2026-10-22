// Pixel transition for the theme switch. Square pixels in the new theme's
// color sweep across the screen in a diagonal wave, starting from the corner
// nearest the switch, each one flashing an accent color as it lands. Once the
// screen is covered the theme changes underneath, and the pixels clear away
// in the same wave. Everything is drawn on one canvas, with timings worked out
// once per switch, so it holds the display's full frame rate.

const MAX_DPR = 2;
const SPREAD_MS = 300;    // time for the wave to cross from one corner to the other
const JITTER_MS = 70;     // random scatter per pixel, so the edge looks pixelated, not a ruler line
const BLOCK_MS = 130;     // how long one pixel takes to grow in or shrink away
const COLUMNS = 28;       // pixel size is picked to give about this many columns
const MIN_BLOCK_PX = 20;
const MAX_BLOCK_PX = 44;
const EDGE_SIZE = 0.55;   // the accent flash is this fraction of a pixel

/** Which screen corner (0 = left/top, 1 = right/bottom) is nearest a point. */
export const cornerNearest = (x, y, width, height) => ({ x: x < width / 2 ? 0 : 1, y: y < height / 2 ? 0 : 1 });

/** When each pixel starts, in ms: by diagonal distance from the corner, plus a little random scatter. */
export function waveDelays(cols, rows, corner, { spread, jitter }, random = Math.random) {
  const delays = new Float32Array(cols * rows);
  const span = Math.max(1, cols - 1 + rows - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const steps = (corner.x ? cols - 1 - c : c) + (corner.y ? rows - 1 - r : r);
      delays[r * cols + c] = (steps / span) * spread + random() * jitter;
    }
  }
  return delays;
}

const easeOutCubic = (p) => 1 - (1 - p) ** 3;

/** Size of one pixel at time t, from 0 (gone) to 1 (fills its cell). */
export function blockScale(t, delay, duration, phase) {
  const p = Math.min(1, Math.max(0, (t - delay) / duration));
  const grown = easeOutCubic(p);
  return phase === "cover" ? grown : 1 - grown;
}

/**
 * Runs the transition. Calls onCovered() while the screen is fully covered
 * (that's when to switch the theme) and resolves once the pixels have cleared.
 */
export function pixelWipe({ color, accents, originX, originY, onCovered }) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onCovered();
      resolve();
      return;
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.className = "pixel-wipe";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    document.body.append(canvas);

    const size = Math.min(MAX_BLOCK_PX, Math.max(MIN_BLOCK_PX, Math.round(width / COLUMNS)));
    const cols = Math.ceil(width / size);
    const rows = Math.ceil(height / size);
    const delays = waveDelays(cols, rows, cornerNearest(originX, originY, width, height), { spread: SPREAD_MS, jitter: JITTER_MS });
    const scales = new Float32Array(delays.length); // reused every frame
    const phaseMs = SPREAD_MS + JITTER_MS + BLOCK_MS;
    let phase = "cover";
    let start = performance.now();

    function frame(now) {
      // The uncover clock starts on the first frame after the theme switch, so the
      // restyle it causes (hidden under the full cover) can't eat into the animation.
      if (start === null) start = now;
      const t = now - start;
      ctx.clearRect(0, 0, width, height);
      // Pass 1: every visible pixel in the theme color. Full ones overlap by 1px so no seams show.
      ctx.fillStyle = color;
      for (let i = 0; i < delays.length; i++) {
        const s = blockScale(t, delays[i], BLOCK_MS, phase);
        scales[i] = s;
        if (s <= 0) continue;
        const x = (i % cols) * size;
        const y = Math.floor(i / cols) * size;
        if (s >= 1) {
          ctx.fillRect(x, y, size + 1, size + 1);
        } else {
          const d = size * s;
          ctx.fillRect(x + (size - d) / 2, y + (size - d) / 2, d, d);
        }
      }
      // Pass 2: pixels still moving get an accent-colored core, alternating like a checkerboard.
      for (let k = 0; k < accents.length; k++) {
        ctx.fillStyle = accents[k];
        for (let i = 0; i < delays.length; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          if ((col + row) % accents.length !== k) continue;
          const s = scales[i];
          if (s <= 0 || s >= 1) continue;
          const d = size * s * EDGE_SIZE;
          ctx.fillRect(col * size + (size - d) / 2, row * size + (size - d) / 2, d, d);
        }
      }
      if (t < phaseMs) {
        requestAnimationFrame(frame);
        return;
      }
      if (phase === "cover") {
        onCovered();
        phase = "uncover";
        start = null;
        requestAnimationFrame(frame);
        return;
      }
      canvas.remove();
      resolve();
    }
    requestAnimationFrame(frame);
  });
}
