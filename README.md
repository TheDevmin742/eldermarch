# Eldermarch — Campaign Hub

A free, no-build static website for the players. Open `index.html` in a browser to preview it locally — everything works offline.

## ⚠ THE SPOILER FIREWALL (rule #1)

**Nothing from the `DM Notes` folder ever goes on this site.** Only content from `Player Notes`, `Recaps`, and `Town Guides` may be added. Lloyd's character card is hidden until his debut (`content/characters.js` → flip `hidden: true` to `false`).

## Publishing it free with GitHub Pages (one-time, ~5 min)

1. Make a free account at github.com.
2. New repository → name it `eldermarch` → Public → Create.
3. On the repo page: "uploading an existing file" → drag the **contents** of this `Website` folder in (index.html at the top level, plus the `content/`, `sheets/`, `docs/`, `img/` folders) → Commit.
4. Repo Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` → Save.
5. Wait ~1 minute. Your site is live at `https://YOURNAME.github.io/eldermarch/` — pin that link in the club Discord.

## Updating the site

All routine updates are tiny edits to the files in `content/` — no HTML needed:

| To… | Edit… |
|---|---|
| Post an announcement / pin a banner | `content/announcements.js` |
| Set the next session date or Roll20 link | `content/site.js` |
| Unlock a page of Ember's Book | `content/ember.js` (set `unlocked: true`) |
| Add a session recap | `content/recaps.js` (+ drop the HTML in `docs/`) |
| Add lore docs | `content/lore.js` (+ file in `docs/`) |
| Reveal Lloyd / update a character | `content/characters.js` (sheets live in `sheets/`) |

Then push: on github.com you can edit any file in the browser (pencil icon → commit), or use **Claude Code** in this folder and just say what you want changed — it edits and pushes, and the live site updates in ~30 seconds.

> Keep this `Website/` folder as the source of truth; the sheets in here are **copies** of the Hearthsheets. When a Hearthsheet changes, re-copy it into `sheets/`.

## What's where

- `index.html` — the whole site shell (tabs, dice roller, styling)
- `content/*.js` — everything you routinely edit (plain text, commented)
- `sheets/` — player Hearthsheets (NO DM/NPC versions)
- `docs/` — recaps, Story So Far, Field Guide (player-safe HTML)
- `img/` — cover art
