# Inchara Adigante — Portfolio

Personal portfolio of Inchara Adigante, an AI/ML and data engineer finishing an MS in Information Systems at Northeastern University. Live at https://adiganteinchara.vercel.app.

A static site (HTML, CSS and vanilla ES modules) with two Vercel functions.

- **Owl post** (`js/owl-letter.js`): a floating envelope in the hero, sealed with Inchara's initials. Breaking the seal pops her letter up alone on a blanked-out screen, where it writes itself; closing folds it back into the envelope. The words live in `LETTER` in `js/profile.js`.
- **Skill-constellation background** (`js/background.js`): twinkling stars with each skill group hidden as a constellation; moving the cursor near one reveals its lines and skill names.
- **Sections**: role switch and impact numbers (`js/interactive.js`), education trail map (`js/education.js`), compact experience and project cards whose details open in a pop-up only when clicked (`js/experience.js`, `js/details.js`; project demos in `js/project-panels.js`), publications, skills explorer (`js/skills.js`) and the AWS credential card (`js/certifications.js`).
- **Ada, the AI assistant** (`js/chatbot.js`): answers questions about Inchara. Its name and tagline live in `PROFILE.assistant`. It calls `/api/chat` (Claude, grounded in `js/profile.js`) and falls back to an offline keyword engine (`js/local-answers.js`) when the API is unavailable.
- **Contact form** (`api/contact.js`): sends messages through Resend. Needs `RESEND_API_KEY`; `CONTACT_TO` overrides the recipient.
- **Eval** (`evals/`): questions in five categories (facts, ask-only details, unknowns, off-topic, prompt injection), graded by `evals/grade.js`. `npm run eval` scores the offline engine; `node evals/run-eval.mjs --live https://adiganteinchara.vercel.app/api/chat` scores Claude (costs credits; waits between questions for the rate limit). Results land in `evals/results/`.
- **Question log**: `/api/chat` logs each question anonymously (no IPs; emails and phone numbers redacted by `lib/redact.js`) to the function logs. To keep them beyond Vercel's log retention, connect an Upstash Redis store from the Vercel Marketplace; entries go to the `assistant:questions` list (newest 1,000).
- **Analytics**: Vercel Web Analytics loads on the deployed site only. Turn it on in the Vercel project's Analytics tab.

All facts live in **`js/profile.js`**. The page, the offline bot, and the Claude system prompt all read from it, so edit facts there only.

## Credits

The Northeastern University seal comes from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:NU_RGB_seal_R.png) under CC BY-SA 4.0. The VTU emblem belongs to Visvesvaraya Technological University. Project logos and all illustrations are original.

## Run locally

```bash
python3 -m http.server 5173
```

With a static server the bot uses offline answers. To test the Claude endpoint locally:

```bash
npm install && npx vercel dev
```

## Deploy (Vercel)

The Vercel project is connected to this repo: every push to `main` deploys to production at https://adiganteinchara.vercel.app, and pushes to other branches get preview URLs. Run `npm test` before pushing.

### First-time setup

1. Import this repo in Vercel (framework preset: **Other**, no build command).
2. Add the environment variable `ANTHROPIC_API_KEY`.
3. Optional: set `CHAT_MODEL` (default `claude-opus-5-5`; `claude-haiku-5-5` is far cheaper for a portfolio bot).

The endpoint caps input at 10 messages × 1,000 characters, limits each IP to 20 questions per 10 minutes (per instance), and returns `{ success, reply, error }`.

## Tests

```bash
npm test
```
