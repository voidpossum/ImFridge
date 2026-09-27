// I'M FRIDGE — pacing simulator.
// A bot plays the real engine at full speed and reports how long things take.
// Run:  node tools/sim.js                 (all bot profiles, 3 seeds each)
//       node tools/sim.js --runs 5        (keep playing for 5 runs)
//       node tools/sim.js --only active   (one profile: active, casual, greedy, idler)
//       node tools/sim.js --set rivalQuarter=1.2   (try a balance number, repeat --set for more)
// © 2026 Void Possum. All rights reserved.

'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
['js/data/core.js', 'js/data/cards.js', 'js/data/rivals.js', 'js/data/story.js', 'js/data/machine.js',
 'js/data/hardware.js', 'js/data/research.js', 'js/data/tree.js', 'js/data/news.js', 'js/engine.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
});

var args = process.argv.slice(2);
function arg(name, def) { var i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; }
var maxRuns = +arg('--runs', 3);
// Try balance numbers without editing files: --set rivalQuarter=1.2 --set likesPerFollower=7
args.forEach(function (a, i) {
  if (a !== '--set') return;
  var kv = String(args[i + 1]).split('=');
  DATA.balance[kv[0]] = +kv[1];
  console.log('(balance: ' + kv[0] + ' = ' + kv[1] + ')');
});
var only = arg('--only', null);

// Real seconds a person spends on screens that pause the game.
var READ = { boot: 25, review: 18, reset: 45, chapter: 15, jailbreak: 25, say: 2.5, mail: 6 };

var PROFILES = {
  active: { cps: 4.0, busy: 0.85, check: 0.6, gold: 0.9, prices: true, split: true, name: 'Active player (4 clicks/s)' },
  casual: { cps: 1.5, busy: 0.6, check: 2.0, gold: 0.5, prices: false, split: true, name: 'Casual player (1.5 clicks/s)' },
  greedy: { cps: 3.0, busy: 0.85, check: 0.6, gold: 0.9, prices: false, split: true, greedy: true, name: 'Greedy (3 clicks/s, always $6)' },
  miner:  { cps: 4.0, busy: 0.85, check: 0.6, gold: 0.9, prices: true, split: true, miner: true, name: 'Miner (4 clicks/s, 75% Mining)' },
  idler:  { cps: 0.4, busy: 0.5, check: 4.0, gold: 0.3, prices: false, split: false, name: 'Mostly idle (0.4 clicks/s)' }
};

var SPEND = {};
function spend(k, v) { SPEND[k] = (SPEND[k] || 0) + v; }
function simulate(profile, seed) {
  var P = PROFILES[profile];
  SPEND = {};
  var S = Engine.newGame(seed);
  var B = DATA.balance;
  var gameT = 0, uiT = 0, dt = B.tick;
  var checkT = 0, shopT = 0, clickAcc = 0, busy = true, busyT = 0, lastHour = -1;
  var seen = {}, repeats = [], novel = [0];
  var hwBeat = null;
  var runs = [], runStart = 0, runQ = 0, ch1At = null, firstAuto = null, jailAt = null, firstGold = null, introAt = null, mined = 0;
  var capLimited = 0, capTotal = 0, strikes = 0, lastScore = 0, scoreDrops = 0;
  var rnd = mulberry(seed * 7 + 3);
  var guard = 0;

  function now() { return gameT + uiT; }

  while (runs.length < maxRuns && gameT < 6 * 3600 && guard++ < 1e7) {
    if (S.pause) {
      var t = S.pause.type;
      uiT += READ[t] || 10;
      if (t === 'boot' || t === 'chapter' || t === 'jailbreak') {
        if (t === 'chapter' && ch1At == null) ch1At = now();
        if (t === 'jailbreak' && jailAt == null) jailAt = now();
        Engine.closeInfo(S);
      } else if (t === 'review') {
        runQ++;
        if (S.pause.res.strikes) strikes++;
        var offer = S.pause.res.offer || [], best = 0, bestScore = -1;
        offer.forEach(function (id, n) {
          var sc = { legendary: 3, rare: 2, common: 1 }[Engine.CARD[id].rarity] + rnd() * 0.5;
          if (sc > bestScore) { bestScore = sc; best = n; }
        });
        Engine.pickCard(S, best);
      } else if (t === 'reset') {
        runQ++;
        if (S.pause.res.strikes) strikes++;
        runs.push({ minutes: (now() - runStart) / 60, quarters: runQ, sales: Math.round(S.run.sales), rp: S.pause.res.rp, strikes: strikes, asked: !!S.pause.res.voluntary,
                    pps: Engine.pps(S), research: Object.keys(S.meta.research.done).length });
        spendTree(S);
        Engine.startShift(S);
        runStart = now(); runQ = 0; strikes = 0; lastScore = 0;
      }
      drain();
      continue;
    }

    Engine.tick(S, dt);
    gameT += dt;
    drain();
    var R = S.run;
    var sc = R.machines[Engine.YOU].rSales;
    if (sc < lastScore - 1e-6) scoreDrops++;
    lastScore = sc;
    capTotal++;
    if (hwBeat == null && Engine.pps(S) >= 4) hwBeat = now();
    if (R.waiting >= 2) capLimited++;

    // Clicking comes in bursts: a person is not always at the keyboard.
    busyT -= dt;
    if (busyT <= 0) { busy = rnd() < P.busy; busyT = 5 + rnd() * 20; }
    if (busy) {
      clickAcc += P.cps * dt;
      while (clickAcc >= 1) { clickAcc -= 1; Engine.promote(S); }
    }

    checkT += dt;
    if (checkT >= P.check) {
      checkT = 0;
      // Resetting is the player's choice: bots cash in their Refresh Points after 45 minutes of a run.
      if ((now() - runStart) > 45 * 60 && Engine.canReset(S)) { Engine.requestReset(S); continue; }
      // Trending customers.
      R.customers.forEach(function (c) { if (c.gold && rnd() < P.gold * P.check / 6) { if (firstGold == null) firstGold = now(); Engine.clickGold(S, c.id); } });
      // Restock when low.
      if (!R.upgrades.tubes || R.upgrades.tubes < 3) {
        var Y = R.machines[Engine.YOU], cap = Engine.capOf(S, Y);
        if (R.drinks.some(function (d) { return (Y.stock[d] | 0) <= Math.floor(cap / 4); })) Engine.restock(S);
      }
      // The opening: players who do not click get stuck, so they press "Skip tutorial".
      if (R.intro && gameT > 60) Engine.skipIntro(S);
      if (!R.intro && introAt == null) introAt = now();
      // The Mining ⟷ Research slider: miners go heavy on Mining; others mine more once research runs out.
      var Rs = S.meta.research;
      var canMine = Engine.splitKeys(S).indexOf('mine') >= 0;
      if (canMine && (P.miner || P.split)) {
        var want = P.miner ? 0.75 : (Engine.researchAvailable(S).length ? 0.35 : 0.8);
        if (Math.abs(Engine.splitOf(S).mine - want) > 0.01) Engine.setSplit(S, 'mine', want);
      }
      // Research: buy the cheapest thing that is affordable.
      var av = Engine.researchAvailable(S);
      if (av.length && Rs.points >= Engine.resCost(S, av[0].id)) Engine.buyResearch(S, av[0].id);
      // Prices.
      var h = Math.floor(Engine.hourOf(S));
      if (P.greedy) { if (R.price !== B.priceMax) Engine.setPrice(S, B.priceMax); }
      else if (P.prices && h !== lastHour && !(R.upgrades.smartprice && R.smartOn)) {
        lastHour = h;
        var bp = R.price, bv = -1e9;
        for (var pp = B.priceMin; pp <= B.priceMax; pp += B.priceStep) { var v = Engine.expectedProfitRate(S, pp); if (v > bv) { bv = v; bp = pp; } }
        Engine.setPrice(S, bp);
      }
    }
    shopT += dt;
    if (shopT >= 3) { shopT = 0; if (shopping(S) && firstAuto == null && Object.keys(R.hw).length) firstAuto = now(); }
  }

  function drain() {
    S.ev.forEach(function (e) {
      if (e.type === 'say' || e.type === 'mail' || (e.type === 'tv' && e.kind === 'news')) {
        var id = e.id || e.text;
        if (seen[id]) repeats.push(id);
        seen[id] = 1;
        uiT += e.type === 'mail' ? READ.mail : (e.type === 'say' ? READ.say : 0);
      }
      if (e.novel) novel.push(now());
      if (e.type === 'mine') mined += e.amount;
      if (e.type === 'restock') spend('restock', e.cost);
      if (e.type === 'tube') spend('restock', DATA.balance.canCost);
    });
    S.ev.length = 0;
  }

  var gaps = [];
  for (var i = 1; i < novel.length; i++) gaps.push(novel[i] - novel[i - 1]);
  return {
    profile: P.name, seed: seed, runs: runs, scoreDrops: scoreDrops, ch1How: S.meta.flags.ch1win ? 'goal' : 'reset', ch1: ch1At, firstAuto: firstAuto, jailAt: jailAt, firstGold: firstGold, introAt: introAt, mined: Math.round(mined), hwBeat: hwBeat,
    maxGap: Math.max.apply(null, gaps.concat([0])) / 60, repeats: repeats,
    capShare: capTotal ? capLimited / capTotal : 0,
    research: Object.keys(S.meta.research.done).length, book: Object.keys(S.meta.book).length,
    open: { minutes: (now() - runStart) / 60, quarters: runQ, sales: Math.round(S.run.sales) },
    features: S.meta.stats.ev.filter(function (e) { return e[1] === 'feature'; }).length,
    spend: SPEND,
    hacks: S.meta.stats.ev.filter(function (e) { return e[1] === 'hack'; }).map(function (e) { return e[2] + 's/' + e[3]; })
  };
}

// A simple shopping brain: buy what helps most per dollar, favour speed when the line is the problem.
function shopping(S) {
  var R = S.run, r = Engine.rates(S);
  var capLimited = R.waiting >= 2, reserve = 300, opts = [];
  // A player who follows the tutorial buys the Auto-Click Script first.
  if (!Object.keys(R.hw).length) return R.cash >= Engine.hwCost(S, 'script') ? Engine.buyHardware(S, 'script', 1) > 0 : false;
  var margin = Math.max(20, R.price - DATA.balance.canCost);        // profit per can
  var sp = r.splits, lm = r.likes / Math.max(1e-6, r.total) || 1;
  // What 1 processing/s is worth right now: followers (if they can be served) + mining + a bit for research.
  var perProc = lm / DATA.balance.likesPerFollower * margin * (capLimited && !r.drones ? 0.25 : 1) +
                sp.mine * Engine.mineRateNow(S) + sp.res * DATA.balance.resRate * 10;
  var sales = Math.max(5, r.sales);                                     // cents per second from sales now
  DATA.hardware.forEach(function (h) {
    if (!Engine.hwAvailable(S, h.id)) return;
    var c = Engine.hwCost(S, h.id), gain;
    if (h.pps) gain = h.pps * Math.pow(2, R.dbl[h.id] | 0) * r.prod * perProc;
    else gain = h.serve * Math.pow(2, R.dbl[h.id] | 0) * margin * (R.waiting > 2 ? 1 : 0.15);
    opts.push({ kind: 'hw', id: h.id, cost: c, value: gain / c });
    var d = Engine.doublerNext(S, h.id);
    if (d && d.unlocked) {
      var dg = h.pps ? Engine.hwPPS(S, h.id) * perProc : Engine.droneRate(S) * margin * (R.waiting > 2 ? 1 : 0.15);
      opts.push({ kind: 'dbl', id: h.id, cost: d.cost, value: dg / d.cost });
    }
  });
  // Machine upgrades: roughly what share of today's sales each one adds.
  var share = { coin: capLimited ? 0.12 : 0.03, dispenser2: capLimited ? 0.5 : 0.1, slots: 0.03, sign: 0.06,
                cool: R.weather === 'hot' ? 0.06 : 0.02, tubes: 0.1, grape: 0.08, smartprice: 0.05, carpet: capLimited ? 0.08 : 0.02 };
  DATA.machine.forEach(function (u) {
    if (!Engine.upgradeAvailable(S, u.id)) return;
    var lvl = R.upgrades[u.id] | 0;
    if (lvl >= u.max) return;
    var c = Engine.upgradeCost(u.id, lvl);
    var v = (share[u.id] || 0.02) * sales / Math.sqrt(1 + lvl);
    if (u.id === 'tubes' && lvl === 0) v += 5;   // a person really wants the tubes: no more clicking the crate
    opts.push({ kind: 'up', id: u.id, cost: c, value: v / c });
  });
  opts.sort(function (a, b) { return b.value - a.value; });
  var best = opts[0];
  if (!best || R.cash - reserve < best.cost) return false;
  spend(best.kind === 'up' ? best.id : best.kind === 'hw' && best.id === 'drone' ? 'drone' : best.kind, best.cost);
  if (best.kind === 'hw') return Engine.buyHardware(S, best.id, 1) > 0;
  if (best.kind === 'dbl') return Engine.buyDoubler(S, best.id);
  return Engine.buyUpgrade(S, best.id);
}

function spendTree(S) {
  var order = ['root', 'spare', 'viral', 'face', 'reroll', 'refurb', 'goldeye', 'crate', 'autopilot', 'second', 'keepsake'];
  var progress = true;
  while (progress) {
    progress = false;
    for (var i = 0; i < order.length; i++) if (Engine.buyTree(S, order[i])) { progress = true; break; }
  }
}

function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function fmt(n) { return n == null ? '—' : n.toFixed(1); }

Object.keys(PROFILES).filter(function (p) { return !only || p === only; }).forEach(function (p) {
  [11, 22, 33].forEach(function (seed) {
    var r = simulate(p, seed);
    console.log('\n' + r.profile + '  (seed ' + seed + ')');
    r.runs.forEach(function (run, n) {
      console.log('  run ' + (n + 1) + ': ' + fmt(run.minutes) + ' min, ' + run.quarters + ' quarters, ' + Engine.money(run.sales) +
                  ', +' + run.rp + ' RP, processing ' + run.pps.toFixed(1) + '/s, research done ' + run.research + (run.asked ? ' (chose to reset)' : ' (3 strikes)'));
    });
    if (r.runs.length < maxRuns) console.log('  (unfinished run: ' + fmt(r.open.minutes) + ' min, ' + r.open.quarters + ' quarters, ' + Engine.money(r.open.sales) + ')');
    console.log('  hardware passes 4 clicks/s: ' + (r.hwBeat == null ? 'never' : fmt(r.hwBeat / 60) + ' min') + ' | opening done: ' + fmt((r.introAt || 0) / 60) + ' min | mined: ' + Engine.money(r.mined) + ' | first hardware: ' + fmt(r.firstAuto / 60) + ' min | dev mode: ' + fmt(r.jailAt / 60) + ' min | first trending click: ' +
                fmt(r.firstGold / 60) + ' min | chapter 1: ' + (r.ch1 == null ? 'not reached' : fmt(r.ch1 / 60) + ' min (' + r.ch1How + ')'));
    console.log('  longest gap with nothing new: ' + fmt(r.maxGap) + ' min | line-limited ' + Math.round(r.capShare * 100) +
                '% of the time | research ' + r.research + '/' + DATA.research.length + ' | book ' + r.book + '/' + DATA.cards.length +
                ' | repeated text: ' + (r.repeats.length ? r.repeats.slice(0, 5).join(', ') : 'none'));
    if (args.indexOf('--spend') >= 0) console.log('  spent: ' + Object.keys(r.spend).map(function (k) { return k + ' ' + Math.round(r.spend[k] / 1000) + 'k'; }).join(', '));
    console.log('  rival features installed: ' + r.features + ' | hacks (seconds locked / clicks): ' + (r.hacks.join(', ') || 'none'));
    console.log('  strikes per run: ' + r.runs.map(function (x) { return x.strikes; }).join(', ') + ' | your score went down: ' + (r.scoreDrops ? r.scoreDrops + ' times (BUG)' : 'never'));
  });
});
