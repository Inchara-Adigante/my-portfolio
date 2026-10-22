# Likhith N G — Portfolio

Static portfolio (HTML/CSS/vanilla JS modules) with:

- **Skill-constellation background** (`js/background.js`): twinkling stars with each skill group hidden as a constellation; moving the cursor near one reveals its lines and skill names.
- **Hero effects** (`js/effects.js`): typewriter headline, count-up impact stats, card spotlight and tilt.
- **Sorting hat** (`js/sorting-hat.js`): an original wizard-hat drawing in the hero. Visitors pick what their team needs; the hat thinks out loud and sorts Inchara into a role, then highlights the matching work.
- **Guru, the AI assistant** (`js/chatbot.js`): answers questions about Likhith. Its name and tagline live in `PROFILE.assistant`. It calls `/api/chat` (Claude, grounded in `js/profile.js`) and falls back to an offline keyword engine (`js/local-answers.js`) when the API is unavailable.

- **Pages**: `/` (homepage), `/experience/` (full history), `/writing/` (posts). Header and footer come from `js/chrome.js`; secondary pages boot with `js/page.js`.
- **Eval** (`evals/`): 52 questions in five categories (facts, ask-only details, unknowns, off-topic, prompt injection), graded by `evals/grade.js`. `npm run eval` scores the offline engine; `node evals/run-eval.mjs --live https://<site>/api/chat` scores Claude (costs credits; waits between questions for the rate limit). Results land in `evals/results/`.
- **Question log**: `/api/chat` logs each question anonymously (no IPs; emails and phone numbers redacted by `lib/redact.js`) to the function logs. To keep them beyond Vercel's log retention, connect an Upstash Redis store from the Vercel Marketplace; entries go to the `guru:questions` list (newest 1,000).
- **Analytics**: Vercel Web Analytics loads on the deployed site only. Turn it on in the Vercel project's Analytics tab.

All facts live in **`js/profile.js`**. The page, the offline bot, and the Claude system prompt all read from it, so edit facts there only.

## Credits

School logos come from Wikimedia Commons under CC BY-SA 4.0: the [Northeastern University seal](https://commons.wikimedia.org/wiki/File:NU_RGB_seal_R.png) and the [BNMIT logo](https://commons.wikimedia.org/wiki/File:BNMIT_logo.webp) (emblem cropped). Project logos are original.

## Run locally

```bash
python3 -m http.server 5173
```

With a static server the bot uses offline answers. To test the Claude endpoint locally:

```bash
npm install && npx vercel dev
```

## Deploy (Vercel)

The Vercel project **likhith-ng-portfolio** is connected to this repo: every push to `main` deploys to production at https://likhith-ng-portfolio.vercel.app, and pushes to other branches get preview URLs. Run `npm test` before pushing.

### First-time setup

1. Import this repo in Vercel (framework preset: **Other**, no build command).
2. Add the environment variable `ANTHROPIC_API_KEY`.
3. Optional: set `CHAT_MODEL` (default `claude-opus-5-5`; `claude-haiku-5-5` is far cheaper for a portfolio bot).

The endpoint caps input at 10 messages × 1,000 characters, limits each IP to 20 questions per 10 minutes (per instance), and returns `{ success, reply, error }`.

## Tests

```bash
npm test
```
