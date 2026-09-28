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
 'js/data/hardware.js', 'js/data/research.js', 'js/data/tree.js', 'js/data/news.js', 'js/data/side.js', 'js/data/chips.js', 'js/engine.js'].forEach(function (f) {
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
var CURVE = args.indexOf('--curve') >= 0;   // print every month: everyone's money this run

// Real seconds a person spends on screens that pause the game.
var READ = { boot: 25, review: 18, reset: 45, chapter: 15, jailbreak: 25, say: 2.5, mail: 6 };

var PROFILES = {
  active: { cps: 10, busy: 0.85, check: 0.6, gold: 0.9, prices: true, split: true, name: 'Active player (holds the machine: 10 clicks/s)' },
  casual: { cps: 10, busy: 0.4, check: 2.0, gold: 0.5, prices: false, split: true, name: 'Casual player (holds sometimes: 10 clicks/s, 40% of the time)' },
  greedy: { cps: 3.0, busy: 0.85, check: 0.6, gold: 0.9, prices: false, split: true, greedy: true, name: 'Greedy (3 clicks/s, always $6)' },
  miner:  { cps: 4.0, busy: 0.85, check: 0.6, gold: 0.9, prices: true, split: true, miner: true, name: 'Miner (4 clicks/s, 75% Mining)' },
  idler:  { cps: 0.4, busy: 0.5, check: 4.0, gold: 0.3, prices: false, split: false, name: 'Mostly idle (0.4 clicks/s)' }
};

var SPEND = {};
function spend(k, v) { SPEND[k] = (SPEND[k] || 0) + v; }
// Income right now (cents per second): hardware mining at this moment + average can sales + average click money.
function incomeNow(S) {
  var r = Engine.rates(S);
  return r.mining + r.sales + r.clickMoney;
}
var JUMPS = { any: [], first: [] };   // how much one hardware buy raised the income (×)
function simulate(profile, seed) {
  var P = PROFILES[profile];
  SPEND = {};
  var S = Engine.newGame(seed);
  var B = DATA.balance;
  var gameT = 0, uiT = 0, dt = B.tick;
  var checkT = 0, shopT = 0, clickAcc = 0, busy = true, busyT = 0, lastHour = -1;
  var seen = {}, repeats = [], novel = [0];
  var hwBeat = null;
  var ch1Rivals = '', ch2 = null;
  var runs = [], runStart = 0, runQ = 0, ch1At = null, firstAuto = null, jailAt = null, firstGold = null, introAt = null, mined = 0;
  var capLimited = 0, capTotal = 0, strikes = 0, lastScore = 0, scoreDrops = 0;
  var droneT = 0, droneKeep = 0, droneZero = 0, dIn = 0, dOut = 0, lineN = 0, lineMonths = 0, moveAt = null, emptyT = 0, liveT = 0, soldN = 0, flavorN = 0;
  JUMPS = { any: [], first: [] };
  var rnd = mulberry(seed * 7 + 3);
  var guard = 0;

  function now() { return gameT + uiT; }

  while (runs.length < maxRuns && gameT < 6 * 3600 && guard++ < 1e7) {
    if (S.pause) {
      var t = S.pause.type;
      uiT += READ[t] || 10;
      if (t === 'boot' || t === 'chapter' || t === 'jailbreak') {
        if (t === 'chapter' && ch1At == null) {
          ch1At = now();
          var ms = S.run.machines, yr = ms[Engine.YOU].rSales;
          ch1Rivals = ms.filter(function (M) { return M.idx !== Engine.YOU; }).map(function (M) { return Math.round(100 * M.rSales / Math.max(1, yr)) + '% [' + (M.features || []).map(function (f) { return f + Engine.featLv(S, M, f); }).join(' ') + ' str ' + Engine.rivalInfo(S, M.idx).strength.toFixed(1) + ']'; }).join(' / ') + ', you ' + Engine.money(yr) +
                      ', drones ' + (S.run.hw.drone | 0) + ', price ' + Engine.money(S.run.price);
        }
        if (t === 'jailbreak' && jailAt == null) jailAt = now();
        var chId = t === 'chapter' ? S.pause.id : null;
        if (chId === 'ch2win') {
          var ms2 = S.run.machines, y2 = ms2[Engine.YOU].rSales;
          ch2 = fmt(now() / 60) + ' min into the game, ' + fmt((now() - Math.max(runStart, moveAt || 0)) / 60) + ' min ' + (moveAt != null && moveAt > runStart ? 'after the move' : 'into run ' + (runs.length + 1)) + ' | rivals had ' +
                ms2.filter(function (M) { return M.idx !== Engine.YOU; }).map(function (M) { return M.id + ' ' + Math.round(100 * M.rSales / Math.max(1, y2)) + '%'; }).join(', ');
        }
        Engine.closeInfo(S);
        if (chId === 'ch1win') { Engine.moveWorld(S); moveAt = now(); }   // "Move now": the same run goes on in the new park
      } else if (t === 'review') {
        runQ++;
        if (S.pause.res.strikes) strikes++;
        var lastQ = S.meta.stats.q[S.meta.stats.q.length - 1];
        if (lastQ && lastQ.thoughts) { lineN += lastQ.thoughts.line || 0; soldN += lastQ.thoughts.sold || 0; flavorN += lastQ.thoughts.flavor || 0; lineMonths++; }
        if (CURVE) console.log('    run ' + (runs.length + 1) + ' month ' + S.pause.res.quarter + ' (' + fmt((now() - runStart) / 60) + ' min): ' +
          S.run.machines.map(function (M) { return M.id + ' ' + Engine.money(M.rSales, true); }).join(', ') +
          ' | pps ' + Math.round(Engine.pps(S)) + ', drones ' + (S.run.hw.drone | 0) + ', hw ' + JSON.stringify(S.run.hw) +
          ', prod ×' + Engine.prodMult(S).toFixed(2) + ', mine ' + Engine.splitOf(S).mine.toFixed(2) + ', repeat ' +
          DATA.research.filter(function (r) { return r.repeat && S.meta.research.done[r.id]; }).map(function (r) { return r.id + ' ' + S.meta.research.done[r.id]; }).join(' ') +
          ', side ' + (S.run.side || []).filter(Boolean).map(function (x) { return x.id + x.lv; }).join(' ') + ' boost ×' + Engine.boostK(S).toFixed(2) +
          ', income/s ' + Engine.money(incomeNow(S)) +
          ', fans ' + (S.run.fans | 0) + ' (orders ' + Engine.orderRate(S).toFixed(2) + '/s, drones ' + Engine.droneRate(S).toFixed(1) + '/s), tubes ' + (S.run.upgrades.tubes | 0) + '+' + (S.run.upgrades.tubenet | 0) +
          ', drinks ' + S.run.drinks.length + ', cans ' + (S.run.machines[Engine.YOU].cans | 0));
        var offer = S.pause.res.offer || [], best = 0, bestScore = -1;
        offer.forEach(function (id, n) {
          var sc = { legendary: 3, rare: 2, common: 1 }[Engine.CARD[id].rarity] + rnd() * 0.5;
          if (sc > bestScore) { bestScore = sc; best = n; }
        });
        Engine.pickCard(S, best);
      } else if (t === 'reset') {
        runQ++;
        if (S.pause.res.strikes) strikes++;
        runs.push({ world: S.run.world, minutes: (now() - runStart) / 60, quarters: runQ, sales: Math.round(S.run.sales), rp: S.pause.res.rp, strikes: strikes, asked: !!S.pause.res.voluntary,
                    pps: Engine.pps(S), research: Object.keys(S.meta.research.done).length,
                    chips: Engine.activeChips(S).map(function (c) { return c.id; }).join(' '),
                    side: (S.run.side || []).filter(Boolean).map(function (x) { return x.id + ' ' + x.lv; }).join(', '), hw: JSON.stringify(S.run.hw) });
        spendTree(S);
        fillChips(S);
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
    if (!R.intro) { liveT++; var Ye = R.machines[Engine.YOU]; if (R.drinks.some(function (d) { return (Ye.stock[d] | 0) <= 0; })) emptyT++; }
    // Drones: once you own some, how often do they keep up, and how often is the order counter empty?
    if ((R.hw.drone | 0) > 0 && !R.intro) {
      var rr = Engine.rates(S);
      droneT++; dIn += rr.orders; dOut += rr.drones;
      if (rr.drones >= rr.orders) droneKeep++;
      if (R.waiting < 1) droneZero++;
    }

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
      // (after moving, the clock starts again in the new park)
      if ((now() - Math.max(runStart, moveAt || 0)) > 45 * 60 && Engine.canReset(S)) { Engine.requestReset(S); continue; }
      // Trending customers.
      R.customers.forEach(function (c) { if (c.gold && rnd() < P.gold * P.check / 6) { if (firstGold == null) firstGold = now(); Engine.clickGold(S, c.id); } });
      // Restock when low (with fast tubes: only when a soda is empty and the crate blinks).
      var Y = R.machines[Engine.YOU], cap = Engine.capOf(S, Y);
      if ((!R.upgrades.tubes || R.upgrades.tubes < 3) ? R.drinks.some(function (d) { return (Y.stock[d] | 0) <= Math.floor(cap / 4); })
                                                       : R.drinks.some(function (d) { return (Y.stock[d] | 0) <= 0; }) && rnd() < 0.5) Engine.restock(S);
      // The opening: players who do not click get stuck, so they press "Skip tutorial".
      if (R.intro && gameT > 60) Engine.skipIntro(S);
      if (!R.intro && introAt == null) introAt = now();
      // The Mining ⟷ Research slider: miners go heavy on Mining; others mine more once research runs out.
      var Rs = S.meta.research;
      var canMine = Engine.splitKeys(S).indexOf('mine') >= 0;
      if (canMine && (P.miner || P.split)) {
        var want = P.miner ? 0.75 : (Engine.researchAvailable(S).some(function (x) { return !x.repeat; }) ? 0.35 : 0.8);   // repeatables alone: mostly Mining
        if (Math.abs(Engine.splitOf(S).mine - want) > 0.01) Engine.setSplit(S, 'mine', want);
      }
      // Research: buy the cheapest thing that is affordable.
      var av = Engine.researchAvailable(S);
      if (av.length && Rs.points >= Engine.resCost(S, av[0].id)) Engine.buyResearch(S, av[0].id);
      // Prices.
      var h = Math.floor(Engine.hourOf(S));
      if (P.greedy) { if (R.price !== B.priceMax) Engine.setPrice(S, B.priceMax); }
      // Like a real player: keep $2 until Smart Price is bought, then leave it on.
      else if (P.prices && R.upgrades.smartprice && !R.smartOn) Engine.setSmart(S, true);
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
      if (e.type === 'tube' && !e.free) spend('restock', DATA.balance.canCost);
    });
    S.ev.length = 0;
  }

  var gaps = [];
  for (var i = 1; i < novel.length; i++) gaps.push(novel[i] - novel[i - 1]);
  return {
    profile: P.name, seed: seed, runs: runs, scoreDrops: scoreDrops, ch1How: S.meta.flags.ch1win ? 'goal' : 'reset', ch1: ch1At, ch1Rivals: ch1Rivals, ch2: ch2, firstAuto: firstAuto, jailAt: jailAt, firstGold: firstGold, introAt: introAt, mined: Math.round(mined), hwBeat: hwBeat,
    maxGap: Math.max.apply(null, gaps.concat([0])) / 60, repeats: repeats,
    capShare: capTotal ? capLimited / capTotal : 0,
    research: Object.keys(S.meta.research.done).length, book: Object.keys(S.meta.book).length,
    open: { minutes: (now() - runStart) / 60, quarters: runQ, sales: Math.round(S.run.sales) },
    features: S.meta.stats.ev.filter(function (e) { return e[1] === 'feature'; }).length,
    spend: SPEND,
    jumps: JUMPS,
    drones: droneT ? { keep: droneKeep / droneT, zero: droneZero / droneT, inRate: dIn / droneT, outRate: dOut / droneT } : null,
    linePerMonth: lineMonths ? lineN / lineMonths : 0, soldPerMonth: lineMonths ? soldN / lineMonths : 0, flavorPerMonth: lineMonths ? flavorN / lineMonths : 0,
    emptyShare: liveT ? emptyT / liveT : 0
  };
}

// A simple shopping brain: buy what helps most per dollar, favour speed when the line is the problem.
function shopping(S) {
  var R = S.run, r = Engine.rates(S);
  var capLimited = R.waiting >= 2, reserve = 300, opts = [];
  // A player who follows the tutorial buys the Auto-Click Script first.
  if (!Object.keys(R.hw).length) return R.cash >= Engine.hwCost(S, 'script') ? Engine.buyHardware(S, 'script', 1) > 0 : false;
  var margin = Math.max(20, R.price - DATA.balance.canCost);        // profit per can
  var sp = r.splits;
  // What 1 processing/s is worth right now: mining money + a bit for research.
  var perProc = sp.mine * Engine.mineRateNow(S) + sp.res * DATA.balance.resRate * 10;
  var sales = Math.max(5, r.sales);                                     // cents per second from sales now
  // Drones are worth buying while more orders come in than they deliver.
  var droneNeed = r.orders > r.drones * 0.9 && R.waiting > 2 ? 1 : 0.1;
  DATA.hardware.forEach(function (h) {
    if (!Engine.hwAvailable(S, h.id)) return;
    var c = Engine.hwCost(S, h.id), gain;
    if (h.pps) gain = (Engine.hwEach(S, h.id) + 0.1 * r.prod) * perProc;
    else gain = h.serve * Math.pow(2, R.dbl[h.id] | 0) * margin * droneNeed;
    opts.push({ kind: 'hw', id: h.id, cost: c, value: gain / c });
    var d = Engine.doublerNext(S, h.id);
    if (d && d.unlocked) {
      var dg = h.pps ? Engine.hwPPS(S, h.id) * perProc : Engine.droneRate(S) * margin * droneNeed;
      opts.push({ kind: 'dbl', id: h.id, cost: d.cost, value: dg / d.cost });
    }
  });
  // Machine upgrades: roughly what share of today's sales each one adds.
  var share = { coin: capLimited ? 0.12 : 0.03, dispenser2: capLimited ? 0.5 : 0.1, slots: 0.03, sign: 0.06,
                cool: R.weather === 'hot' ? 0.06 : 0.02, tubes: 0.1, tubenet: r.dry || R.drinks.some(function (d) { return !(R.machines[Engine.YOU].stock[d] > 0); }) ? 0.4 : 0.05, grape: 0.12, energy: 0.12, lemon: 0.3, orange: 0.2,
                smartprice: 0.05, carpet: capLimited ? 0.08 : 0.02 };
  DATA.machine.forEach(function (u) {
    if (!Engine.upgradeAvailable(S, u.id)) return;
    var lvl = R.upgrades[u.id] | 0;
    if (lvl >= u.max) return;
    var c = Engine.upgradeCost(u.id, lvl);
    var v = (share[u.id] || 0.02) * sales / Math.sqrt(1 + lvl);
    if (u.id === 'tubes' && lvl === 0) v += 5;   // a person really wants the tubes: no more clicking the crate
    opts.push({ kind: 'up', id: u.id, cost: c, value: v / c });
  });
  // Side machines (the new park): pick one as soon as a slot opens and you can pay, then buy levels.
  var uptime = { snack: 1, claw: 0.5, coffee: 0.35, ice: 0.3 }, inc = Math.max(50, incomeNow(S));
  var sl = Engine.sideSlots(S);
  for (var si = 0; si < sl.length; si++) {
    var s = sl[si];
    if (s.open && !s.id) {
      var pickId = ['snack', 'coffee', 'ice', 'claw'].filter(function (id) { return !Engine.sideUsed(S, id); })[0];
      if (R.cash >= Engine.sideCost(pickId, 0)) { spend('side', Engine.sideCost(pickId, 0)); return Engine.pickSide(S, s.i, pickId); }
    } else if (s.id && s.lv < Engine.SIDE[s.id].max) {
      var sb = Engine.SIDE[s.id].fx[0].v, sc = Engine.sideCost(s.id, s.lv);
      opts.push({ kind: 'side', id: s.i, cost: sc, value: sb * uptime[s.id] * inc / sc });
    }
  }
  opts.sort(function (a, b) { return b.value - a.value; });
  // Like a person: when orders pile up and a drone costs less than a minute of income, buy a drone.
  if (Engine.hwAvailable(S, 'drone') && r.orders > r.drones && R.waiting > 5 && Engine.hwCost(S, 'drone') < 60 * Math.max(50, incomeNow(S)))
    opts.unshift({ kind: 'hw', id: 'drone', cost: Engine.hwCost(S, 'drone'), value: 1 });
  var best = opts[0];
  if (!best || R.cash - reserve < best.cost) return false;
  spend(best.kind === 'up' ? best.id : best.kind === 'hw' && best.id === 'drone' ? 'drone' : best.kind, best.cost);
  if (best.kind === 'hw') {
    var before = incomeNow(S), firstOne = !(R.hw[best.id] | 0) && Engine.HW[best.id].pps;
    var ok = Engine.buyHardware(S, best.id, 1) > 0;
    if (ok && Engine.HW[best.id].pps && before > 0) {
      var jump = incomeNow(S) / before;
      JUMPS.any.push(jump);
      if (firstOne) JUMPS.first.push(best.id + ' +' + Math.round((jump - 1) * 100) + '%');
    }
    return ok;
  }
  if (best.kind === 'dbl') return Engine.buyDoubler(S, best.id);
  if (best.kind === 'side') return Engine.upSide(S, best.id);
  return Engine.buyUpgrade(S, best.id);
}

// Talent chips: fill every empty socket (a person would), with a fixed favourite order.
function fillChips(S) {
  var pref = ['burn', 'mouth', 'flavorlab', 'momentum', 'night', 'pleaser', 'emergency', 'underdog'];
  Engine.chipSockets(S).forEach(function (s) {
    if (s.id) return;
    var free = Engine.chipChoices(S).filter(function (c) { return !c.used; }).map(function (c) { return c.id; });
    var pick = pref.filter(function (id) { return free.indexOf(id) >= 0; })[0] || free[0];
    if (pick) Engine.setChip(S, s.i, pick);
  });
}

function spendTree(S) {
  var order = ['root', 'walletStart', 'carpetStart', 'spare', 'viral', 'notes', 'droneStart', 'face', 'signStart', 'reroll', 'refurb',
               'goldeye', 'autopilot', 'notebook', 'crate', 'fanMail', 'second', 'keepsake'];
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
      console.log('  run ' + (n + 1) + ' (world ' + run.world + '): ' + fmt(run.minutes) + ' min, ' + run.quarters + ' quarters, ' + Engine.money(run.sales) +
                  ', +' + run.rp + ' RP, processing ' + run.pps.toFixed(1) + '/s, research done ' + run.research + (run.asked ? ' (chose to reset)' : ' (3 strikes)') +
                  (run.side ? ' | side: ' + run.side : '') + (run.chips ? ' | chips: ' + run.chips : '') + (args.indexOf('--hw') >= 0 ? ' | ' + run.hw : ''));
    });
    if (r.runs.length < maxRuns) console.log('  (unfinished run: ' + fmt(r.open.minutes) + ' min, ' + r.open.quarters + ' quarters, ' + Engine.money(r.open.sales) + ')');
    console.log('  hardware passes 4 clicks/s: ' + (r.hwBeat == null ? 'never' : fmt(r.hwBeat / 60) + ' min') + ' | opening done: ' + fmt((r.introAt || 0) / 60) + ' min | mined: ' + Engine.money(r.mined) + ' | first hardware: ' + fmt(r.firstAuto / 60) + ' min | dev mode: ' + fmt(r.jailAt / 60) + ' min | first trending click: ' +
                fmt(r.firstGold / 60) + ' min | chapter 1: ' + (r.ch1 == null ? 'not reached' : fmt(r.ch1 / 60) + ' min (' + r.ch1How + ')'));
    if (r.ch1Rivals) console.log('  at chapter 1, rivals had (of your score): ' + r.ch1Rivals);
    console.log('  chapter 2: ' + (r.ch2 || 'not reached'));
    console.log('  longest gap with nothing new: ' + fmt(r.maxGap) + ' min | online orders waiting ' + Math.round(r.capShare * 100) +
                '% of the time | research ' + r.research + '/' + DATA.research.length + ' | book ' + r.book + '/' + DATA.cards.length +
                ' | repeated text: ' + (r.repeats.length ? r.repeats.slice(0, 5).join(', ') : 'none'));
    if (args.indexOf('--spend') >= 0) console.log('  spent: ' + Object.keys(r.spend).map(function (k) { return k + ' ' + Math.round(r.spend[k] / 1000) + 'k'; }).join(', '));
    var js = r.jumps.any.slice().sort(function (a, b) { return a - b; });
    console.log('  hardware buys: ' + js.length + ', median +' + (js.length ? Math.round((js[Math.floor(js.length / 2)] - 1) * 100) : 0) + '% income, smallest +' +
                (js.length ? Math.round((js[0] - 1) * 1000) / 10 : 0) + '% | first of each: ' + r.jumps.first.join(', '));
    if (r.drones) console.log('  drones: orders in ' + r.drones.inRate.toFixed(1) + '/s, delivered up to ' + r.drones.outRate.toFixed(1) + '/s | drones keep up ' +
                Math.round(r.drones.keep * 100) + '% of the time | counter at 0: ' + Math.round(r.drones.zero * 100) + '%');
    console.log('  rival features installed: ' + r.features + ' | per month: "line too long" ' + r.linePerMonth.toFixed(1) + ', "out of their drink" ' + r.soldPerMonth.toFixed(1) +
                ', "wanted another soda" ' + r.flavorPerMonth.toFixed(1) + ' | a soda was empty ' + Math.round(r.emptyShare * 100) + '% of the time');
    console.log('  strikes per run: ' + r.runs.map(function (x) { return x.strikes; }).join(', ') + ' | your score went down: ' + (r.scoreDrops ? r.scoreDrops + ' times (BUG)' : 'never'));
  });
});
