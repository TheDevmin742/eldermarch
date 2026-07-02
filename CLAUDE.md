# Eldermarch Campaign Hub — instructions for Claude Code

This folder is a static, player-facing website for an ongoing homebrew D&D 5e campaign (Eldermarch). The DM is Jane; the audience is her school D&D club players. It deploys to GitHub Pages. No build step, no frameworks — plain HTML/CSS/JS, and it must stay that way.

## RULE #1 — THE SPOILER FIREWALL
This site is read by PLAYERS. Never add content from the campaign's `DM Notes` folder or anything Jane describes as DM-facing. If asked to add lore, it must come from player-safe sources (recaps, player guides, town guides) or be text Jane provides. When in doubt, ask. Specifically:
- Lloyd's character card stays `hidden: true` in `content/characters.js` until Jane says he has debuted.
- Ember's Book entries must never reveal: anything about gods scheming, dragons in disguise, advisors, shapeshifters, "the Riftrender", or anyone named Mharrokh, Caelus, Tethaia, or Vaelra. If Jane asks for a new Ember page, write warm in-world history/folklore only, and show it to her before committing.

## File map (what to edit for what)
- `content/site.js` — Roll20 URL, next-session date, tagline, extra tools list, `feedbackEmail` (Messages form target; "" hides the form)
- `content/announcements.js` — announcements; `banner: true` pins one above the tabs
- `content/ember.js` — Ember's Book pages; set `unlocked: true` to reveal one
- `content/recaps.js` / `content/lore.js` — cards linking to files in `docs/`
- `content/characters.js` — character cards linking to `sheets/`
- `content/gazetteer.js` — town cards for the Gazetteer tab. ⚠ Only towns the party has VISITED. The Town Guides docx files contain DM-only sections (SECRETS, OPEN THREADS, DM NOTE, MAP PROMPTS) — strip all of those when converting one to a `docs/town-*.html` page.
- `content/surveys.js` — survey/poll cards on the Messages tab (paste Google Form links)
- `index.html` — the whole shell (tabs, styling, dice roller, Courier feedback form). Touch only for feature work.
- `sheets/` — COPIES of the Hearthsheets (source of truth lives in the campaign folder: `Player Notes/Character Sheets/Hearthsheets (HTML)`). Never copy any file marked NPC or DM Version.
- `docs/` — player-safe HTML documents. `img/` — cover art.

## Conventions
- Style: parchment theme, Cinzel + EB Garamond, CSS variables at the top of index.html. Match it.
- Never rename keys in the `content/*.js` data objects; index.html depends on them.
- Dates in announcements are `YYYY-MM-DD` strings (they sort newest-first).
- Jane's tone preference: concise, warm, in-world flavor welcome ("a new page has appeared").
- Never call the character Thalasstheos "Thal" anywhere, ever.

## When Lloyd debuts
Flip `hidden: false` in `content/characters.js`, AND: convert his tip sheet (`Player Notes/Tip Sheets/Lloyd — Tip Sheet.docx`) to `docs/tips-lloyd.html`, and add his card to `docs/battle-cards.html` (both were deliberately held back to avoid leaking him).

## The Messages tab (feedback)
The Courier's Desk form posts to formsubmit.co using `feedbackEmail` in `content/site.js`. It needs one-time activation: submit the form once on the live site, then click the link in FormSubmit's activation email. After activation, FormSubmit offers a random alias string — swap it into `feedbackEmail` so Jane's address isn't in the public repo.

## Workflow
- After ANY content change: commit with a clear message and push. The live site updates ~30s after push.
- Verify before pushing: this Mac has NO node/pandoc — check `content/*.js` with `osascript -l JavaScript` on a temp file prefixed with `var window = {};`, then serve locally and confirm the change renders. (The macOS preview panel can't read ~/Downloads; serve from a synced copy in the scratchpad if using it.)
- To read campaign .docx files: they're zip archives — extract `word/document.xml` with Python's `zipfile` + `ElementTree` (no python-docx installed).
- If Jane hands you an updated Hearthsheet or recap HTML, copy it into `sheets/`/`docs/` (keeping the simple kebab-case filenames) and update the matching content file.

## Deployment (first-time setup)
Repo: public, suggested name `eldermarch`. GitHub Pages: deploy from branch `main`, folder `/ (root)`. Use the `gh` CLI (`gh repo create`, `gh api` to enable Pages); walk Jane through `gh auth login` if not authenticated. After enabling, poll the Pages URL until it returns 200 and give Jane the final link.
