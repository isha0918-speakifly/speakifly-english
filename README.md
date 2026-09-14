# Speakifly — 60-Level Spoken English Course

A free, self-contained website that takes a learner from **zero English words** to **confident, fluent speech** across 60 progressively harder levels.

## What's inside

- `index.html` — the course map (hero, how-it-works, all 60 levels grouped into 6 stages)
- `level.html` — a single template that renders any level based on the URL, e.g. `level.html?id=23`
- `login.html` — the sign-in page students see first
- `users-data.js` — the list of usernames/passwords you assign to students
- `levels-data.js` — all course content: vocabulary, sentences, grammar rules, idioms, quizzes (60 levels)
- `style.css` — the site's visual design
- `app.js` — login/session handling, per-student progress tracking, pronunciation playback, speech-practice recognition, and quiz logic
- `logo.png` — your Speakifly logo, used in the header and browser tab icon

## Logging students in

Every student needs an account before they can see the course:

1. Open `users-data.js`.
2. Add one line per student inside the `USERS` array:
   ```js
   { u: "priya", p: "sunrise42", name: "Priya" },
   ```
   `u` is the username you assign, `p` is the password you assign, `name` is what greets them at the top of the page.
3. Save the file and upload/commit it back to GitHub.
4. Give each student their username and password. They'll enter these on `login.html` (the page they land on automatically).

Each student's course progress is stored separately in their own browser, keyed to their username, so several students can use the same shared computer without mixing up progress.

### Important security note

This is **not** a secure, encrypted login system — it's a lightweight access gate suitable for a free static website. Because the whole site (including `users-data.js`) is public on GitHub, anyone who knows how to open a browser's "view page source" or the Network tab could see the username/password list. This is fine for keeping casual visitors out and for classroom-style access control, but:
- Don't reuse students' real/important passwords here — assign simple, course-only passwords instead.
- Don't use this to protect anything sensitive.
- If you later need real security (private student data, payments, etc.), you'd want a proper backend with hashed passwords (e.g. Firebase Auth, Auth0, or a small server) rather than a static GitHub Pages site.

No build step, no server, and no dependencies beyond two Google Fonts loaded via CDN in `style.css`.

## How the course is structured

| Stage | Levels | Focus |
|---|---|---|
| 1. Foundation Words | 1–10 | Core vocabulary, starting from zero |
| 2. Everyday Sentences | 11–20 | Full, practical daily-life sentences |
| 3. Grammar Foundations | 21–30 | The ten grammar patterns behind fluent speech |
| 4. Working Vocabulary | 31–40 | Phrasal verbs, prepositions, connectors, workplace words |
| 5. Advanced Words & Idioms | 41–50 | Academic vocabulary, idioms, proverbs |
| 6. Fluency & Confidence | 51–60 | Storytelling, debate, interviews, presentations |

Every level includes:
1. **Learn out loud** — words/sentences/grammar with a phonetic guide and a "🔊 Hear it" button (uses the browser's built-in text-to-speech).
2. **Speaking practice** — a speaking prompt, plus an optional "🎤 Try Speaking This" microphone check (uses the browser's speech recognition where supported — Chrome/Edge work best).
3. **Writing practice** — a short quiz mixing multiple-choice and fill-in-the-blank questions. Scoring 60%+ marks the level complete.

Progress is saved locally in the learner's browser (`localStorage`) — no account or backend needed.

## Publishing to GitHub Pages

1. Create a new GitHub repository.
2. Upload every file in this folder to the root of that repository (do not put them inside a subfolder).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to "Deploy from a branch," choose the `main` branch and `/ (root)` folder, then save.
5. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Customizing

- **Content**: edit `levels-data.js`. Each level is one JSON object with `id`, `stage`, `title`, `type`, `items`, `tip`, `speaking`, and `quiz`.
- **Colors/fonts**: edit the `:root` variables at the top of `style.css`.
- **Logo**: replace `logo.png` with your own file of the same name (or update the `<img src>` references in `index.html` and `level.html`).
