# I'm Fridge — working notes (was called OUT OF ORDER)

What a new session needs to know to keep working without re-deriving anything.

## The person and how they like to work
- The author is **Void Possum** (use only this name in files and credits). Basic HTML/CSS only, not a native English speaker, so explain simply.
- **Plan first, confirm, then build big complete chunks.** Deliberate on their feedback instead of implementing every idea. Research the reference games they name. Push back when an idea is weak, and ask 2–4 focused questions.
- **Visual changes need an approval gate:** render snapshots (`tools/mockup.html`, `tools/lineup.html`) and send them with SendUserFile before building on top.
- Taste references: Cookie Clicker (loop, ascension), Spaceplan (favourite), RollerCoaster Tycoon (guests, research), Rogue Legacy (type = visual signature), FACEMINER, Gnorp, Tower Wizard, Horripilant.

## Hard rules
- Teaching text is plain, short English. Jokes only in character lines.
- **No text line is ever shown twice.** Everything goes through `sayOnce` / `mail` / `checkNews` with ids in `meta.seen`. Patch notes and TV filler use never-repeated combinations.
- Tune with `node tools/sim.js` before tuning by feel. Target: chapter 1 in 30–45 min, nothing new for more than 5 min.
- Saves must never reset a player: bump `SAVE_VERSION` + add a step in `migrate()` in `js/engine.js`.
- `js/engine.js` has no DOM code (the sim runs it in Node through `vm`).
- No text or file may contain the Windows user name or path. `.claude/launch.json` uses `tools/devserver.py 8741` with no user path.
- **Never do** `open(p,'w').write(open(p).read())` in Python: it empties the file (this happened once to scene.js). Use the Edit tool or read first.
- Bash heredocs with single quotes inside JS can break. Write snippets to the scratchpad with the Write tool, then splice them in with Python.

## Design decisions (locked)
- **Tone and structure:**
  - Mostly funny tone.
  - Active early, idle later.
  - Hybrid: memory cards (1 of 3 after each review won) + Refresh Points tree.
  - 6–8 h to the ending, then endless mode.
  - Two endings (Out of Order / Employee of the Month).
- **Rivals:** parodies. ChugGPT (90% hype, undercuts price), Clawd (70% research, fair price, blazer/tungsten/apologies). Later: Grog, Gemfizz, DeepSip, Llamanade, Co-Pourlot, Refreshr ONE.
- **Click = Promote.** 1 processing → likes → a follower every 5 likes. Followers walk to you and wait outside if your line is full.
- **Processing Power split** (Void Possum's idea): unlocked by Developer Mode after the first card pick. Posting makes followers, Research makes research points.
- **Research is permanent** and unlocks machine upgrades, hardware and multipliers. Hardware is the "inside the machine" layer: later a cut-away tower, with the human brain ("wetware") at the bottom.
- **Reset:**
  - Losing a review means reset.
  - The reset screen is **paused**, and Refresh Points are spent only there, in the tree.
  - Rivals grow ×1.25 per loss, ×1.18 per quarter, +10% per reset.
  - Rivals get online-order drones, so runs always end.
- **Run 1 script:** both rivals get 4 version bumps at the start of quarter 3 ("model day"), so the first reset lands around 15 min.
- **Lifts** on both sides (customers arrive through lifts); the floor display says "3".

## Useful commands
- `node tools/sim.js --runs 3`: pacing report.
- Browser pane:
  - start the server with preview_start name `out-of-order` (port 8741)
  - open `http://localhost:8741/tools/mockup.html`, then run `await runMockup()` in the page → PNGs in `%TEMP%\outoforder-snaps`
  - read the PNGs with the Read tool; send them with SendUserFile
- Debug in the game: `index.html?debug=1` shows a bar (speed, cash, RP, research, end quarter, night, influencer, quirks, win/lose now). `window.OOO.S` is the live state.
- In-page testing: `Save.reset()` really resets. Clearing localStorage from outside gets undone by the save-on-close.

## Page screenshots (headless Edge)
`"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=<scratch>\edgeprof --window-size=1366,768 --virtual-time-budget=4000 --screenshot=<scratch>\x.png "http://localhost:8741/index.html?debug=1&demo=mid"` (Windows-style paths only; `demo=` never saves). Add `--force-prefers-reduced-motion`: headless Edge does not run CSS animations, so animated pop-ups would show their first frame.
- CSS gotcha: `.res` is the review result row. Do not reuse short class names like `.res`/`.row` for new things.

## File map
- `js/data/*.js`: all text and numbers. `core.js` holds the balance and world layout.
- `js/engine.js`: rules. The public API is listed in the return object at the bottom of the file.
- `js/sprites.js`: palette, people (outlined, cached), machines + faces, TV, props, bubbles.
- `js/scene.js`: room, lighting, particles, hit tests, `toScreen`/`tvRect`.
- `js/audio.js`, `js/save.js`: still from M1 and fine to keep (save keys `outoforder_save` / `outoforder_settings`).
- `js/ui.js`: HUD, bar, drawer tabs (`PANELS`: each has `sig` = rebuild key, `html`, optional `live` = in-place update so buttons never get replaced mid-click), tooltips (`TIPS`), pop-ups (`MODALS`), reset tree, TV marquee.
- `js/main.js`: loop, scene clicks, saving, debug bar. `js/icons.js`: 12×12 pixel icons from text maps.
- `tools/`: `sim.js`, `devserver.py`, `mockup.html`, `lineup.html`.
