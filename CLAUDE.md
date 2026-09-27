# I'm Fridge — project notes

Soda-machine incremental by Void Possum. Plain HTML/CSS/JS, no build step: `index.html` runs from a double-click.
The design plan (chapters, systems, endings) was approved 2026-09-26.
**Start every session by reading `progress.md` (status + next steps) and `notes.md` (rules, decisions, gotchas).**

## Rules that must not break
- **Teaching text is plain, short English** (the author is not a native speaker). Jokes only in character lines.
- **No text line is shown twice.** Every line has an id and goes through `sayOnce` / `mail` in `js/engine.js`.
  Repeating effects show an icon, not text. Patch notes fall back to never-reused combinations (`DATA.patchParts`).
- **Tune with the simulator first:** `node tools/sim.js` (add `--runs N`, `--expert`). Chapter 1 target: 30–45 min.
- **Saves must survive updates:** bump `SAVE_VERSION` and add a step in `migrate()`; never reset a player's save.
- `js/engine.js` has no DOM code. The page and the simulator run the same rules.
- All author/credit text says "Void Possum" only. Links: https://voidpossum.carrd.co/ (About box in the pause menu and on the start screen).
- Money is stored in **cents** (200 = $2.00). Show it only through `Engine.money(n)` (`short` = scene pixel text).
- `DATA.version` (`js/data/core.js`) is shown in the pause menu: raise it for every shared build, and rerun `node tools/gen-docs.js` (updates `docs/game-data.md`).
- **All rights reserved.** Never add an open-source license (MIT etc.). File headers say `© 2026 Void Possum. All rights reserved.`

## Map
- `js/data/*.js`: all text and numbers (balance, cards, rivals, story, machine, hardware, research, tree, news)
- `js/engine.js`: rules. `js/scene.js` + `js/sprites.js`: canvas lobby (480×270). `js/ui.js`: DOM. `js/icons.js`: menu icons. `js/main.js`: loop, saving, `?debug=1` bar
- `tools/devserver.py`: local server for browser testing (`.claude/launch.json`), saves canvas snapshots to the system temp folder
- `tools/wiki.html`: the game data wiki (all upgrades, cards, rivals, balance; editable, exports a change list). Opened in the game with the Konami code (↑↑↓↓←→←→BA), no visible link. `tools/describe.js` builds its sections; `tools/gen-docs.js` writes the same as `docs/game-data.md`.
- `tools/export.html`: art as PNGs for Photoshop mockups (`art/export/`).
