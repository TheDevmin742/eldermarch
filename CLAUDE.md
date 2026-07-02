# Eldermarch Campaign Hub — instructions for Claude Code

This folder is a static, player-facing website for an ongoing homebrew D&D 5e campaign (Eldermarch). The DM is Jane; the audience is her school D&D club players. It deploys to GitHub Pages. No build step, no frameworks — plain HTML/CSS/JS, and it must stay that way.

## RULE #1 — THE SPOILER FIREWALL
This site is read by PLAYERS. Never add content from the campaign's `DM Notes` folder or anything Jane describes as DM-facing. If asked to add lore, it must come from player-safe sources (recaps, player guides, town guides) or be text Jane provides. When in doubt, ask. Specifically:
- Lloyd's character card stays `hidden: true` in `content/characters.js` until Jane says he has debuted.
- Ember's Book entries must never reveal: anything about gods scheming, dragons in disguise, advisors, shapeshifters, "the Riftrender", or anyone named Mharrokh, Caelus, Tethaia, or Vaelra. If Jane asks for a new Ember page, write warm in-world history/folklore only, and show it to her before committing.

## File map (what to edit for what)
- `content/site.js` — Roll20 URL, next-session date, tagline, extra tools list
- `content/announcements.js` — announcements; `banner: true` pins one above the tabs
- `content/ember.js` — Ember's Book pages; set `unlocked: true` to reveal one
- `content/recaps.js` / `content/lore.js` — cards linking to files in `docs/`
- `content/characters.js` — character cards linking to `sheets/`
- `index.html` — the whole shell (tabs, styling, dice roller). Touch only for feature work.
- `sheets/` — COPIES of the Hearthsheets (source of truth lives in the campaign folder: `Player Notes/Character Sheets/Hearthsheets (HTML)`). Never copy any file marked NPC or DM Version.
- `docs/` — player-safe HTML documents. `img/` — cover art.

## Conventions
- Style: parchment theme, Cinzel + EB Garamond, CSS variables at the top of index.html. Match it.
- Never rename keys in the `content/*.js` data objects; index.html depends on them.
- Dates in announcements are `YYYY-MM-DD` strings (they sort newest-first).
- Jane's tone preference: concise, warm, in-world flavor welcome ("a new page has appeared").
- Never call the character Thalasstheos "Thal" anywhere, ever.

## Workflow
- After ANY content change: commit with a clear message and push. The live site updates ~30s after push.
- Verify before pushing: `node --check content/*.js`, then open `index.html` (or run a quick local server) and confirm the change renders.
- If Jane hands you an updated Hearthsheet or recap HTML, copy it into `sheets/`/`docs/` (keeping the simple kebab-case filenames) and update the matching content file.

## Deployment (first-time setup)
Repo: public, suggested name `eldermarch`. GitHub Pages: deploy from branch `main`, folder `/ (root)`. Use the `gh` CLI (`gh repo create`, `gh api` to enable Pages); walk Jane through `gh auth login` if not authenticated. After enabling, poll the Pages URL until it returns 200 and give Jane the final link.
