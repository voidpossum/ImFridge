# I'm Fridge — progress (was called OUT OF ORDER)

Last updated: 2026-09-27. Full design: the plan file, kept outside this repo (its newest "UPDATE" is the current milestone).

## 2026-09-27 (later): Void Possum's notes
- Game renamed **I'm Fridge** (title, start screen, file headers, README, LICENSE). Save keys (`outoforder_*`) and `window.OOO` are unchanged on purpose, so saves keep working.
- Money shows in dollars: the numbers were already cents, so a can is $2.00 (was ƒ200). No balance or save change. `Engine.money(n, short)` formats it everywhere (UI, scene, sim). The fizz mail and all "fizz" amounts in text now say money / dollars.
- Idea, not built: prices that go up later in the game (Void Possum said "maybe").
- Cherry blossoms moved down onto the branches, plus clusters on every branch tip (no bare branches at the edges).
- Settings tab removed from the rail (the pause menu already has it). Pause menu has an About box: avatar (`art/voidpossum.jpg`), version (`DATA.version` = 0.1.8), carrd link, bug mail. The start screen has the same box at the bottom.

## M1.8 in progress (plan "UPDATE 4": Cookie Clicker economy + Japanese park)
- Engine + data + sim DONE (2026-09-27): money is fizz (ƒ, ×100, save v5 migrates), research points (`buyResearch`, no projects), machine upgrades research-gated, Pneumatic Tubes (`tubeEvery`), Delivery Drone building (`serve`), mining not in review, `rpProd` +10%/RP ever earned, Macro Keyboards (`clickPct`), rivals copy a leader (`rivalCopy`), hardware ~3× cheaper. Sim: chapter 1 27–46 min for all bots, hardware beats clicks at 5–11 min, miner bot worse than active.
- Step 1 UI DONE: Shop = Research strip (research points) + Upgrades strip (machine levels + doublers) + Automation list (hardware + Delivery Drone); Research tab removed; research tutorial via Shop; click squash + floating numbers; pause menu has settings; all-time counter; tubes on your machine; drones fly up; RESTOCK over darkness; fizz mail; old saves migrate (v3/v4 → v5, gate research credited). CSS gotcha again: `.res` clashes (use `k-res`).
- Step 2 park mockup BUILT (2026-09-27), **waiting for Void Possum's approval**: the park already replaces the lobby in `js/scene.js` (sky by hour, hills, city, building with PARK NEWS board, railing, hedges, cherry trees + falling petals, lamp post, stone sign, recycle bins, concrete base, stone path, rain). Lobby art saved in `art/lobby/`. Machines restyled lightly (backlit glass, price tags + buttons, wide pickup slot). Customers walk in from off-screen (`DATA.world.doors` x -24 / 504). Stills: `?debug=1&demo=mid&hour=11|18.6|22.5&weather=rain`.
- Sim after the park: chapter 1 active 41–45, casual 23–37, idle 18–32, miner 23–36; `rivalQuarter` 1.16.
- NEXT (step 3): customers restyled for the park (student, jogger, salaryman...), text pass (lobby/lifts/TV/office words), polish from Void Possum's notes, then playtest.

## M1.7 (plan "UPDATE 3"): steps 1–3 built, waiting for Void Possum's screenshot approval, then playtest
- **Step 1:** save v4; the opening (dark lobby + spotlight, 5 clicks, 1 sale, free restock, lights flicker on, rivals say hello, "Skip tutorial"); Developer Mode at the end of day 1 (lobby glitch + new terminal text); research tutorial (tips: Research tab → SodaCoin Wallet → Research bar → Mining bar); 3 bars on your card (`Engine.setSplit(S, key, v)`, Game Dev Tycoon style); nickname (boot screen + Settings; plate, LED strip, card, log); red blinking RESTOCK + red arrows.
- **Step 2:** rivals save 40% of each sale (`rivalSpend`) and buy `DATA.rivalUpgrades` (coin, sign, cool, slots; logged as patch entries); features stack for the run (`M.features`, first loss = Crypto Mining with self-defense lines); mining difficulty (`mineHalf`: pay halves after $150 mined per run); `rivalBump` 1.15, `rivalQuarter` 1.14.
- **Step 3:** LED sign levels 1–10 look different (strips, running lights, top bulbs, colour cycle, rainbow + sparkles, night glow); cooling = frost + floor glow; coin slot glow; rival upgrades drawn in their colours (bulbs on top, frost, coin glow); stacked feature badges; NEW marks on research-unlocked shop items, pulsing Shop/Research tab icons, one-time "newShop" tip.
- Sim: chapter 1 active ≈ 45 min, casual 27–32, idle 18–23 (a bit short), greedy $6 loses fast (intended). No repeated text.
- Screenshot scenes: `?debug=1&demo=intro|new|jail|mid|bling`. Headless Edge freezes CSS animations: add `--force-prefers-reduced-motion`.
- Old saves: the v3 save from 2026-09-26 migrates and plays on (tested in Node).

## Where we are
**Milestone M1.6 (after the M1.5 playtest).** Plan: "UPDATE 2" at the top of the plan file.
- Step 1 (speed, follower price rule, repeatable research, pause, play stats): done 2026-09-26
- Step 2 (rival features crypto/hack/price war, carpet, rival capacity, lines, emotes, retune): done
- Step 3 (new layout): built, **waiting for Void Possum's approval of the screenshots** before polishing
- Step 4: verify + playtest

## Done
- [x] M1 built and playtested (chapter 1, wave-based). The feedback led to M1.5.
- [x] **Engine rewrite** (`js/engine.js`, save version 2):
  - Promote click (+1 processing → likes → a follower every 5 likes), followers waiting outside
  - Processing Power split (Posting ⟷ Research), unlocked by the Developer Mode "jailbreak" after the first card pick
  - Hardware in Cookie Clicker style (×1.15 cost, doublers at 1/5/25/50 owned)
  - Research (persistent, 3 offers, bank when idle)
  - Machine upgrades (some gated by research), a second dispenser (lanes)
  - Influencers (golden cookie: trending / rush / tip / grant)
  - Customer thoughts + `thoughtsSummary`
  - Refresh Points (cube root) + a paused reset screen (tree bought only there) + `startShift`
  - Lobby TV events: `tv` events (live / news / filler), `conditions()`
  - Rival online orders (drones), rival faces/moods
  - Save migration v1 → v2 (Déjà Vu refunded as Refresh Points)
- [x] **New data files:** `machine.js`, `hardware.js`, `research.js`, `news.js`. `tree.js`, `story.js`, `core.js`, `cards.js` and `rivals.js` are updated. `shop.js` is deleted.
- [x] **Simulator rebuilt** (`node tools/sim.js [--runs N] [--only active|casual|idler]`). Current results:
  - chapter 1: active 39–48 min, casual 34–38, idle 21–38
  - first hardware: 1–2.5 min; Developer Mode ≈ 6 min
  - longest gap with nothing new ≤ 4.3 min
  - line-limited 8–28% of the time
  - no repeated text
- [x] **Art pass (approved):** `js/sprites.js` + `js/scene.js`
  - Scene fills any box at a whole-pixel scale (world 480×270, the view grows around it).
  - Room: two lifts (doors open when people pass), windows with weather/time and a dithered sky, a TV hanging from the ceiling, poster, clock, bench, bin, plant (grows each run), water cooler/extinguisher on wide screens.
  - Light: sunbeams by day; night lamps and machine glows; rain footprints and a wet-floor sign.
  - All machines have faces and moods.
  - Customers are outlined and cached. Signatures:

    | Type | Signature |
    |---|---|
    | Office | white shirt |
    | Intern | round glasses + coffee |
    | Gym | T-shape + sweat + headband |
    | Boss | suit, tie, briefcase |
    | Kid | half size, cap, lollipop |
    | Night shift | vest + hard hat |
    | Follower | phone |
    | Influencer | sunglasses + selfie phone + gold glow |
  - Thought bubbles and particles: hearts, research bits, coins, drones, confetti.
- [x] Dev tools: `tools/devserver.py` (serves the folder and saves canvas snapshots to `%TEMP%\outoforder-snaps`), `tools/mockup.html` (`runMockup()` → day/night/rain/hot stills), `tools/lineup.html` (`runLineup(name)` → customer lineup).
- [x] **Step 3: new layout and UI** (`index.html`, `style.css`, `js/ui.js`, `js/main.js`, new `js/icons.js`):
  - HUD: three machine cards (live pixel face, name, quarter sales bar, rank, posting/research split, quirk status), review ring + clock, cash + likes/followers/research/sales per second.
  - Goal row: tutorial step (only when it makes sense) or the goal + rank; "Now" chips on the right with hover details (`Engine.conditions`).
  - Scene fills its box (ResizeObserver). Click: influencer = bonus, your machine = post, crate = restock.
  - Bottom bar: Post (Space), Posting/Research slider (after Developer Mode), price + Smart Price, Restock (R), can levels, "N waiting outside".
  - Right drawer with a pixel-icon rail (click the open tab again to fold it): Hardware (×1/×10/Max, doublers, locked teaser), Machine (stats + upgrades), Research (current bar + ETA, offers, done list), Cards, Book, Customers ("what customers say" + guide with portraits), Log (filters), Settings (incl. voluntary reset, save export/import).
  - Tooltips everywhere (`data-tip` / `data-tipfn`), numbers refresh while shown.
  - Pop-ups: boot, review (keys 1–4), Developer Mode, chapter. Enter = continue.
  - Reset screen: full screen, paused, compact summary, wake line, first-reset help, tree picture with lines, info panel + buy, sticky "Start next shift".
  - Lobby TV: HTML marquee on `Scene.tvRect()`. News first, then live lines (dropped if older than 25 s), filler every ~28 s when idle.
  - Engine: added `Engine.perClick(S)` (read-only). Customer `look` text updated to match the art.
  - Checked in the browser at 1089×895, 1366×768, 1920×1080 (scale 2, 2, 3). Sim unchanged. M1 → v2 migration tested in Node (refund works, round trip works).

- [x] **M1.6 steps 1–3** (see plan UPDATE 2):
  - Speed: outline without getImageData, cached pixel text and dither patterns. Late-game draw 1.9 ms median (was 6.7, spikes 54).
  - Followers compare prices (loyal margin $0.50 + $0.40 per person in the shortest rival line, floor 5%); refusers go to the cheaper rival.
  - Research: Fan Club / Superfans (+$1/+$2 margin), repeatables Fine-Tune Posts / Faster Firmware. Old saves get a fresh offer on load.
  - Pause: button (top right), P/Esc, engine pause type `hold`.
  - Save v3: `meta.stats` (per-quarter lines, events, sessions, tabs, fps). Read with `node tools/stats.js save.json`.
  - Rivals: cans min(30, 8+2×bumps), restock ÷√strength; features after a lost review (`DATA.features`), lines per group (`rivals.js lines`), emotes.
  - Comfy Carpet: your line starts at 50%, +10% per level (max 5).
  - Layout: top = customer thoughts + Now chips + money + pause; bottom = machine cards (your card: goal, split bar, price −/+) + clock; tabs Shop/Research/Memories/Customers/Log + gear; crate on top of your machine, LED strips on the sides, CLICK ME, waiting counter at the lift, TIP bubbles pointing at things.
  - Sim: greedy bot added. Chapter 1: active 40–44, casual 30–35, idle 22–35 min. Greedy ($6) loses every first quarter.
  - Screenshots: `index.html?debug=1&demo=mid` / `demo=new` (never saves). Headless Edge: see notes.md.

## Next (in order)
- [ ] **Step 4: story hooks check**
  - Headlines appear on the TV.
  - First-purchase lines (`first` in data) show as bubbles over VEND-3.
  - The "cpu" mail arrives.
  - Write more chapter-1 headlines if gaps show up.
- [ ] **Step 5: verify**
  - done: sim, browser at 3 sizes, migration, reset pauses
  - still to do: play a full chapter 1 at 1× in the browser (tutorial completes, chapter screen shows)
  - then a **playtest by Void Possum**
- [ ] Later milestones (see plan): M2 = chapters 2–3 (machine cut-away = hardware tower, lobby tycoon, Gus, messages, more rivals, fine-tune cards), M3 = chapters 4–5 + endings + endless, M4 = polish (sound, lofi music, juice).

## Small things noticed, not done
- No embedded pixel font yet (headings use the system monospace). Needs a font file download: ask first.
- Log colours: all rival lines use ChugGPT's colour.
- At 1089 wide with the drawer open, the view shows ~360 world px, so the lifts are cut at the edges (fold the drawer to see all).

## Open ideas, not decided
- **Art folder for Void Possum's own pixel art** (asked 2026-09-27, for later): PNG files in `art/park/` (trees, machines, customers, park pieces) that replace the code-drawn versions when present; the code drawing stays as the fallback. Export the current pieces as starter PNGs at the exact pixel size.
- Repo: https://github.com/voidpossum/ImFridge (public). Start screen password "soda" (`js/gate.js`, not security).
- Regulars (Tanya, Greg) look like normal customers. Offered: Tanya with a messy bun and a mug, Greg with a gold chain. No answer yet.
- Player online delivery (a research unlock) as the chapter-2 "scale jump".
