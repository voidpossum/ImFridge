# I'm Fridge — progress (was called OUT OF ORDER)

Last updated: 2026-09-27. Full design: the plan file, kept outside this repo (its newest "UPDATE" is the current milestone).

## 2026-09-27 (later): Void Possum's notes
- Game renamed **I'm Fridge** (title, start screen, file headers, README, LICENSE). Save keys (`outoforder_*`) and `window.OOO` are unchanged on purpose, so saves keep working.
- Money shows in dollars: the numbers were already cents, so a can is $2.00 (was ƒ200). No balance or save change. `Engine.money(n, short)` formats it everywhere (UI, scene, sim). The fizz mail and all "fizz" amounts in text now say money / dollars.
- Idea, not built: prices that go up later in the game (Void Possum said "maybe").
- Cherry blossoms moved down onto the branches, plus clusters on every branch tip (no bare branches at the edges).
- Settings tab removed from the rail (the pause menu already has it). Pause menu has an About box: avatar (`art/voidpossum.jpg`), version (`DATA.version` = 0.1.8), carrd link, bug mail. The start screen has the same box at the bottom.

## 0.3.1 (2026-09-27): money like Cookie Clicker, drones that catch up, no hacking, side machines
From Void Possum's 0.3.0 save and notes. They asked for all of it in one build. The Cookie Clicker and Gnorp pages they sent were read: Cookie Clicker's code through a copy on GitHub; Gnorp's pages they pasted.
- **Money from hardware, like Cookie Clicker buildings:**
  - Processing in Mining earns `procCash` (30¢) per point every second, half before the SodaCoin Wallet.
  - No more "tired" rates (`clickHalf`, `adHalf`, `mineHalf` are gone), and no more ads.
  - Clicks pay their own click money.
  - Before Developer Mode everything is Mining. After it, the slider starts at half and half.
- **Hardware tiers (Cookie Clicker spacing):**
  - Each new item takes longer to pay itself back.
  - Overclock 20 pps, GPU $15k / 100 pps.
  - New in the new park: **Server Rack** ($200k, 270 pps) and **Neural Chip** ($3M, 1,250 pps), after research.
  - Doublers also at 100 and 150 owned.
  - Synergies: each Auto-Click Script gets +0.1 per other hardware; an item gets +1% per copy of the next item once that one has 2 doublers.
- **Shop:** each hardware row shows "+$X/s" (what one more copy adds). The tooltip shows each item's and all copies' money, and the share of your income. The money tooltip lists cans, hardware and clicks.
- **Refresh Point bonus is +2% per point** (was +10%; Cookie Clicker: +1%). This was the real cause of the run-2 runaway.
- **Drones catch up:**
  - Followers per second = 0.5 × (likes per second)^0.3.
  - Fixed limit of 40 online orders; extra ones are lost (`R.qLost` per month).
  - The counter always shows once you own drones (0/40 = green), and idle drones park on VEND-3's roof.
  - The tooltip shows orders in vs delivered.
  - Drones cost ×1.2 per copy (was ×1.35).
  - Sim: drones keep up about 60% of the time, and the counter is at 0 about 70% of the time.
- **No hacking.** Removed from the rules, data, text, UI, sprites and the debug bar.
- **Price War is an event:** one month, one rival at a time (`M.warUntil`, `endWars` at the review). That's where the "too expensive" pile came from (all 3 rivals were $1 under you).
- **"Line too long" only when true:**
  - at least 3 people really waiting per dispenser (not walking there)
  - and the customer would have picked you with an empty line
  - The line penalty is per dispenser. Sim: 0–0.1 per month (was on every sale).
- **Side machines** (`js/data/side.js`, Void Possum's layout):
  - Two slots. Each needs a research (Side Machine Permit / Second Permit) and followers this run (200 / 1,000), like Gnorp buildings need gnorps.
  - Click the dashed "PICK" slot in the park, or its Shop row: a menu with 4 red machines, each usable only once.
    - Snack: always, +5% of all money per level
    - Claw: 3+ in your line, +10%, and people wait longer
    - Coffee: morning and lunch rush, +12%, and more walk-ins
    - Ice: hot days, +18%, and colder cans
  - 5 levels ($10k ×4 per level), shown in the Shop. They reset with the run.
  - A working machine drops coins; an idle one is dim.
- **More to research in the new park:** Permits, Energy Drink (a new flavor at +$1; only wanted once you sell it), VIP Customers (Tech Bro: vest, sunglasses, phone; budget $4–8), Server Rack, Neural Chip, and repeatables Better Mining Code (+5% hardware money) and Drone Tuning (+5% drones).
- **Rivals keep up with a fixed curve:**
  - Rival-only mod levels grow ×1.7 per month (×1.9 in the new park): 1, 2, 3, 5, 8, 14...
  - They earn ×(your Refresh bonus)^1.5 (`rivalPow`), ×2 in the first park, ×8 in the new park.
- **Chapter 2 goal is $3,000,000.**
- **Fixes:**
  - With 4 machines, being 1st gave the worst card odds (rank was counted for 3 machines).
  - Review bars: Grog could go past 100%.
- **Save v8:** hack is removed from rivals, only one Price War is kept, orders are clamped to 40, the tired-rate fields are dropped, and side slots are added. Void Possum's save loads and plays.
- **Sim** (new lines: income jump per hardware buy, drones in/out, "line too long" per month; bots mine 80% once only repeatables are left):
  - Chapter 1: active 23–26 min, casual 25–29, idle 28–30
  - Chapter 2: 34–40 min into run 2, rivals at 8–88% of you
  - No strikes for normal players.
- **Known:** in run 3 the rivals fall to about 10–20% of you (for the 0.3.3 balance pass). Talents (Gnorp style) are planned as chips on VEND-3's board in 0.3.2 (inside the machine).

## Game data wiki (2026-09-27, after 0.3.0; tools only, no version change)
- **`tools/wiki.html`** lists every balance number, machine upgrade (cost of every level), hardware item (processing per $), research, Refresh star, card, rival (stats, quirks, upgrades, features and rival-only mods) and the park (customers, weather, dayparts, worlds).
  - Read live from the data files, with their comments.
  - 556 values can be edited: changed values turn yellow, and costs per level update.
  - Edits and per-section notes are kept in the browser.
  - **Export changes** gives an old → new list to send. **Download document** saves one HTML file.
  - Search works across everything.
- **Opening it:** the Konami code in the game (↑↑↓↓←→←→BA) opens it in a new tab. There is no visible link.
- **`docs/game-data.md`:** the same content for GitHub, written by `node tools/gen-docs.js` from the shared `tools/describe.js`.

## 0.3.0 (2026-09-27): Chapter 2 starts: the new park and Grog
- **Worlds** (`DATA.worlds` in `core.js`, `run.world`): world 1 = the Chapter 1 park, world 2 = the new park (Void Possum's layout, VEND-3 in the centre under the news board):
  - left to right: a cardboard box ("SOON", a machine that arrives later), ChugGPT, your slot, VEND-3, your slot, Clawd, Grog
  - a lamp behind each side slot; the slots stay empty until 0.3.1
- **When you move:** after Chapter 1, every new run starts in the new park.
  - Goal reached: the pop-up has **Move now** (reset) and **Stay a little longer** (move later with Reset).
  - First reset: the next run is already there.
  - A mail, the TV news and a line from each rival, all once.
- **Save v7:** `run.world`, and old runs stay in world 1. Void Possum's saves were tested: they move at the next reset.
- **Engine: any number of machines.**
  - Loops use `machines.length`.
  - `Engine.MX` changes with the world (it is the same array).
  - Rival lines are looked up by id; banter only plays when both speakers are here.
- **Grog** (a Grok parody, the product only):
  - Look: dark chrome, sunglasses face, antenna, flames in spicy mode.
  - Price: chaos (a new price every day).
  - Quirks: spicy mode (hype), roast (its line walks away and people keep away for a while), free soda, hot take (closed), 40% off.
  - Rival-only mods on a schedule: Fleet month 2, Plus 4, Sandwiches 6.
  - Lines, patch notes, 4 night banters. Quirks can have their own TV line and card word (`tv`, `word`).
- **Chapter 2 goal:** $1,000,000 in one run in the new park (`B.ch2Goal`), then a Chapter 2 complete screen.
- **Money from processing slows down within a run** (this fixed a big snowball: run 2 went to $214M, rivals at 0%):
  - clicks (`clickHalf`, $30k) and ads (`adHalf`, $20k), like mining already did
  - reason: after a reset, +10% processing per Refresh Point made clicks worth $1k+ each
- **Rival-only mods** are ×2.5 in the new park and grow with your permanent power (√ of your processing multiplier), not with this run's score.
- 4 cards in the bottom bar (`#machines.four`), "4th" rank. Debug: `?debug=1&demo=park2`.
- Sim (runs 1–3; bots press Move now):
  - Chapter 1: active 29–32 min, casual 35–37 min (unchanged).
  - Chapter 2, active: 37–42 min into run 2, rivals at 14–36% of you.
  - Chapter 2, casual: 16–21 min into run 3, about 100 min into the game.
  - Idle players get 3 strikes in both runs.
- Known: in runs 3+ the rivals fall behind again (2–7%). This is for the 0.3.3 balance pass.

## 0.2.8 (2026-09-27): drones, Smart Price, rivals keep up (from Void Possum's 0.2.7 save)
- Their save: $30,093 at month 8 vs rivals $4,435 / $3,675 (7× ahead); 24 drones sold 78% of all cans.
- **Drones** cost 35% more per copy (`grow` in `DATA.hardware`, others stay 15%). At most ~12 drones are drawn in the sky.
- **Smart Price** = the average price of the other machines (`Engine.smartTarget`). A rival that copies you counts with its own normal price (`rivalOwnPrice`), or the price would chase itself down. Old profit optimizer is no longer used by the game.
- **Rival-only mods** (you never get them): Sandwich Menu (+money per can), Drone Fleet (sells to its own online fans), Soda Plus (subscription money every second).
  - Fixed schedule per rival (`mods` in `rivals.js`: ChugGPT Plus in month 2, Fleet 4, Sandwiches 6; Clawd the other way round). Level 1 on arrival, +`featPerMonth` (3) every month.
  - Not tied to how you do (no rubber-banding): a steady curve. First tries with random picks or rivals reinvesting their money swung from 5% to 400%.
  - Also: every rival behind you installs a feature at each review (was only the lowest one).
  - Shown on the rival cards with gold borders, and as badges on their machines. One character line each.
- Sim bots now keep $2 until they buy Smart Price (like real players). The sim prints rival scores at Chapter 1.
- Sim (1 run each): active Chapter 1 at 28–29 min, rivals at 20–38% of you; casual 31–38 min, rivals 34–105%; idle players now get 3 strikes around 36 min (rivals pass them).

## Chapter 2 plan (approved 2026-09-27), mockups in `tools/ch2mock.html`
- **Builds:**
  - 0.3.0: the move + Grog (done)
  - 0.3.1: your **side machines** + bigger numbers
  - 0.3.2: inside the machine
  - 0.3.3: achievements + balance
- **Layout** (after Void Possum's Photoshop mockup):
  - One screen, no Big Park. The machines stand side by side.
  - Your own machines are red, smaller, and stand next to VEND-3.
  - No bench, fountain or bus stop: they'd be lost among the NPCs and menus.
- **Side slots:** two slots. The player **picks one machine per slot**: Snack (money), Claw (kids and crowds), Coffee (mornings), Ice (hot days).
- **Art export for Photoshop:** `tools/export.html` writes to `art/export/` (1x and 4x, clear backgrounds).
  - Machines, side machines, the cardboard box, people, and the park with and without trees.
  - Rebuild: open the page through the dev server and run `exportAll()`.

## 0.2.3–0.2.7 (2026-09-27): layout and feel, from Void Possum's play
- Top bar: clock at the left, customer reviews, menu buttons next to Pause. Money at the top of the Shop panel (top bar when folded). Today's conditions at the top middle of the park; rival news, features and mods on their cards.
- Click a mail pop-up to close it. Smooth dawn (dark at 6:00, light at 8:00) and blended sky colours. Soda cans in the Refresh map (flavour per group).
- Developer Mode: the machine's line is the button. SodaCoin Wallet and Carpet cost 25; the slider starts at 50/50. Drones research shows at 8 orders.
- **Hold to click:** holding the mouse on your machine (or Space) clicks `B.holdCps` (10) times a second; not for a hack reboot. Sim bots hold.
- **Calendar:** one day/night = one week, 4 weeks = a month (review), 12 months = a year (`Engine.calendar`, `DATA.months`). Internally still `quarter`/`qDay`.
- Pneumatic Tubes: at most 2 tubes (under the feet); higher levels = faster capsules.
- Balance: `clickCash` 5, Chapter 1 goal $30,000. Sim: active 25–29 min, casual 28–35, idle resets at ~45.

## 0.2.2 (2026-09-27): online orders fix (from Void Possum's run-2 save: 430 orders in quarter 1)
- Cause: +10% processing per Refresh Point ever earned (40 RP = ×5) → likes → followers without limit.
- Online orders have a limit (`Engine.ordersCap`: 30 s of drone deliveries, at least 15; counter shows 15/18). When full, extra likes earn ad money (`B.adCash` 5 cents per follower, counts as score, "Ads" in the money tooltip). Old saves are clamped to the limit.
- Followers are made in one step per tick (was one loop per follower): the sim is ~20× faster.
- Money box moved to the top of the Shop panel (back in the top bar when the panel is folded).
- Chapter 1 goal $20,000. Sim: active 26–28 min, casual 34–42, idle 42–44, all by the goal.

## 0.2.1 (2026-09-27, after Void Possum's 0.2.0 play; their save is the data)
Research on Horripilant, Gnorp Apologue, Tower Wizard, Starvester: everything bought in a run resets; only the
prestige tree is permanent; the best prestige nodes are "start with X". Void Possum approved:
- **Research starts over every run** (it still lives in `S.meta.research`, reset in `newRun`, so old saves keep the current run's research). Each research **gives level 1** of what it unlocks (`grant()`; Shop items: one free copy). Order: SodaCoin Wallet → **Carpet Catalog** (cheap, visible) → the rest.
- **Milestone research** (`when` in `DATA.research`, Cookie Clicker style): Delivery Drones is cheap and shows up once 15 online orders wait.
- **Online orders:** followers who cannot fit in your line are online orders (drone counter at the left edge, hover explains, click opens the Shop). Undelivered orders expire quietly (`R.ordersLost`), no review for them.
- **Customer reviews** count this quarter only (`R.qThoughts`, reset at every review). Only people at your machine: "gave up waiting" = left your line; "line too long" = saw it and did not join (new queue icon).
- **Refresh tree = constellations** on a night sky (4 groups + a centre star, `DATA.treeGroups`). New "start with" stars: Rolled-Up Carpet, Pocket LED, Autopilot (tubes), Old Wallet, Lab Notes/Notebook (research points), Drone Hangar, Fan Mail. Fx keys `startResearch` (id) and `startRes` (points).
- Ideas for later: hard mode with rubber-banding; FACEMINER-style achievements (no reset, no strike).

## 0.2.0 in progress (2026-09-27): "one number goes up" economy rework
Plan approved by Void Possum (research: Cookie Clicker, Spaceplan, Gnorp Apologue, Tower Wizard, FACEMINER).
- **Everything is money.** Cans, clicks, mining and tips all count. The card bars show money earned **this run** and never reset (`M.rSales`); small text shows the quarter (`qSales`). Cans sold are counted (`M.cans`, `meta.totalCans`). One helper: `score(S, amt)` in `js/engine.js`.
- **No Posting bar.** Processing power always brings likes (followers). After Developer Mode it also makes research; after SodaCoin Wallet one slider splits that part: Mining ⟷ Research (`split = {res, mine}`, `B.resRate`). A click also earns money right away (`clickCash`, `B.clickCash`).
- **Reviews:** last place = a strike, 3 in a row = reset (`B.strikesMax`). A rival that is last gets updated + a feature (crypto, price war, hack) as before. Not last clears strikes.
- **Cozy standard mode:** a strong run can go on forever; resetting is the player's choice (pause menu, from quarter 2: `Engine.canReset`). No rubber-banding (`rivalCopy` = 0). A **hard mode** with rubber-banding is an idea for later (Void Possum). Achievements like FACEMINER's (no reset, no strike) also later.
- **Chapter 1** ends at the first reset OR when you earn `B.ch1Goal` in one run (`ch1win` screen + mail). Model day moved to quarter 5 (`B.modelDayQuarter`).
- **Tubes** come up from under the path into the machine feet (rivals: both feet, always; you: Pneumatic Tubes level 1–3). Capsules rise on refills (`fill` event for rivals). Customers tab explains drones (online orders) and tubes (refills).
- Save v6 (split → {res, mine}, strikes, cans). Tested with a fake v5 save in Node.
- Sim: `--set key=value`; bots reset by choice after 45 min of a run; report shows strikes, "score went down: never", how Chapter 1 was finished.

## 0.1.9 (2026-09-27)
- Click a speech bubble or a tip to close it (a closed tip stays away until the next tip step).
- Stone park sign removed.
- Your machine is drawn into a small canvas and copied with the scale (`youDraw` in `js/scene.js`): the squash and the hover grow are crisp, and the night-light pass (face, name) moves with the machine. No white hover veil any more.
- "Customer reviews" label before the thoughts at the top. The top bar stays one line: chips shrink to icon + number on narrow screens.

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
