"""Builds the 1200x630 link-preview images in assets/og/.

Run from the portfolio root after changing a post title:
    python3 scripts/make_og_images.py
Needs node (to read js/profile.js), rsvg-convert, and Pillow.
"""
import base64
import html
import io
import json
import os
import subprocess
import logging
import tempfile

from PIL import Image

OUT_DIR = "assets/og"
WIDTH, HEIGHT = 1200, 630
MAX_LINE_CHARS = 24
MAX_LINES = 3
NAME = "Inchara Adigante"
POST_LOGOS = {}


def profile() -> dict:
    out = subprocess.run(
        ["node", "--input-type=module", "-e",
         "import {PROFILE} from './js/profile.js'; console.log(JSON.stringify(PROFILE))"],
        check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def data_uri(path: str, mime: str) -> str:
    with open(path, "rb") as f:
        return f"data:{mime};base64,{base64.b64encode(f.read()).decode()}"


def avatar_uri() -> str:
    buf = io.BytesIO()
    Image.open("assets/inchara-avatar.webp").convert("RGB").save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def wrap(text: str) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if len(candidate) > MAX_LINE_CHARS and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    lines.append(line)
    if len(lines) > MAX_LINES:
        lines = lines[:MAX_LINES]
        lines[-1] = lines[-1].rstrip(".,") + "…"
    return lines


def card_svg(kicker: str, title: str, footer: str, avatar: str, logo: str | None = None) -> str:
    lines = wrap(title)
    title_size = 64 if len(lines) < 3 else 58
    start_y = 250 - (len(lines) - 1) * title_size * 0.55
    title_tspans = "".join(
        f'<tspan x="80" y="{start_y + i * title_size * 1.12:.0f}">{html.escape(line)}</tspan>' for i, line in enumerate(lines))
    logo_tag = f'<image href="{logo}" x="940" y="80" width="180" height="180" />' if logo else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="0.15" cy="0.1" r="0.9">
      <stop offset="0" stop-color="#f0a6ca" stop-opacity="0.22"/><stop offset="0.6" stop-color="#f0a6ca" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="#f0a6ca"/><stop offset="1" stop-color="#7dd3fc"/></linearGradient>
    <clipPath id="round"><circle cx="116" cy="526" r="36"/></clipPath>
  </defs>
  <rect width="{WIDTH}" height="{HEIGHT}" fill="#181a21"/>
  <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#glow)"/>
  <g fill="none" stroke="#aab0c0" stroke-opacity="0.22" stroke-width="1.2">
    <path d="M760 120 860 70 980 140 1100 90M860 70 900 240 1040 300 1150 230M900 240 780 330 860 420"/>
  </g>
  <g fill="#c8cad7" fill-opacity="0.5">
    <circle cx="760" cy="120" r="3"/><circle cx="860" cy="70" r="3"/><circle cx="980" cy="140" r="3"/><circle cx="1100" cy="90" r="3"/>
    <circle cx="900" cy="240" r="3"/><circle cx="1040" cy="300" r="3"/><circle cx="1150" cy="230" r="3"/><circle cx="780" cy="330" r="3"/><circle cx="860" cy="420" r="3"/>
  </g>
  {logo_tag}
  <text x="80" y="110" font-family="Menlo, monospace" font-size="24" letter-spacing="3" fill="#7dd3fc">{html.escape(kicker)}</text>
  <text font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="{title_size}" fill="#ececf1">{title_tspans}</text>
  <image href="{avatar}" x="80" y="490" width="72" height="72" clip-path="url(#round)"/>
  <circle cx="116" cy="526" r="37" fill="none" stroke="#f0a6ca" stroke-width="2"/>
  <text x="172" y="518" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="28" fill="#ececf1">{html.escape(NAME)}</text>
  <text x="172" y="552" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" fill="#9a9cab">{html.escape(footer)}</text>
  <rect x="0" y="618" width="{WIDTH}" height="12" fill="url(#bar)"/>
</svg>'''


def render(svg: str, out_path: str) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as f:
        f.write(svg)
        tmp = f.name
    try:
        subprocess.run(["rsvg-convert", "-w", str(WIDTH), "-h", str(HEIGHT), tmp, "-o", out_path], check=True)
    finally:
        os.unlink(tmp)


def main() -> None:
    p = profile()
    os.makedirs(OUT_DIR, exist_ok=True)
    avatar = avatar_uri()
    footer = "AI/ML & Data Engineer · inchara-adigante.vercel.app"
    cards = {
        "home": ("PORTFOLIO", "AI/ML and data engineer building LLM apps and data pipelines", None),
        "experience": ("EXPERIENCE", "Where I've worked and what I did there", None),
    }
    for post in p["writing"]:
        logo = POST_LOGOS.get(post["slug"])
        cards[post["slug"]] = ("WRITING · " + post["date"].upper(), post["title"], logo)
    for name, (kicker, title, logo) in cards.items():
        logo_path = logo if logo and logo.endswith(".svg") else f"assets/logos/{logo}.svg"
        logo_uri = data_uri(logo_path, "image/svg+xml") if logo else None
        render(card_svg(kicker, title, footer, avatar, logo_uri), f"{OUT_DIR}/{name}.png")
        logging.info("wrote %s/%s.png", OUT_DIR, name)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    main()
