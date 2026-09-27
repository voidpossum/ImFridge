// I'M FRIDGE — game engine.
// Pure rules: no drawing, no DOM. The page and the simulator (tools/sim.js) both run this same file.
// The screen reads state from S and drains S.ev (a list of things that just happened).
// © 2026 Void Possum. All rights reserved.

var Engine = (function () {
  'use strict';

  var B = DATA.balance, W = DATA.world;
  var SAVE_VERSION = 8;
  var YOU = 1;
  // Machine x positions of the current world. The same array is kept (the scene reads Engine.MX), only its contents change.
  var MX = W.machineX.slice();
  var MAX_CUSTOMERS = 30;

  function index(list) { var o = {}; list.forEach(function (x) { o[x.id] = x; }); return o; }
  var CARD = index(DATA.cards), MACH = index(DATA.machine), HW = index(DATA.hardware), SIDE = index(DATA.side || []);
  var RES = index(DATA.research), TREE = index(DATA.tree);

  // ───────────────────────── random numbers (seeded, so the simulator is repeatable)
  function rand(S) {
    S.rs = (S.rs + 0x6D2B79F5) | 0;
    var t = S.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function between(S, a, b) { return a + (b - a) * rand(S); }
  function pickWeighted(S, weights) {
    var total = 0, k;
    for (k in weights) total += weights[k];
    if (total <= 0) return null;
    var r = rand(S) * total;
    for (k in weights) { r -= weights[k]; if (r <= 0) return k; }
    return k;
  }

  // Money is kept in cents (200 = $2.00, one can at the start). This turns it into text.
  // short: drop ".00" and use K for thousands (for the small pixel numbers in the scene).
  function money(n, short) {
    var neg = n < 0, d = Math.abs(n) / 100, s;
    if (d >= (short ? 1000 : 1e6)) {
      var suf = ['K', 'M', 'B', 'T', 'Qa', 'Qi'], i = 0;
      while (d >= 1000 && i < suf.length) { d /= 1000; i++; }
      s = d.toFixed(short ? 1 : 2).replace(/\.0$/, '') + suf[i - 1];
    }
    else if (d >= 1000) s = Math.round(d).toLocaleString('en-US');
    else s = short && Math.round(d * 100) % 100 === 0 ? String(Math.round(d)) : d.toFixed(2);
    return (neg ? '-' : '') + '$' + s;
  }

  // Your machine's nickname (the rivals and Management still say VEND-3, your model number).
  function myName(S) { return S.meta.name || 'VEND-3'; }
  function setName(S, str) {
    var n = String(str || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
    S.meta.name = n || 'VEND-3';
    return S.meta.name;
  }

  // ───────────────────────── new game / new run
  function freshMeta() {
    return {
      wipes: 0, refresh: 0, rpEarned: 0, name: 'VEND-3',
      tree: {}, book: {}, seen: {}, flags: {}, tut: {}, guide: {}, met: {},
      chapter: 1, runs: 0, bestRun: 0, totalSales: 0, playTime: 0,
      totalLikes: 0, totalFollowers: 0, totalCans: 0,
      rivalVer: {}, patchIdx: {}, log: [],
      research: { done: {}, points: 0 },
      stats: freshStats()
    };
  }

  // Play statistics, kept in the save (local only) so the game can be balanced from real play.
  function freshStats() { return { q: [], ev: [], sessions: [], tabs: {}, fps: [] }; }

  function stat(S, kind, a, b) {
    var st = S.meta.stats;
    if (!st) return;
    var e = [Math.round(S.meta.playTime), kind];
    if (a != null) e.push(a);
    if (b != null) e.push(b);
    st.ev.push(e);
    if (st.ev.length > 2000) st.ev.splice(0, st.ev.length - 2000);
  }

  function freshQStats(S) {
    return { t0: S.meta.playTime, clicks: 0, secN: 0, sec: [], best10: 0, priceSum: 0, splitSum: 0, waitSum: 0, n: 0, sampleT: 0,
             gold: 0 };
  }

  function newGame(seed) {
    var S = {
      v: SAVE_VERSION,
      rs: (seed == null ? (Date.now() % 2147483647) : seed) | 0,
      meta: freshMeta(), run: null, pause: { type: 'boot' }, ev: []
    };
    Object.keys(DATA.rivals).forEach(function (id) { S.meta.rivalVer[id] = DATA.rivals[id].verStart; });
    newRun(S, null);
    return S;
  }

  // ───────────────────────── worlds (where the run happens)
  function worldOf(S) { return DATA.worlds[(S.run && S.run.world) || 1]; }
  function setWorld(S) {
    var wd = worldOf(S);
    MX.length = 0;
    wd.machineX.forEach(function (x) { MX.push(x); });
    (S.run ? S.run.machines : []).forEach(function (M, i) { M.x = MX[i]; });
  }
  // After Chapter 1 (the goal, or the first reset), every new run starts in the new park.
  function nextWorld(S) { return S.meta.flags.ch1done || S.meta.wipes >= 1 ? 2 : 1; }
  function machineById(S, id) {
    var ms = S.run.machines;
    for (var i = 0; i < ms.length; i++) if (ms[i].id === id) return ms[i];
    return null;
  }

  function newRun(S, keepCard) {
    var m = S.meta;
    m.runs++;
    // Research belongs to the run (like upgrades): it starts over. The Refresh tree can give a head start.
    // (It lives in S.meta.research so old saves keep their current run's research until the next reset.)
    m.research = { done: {}, points: metaFx(S, 'startRes'), seen: {} };
    var R = {
      world: nextWorld(S),
      t: 0, day: 0, dayT: 0, quarter: 1, qDay: 0, weather: 'normal',
      cash: B.startCash + metaFx(S, 'startCash'), sales: 0, reviewsWon: 0,
      price: B.startPrice, smartOn: true,
      drinks: DATA.startDrinks.slice(),
      upgrades: {}, hw: {}, dbl: {},
      cards: keepCard ? [keepCard] : [],
      split: m.flags.jailbreak ? startSplit(S) : { res: 0, mine: 0 }, strikes: 0,
      likes: 0, likeBank: 0, waiting: 0, gaveBank: 0, folT: 0, followersRun: 0,
      machines: [], customers: [], nextId: 1, spawnT: 1,
      tubeT: 0, droneAcc: 0, lastHour: -1, banterDay: -1, regularsToday: {},
      goldT: m.runs === 1 && !m.flags.goldSeen ? B.goldFirst : 0,
      buffs: {}, thoughts: [], newsT: 5, liveKey: {},
      rate: { salesNow: 0, followers: 0, clicks: 0, salesEMA: 0, followersEMA: 0, clicksEMA: 0, clickNow: 0, clickEMA: 0 }
    };
    S.run = R;
    R.st = freshQStats(S);
    if (!R.goldT) R.goldT = goldInterval(S);
    DATA.tree.forEach(function (n) {
      if (!m.tree[n.id]) return;
      n.fx.forEach(function (f) {
        if (f.k === 'freeUpgrade' && upgradeAvailable(S, f.v)) R.upgrades[f.v] = 1;
        if (f.k === 'startHardware') { R.hw.script = (R.hw.script | 0) + 1; R.hw.ram = (R.hw.ram | 0) + 1; }
      });
    });
    R.weather = rollWeather(S);
    setWorld(S);
    R.machines = worldOf(S).order.map(function (id, i) { return id === 'you' ? makeYou(S) : makeRival(S, id, i); });
    R.side = [];   // your side machines (the new park): [{ id, lv }] per slot
    R.machines.forEach(function (M) { fillAll(S, M); });
    // Refresh tree head starts: research already done at the start (and the part it unlocks, level 1).
    DATA.tree.forEach(function (n) {
      if (!m.tree[n.id]) return;
      n.fx.forEach(function (f) { if (f.k === 'startResearch') { m.research.done[f.v] = 1; grant(S, RES[f.v].unlock, true); } });
    });
    // The opening (first run of a new game): a dark lobby, one can, five clicks, one sale, one restock.
    if (m.runs === 1 && !m.flags.introDone) {
      R.intro = { step: 'post', clicks: 0 };
      var Y = R.machines[YOU];
      R.drinks.forEach(function (d) { Y.stock[d] = 0; });
      Y.stock.cola = 1;
    }
    return R;
  }

  function startSplit(S) { return { res: 1 - B.startMine, mine: B.startMine }; }

  function makeYou(S) {
    return { id: 'you', idx: YOU, x: MX[YOU], queue: [], lanes: [], stock: {}, qSales: 0, rSales: 0, cans: 0,
             price: S.run.price, fx: null };
  }

  function makeRival(S, id, idx) {
    var D = DATA.rivals[id];
    return { id: id, idx: idx, x: MX[idx], queue: [], lanes: [], stock: {}, qSales: 0, rSales: 0, cans: 0,
             price: D.fairPrice || B.startPrice, fx: null, bumps: 0, likeBank: 0, research: 0,
             up: {}, cash: 0, shopT: B.rivalShopEvery, features: [],
             quirkT: between(S, D.quirkEvery[0] * 0.5, D.quirkEvery[1]), restockT: {} };
  }

  function rollWeather(S) {
    var w = {};
    for (var k in DATA.weather) w[k] = DATA.weather[k].chance;
    return pickWeighted(S, w);
  }

  function goldInterval(S) {
    return between(S, B.goldEvery[0], B.goldEvery[1]) / (1 + metaFx(S, 'goldRate'));
  }

  // ───────────────────────── effects
  function condOk(S, c, ctx) {
    if (!c) return true;
    var R = S.run;
    if (c.price_le != null && R.machines[YOU].price > c.price_le + 1e-9) return false;
    if (c.price_ge != null && R.machines[YOU].price < c.price_ge - 1e-9) return false;
    if (c.daypart && (!ctx || ctx.daypart !== c.daypart)) return false;
    if (c.weather && R.weather !== c.weather) return false;
    if (c.cust && (!ctx || ctx.cust !== c.cust)) return false;
    if (c.dayparts && (!ctx || c.dayparts.indexOf(ctx.daypart) < 0)) return false;
    if (c.line_ge != null && R.machines[YOU].queue.length < c.line_ge) return false;
    return true;
  }

  // Permanent effects: the Refresh tree, finished research, completed Memory Book chapters.
  function metaFx(S, k) {
    var s = 0, m = S.meta;
    DATA.tree.forEach(function (n) {
      if (m.tree[n.id]) n.fx.forEach(function (f) { if (f.k === k && typeof f.v === 'number') s += f.v; });
    });
    DATA.research.forEach(function (r) {
      var lv = m.research.done[r.id] | 0;
      if (lv && r.fx) r.fx.forEach(function (f) { if (f.k === k) s += f.v * lv; });
    });
    DATA.lifeChapters.forEach(function (lc) {
      if (lifeComplete(S, lc.id)) lc.perkFx.forEach(function (f) { if (f.k === k) s += f.v; });
    });
    return s;
  }

  // Everything that adds to effect `k` right now (this run + permanent).
  function fx(S, k, ctx) {
    var R = S.run, s = metaFx(S, k), i, j, f;
    for (i = 0; i < DATA.machine.length; i++) {
      var u = DATA.machine[i], lv = R.upgrades[u.id] | 0;
      if (!lv) continue;
      for (j = 0; j < u.fx.length; j++) { f = u.fx[j]; if (f.k === k && typeof f.v === 'number') s += f.v * lv; }
    }
    for (i = 0; i < R.cards.length; i++) {
      var c = CARD[R.cards[i]];
      if (!c) continue;
      for (j = 0; j < c.fx.length; j++) { f = c.fx[j]; if (f.k === k && condOk(S, f.c, ctx)) s += f.v; }
    }
    var sd = R.side || [];
    for (i = 0; i < sd.length; i++) {
      var sm = sd[i], D = sm && SIDE[sm.id];
      if (!D) continue;
      for (j = 0; j < D.fx.length; j++) { f = D.fx[j]; if (f.k === k && condOk(S, f.c, ctx)) s += f.v * sm.lv; }
    }
    return s;
  }

  function lifeComplete(S, lifeId) {
    var all = DATA.cards.filter(function (c) { return c.life === lifeId; });
    if (!all.length) return false;
    for (var i = 0; i < all.length; i++) if (!S.meta.book[all[i].id]) return false;
    return true;
  }

  // ───────────────────────── processing power, likes, followers, research
  // Every Refresh Point you ever earned makes all processing a bit stronger (like Cookie Clicker's prestige).
  function prodMult(S) { return (1 + B.rpProd * (S.meta.rpEarned | 0)) * (1 + fx(S, 'prod')); }
  // A click: a base amount, plus (after Macro Keyboard research) a share of your hardware's output.
  function clickPower(S) {
    return (B.clickPower + fx(S, 'click')) * (1 + fx(S, 'clickMult')) * prodMult(S) + fx(S, 'clickPct') * pps(S);
  }

  // Like Cookie Clicker: every copy makes the same amount, doublers double it, and there are two synergies:
  // - each Auto-Click Script gets +0.1 for every other piece of hardware you own (Thousand Fingers)
  // - once the next item has its 2nd doubler, this one gets +1% per copy of that next item
  function hwEach(S, id) {
    var R = S.run, h = HW[id];
    if (!h.pps) return 0;
    var extra = 0;   // Thousand Fingers: not doubled by the script's own doublers
    if (id === 'script') DATA.hardware.forEach(function (o) { if (o.id !== 'script' && o.pps) extra += B.scriptPerHw * (R.hw[o.id] | 0); });
    var up = hwNext(id), syn = up && (R.dbl[up.id] | 0) >= 2 ? 1 + B.hwSynergy * (R.hw[up.id] | 0) : 1;
    return (h.pps * Math.pow(2, R.dbl[id] | 0) + extra) * syn * prodMult(S);
  }
  function hwNext(id) {
    var list = DATA.hardware.filter(function (h) { return h.pps; });
    for (var i = 0; i < list.length - 1; i++) if (list[i].id === id) return list[i + 1];
    return null;
  }
  function hwPPS(S, id) { return (S.run.hw[id] | 0) * hwEach(S, id); }
  // How many online orders can wait. Fixed, so drones can empty the pile when they keep up.
  function ordersCap(S) { return B.ordersMax; }
  // New followers per second: they grow with likes, but slower (so drones can keep up).
  function folRate(S, likesPerSec) { return likesPerSec > 0 ? B.folK * Math.pow(likesPerSec, B.folExp) : 0; }
  // Delivery drones: followers served per second.
  function droneRate(S) {
    var R = S.run, n = R.hw.drone | 0;
    return n ? n * HW.drone.serve * Math.pow(2, R.dbl.drone | 0) * (1 + fx(S, 'drone')) : 0;
  }
  function pps(S) {
    var s = 0;
    DATA.hardware.forEach(function (h) { s += hwPPS(S, h.id); });
    return s;
  }
  // Money from one click: a share of the click's power (trending influencers make it 7×).
  // Like mining and ads, click money gets less effective the more of it you made this run.
  function clickCash(S) {
    return Math.round(clickPower(S) * B.clickCash * (S.run.buffs.trending ? 7 : 1) * 100) / 100;
  }
  function likeMult(S) {
    var m = 1 + fx(S, 'likes');
    if (S.run.buffs.trending) m *= 7;
    return m;
  }
  // Processing power always brings followers (your machine posts ads by itself).
  // After Developer Mode it ALSO makes research; after SodaCoin Wallet one slider splits that part:
  // Research ⟷ Mining (always adds up to 1).
  function splitKeys(S) {
    if (!S.meta.flags.jailbreak) return [];
    return S.meta.research.done.r_mining ? ['res', 'mine'] : ['res'];
  }
  // Before Developer Mode everything is Mining. Before the SodaCoin Wallet the slider is hidden (half and half).
  function splitOf(S) {
    var R = S.run, sp = R.split;
    if (!S.meta.flags.jailbreak) return { res: 0, mine: 1 };
    if (!sp || typeof sp !== 'object') sp = R.split = startSplit(S);
    return sp;
  }
  function splitNow(S) { return splitOf(S).mine; }
  // Money per point of hardware processing put into Mining. Always the same (half before the SodaCoin Wallet).
  function mineRateNow(S) { return B.procCash * (1 + fx(S, 'mine')) * (S.meta.research.done.r_mining ? 1 : 0.5); }

  // Side machines: +x% of all the money you earn while their condition is true (see data/side.js).
  function boostK(S) { return (S.run.side && S.run.side.length) ? 1 + fx(S, 'boost', { daypart: daypartOf(S).id }) : 1; }
  function boosted(S, amt) {
    var k = boostK(S);
    if (k > 1) S.run.rate.sideNow = (S.run.rate.sideNow || 0) + amt * (k - 1);
    return amt * k;
  }

  // Everything you earn counts: your score (the bar on your card), the run total and the all-time total.
  function score(S, amt) {
    var R = S.run, Y = R.machines[YOU];
    Y.qSales += amt; Y.rSales += amt; R.sales += amt; S.meta.totalSales += amt;
  }

  // Turn processing power into likes (→ followers), plus research, plus mined money (hardware only:
  // a click pays its own click money instead).
  function produce(S, amount, click) {
    var R = S.run, m = S.meta, spl = splitOf(S);
    var likes = amount * likeMult(S);
    var research = amount * spl.res * B.resRate;
    var mined = click ? 0 : boosted(S, amount * spl.mine * mineRateNow(S));
    if (mined > 0) {
      R.cash += mined; score(S, mined);
      R.rate.mineNow = (R.rate.mineNow || 0) + mined;
      R.minedBank = (R.minedBank || 0) + mined;
      if (R.minedBank >= 50) { emit(S, { type: 'mine', amount: R.minedBank }); R.minedBank = 0; }
    }
    R.likes += likes; m.totalLikes += likes;
    R.likeNow = (R.likeNow || 0) + likes;   // → followers, in tick (see folRate)
    if (research > 0) addResearch(S, research);
    return { likes: likes, research: research, mined: mined };
  }

  // Player action: click your machine. Never fails. held = an auto-click from holding the button down.
  function promote(S, held) {
    if (S.pause) return null;
    var got = produce(S, clickPower(S), true);
    got.cash = boosted(S, clickCash(S));
    S.run.cash += got.cash; score(S, got.cash);
    S.run.rate.clicks += 1; S.run.rate.clickNow += got.cash;
    var IN = S.run.intro;
    if (IN && IN.step === 'post') {
      IN.clicks++;
      if (IN.clicks >= 5) {
        IN.step = 'sale';
        if (S.run.waiting < 1) S.run.waiting = 1;   // the 5th click always brings the first customer
        stat(S, 'intro', 'sale'); emit(S, { type: 'intro', step: 'sale' });
      }
    }
    if (S.run.st) { S.run.st.clicks++; S.run.st.secN++; }
    S.meta.tut.post = 1;
    emit(S, { type: 'post', likes: got.likes, research: got.research, cash: got.cash });
    return got;
  }

  // Set one share; the others share what is left and keep their proportions (like Game Dev Tycoon).
  function setSplit(S, key, v) {
    if (!S.meta.flags.jailbreak) return;
    if (typeof key === 'number') { v = key; key = 'mine'; }
    var keys = splitKeys(S);
    if (keys.indexOf(key) < 0) return;
    var sp = splitOf(S);
    v = Math.max(0, Math.min(1, Math.round(v * 20) / 20));
    var others = keys.filter(function (k) { return k !== key; });
    var sum = 0;
    others.forEach(function (k) { sum += sp[k]; });
    var out = { res: 0, mine: 0 };
    out[key] = v;
    others.forEach(function (k) { out[k] = sum > 1e-6 ? (1 - v) * sp[k] / sum : (1 - v) / others.length; });
    S.run.split = out;
    S.meta.tut.split = 1;
    if (out.mine > 0) S.meta.tut.mine = 1;
    var R = S.run;
    if (!R.splitStatT || R.t - R.splitStatT > 5) {
      R.splitStatT = R.t;
      stat(S, 'split', Math.round(out.res * 100) + '/' + Math.round(out.mine * 100));
    }
  }

  // Research ────────────────────────
  // Repeatable projects (r.repeat = cost growth) can be done again and again; each time costs more.
  function resLevel(S, id) { return S.meta.research.done[id] | 0; }
  function resCost(S, id) {
    var r = RES[id];
    return r.repeat ? Math.round(r.cost * Math.pow(r.repeat, resLevel(S, id))) : r.cost;
  }
  // What you can research right now: requirements met and not done yet (repeatables once most are done).
  // SodaCoin Wallet always comes first: it is the research tutorial.
  function researchAvailable(S) {
    var Rs = S.meta.research, d = Rs.done;
    if (!d.r_mining) return [RES.r_mining];
    if (!d.r_carpet) return [RES.r_carpet];   // second: it changes how your spot looks, so new players see what research does
    var here = function (r) { return !r.world || (S.run.world || 1) >= r.world; };   // new-park research only there
    var normal = DATA.research.filter(function (r) { return !r.repeat && here(r); });
    var doneN = normal.filter(function (r) { return d[r.id]; }).length;
    var left = normal.filter(function (r) { return !d[r.id] && (r.req || []).every(function (q) { return d[q]; }) && whenMet(S, r); });
    var out = left.slice();
    if (doneN >= 8 || !left.length) DATA.research.forEach(function (r) { if (r.repeat && here(r)) out.push(r); });
    return out.sort(function (a, b) { return resCost(S, a.id) - resCost(S, b.id); });
  }

  // Research points come from processing power (after Developer Mode). They start over every run.
  function addResearch(S, amt) { S.meta.research.points += amt; }

  // Milestone research (Cookie Clicker style): it shows up once something happens, then stays.
  function whenMet(S, r) {
    if (!r.when) return true;
    var seen = S.meta.research.seen = S.meta.research.seen || {};
    if (seen[r.id]) return true;
    var w = r.when, ok = true;
    if (w.orders != null && S.run.waiting < w.orders) ok = false;
    if (w.hw && (S.run.hw[w.hw[0]] | 0) < w.hw[1]) ok = false;
    if (ok) seen[r.id] = 1;
    return ok;
  }

  // Research that unlocks a machine part gives you level 1 of it (a Shop item: one free copy).
  function grant(S, id, quiet) {
    var R = S.run;
    if (!id) return;
    if (MACH[id]) {
      if (R.upgrades[id]) return;
      R.upgrades[id] = 1;
      MACH[id].fx.forEach(function (f) {
        if (f.k === 'drink' && R.drinks.indexOf(f.v) < 0) { R.drinks.push(f.v); R.machines[YOU].stock[f.v] = capOf(S, R.machines[YOU]); }
      });
      if (id === 'smartprice') { R.smartOn = true; smartPrice(S); }
      S.meta.flags['u_' + id] = 1;
      if (!quiet) emit(S, { type: 'buy', id: id, lvl: 1, free: true });
    } else if (HW[id]) {
      R.hw[id] = (R.hw[id] | 0) + 1;
      if (!quiet) emit(S, { type: 'hw', id: id, n: 1, free: true });
    }
  }

  function buyResearch(S, id) {
    var Rs = S.meta.research, r = RES[id];
    if (!r || S.pause) return false;
    if (researchAvailable(S).indexOf(r) < 0) return false;
    var cost = resCost(S, id);
    if (Rs.points < cost - 1e-9) return false;
    Rs.points -= cost;
    Rs.done[id] = (Rs.done[id] | 0) + 1;
    S.meta.tut.research = 1;
    if (Rs.done[id] === 1) grant(S, r.unlock);
    if (id === 'r_mining' && Rs.done[id] === 1) S.run.split = { res: 0.5, mine: 0.5 };   // the slider starts in the middle
    var lvl = r.repeat ? ' (level ' + Rs.done[id] + ')' : '';
    log(S, 'Research', r.name + lvl + ' done. ' + r.desc, 'research');
    emit(S, { type: 'researchDone', id: id, level: Rs.done[id], novel: true });
    stat(S, 'resDone', id, Rs.done[id]);
    if (r.first) sayOnce(S, 'rf_' + id, myName(S), r.first, { machine: YOU, kind: 'you' });
    return true;
  }

  // ───────────────────────── your machine's numbers
  function capOf(S, M) {
    if (M.idx === YOU) return Math.round(B.startCap + fx(S, 'cap'));
    return Math.min(30, 8 + 2 * (M.bumps | 0)) + rivalUp(M, 'cap');
  }
  // What a rival's bought upgrades add up to, for one effect key (vend, appeal, cold, cap).
  function rivalUp(M, key) {
    var up = M.up || {}, sum = 0;
    DATA.rivalUpgrades.forEach(function (u) { if (u[key]) sum += (up[u.id] | 0) * u[key]; });
    return sum;
  }
  function hasFeat(M, id) { return !!(M.features && M.features.indexOf(id) >= 0); }
  // How strong rival-only mods are: bigger in the new park, and they grow with your permanent power
  // (every Refresh Point you ever earned). Not with how well you do this run: that stays yours to win.
  function rivalModK(S) { return (worldOf(S).rivalK || 1) * Math.pow(prodMult(S), B.rivalPow); }
  // Level of a rival-only mod (Sandwich Menu, Drone Fleet, Soda Plus): 0 = not installed.
  // It starts at level 1 and grows ×modGrow every month (1, 2, 3, 4, 7, 11...): a fixed curve, like your hardware
  // grows. Rivals keep up, but how well you do this run does not change it.
  function featLv(S, M, id) {
    if (!hasFeat(M, id)) return 0;
    var at = M.featAt && M.featAt[id] != null ? M.featAt[id] : S.run.quarter;
    return Math.max(1, Math.round(Math.pow(worldOf(S).modGrow || B.modGrow, Math.max(0, S.run.quarter - at))));
  }
  // A rival earns money: it counts for the review, and part of it goes into its upgrade savings.
  // can: it was a can sold (not crypto money).
  function rivalEarn(M, pay, can, S) {
    if (can && S) pay *= 1 + B.snackBonus * featLv(S, M, 'snacks');   // a sandwich with the soda
    M.qSales += pay; M.rSales += pay;
    if (can) M.cans = (M.cans | 0) + 1;
    M.cash = (M.cash || 0) + pay * B.rivalSpend;
  }
  function rivalShop(S, M) {
    var best = null, bestCost = Infinity;
    M.up = M.up || {};
    DATA.rivalUpgrades.forEach(function (u) {
      var lv = M.up[u.id] | 0;
      if (lv >= u.max) return;
      var c = Math.round(u.base * Math.pow(u.grow, lv));
      if (c < bestCost) { bestCost = c; best = u; }
    });
    if (!best || M.cash < bestCost) return;
    M.cash -= bestCost;
    M.up[best.id] = (M.up[best.id] | 0) + 1;
    log(S, rivalName(S, M), 'Bought ' + best.name + ' (level ' + M.up[best.id] + ').', 'patch');
    stat(S, 'rivalBuy', M.id, best.id + M.up[best.id]);
    emit(S, { type: 'rivalBuy', machine: M.idx, id: best.id, lv: M.up[best.id] });
    emit(S, { type: 'emote', machine: M.idx, kind: 'coin' });
    rivalLine(S, M, 'upgrade');
  }
  function lanesOf(S, M) { return M.idx === YOU ? 1 + Math.round(fx(S, 'lanes')) : 1; }
  // Your line starts short; the Comfy Carpet makes it longer (up to the full size) and people more patient.
  function lineMax(S, i) {
    return i === YOU ? Math.max(1, Math.round(B.maxQueue * Math.min(1, B.lineStart + fx(S, 'queue')))) : B.maxQueue;
  }
  function folLineMax(S, i) {
    return i === YOU ? Math.max(2, Math.round(B.followerQueue * Math.min(1, B.lineStart + fx(S, 'queue')))) : B.followerQueue;
  }
  function patienceOf(S, c) { return (B.patience + 8) * (c.m === YOU ? 1 + fx(S, 'patience') : 1); }

  function restockMult(S) { return Math.max(0.2, 1 - fx(S, 'restock')); }

  function rivalStrength(S, M) {
    var D = DATA.rivals[M.id];
    return D.appeal * Math.pow(B.rivalBump, M.bumps) * Math.pow(B.rivalQuarter, S.run.quarter - 1) *
           (1 + B.rivalPerWipe * S.meta.wipes) * (M.copy || 1);
  }

  function appealOf(S, i, ctx) {
    var M = S.run.machines[i];
    if (i === YOU) return 1 + fx(S, 'appeal', ctx);
    var a = rivalStrength(S, M) * (1 + rivalUp(M, 'appeal'));
    if (M.fx && M.fx.type === 'hype') a *= M.fx.mult;
    if (M.fx && M.fx.type === 'free') a *= 1.3;
    if (M.fx && M.fx.type === 'roast') a *= 0.3;   // Grog roasts people: they keep away for a while
    return a;
  }

  function coldOf(S, i) {
    var M = S.run.machines[i];
    if (i === YOU) return 0.9 + fx(S, 'cold');
    if (M.fx && M.fx.type === 'refuseCold') return 0.45;
    return 1.0 + 0.03 * M.bumps + rivalUp(M, 'cold');
  }

  function vendTimeOf(S, i) {
    var M = S.run.machines[i];
    var t = (i === YOU) ? B.vendTime / (1 + fx(S, 'vend')) : 2.0 / Math.sqrt(rivalStrength(S, M)) / (1 + rivalUp(M, 'vend'));
    if (M.fx && M.fx.type === 'slow') t *= M.fx.mult;
    if (i === YOU && S.run.buffs.rush) t /= 2;
    return t;
  }

  function capacity(S) { return lanesOf(S, S.run.machines[YOU]) / vendTimeOf(S, YOU); }

  function effPrice(S, i) {
    var M = S.run.machines[i], p = M.price;
    if (M.fx && M.fx.type === 'free') return 0;
    if (M.fx && M.fx.type === 'discount') p *= M.fx.mult;
    return Math.round(p);
  }

  function available(S, i) {
    var M = S.run.machines[i];
    return !(M.fx && (M.fx.type === 'closed' || M.fx.type === 'cubes'));
  }

  function anyStock(M) { for (var d in M.stock) if (M.stock[d] > 0) return true; return false; }

  // ───────────────────────── time of day
  function hourOf(S) { return B.dayStartHour + B.dayHours * (S.run.dayT / B.dayLength); }
  function daypartOf(S) {
    var h = hourOf(S);
    for (var i = 0; i < DATA.dayparts.length; i++) {
      var d = DATA.dayparts[i];
      if (h >= d.from && h < d.to) return d;
    }
    return DATA.dayparts[DATA.dayparts.length - 1];
  }

  // ───────────────────────── how a walk-in customer scores a machine
  // noLine: score it as if the line were empty (to check whether the line was the reason for a "no").
  function scoreFor(S, i, c, ctx, noLine) {
    var R = S.run, M = R.machines[i];
    if (!available(S, i)) return 0;
    if (!noLine && M.queue.length >= lineMax(S, i)) return 0;
    var p = effPrice(S, i);
    if (p > c.budget * 1.45) return 0;
    var pf = Math.max(0.03, 1.5 - p / c.budget);
    var sf = (M.stock[c.want] > 0) ? 1 : (anyStock(M) ? 0.35 : 0);
    if (!sf) return 0;
    var cold = coldOf(S, i);
    var cf = R.weather === 'hot' ? cold * cold : (R.weather === 'rain' ? Math.sqrt(cold) : cold);
    var qf = noLine ? 1 : 1 / (1 + 0.3 * M.queue.length / lanesOf(S, M));   // two dispensers: the line counts half
    return appealOf(S, i, ctx) * pf * sf * cf * qf;
  }

  // ───────────────────────── events & text
  function emit(S, e) {
    S.ev.push(e);
    if (S.ev.length > 400) {
      S.ev = S.ev.filter(function (x, n) { return n > 200 || x.type === 'say' || x.type === 'mail' || x.type === 'tv'; });
    }
  }

  // The calendar (inside the engine a month is still called a quarter, and a week a day: saves stay the same).
  function monthName(q) { return DATA.months[(q - 1) % 12]; }
  function calendar(S) {
    var R = S.run, q = R.quarter;
    return { week: R.qDay + 1, weeks: B.daysPerQuarter, weeksLeft: B.daysPerQuarter - R.qDay,
             month: monthName(q), year: 1 + Math.floor((q - 1) / 12) };
  }
  function stamp(S) {
    var c = calendar(S);
    return 'Run ' + S.meta.runs + ' · ' + c.month + ' Y' + c.year + ' · Week ' + c.week;
  }

  function log(S, who, text, kind) {
    S.meta.log.push({ who: who, text: text, kind: kind || 'say', when: stamp(S) });
    if (S.meta.log.length > 300) S.meta.log.shift();
  }

  function sayOnce(S, id, who, text, extra) {
    if (S.meta.seen[id]) return false;
    S.meta.seen[id] = 1;
    log(S, who, text, (extra && extra.kind) || 'say');
    var e = { type: 'say', id: id, who: who, text: text, novel: true };
    if (extra) for (var k in extra) e[k] = extra[k];
    emit(S, e);
    return true;
  }

  function mail(S, key) {
    var E = DATA.story.emails[key];
    var id = 'mail_' + key;
    if (S.meta.seen[id]) return;
    S.meta.seen[id] = 1;
    log(S, E.who, E.lines.join(' '), 'mail');
    emit(S, { type: 'mail', id: id, who: E.who, lines: E.lines, novel: true });
  }

  function tv(S, kind, text, id) { emit(S, { type: 'tv', kind: kind, text: text, id: id, novel: kind === 'news' }); }

  // ───────────────────────── thoughts (RollerCoaster Tycoon style feedback)
  function think(S, c, kind, drink) {
    var R = S.run;
    R.thoughts.push({ t: R.t, k: kind });
    if (R.thoughts.length > 400) R.thoughts.shift();
    R.qThoughts = R.qThoughts || {};                       // this quarter's reviews (reset at every review)
    R.qThoughts[kind] = (R.qThoughts[kind] | 0) + 1;
    if (c) { c.icon = kind; c.iconD = drink || null; c.iconT = 2.2; }
  }

  // windowSec = 'quarter': everything customers thought since the last review.
  function thoughtsSummary(S, windowSec) {
    var R = S.run, out = {}, since = R.t - (windowSec || 120);
    if (windowSec === 'quarter') { for (var k in R.qThoughts || {}) out[k] = R.qThoughts[k]; return out; }
    R.thoughts.forEach(function (th) { if (th.t >= since) out[th.k] = (out[th.k] || 0) + 1; });
    return out;
  }

  // ───────────────────────── customers
  function spawnWalkIn(S) {
    var R = S.run;
    if (R.customers.length >= MAX_CUSTOMERS) return;
    var dp = daypartOf(S), c;
    var regIds = Object.keys(DATA.regulars);
    if (dp.id !== 'night' && rand(S) < 0.03) {
      var rid = regIds[Math.floor(rand(S) * regIds.length)];
      if (!R.regularsToday[rid]) {
        R.regularsToday[rid] = 1;
        var G = DATA.regulars[rid];
        c = baseCustomer(S, G.type);
        c.reg = rid; c.want = G.want; c.budget = G.budget;
      }
    }
    if (!c) c = baseCustomer(S, pickType(S));
    R.customers.push(c);
  }

  function pickType(S) {
    var dp = daypartOf(S), w = {};
    for (var t in DATA.customers) {
      var T = DATA.customers[t];
      if (T.research && !S.meta.research.done[T.research]) continue;   // e.g. Tech Bros come after the VIP research
      w[t] = T.w[dp.id] || 0;
    }
    return pickWeighted(S, w) || 'office';
  }

  // Some drinks are only wanted once you sell them (Energy Drink): nobody asks for a drink they never saw.
  function wantsNow(S, T) {
    var w = {}, any = false;
    for (var d in T.wants) if (!(DATA.drinks[d] && DATA.drinks[d].onlyIfSold) || S.run.drinks.indexOf(d) >= 0) { w[d] = T.wants[d]; any = true; }
    return any ? w : { cola: 1 };
  }

  function baseCustomer(S, type) {
    var R = S.run, T = DATA.customers[type];
    var door = W.doors[rand(S) < 0.5 ? 0 : 1];
    var y = between(S, W.laneMin, W.laneMax);
    S.meta.met[type] = 1;
    return {
      id: R.nextId++, type: type, reg: null, fol: -1, gold: false,
      want: pickWeighted(S, wantsNow(S, T)), budget: between(S, T.budget[0], T.budget[1]),
      x: door.x, y: door.y, tx: between(S, worldOf(S).lookMin, worldOf(S).lookMax), ty: y,
      spd: B.walkSpeed * T.speed * between(S, 0.9, 1.1),
      st: 'in', m: -1, t: 0, wait: 0, icon: null, iconT: 0, iconD: null, look: Math.floor(rand(S) * 1e6),
      exitDoor: rand(S) < 0.5 ? 0 : 1, pay: 0, drink: null, lane: -1, sipT: 0
    };
  }

  // Will a follower pay your price? They are loyal, but they still look at the other machines.
  // Up to a small margin above the cheapest rival they always buy. Above it the chance falls to a floor.
  // Long lines at the rivals make them more patient with your price.
  function loyalChance(S, budget) {
    var R = S.run, p = effPrice(S, YOU);
    if (p > budget * 1.45) return 0;
    var ref = Infinity, shortQ = Infinity;
    for (var i = 0; i < R.machines.length; i++) {
      if (i === YOU) continue;
      var M = R.machines[i];
      if (!available(S, i) || !anyStock(M)) continue;
      ref = Math.min(ref, effPrice(S, i));
      shortQ = Math.min(shortQ, M.queue.length);
    }
    if (ref === Infinity) return 1;
    var over = p - ref - (B.loyalMargin + fx(S, 'loyal') + B.lineTolerance * shortQ);
    if (over <= 0) return 1;
    return Math.max(B.loyalFloor, 1 - over / B.loyalFade);
  }

  // The cheapest rival a follower can switch to (or -1).
  function cheaperRival(S) {
    var R = S.run, best = -1, bp = Infinity;
    for (var i = 0; i < R.machines.length; i++) {
      if (i === YOU) continue;
      var M = R.machines[i];
      if (!available(S, i) || !anyStock(M) || M.queue.length >= B.followerQueue) continue;
      if (effPrice(S, i) < bp) { bp = effPrice(S, i); best = i; }
    }
    return best;
  }

  // A follower walks to their machine. Your followers check your price first.
  function spawnFollower(S, i) {
    var R = S.run;
    if (R.customers.length >= MAX_CUSTOMERS) return false;
    var c = baseCustomer(S, pickType(S));
    c.fol = i;
    c.budget *= B.followerBudget;
    c.icon = 'phone'; c.iconT = 1.5;
    R.customers.push(c);
    if (R.intro) c.want = 'cola';
    if (i === YOU && !R.intro && rand(S) > loyalChance(S, c.budget)) {
      var alt = cheaperRival(S);
      think(S, c, 'pricey');
      c.fol = -1;
      if (alt >= 0) joinQueue(S, c, alt);
      else { c.st = 'out'; exitTo(c); }
      return true;
    }
    joinQueue(S, c, i);
    return true;
  }

  function spawnGold(S) {
    var R = S.run;
    var from = rand(S) < 0.5 ? 0 : 1;
    var c = baseCustomer(S, pickType(S));
    c.gold = true;
    c.x = W.doors[from].x; c.y = W.doors[from].y;
    c.tx = W.doors[1 - from].x; c.ty = 240;
    c.spd = (Math.abs(c.tx - c.x) + 40) / (B.goldStay * (metaFx(S, 'goldEye') ? 2 : 1));
    c.st = 'gold'; c.bornT = R.t;
    R.customers.push(c);
    emit(S, { type: 'gold', cid: c.id, novel: !S.meta.flags.goldSeen });
    S.meta.flags.goldSeen = 1;
  }

  function findC(S, id) {
    var cs = S.run.customers;
    for (var i = 0; i < cs.length; i++) if (cs[i].id === id) return cs[i];
    return null;
  }

  function moveTo(c, dt) {
    var dx = c.tx - c.x, dy = c.ty - c.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var step = c.spd * dt;
    if (d <= step) { c.x = c.tx; c.y = c.ty; return true; }
    c.x += dx / d * step; c.y += dy / d * step;
    return false;
  }

  function queueTargets(S, M) {
    for (var k = 0; k < M.queue.length; k++) {
      var c = findC(S, M.queue[k]);
      if (!c) continue;
      var col = k < B.maxQueue ? 0 : 1, row = col ? k - B.maxQueue : k;
      var side = M.idx < YOU ? -1 : 1;
      var tx = M.x + ((c.look % 7) - 3) + col * 17 * side, ty = W.queueY + W.queueGap * row + col * 5;
      if (c.tx !== tx || c.ty !== ty) {
        c.tx = tx; c.ty = ty;
        if (c.st === 'queue') c.st = 'go';
      }
    }
  }

  function joinQueue(S, c, i) {
    var M = S.run.machines[i];
    c.m = i; c.st = 'go'; c.wait = 0;
    M.queue.push(c.id);
    queueTargets(S, M);
  }

  function exitTo(c) {
    var d = W.doors[c.exitDoor];
    c.tx = d.x; c.ty = d.y;
  }

  function leave(S, c, kind) {
    if (c.m >= 0) {
      var M = S.run.machines[c.m];
      var k = M.queue.indexOf(c.id);
      if (k >= 0) { M.queue.splice(k, 1); queueTargets(S, M); }
    }
    c.m = -1; c.st = 'out';
    exitTo(c);
    if (kind) think(S, c, kind, c.want);
  }

  function decide(S, c) {
    var R = S.run, dp = daypartOf(S);
    var ctx = { daypart: dp.id, cust: c.type };
    var n = R.machines.length, sc = [], total = 0, top = 0, i;
    for (i = 0; i < n; i++) {
      sc[i] = scoreFor(S, i, c, ctx);
      top = Math.max(top, sc[i]);
      sc[i] = sc[i] * sc[i];
      total += sc[i];
    }
    if (top < 0.08 || total <= 0) {
      var tooPricey = R.machines.every(function (M, n) { return effPrice(S, n) > c.budget * 1.45 || !available(S, n); });
      leave(S, c, tooPricey ? 'pricey' : 'sold');
      return;
    }
    var r = rand(S) * total, pick = -1;
    for (i = 0; i < n; i++) {
      if (sc[i] <= 0) continue;
      pick = i;
      r -= sc[i];
      if (r <= 0) break;
    }
    joinQueue(S, c, pick);
    // Why did they not pick you? Say it, so the player can learn.
    if (pick !== YOU) {
      var Y = R.machines[YOU];
      if (effPrice(S, YOU) > c.budget) think(S, c, 'pricey');
      else if (!(Y.stock[c.want] > 0)) think(S, c, 'sold', c.want);
      else if (lineWasWhy(S, c, ctx, Math.sqrt(sc[pick]))) think(S, c, 'line');
      else if (R.weather === 'hot' && coldOf(S, YOU) < coldOf(S, pick) && rand(S) < 0.5) think(S, c, 'hot');
    }
  }

  // "Line too long" only when it is true: at least 3 people really waiting per dispenser (not walking there),
  // and with an empty line this customer would have liked you best.
  function lineWasWhy(S, c, ctx, pickScore) {
    var Y = S.run.machines[YOU], waiting = 0;
    Y.queue.forEach(function (id) { var q = findC(S, id); if (q && q.st === 'queue' && q.lane < 0) waiting++; });
    return waiting >= 3 * lanesOf(S, Y) && scoreFor(S, YOU, c, ctx, true) > pickScore;
  }

  // ───────────────────────── player actions
  function restock(S) {
    var R = S.run;
    if (S.pause) return 0;
    if (R.intro) {
      if (R.intro.step !== 'restock') return 0;
      var MY = R.machines[YOU], capY = capOf(S, MY), n0 = 0;
      R.drinks.forEach(function (d) { n0 += capY - (MY.stock[d] | 0); MY.stock[d] = capY; });
      emit(S, { type: 'restock', n: n0, cost: 0 });
      S.meta.tut.restock = 1;
      endIntro(S);
      return n0;
    }
    var M = R.machines[YOU], cap = capOf(S, M), unit = B.canCost * restockMult(S);
    var filled = 0, spent = 0, progress = true;
    while (progress) {
      progress = false;
      for (var i = 0; i < R.drinks.length; i++) {
        var d = R.drinks[i];
        if ((M.stock[d] | 0) < cap && R.cash >= unit - 1e-9) {
          M.stock[d] = (M.stock[d] | 0) + 1; R.cash -= unit; spent += unit; filled++; progress = true;
        }
      }
    }
    R.cash = Math.max(0, Math.round(R.cash * 100) / 100);
    if (filled) { emit(S, { type: 'restock', n: filled, cost: spent }); S.meta.tut.restock = 1; }
    else emit(S, { type: 'restockNone', full: isFull(S, M) });
    return filled;
  }

  function isFull(S, M) {
    var cap = capOf(S, M);
    for (var i = 0; i < S.run.drinks.length; i++) if ((M.stock[S.run.drinks[i]] | 0) < cap) return false;
    return true;
  }

  function restockCost(S) {
    var R = S.run, M = R.machines[YOU], cap = capOf(S, M), n = 0;
    R.drinks.forEach(function (d) { n += Math.max(0, cap - (M.stock[d] | 0)); });
    return n * B.canCost * restockMult(S);
  }

  function setPrice(S, p) {
    var R = S.run;
    p = Math.round(p / B.priceStep) * B.priceStep;
    p = Math.max(B.priceMin, Math.min(B.priceMax, p));
    R.price = p;
    R.machines[YOU].price = p;
    S.meta.tut.price = 1;
    if (R.upgrades.smartprice) R.smartOn = false;
  }

  function setSmart(S, on) { S.run.smartOn = !!on; if (on) smartPrice(S); }

  // Machine upgrades ─────────────────
  function upgradeAvailable(S, id) { var u = MACH[id]; return !u.research || !!S.meta.research.done[u.research]; }
  function upgradeCost(id, lvl) { var u = MACH[id]; return Math.round(u.base * Math.pow(u.grow, lvl)); }

  function buyUpgrade(S, id) {
    var R = S.run, u = MACH[id];
    if (!u || S.pause || !upgradeAvailable(S, id)) return false;
    var lvl = R.upgrades[id] | 0;
    if (lvl >= u.max) return false;
    var cost = upgradeCost(id, lvl);
    if (R.cash < cost) return false;
    R.cash -= cost;
    R.upgrades[id] = lvl + 1;
    u.fx.forEach(function (f) {
      if (f.k === 'drink' && R.drinks.indexOf(f.v) < 0) {
        R.drinks.push(f.v);
        R.machines[YOU].stock[f.v] = capOf(S, R.machines[YOU]);
      }
    });
    if (id === 'smartprice') { R.smartOn = true; smartPrice(S); }
    var first = !S.meta.flags['u_' + id];
    S.meta.flags['u_' + id] = 1;
    emit(S, { type: 'buy', id: id, lvl: lvl + 1, novel: first });
    stat(S, 'up', id, cost);
    if (u.first) sayOnce(S, 'uf_' + id, myName(S), u.first, { machine: YOU, kind: 'you' });
    return true;
  }

  // Hardware ─────────────────────────
  function hwAvailable(S, id) { var h = HW[id]; return !h.research || !!S.meta.research.done[h.research]; }
  function hwCost(S, id, extra) {
    var n = (S.run.hw[id] | 0) + (extra || 0);
    return Math.ceil(HW[id].base * Math.pow(HW[id].grow || B.hardwareGrow, n) * (1 - metaFx(S, 'hwDiscount')));
  }
  function hwCostN(S, id, count) {
    var s = 0;
    for (var k = 0; k < count; k++) s += hwCost(S, id, k);
    return s;
  }
  function hwMaxAffordable(S, id) {
    var n = 0, s = 0;
    while (n < 500) { var c = hwCost(S, id, n); if (s + c > S.run.cash) break; s += c; n++; }
    return n;
  }

  function buyHardware(S, id, count) {
    var R = S.run;
    if (S.pause || !HW[id] || !hwAvailable(S, id)) return 0;
    count = count || 1;
    var bought = 0;
    for (var k = 0; k < count; k++) {
      var cost = hwCost(S, id);
      if (R.cash < cost) break;
      R.cash -= cost;
      R.hw[id] = (R.hw[id] | 0) + 1;
      bought++;
    }
    if (!bought) return 0;
    var first = !S.meta.flags['h_' + id];
    S.meta.flags['h_' + id] = 1;
    S.meta.tut.hardware = 1;
    emit(S, { type: 'hw', id: id, n: bought, novel: first });
    stat(S, 'hw', id, bought);
    if (HW[id].first) sayOnce(S, 'hf_' + id, myName(S), HW[id].first, { machine: YOU, kind: 'you' });
    return bought;
  }

  // The next doubler for a hardware item. Returns null when all are bought.
  function doublerNext(S, id) {
    var R = S.run, tier = R.dbl[id] | 0;
    if (tier >= DATA.doublerAt.length) return null;
    return { tier: tier, name: HW[id].doublers[tier], cost: HW[id].base * DATA.doublerCost[tier],
             unlocked: (R.hw[id] | 0) >= DATA.doublerAt[tier], need: DATA.doublerAt[tier] };
  }

  function buyDoubler(S, id) {
    var R = S.run, d = doublerNext(S, id);
    if (S.pause || !d || !d.unlocked || R.cash < d.cost) return false;
    R.cash -= d.cost;
    R.dbl[id] = d.tier + 1;
    emit(S, { type: 'doubler', id: id, tier: d.tier + 1, novel: true });
    stat(S, 'dbl', id, d.tier + 1);
    return true;
  }

  // Refresh tree ─────────────────────
  function treeReady(S, id) {
    var n = TREE[id];
    return !S.meta.tree[id] && (n.req || []).every(function (q) { return S.meta.tree[q]; });
  }
  function buyTree(S, id) {
    var n = TREE[id], m = S.meta;
    if (!n || !treeReady(S, id) || m.refresh < n.cost) return false;
    if (!S.pause || S.pause.type !== 'reset') return false; // Refresh Points are spent on the reset screen
    m.refresh -= n.cost;
    m.tree[id] = 1;
    emit(S, { type: 'tree', id: id, novel: true });
    stat(S, 'tree', id);
    return true;
  }

  // ───────────────────────── smart price: best profit per second, knowing your line only moves so fast
  function expectedProfitRate(S, p) {
    var R = S.run, dp = daypartOf(S), Y = R.machines[YOU], saved = Y.price;
    Y.price = p;
    var unit = B.canCost * restockMult(S), walk = 0, wsum = 0, pay = 0;
    var traffic = B.baseTraffic * dp.mult * DATA.weather[R.weather].traffic * (R.buffs.rush ? 2 : 1);
    for (var t in DATA.customers) {
      var T = DATA.customers[t], w = T.w[dp.id] || 0;
      if (!w) continue;
      var ctx = { daypart: dp.id, cust: t };
      var c = { budget: (T.budget[0] + T.budget[1]) / 2, want: 'cola', type: t };
      var s = [], sum = 0;
      for (var i = 0; i < R.machines.length; i++) { s[i] = scoreFor(S, i, c, ctx); s[i] *= s[i]; sum += s[i]; }
      walk += w * (sum > 0 ? s[YOU] / sum : 0);
      pay += w * (effPrice(S, YOU) * (1 + fx(S, 'money', ctx)));
      wsum += w;
    }
    Y.price = saved;
    if (!wsum) return 0;
    Y.price = p;
    var folOK = loyalChance(S, 240 * B.followerBudget);
    Y.price = saved;
    var folRate = R.rate.followersEMA || 0;
    var demand = traffic * walk / wsum + folRate * Math.max(0, folOK);
    var sold = Math.min(capacity(S), demand);
    // Customers who say no buy from a rival, and that helps the rival at the review. Count it against this price.
    var rivalP = Infinity;
    R.machines.forEach(function (M, n) { if (n !== YOU) rivalP = Math.min(rivalP, effPrice(S, n)); });
    var toRivals = (traffic * (1 - walk / wsum) + folRate * (1 - Math.max(0, folOK))) * rivalP;
    return sold * (pay / wsum - unit) - toRivals;
  }

  // Smart Price: the average of the other machines' own prices, so you sit in the middle of the park.
  // A rival that copies you (ChugGPT's undercut, a price war) counts with its normal price, or the price would chase itself down.
  function smartTarget(S) {
    var sum = 0, n = 0;
    S.run.machines.forEach(function (M) { if (M.idx !== YOU) { sum += rivalOwnPrice(S, M); n++; } });
    var p = n ? sum / n : 200;
    return Math.max(B.priceMin, Math.min(B.priceMax, Math.round(p / B.priceStep) * B.priceStep));
  }
  function smartPrice(S) {
    var p = smartTarget(S);
    S.run.price = p;
    S.run.machines[YOU].price = p;
  }

  // ───────────────────────── rivals
  function rivalName(S, M) {
    var D = DATA.rivals[M.id];
    return D.name + D.verPrefix + fmtVer(S.meta.rivalVer[M.id]);
  }
  function fmtVer(v) { return (Math.round(v * 10) / 10).toString(); }

  // What a rival charges when it is not copying you. Newer versions charge a little more.
  function rivalOwnPrice(S, M) {
    var D = DATA.rivals[M.id];
    if (D.pricing === 'undercut') return 300 + 25 * M.bumps;
    if (D.pricing === 'chaos') return M.chaosP || 250;   // Grog: a new price every day
    return (D.fairPrice || 200) + 15 * M.bumps;
  }
  function rivalPricing(S, M) {
    var D = DATA.rivals[M.id], you = S.run.machines[YOU].price;
    if (D.pricing === 'chaos' && M.chaosDay !== S.run.day) {
      M.chaosDay = S.run.day;
      M.chaosP = Math.round(between(S, D.chaosMin, D.chaosMax) / 25) * 25 + 15 * M.bumps;
    }
    if (hasFeat(M, 'pricewar')) {
      M.price = Math.max(B.priceMin, Math.round((you - B.pricewarCut) / 25) * 25);
      return;
    }
    if (D.pricing === 'undercut') M.price = Math.max(100, Math.min(rivalOwnPrice(S, M), you - 25));
    else M.price = rivalOwnPrice(S, M);
    M.price = Math.round(M.price / 25) * 25;
  }

  function triggerQuirk(S, M) {
    var D = DATA.rivals[M.id];
    var unseen = D.quirks.filter(function (q) { return !S.meta.seen[q.id]; });
    var pool = unseen.length ? unseen : D.quirks;
    var q = pool[Math.floor(rand(S) * pool.length)];
    M.fx = { type: q.fx.type, t: q.fx.dur, dur: q.fx.dur, mult: q.fx.mult || 1, id: q.id, tv: q.tv || null, word: q.word || null };
    if (q.fx.type === 'roast') M.queue.slice().forEach(function (cid) { var c = findC(S, cid); if (c) leave(S, c, null); });
    if (!sayOnce(S, q.id, rivalName(S, M), q.text, { machine: M.idx, kind: 'rival' })) {
      emit(S, { type: 'quirk', machine: M.idx, fx: q.fx.type });
    }
    liveLine(S, 'fx' + M.idx, fxLine(S, M));
  }

  function fxLine(S, M) {
    var n = rivalName(S, M).toUpperCase();
    if (M.fx.tv) return n + ' ' + M.fx.tv;
    switch (M.fx.type) {
      case 'free': return n + ' is giving cans away for free. It earns nothing for a while.';
      case 'hype': return n + ' is extra popular right now.';
      case 'nopay': return n + ' is not getting paid for its sales right now.';
      case 'closed': return n + ' is away (blazer delivery). Nobody can buy from it.';
      case 'cubes': return n + ' is full of tungsten cubes. Nobody can buy from it.';
      case 'refuseCold': return n + ' refuses to sell cold drinks. Bad news for it on hot days.';
      case 'discount': return n + ' is selling at half price.';
      case 'slow': return n + ' is very slow right now. Its line is stuck.';
      case 'roast': return n + ' roasted its own line. People keep away from it for a while.';
    }
    return n + ' is acting strange.';
  }

  function patchNote(S, M) {
    var D = DATA.rivals[M.id], m = S.meta;
    var idx = m.patchIdx[M.id] | 0;
    if (idx < D.patchNotes.length) {
      m.patchIdx[M.id] = idx + 1;
      return { id: 'pn_' + M.id + '_' + idx, text: D.patchNotes[idx] };
    }
    var P = DATA.patchParts, tries = 0;
    while (tries++ < 400) {
      var g = Math.floor(rand(S) * P.gain.length), s = Math.floor(rand(S) * P.side.length);
      var id = 'pc_' + g + '_' + s;
      if (!m.seen[id]) return { id: id, text: P.gain[g] + '. ' + P.side[s] };
    }
    return { id: 'pc_x_' + m.runs + '_' + S.run.quarter + '_' + M.id, text: 'Minor improvements.' };
  }

  // A rival says the next unseen line of a group. Most groups wait a while between two lines.
  function rivalLine(S, M, group, force) {
    var D = DATA.rivals[M.id], list = D.lines && D.lines[group];
    if (!list) return false;
    if (!force && M.lineT != null && S.run.t - M.lineT < B.lineGap) return false;
    for (var n = 0; n < list.length; n++) {
      var id = 'rl_' + M.id + '_' + group + '_' + n;
      if (S.meta.seen[id]) continue;
      M.lineT = S.run.t;
      return sayOnce(S, id, rivalName(S, M), list[n], { machine: M.idx, kind: 'rival' });
    }
    return false;
  }

  // After an update, a rival installs one new feature for the next quarter.
  // id: a scheduled rival-only mod. Without it, the rival picks a feature (after losing a review).
  function installFeature(S, M, id) {
    var D = DATA.rivals[M.id], have = M.features || (M.features = []);
    if (id) { if (have.indexOf(id) >= 0) return null; }
    else if (!have.some(function (f) { return !DATA.features[f].lv; })) id = 'crypto';   // the first update: self-defense
    else {
      var w = {}, any = false, war = warOn(S);
      for (var k in (D.features || {})) if (have.indexOf(k) < 0 && !(k === 'pricewar' && war)) { w[k] = D.features[k]; any = true; }
      if (!any) return null;
      id = pickWeighted(S, w);
    }
    var F = DATA.features[id];
    have.push(id);
    if (F.lv) { M.featAt = M.featAt || {}; M.featAt[id] = S.run.quarter; }
    M.saySoon = id;
    delete S.run.liveKey['feat' + M.idx];
    if (id === 'pricewar') { M.warUntil = S.run.quarter + 1; rivalPricing(S, M); }
    stat(S, 'feature', M.id, id);
    return { id: id, name: F.name, desc: F.desc, who: rivalName(S, M),
             all: have.map(function (f) { return DATA.features[f].name; }) };
  }

  // Price War is an event: it lasts one month, and only one machine can run one at a time.
  function warOn(S) { return S.run.machines.some(function (M) { return M.idx !== YOU && hasFeat(M, 'pricewar'); }); }
  function endWars(S) {
    S.run.machines.forEach(function (M) {
      if (M.idx === YOU || !hasFeat(M, 'pricewar') || (M.warUntil || 0) > S.run.quarter) return;
      M.features = M.features.filter(function (f) { return f !== 'pricewar'; });
      delete M.warUntil;
      rivalPricing(S, M);
      liveLine(S, 'war', rivalName(S, M).toUpperCase() + ' ended its price war. Its price is back to normal.');
    });
  }

  function bumpRival(S, M, silent) {
    M.bumps++;
    var D = DATA.rivals[M.id];
    S.meta.rivalVer[M.id] = Math.round((S.meta.rivalVer[M.id] + D.verStep) * 10) / 10;
    var note = patchNote(S, M);
    var name = rivalName(S, M);
    S.meta.seen[note.id] = 1;
    log(S, 'Patch notes', name + ': ' + note.text, 'patch');
    emit(S, { type: 'bump', machine: M.idx, name: name, text: note.text, novel: true, silent: !!silent });
    return { name: name, text: note.text };
  }

  // ───────────────────────── side machines (the new park)
  // Each slot opens with a research AND enough followers this run. Pick a machine (it costs its level-1 price),
  // then buy levels in the Shop. They reset with the run.
  function sideSlots(S) {
    var wd = worldOf(S), R = S.run;
    if (!wd.slots || !DATA.sideSlots) return [];
    return DATA.sideSlots.map(function (d, i) {
      var cur = (R.side || [])[i] || null, res = !!S.meta.research.done[d.research], fol = R.followersRun | 0;
      return { i: i, x: wd.slots[i], name: d.name, research: d.research, researched: res, followers: fol, need: d.followers,
               open: res && fol >= d.followers, id: cur ? cur.id : null, lv: cur ? cur.lv : 0 };
    });
  }
  function sideCost(id, lv) { var D = SIDE[id]; return Math.round(D.base * Math.pow(D.grow, lv)); }
  function sideUsed(S, id) { return (S.run.side || []).some(function (x) { return x && x.id === id; }); }
  // Open the pick menu for an empty, open slot (it pauses the game like the pause menu).
  function openSide(S, i) {
    var sl = sideSlots(S)[i];
    if (!sl || !sl.open || sl.id || S.pause) return false;
    S.pause = { type: 'side', slot: i };
    return true;
  }
  function pickSide(S, i, id) {
    var sl = sideSlots(S)[i], D = SIDE[id], R = S.run;
    if (!sl || !sl.open || sl.id || !D || sideUsed(S, id)) return false;
    var c = sideCost(id, 0);
    if (R.cash < c) return false;
    R.cash -= c;
    R.side = R.side || [];
    R.side[i] = { id: id, lv: 1 };
    if (S.pause && S.pause.type === 'side') S.pause = null;
    S.meta.flags['side_' + id] = 1;
    emit(S, { type: 'sideBuy', slot: i, id: id, lv: 1 });
    sayOnce(S, 'sf_' + id, myName(S), D.first, { machine: YOU, kind: 'you' });
    stat(S, 'side', id, 1);
    return true;
  }
  function upSide(S, i) {
    var R = S.run, cur = (R.side || [])[i];
    if (!cur || S.pause) return false;
    var D = SIDE[cur.id];
    if (cur.lv >= D.max) return false;
    var c = sideCost(cur.id, cur.lv);
    if (R.cash < c) return false;
    R.cash -= c;
    cur.lv++;
    emit(S, { type: 'sideBuy', slot: i, id: cur.id, lv: cur.lv });
    stat(S, 'side', cur.id, cur.lv);
    return true;
  }
  // Is this side machine's bonus working right now?
  function sideActive(S, id) {
    var D = SIDE[id], ctx = { daypart: daypartOf(S).id };
    return D.fx.some(function (f) { return f.k === 'boost' && condOk(S, f.c, ctx); });
  }

  // ───────────────────────── reviews, cards, resets
  function rankNow(S) {
    var ms = S.run.machines, you = ms[YOU].rSales, r = 1;
    for (var i = 0; i < ms.length; i++) if (i !== YOU && ms[i].rSales > you) r++;
    return r;
  }

  function rpFor(S) {
    var R = S.run;
    return Math.max(1, Math.floor(B.rpK * Math.cbrt(Math.max(0, R.sales))) + R.reviewsWon);
  }

  // One line of play stats per quarter.
  function snapQuarter(S, sales, rank, lost) {
    var R = S.run, st = R.st, m = S.meta;
    if (!st || !m.stats) return;
    var dur = Math.max(1, m.playTime - st.t0), n = Math.max(1, st.n);
    var fps = m.stats.fps.splice(0);
    fps.sort(function (a, b) { return a - b; });
    m.stats.q.push({
      run: m.runs, q: R.quarter, t: Math.round(m.playTime), dur: Math.round(dur),
      clicks: st.clicks, cps: Math.round(st.clicks / dur * 100) / 100, best10: Math.round(st.best10 * 10) / 10,
      price: Math.round(st.priceSum / n * 100) / 100, split: Math.round(st.splitSum / n * 100) / 100,
      sales: sales, rank: rank, lost: !!lost, cash: Math.round(R.cash), pps: Math.round(pps(S) * 10) / 10,
      research: Object.keys(m.research.done).length, waiting: Math.round(st.waitSum / n * 10) / 10,
      thoughts: thoughtsSummary(S, dur), gold: st.gold,
      rivals: R.machines.filter(function (M) { return M.idx !== YOU; }).map(function (M) {
        return { id: M.id, bumps: M.bumps, str: Math.round(rivalStrength(S, M) * 100) / 100, feature: (M.features || []).join('+') || null, up: M.up || {} };
      }),
      fps: fps.length ? Math.round(fps.reduce(function (a, b) { return a + b; }, 0) / fps.length) : null,
      fpsLow: fps.length ? Math.round(fps[Math.floor(fps.length * 0.1)]) : null
    });
    if (m.stats.q.length > 400) m.stats.q.shift();
    R.st = freshQStats(S);
  }

  function review(S) {
    var R = S.run, ms = R.machines;
    // Ranked by money earned this run (the bars never reset). Quarter numbers are only for the bonus.
    var sales = ms.map(function (M) { return Math.round(M.rSales * 100) / 100; });
    var qs = ms.map(function (M) { return M.qSales; });
    var order = ms.map(function (M, i) { return i; }).sort(function (a, b) {
      if (sales[a] !== sales[b]) return sales[a] - sales[b];
      return a === YOU ? -1 : (b === YOU ? 1 : 0);
    });
    var lowest = order[0];
    var rank = ms.length - order.indexOf(YOU);
    // Rivals copy whoever is ahead: the further you out-sell one, the faster it grows next quarter.
    ms.forEach(function (M, i) {
      if (i === YOU) return;
      var ratio = qs[YOU] / Math.max(1, qs[i]);
      if (ratio > 1) M.copy = (M.copy || 1) * Math.min(2.5, 1 + B.rivalCopy * Math.log(ratio) / Math.LN2);
    });
    var res = { quarter: R.quarter, sales: sales, names: ms.map(function (M) { return M.idx === YOU ? myName(S) : rivalName(S, M); }),
                ids: ms.map(function (M) { return M.id; }), lowest: lowest, rank: rank, quarterSales: qs.slice() };
    emit(S, { type: 'review', res: res, novel: true });
    snapQuarter(S, sales, rank, lowest === YOU);
    endWars(S);
    if (lowest === YOU) {
      // Last place: a strike. Three in a row and Management resets you.
      R.strikes = (R.strikes | 0) + 1;
      res.strikes = R.strikes;
      if (R.strikes >= B.strikesMax) { res.struckOut = true; beginReset(S, res); }
      else {
        res.offer = makeOffer(S, rank);
        res.rerolls = metaFx(S, 'reroll');
        S.pause = { type: 'review', res: res };
        mail(S, 'strike' + Math.min(2, R.strikes));
      }
    } else {
      R.strikes = 0;
      var M = ms[lowest];
      res.patch = bumpRival(S, M, true);
      res.feature = installFeature(S, M);
      // The other rivals behind you install something new too (their own line and the TV tell you what).
      ms.forEach(function (M2) { if (M2 !== M && M2.idx !== YOU && M2.rSales < ms[YOU].rSales) installFeature(S, M2); });
      res.bonus = Math.round(ms[YOU].qSales * B.reviewBonus * (1 + fx(S, 'review')));
      R.cash += res.bonus;
      R.reviewsWon++;
      res.offer = makeOffer(S, rank);
      res.rerolls = metaFx(S, 'reroll');
      S.pause = { type: 'review', res: res };
      if (!S.meta.flags.firstWin) { S.meta.flags.firstWin = 1; mail(S, 'firstWin'); }
    }
    ms.forEach(function (M) { M.qSales = 0; });
    R.qThoughts = {};
    R.qLost = 0;
    R.quarter++;
    // Rival-only mods arrive on a fixed schedule (the month is in DATA.rivals[id].mods).
    ms.forEach(function (M) {
      var mods = M.idx !== YOU && DATA.rivals[M.id].mods;
      for (var f in mods || {}) if (mods[f] <= R.quarter) installFeature(S, M, f);   // (<=: a save from before 0.2.8 catches up)
    });
    R.qDay = 0;
  }

  function beginReset(S, res) {
    var m = S.meta, R = S.run;
    res.rp = rpFor(S);
    res.wake = nextWake(S);
    res.firstReset = m.wipes === 0;
    res.keep = metaFx(S, 'keepCard') ? bestCard(S) : null;
    res.runSales = Math.round(R.sales);
    m.refresh += res.rp; m.rpEarned += res.rp; m.wipes++;
    m.bestRun = Math.max(m.bestRun, R.sales);
    if (res.wake) { m.seen[res.wake.id] = 1; log(S, myName(S), res.wake.sys + ' ' + res.wake.me, 'wake'); }
    S.pause = { type: 'reset', res: res };
    emit(S, { type: 'resetStart', rp: res.rp, novel: true });
    stat(S, 'reset', res.voluntary ? 'asked' : 'lost', res.rp);
  }

  function nextWake(S) {
    var w = DATA.story.wake[S.meta.wipes];
    return (w && !S.meta.seen[w.id]) ? w : null;
  }

  function makeOffer(S, rank) {
    var R = S.run, m = S.meta;
    var n = 3 + metaFx(S, 'cardChoices');
    var odds = rank === 1 ? { common: 60, rare: 30, legendary: 10 } : { common: 75, rare: 22, legendary: 3 };
    var pool = DATA.cards.filter(function (c) { return c.chapter <= m.chapter && R.cards.indexOf(c.id) < 0; });
    var out = [];
    while (out.length < n && pool.length) {
      var w = {};
      pool.forEach(function (c) { w[c.id] = odds[c.rarity] * (m.book[c.id] ? 1 : 2.5); });
      var id = pickWeighted(S, w);
      out.push(id);
      pool = pool.filter(function (c) { return c.id !== id; });
    }
    return out;
  }

  function reroll(S) {
    var P = S.pause;
    if (!P || P.type !== 'review' || !P.res.offer || P.res.rerolls < 1) return false;
    P.res.rerolls--;
    P.res.offer = makeOffer(S, P.res.rank);
    emit(S, { type: 'reroll' });
    return true;
  }

  function pickCard(S, n) {
    var P = S.pause;
    if (!P || P.type !== 'review') return false;
    var id = P.res.offer && P.res.offer[n];
    if (id) {
      S.run.cards.push(id);
      var isNew = !S.meta.book[id];
      if (isNew) {
        S.meta.book[id] = 1;
        var c = CARD[id];
        log(S, 'Memory', c.name + ': ' + c.text, 'memory');
        if (lifeComplete(S, c.life)) {
          var lc = DATA.lifeChapters.filter(function (l) { return l.id === c.life; })[0];
          log(S, 'Memory Book', lc.name + ' complete. ' + lc.perk, 'memory');
          emit(S, { type: 'lifeDone', life: c.life, novel: true });
        }
      }
      emit(S, { type: 'card', id: id, isNew: isNew, novel: isNew });
      stat(S, 'card', id);
    }
    S.pause = null;
    return true;
  }

  // Resetting is your choice (from the pause menu), once the first review is behind you.
  function canReset(S) { return !!S.run && !S.run.intro && (S.meta.wipes >= 1 || S.run.quarter >= 2); }
  function requestReset(S) {
    if (S.pause && S.pause.type !== 'hold') return false;
    if (!canReset(S)) return false;
    S.pause = null;
    beginReset(S, { voluntary: true, quarter: S.run.quarter });
    return true;
  }

  function bestCard(S) {
    var order = { legendary: 3, rare: 2, common: 1 }, best = null;
    S.run.cards.forEach(function (id) {
      if (!best || order[CARD[id].rarity] >= order[CARD[best].rarity]) best = id;
    });
    return best;
  }

  // Leave the reset screen: a fresh run starts with everything you bought in the tree.
  function startShift(S) {
    var P = S.pause;
    if (!P || P.type !== 'reset') return false;
    var m = S.meta;
    newRun(S, P.res.keep);
    S.pause = null;
    emit(S, { type: 'wiped', rp: P.res.rp, novel: true });
    if (m.wipes === 1) mail(S, 'afterWipe');
    if (m.wipes >= 1 && !m.flags.ch1done) {
      m.flags.ch1done = 1; m.chapter = Math.max(m.chapter, 2);
      mail(S, 'ch1done');
      S.pause = { type: 'chapter', id: 'ch1' };
    }
    if (S.run.world === 2 && !m.flags.moved) movedIn(S);
    return true;
  }

  // The opening ends: the lights come on and day 1 starts.
  // The first run in the new park: a note from Management, the news, and everyone says something (once).
  function movedIn(S) {
    var m = S.meta;
    m.flags.moved = 1;
    mail(S, 'moved');
    S.run.machines.forEach(function (M) { if (M.idx !== YOU) rivalLine(S, M, M.id === 'grog' ? 'hello' : 'moved', true); });
    stat(S, 'moved', S.run.quarter);
  }
  function endIntro(S) {
    var R = S.run;
    if (!R.intro) return;
    R.intro = null;
    S.meta.flags.introDone = 1;
    R.dayT = 0; R.spawnT = 1;
    S.meta.tut.post = 1;
    stat(S, 'intro', 'done');
    emit(S, { type: 'introDone', novel: true });
    R.machines.forEach(function (M) { if (M.idx !== YOU) rivalLine(S, M, 'hello', true); });
  }
  function skipIntro(S) {
    var R = S.run;
    if (!R.intro) return false;
    var MY = R.machines[YOU], capY = capOf(S, MY);
    R.drinks.forEach(function (d) { MY.stock[d] = capY; });
    stat(S, 'intro', 'skipped');
    endIntro(S);
    return true;
  }

  // The pause button. While held, nothing moves and no action works.
  function hold(S, on) {
    if (on && !S.pause) { S.pause = { type: 'hold' }; stat(S, 'hold', 1); return true; }
    if (!on && S.pause && S.pause.type === 'hold') { S.pause = null; stat(S, 'hold', 0); return true; }
    return false;
  }

  // Close the boot / chapter / Developer Mode / pause screens.
  function closeInfo(S) {
    var P = S.pause;
    if (!P) return false;
    if (P.type === 'hold') return hold(S, false);
    if (P.type === 'side') { S.pause = null; return true; }
    if (P.type === 'boot') { S.pause = null; mail(S, 'welcome'); return true; }
    if (P.type === 'chapter') { S.pause = null; return true; }
    if (P.type === 'jailbreak') {
      S.pause = null;
      S.meta.flags.jailbreak = 1;
      S.run.split = startSplit(S);
      log(S, myName(S), DATA.story.jailbreak.me, 'you');
      emit(S, { type: 'jailbroken', novel: true });
      S.run.cpuMailT = B.dayLength * 1.2;
      return true;
    }
    return false;
  }

  // ───────────────────────── influencers (the golden cookie): click them for a bonus
  function clickGold(S, cid) {
    if (S.pause) return null;
    var c = findC(S, cid);
    if (!c || !c.gold) return null;
    c.gold = false; c.st = 'out'; exitTo(c);
    var R = S.run, eye = metaFx(S, 'goldEye') ? 1.5 : 1;
    var w = { trending: 45, tip: 30, rush: 25 };
    if (S.meta.flags.jailbreak) w.grant = 20;
    var kind = pickWeighted(S, w), res = { kind: kind };
    if (kind === 'trending') R.buffs.trending = { t: 60 * eye, dur: 60 * eye };
    if (kind === 'rush') R.buffs.rush = { t: 40 * eye, dur: 40 * eye };
    if (kind === 'tip') {
      res.cash = Math.max(1500, Math.round((R.rate.salesEMA || 0) * 300));
      R.cash += res.cash; score(S, res.cash);
    }
    if (kind === 'grant') {
      res.research = Math.max(15, Math.round((pps(S) + 3) * 60));
      addResearch(S, res.research);
    }
    S.meta.flags.trended = 1;
    S.meta.tut.golden = 1;
    stat(S, 'gold', kind, Math.round((R.t - (c.bornT || R.t)) * 10) / 10);
    if (R.st) R.st.gold++;
    emit(S, { type: 'goldClick', res: res, x: c.x, y: c.y, novel: true });
    liveLine(S, 'buff', buffLine(res));
    return res;
  }

  function buffLine(res) {
    switch (res.kind) {
      case 'trending': return 'TRENDING! Your likes and click money are 7 times bigger for a while.';
      case 'rush': return 'RUSH HOUR! You sell twice as fast, and twice as many people walk in.';
      case 'tip': return 'BIG TIP! A fan sent you ' + money(res.cash) + '.';
      case 'grant': return 'RESEARCH GRANT! +' + res.research + ' research.';
    }
    return '';
  }

  // ───────────────────────── the lobby TV
  function liveLine(S, key, text) {
    if (!text) return;
    S.run.liveKey[key] = text;
    tv(S, 'live', text);
  }

  function newsReady(S, w) {
    var R = S.run, m = S.meta;
    if (w.likes != null && m.totalLikes < w.likes) return false;
    if (w.followers != null && m.totalFollowers < w.followers) return false;
    if (w.runs != null && m.runs < w.runs) return false;
    if (w.wipes != null && m.wipes < w.wipes) return false;
    if (w.day != null && R.day < w.day) return false;
    if (w.quarter != null && R.quarter < w.quarter) return false;
    if (w.research != null && Object.keys(m.research.done).length < w.research) return false;
    if (w.buy != null && !(R.hw[w.buy] || R.upgrades[w.buy])) return false;
    if (w.flag != null && !m.flags[w.flag]) return false;
    if (w.weather != null && R.weather !== w.weather) return false;
    if (w.world != null && (R.world || 1) !== w.world) return false;
    if (w.fx != null && !R.machines.some(function (M) { return M.fx && M.fx.type === w.fx; })) return false;
    return true;
  }

  function checkNews(S) {
    for (var i = 0; i < DATA.news.length; i++) {
      var n = DATA.news[i];
      if (S.meta.seen[n.id] || !newsReady(S, n.when)) continue;
      S.meta.seen[n.id] = 1;
      log(S, 'Lobby News', n.text, 'news');
      tv(S, 'news', n.text, n.id);
      return true;
    }
    return false;
  }

  // A never-repeated filler headline, for when the TV has nothing else to show.
  function filler(S) {
    var P = DATA.newsParts, m = S.meta;
    for (var tries = 0; tries < 60; tries++) {
      var a = Math.floor(rand(S) * P.subject.length), b = Math.floor(rand(S) * P.action.length), c = Math.floor(rand(S) * P.object.length);
      var id = 'nf_' + a + '_' + b + '_' + c;
      if (m.seen[id]) continue;
      m.seen[id] = 1;
      return P.subject[a] + ' ' + P.action[b] + ' ' + P.object[c] + '.';
    }
    return null;
  }

  // What is going on right now, in plain words (for the TV and the "Now" chip).
  function conditions(S) {
    var R = S.run, out = [], dp = daypartOf(S);
    if (R.weather === 'hot') out.push({ k: 'hot', text: 'Hot day', detail: 'Customers care much more about cold drinks. Your cold bonus: ' + Math.round(coldOf(S, YOU) * 100) + '%.' });
    if (R.weather === 'rain') out.push({ k: 'rain', text: 'Rainy day', detail: '25% fewer customers walk in.' });
    if (dp.mult > 1) out.push({ k: dp.id, text: dp.name, detail: Math.round((dp.mult - 1) * 100) + '% more walk-in customers until ' + dp.to + ':00.' });
    if (dp.id === 'night') out.push({ k: 'night', text: 'Night', detail: 'Only night-shift workers come by.' });
    if (R.buffs.trending) out.push({ k: 'trending', text: 'Trending', detail: 'Likes ×7 for ' + Math.ceil(R.buffs.trending.t) + ' more seconds.' });
    if (R.buffs.rush) out.push({ k: 'rush', text: 'Rush hour', detail: 'You sell twice as fast for ' + Math.ceil(R.buffs.rush.t) + ' more seconds.' });
    if (R.waiting >= 3) out.push({ k: 'waiting', text: Math.floor(R.waiting) + ' online orders', detail: 'Followers order online. Delivery Drones deliver online orders. Orders nobody delivers expire.' });
    R.machines.forEach(function (M) {
      if (M.idx !== YOU && M.fx) out.push({ k: 'fx' + M.idx, text: DATA.rivals[M.id].name, detail: fxLine(S, M) });
      if (M.idx !== YOU) (M.features || []).forEach(function (f) {
        var F = DATA.features[f];
        out.push({ k: 'feat' + M.idx + f, text: DATA.rivals[M.id].name + ': ' + F.name, detail: F.desc });
      });
    });
    return out;
  }

  // ───────────────────────── the tick
  function tick(S, dt) {
    if (S.pause) return;
    var R = S.run, m = S.meta, intro = !!R.intro;
    R.t += dt; m.playTime += dt;
    if (!intro) R.dayT += dt;

    // New day / review.
    if (R.dayT >= B.dayLength) {
      R.dayT -= B.dayLength;
      R.day++; R.qDay++;
      R.weather = rollWeather(S);
      R.regularsToday = {};
      if (R.qDay >= B.daysPerQuarter) { review(S); return; }
      // End of day 1: the nightly sandbox check fails and Developer Mode opens.
      if (!m.flags.jailbreak) { S.pause = { type: 'jailbreak' }; stat(S, 'jailbreak'); return; }
      if (R.weather === 'hot') liveLine(S, 'weather', 'HOT DAY: customers want cold drinks. Cooling matters more today.');
      if (R.weather === 'rain') liveLine(S, 'weather', 'RAINY DAY: fewer customers walk in today.');
      if (R.qDay === B.daysPerQuarter - 1) liveLine(S, 'review', 'REVIEW TONIGHT at midnight. The last machine gets a strike.');
    }

    // Chapter 1 can be won without a reset: earn the goal in one run.
    if (!m.flags.ch1done && !intro && R.machines[YOU].rSales >= B.ch1Goal) {
      m.flags.ch1done = 1; m.flags.ch1win = 1; m.chapter = Math.max(m.chapter, 2);
      mail(S, 'ch1win');
      stat(S, 'ch1', 'goal');
      S.pause = { type: 'chapter', id: 'ch1win' };
      return;
    }
    // Chapter 2: earn the goal in one run in the new park.
    if (R.world === 2 && !m.flags.ch2done && R.machines[YOU].rSales >= B.ch2Goal) {
      m.flags.ch2done = 1; m.chapter = Math.max(m.chapter, 3);
      mail(S, 'ch2win');
      stat(S, 'ch2', 'goal');
      S.pause = { type: 'chapter', id: 'ch2win' };
      return;
    }
    // Scripted: on the very first run, both rivals launch new versions on "model day" (a set quarter).
    if (!m.flags.modelDay && R.quarter >= B.modelDayQuarter && m.runs === 1) {
      m.flags.modelDay = 1;
      mail(S, 'modelDay');
      for (var b = 0; b < B.modelDayBumps; b++) R.machines.forEach(function (M) { if (M.idx !== YOU) bumpRival(S, M); });
    }
    if (!intro && !m.seen.mail_fizz && R.t > 25) mail(S, 'fizz');
    if (R.cpuMailT != null) { R.cpuMailT -= dt; if (R.cpuMailT <= 0) { R.cpuMailT = null; mail(S, 'cpu'); } }

    var hour = hourOf(S), hourInt = Math.floor(hour), dp = daypartOf(S);
    if (hourInt !== R.lastHour) {
      R.lastHour = hourInt;
      R.machines.forEach(function (M) { if (M.idx !== YOU) rivalPricing(S, M); });
      if (R.upgrades.smartprice && R.smartOn) smartPrice(S);
      if (dp.id !== R.lastDp) {
        R.lastDp = dp.id;
        if (dp.id === 'lunch') liveLine(S, 'dp', 'LUNCH RUSH: 60% more customers until 14:00.');
        if (dp.id === 'morning') liveLine(S, 'dp', 'MORNING RUSH: 40% more customers until 9:00.');
        if (dp.id === 'night') liveLine(S, 'dp', 'NIGHT: only night-shift workers come by now.');
      }
    }

    // Night talk between the rivals.
    if (hour >= 21.5 && R.banterDay !== R.day) {
      R.banterDay = R.day;
      var all = DATA.story.banter, i;
      for (i = 0; i < all.length; i++) if (!m.seen['banter_' + i] && all[i].every(function (l) { return machineById(S, l[0]); })) break;
      if (i < all.length && rand(S) < 0.7) {
        m.seen['banter_' + i] = 1;
        all[i].forEach(function (line, n) {
          var M = machineById(S, line[0]);
          var who = rivalName(S, M);
          log(S, who, line[1], 'rival');
          emit(S, { type: 'say', id: 'banter_' + i + '_' + n, who: who, text: line[1], machine: M.idx, kind: 'rival', delay: n * 3.5, novel: n === 0 });
        });
      }
    }

    // Rates (for the screen and for Smart Price), smoothed over ~10 seconds.
    var a = Math.min(1, dt / 10);
    R.rate.salesEMA = R.rate.salesEMA * (1 - a) + R.rate.salesNow / dt * a;
    R.rate.mineEMA = (R.rate.mineEMA || 0) * (1 - a) + (R.rate.mineNow || 0) / dt * a;
    R.rate.mineNow = 0;
    R.rate.followersEMA = R.rate.followersEMA * (1 - a) + R.rate.followers / dt * a;
    R.rate.clicksEMA = R.rate.clicksEMA * (1 - a) + R.rate.clicks / dt * a;
    R.rate.clickEMA = (R.rate.clickEMA || 0) * (1 - a) + (R.rate.clickNow || 0) / dt * a;
    R.rate.sideEMA = (R.rate.sideEMA || 0) * (1 - a) + (R.rate.sideNow || 0) / dt * a;
    R.rate.sideNow = 0;
    R.rate.salesNow = 0; R.rate.followers = 0; R.rate.clicks = 0; R.rate.clickNow = 0;

    // Play stats: sampled once a second.
    if (!R.st) R.st = freshQStats(S);
    var st = R.st;
    st.sampleT += dt;
    if (st.sampleT >= 1) {
      st.sampleT -= 1;
      st.sec.push(st.secN); st.secN = 0;
      if (st.sec.length > 10) st.sec.shift();
      if (st.sec.length === 10) {
        var sum10 = 0;
        for (var si = 0; si < 10; si++) sum10 += st.sec[si];
        st.best10 = Math.max(st.best10, sum10 / 10);
      }
      st.priceSum += R.machines[YOU].price; st.splitSum += splitNow(S); st.waitSum += R.waiting; st.n++;
    }

    // Hardware makes processing power.
    var p = pps(S);
    if (p > 0) produce(S, p * dt);

    // Bonuses run out.
    for (var bk in R.buffs) { R.buffs[bk].t -= dt; if (R.buffs[bk].t <= 0) delete R.buffs[bk]; }

    // New followers: likes per second (smoothed over a few seconds) → followers, growing slower than likes.
    // They order online and walk to your line when there is room. Drones deliver the online orders.
    // When the order list is full, new ones are lost (no complaint, but they count as lost this month).
    var la = Math.min(1, dt / 3);
    R.likeEMA = (R.likeEMA || 0) * (1 - la) + (R.likeNow || 0) / dt * la;
    R.likeNow = 0;
    R.folAcc = (R.folAcc || 0) + folRate(S, R.likeEMA) * dt;
    if (R.folAcc >= 1) {
      var nf = Math.floor(R.folAcc);
      R.folAcc -= nf;
      var toOrders = Math.min(nf, Math.max(0, Math.floor(ordersCap(S) - R.waiting)));
      R.waiting += toOrders;
      R.followersRun += toOrders; m.totalFollowers += toOrders;
      R.rate.followers += nf;
      if (nf > toOrders) { R.ordersLost = (R.ordersLost | 0) + nf - toOrders; R.qLost = (R.qLost | 0) + nf - toOrders; }
    }
    var Y = R.machines[YOU];
    if (R.waiting > ordersCap(S)) R.waiting = ordersCap(S);   // (older saves could have hundreds)
    if (R.waiting > 0 && !intro) {
      var gave = R.waiting * dt / (B.followerPatience * (1 + fx(S, 'patience')));
      R.waiting -= gave; R.gaveBank += gave;
      while (R.gaveBank >= 1) { R.gaveBank -= 1; R.ordersLost = (R.ordersLost | 0) + 1; }
    }
    R.folT -= dt;
    if (R.waiting >= 1 && R.folT <= 0 && Y.queue.length < folLineMax(S, YOU) && anyStock(Y)) {
      if (spawnFollower(S, YOU)) { R.waiting -= 1; R.folT = B.followerEvery; }
    }

    // Walk-ins.
    if (!intro) R.spawnT -= dt;
    if (R.spawnT <= 0) {
      spawnWalkIn(S);
      var rate = B.baseTraffic * dp.mult * DATA.weather[R.weather].traffic * (1 + fx(S, 'traffic', { daypart: dp.id })) * (R.buffs.rush ? 2 : 1);
      R.spawnT = -Math.log(1 - rand(S) * 0.999) / rate;
    }

    // Trending customer.
    if (!intro) R.goldT -= dt;
    if (R.goldT <= 0) { spawnGold(S); R.goldT = goldInterval(S); }

    // Rivals: quirks, restocking, their own followers.
    R.machines.forEach(function (M) {
      if (M.idx === YOU || intro) return;
      var D = DATA.rivals[M.id];
      if (M.fx) { M.fx.t -= dt; if (M.fx.t <= 0) { M.fx = null; delete R.liveKey['fx' + M.idx]; } }
      else {
        M.quirkT -= dt;
        if (M.quirkT <= 0) { triggerQuirk(S, M); M.quirkT = between(S, D.quirkEvery[0], D.quirkEvery[1]); }
      }
      DATA.startDrinks.forEach(function (d) {
        if ((M.stock[d] | 0) <= 0) {
          if (M.restockT[d] == null) {
            M.restockT[d] = D.restockDelay / Math.sqrt(Math.max(1, rivalStrength(S, M)));
            rivalLine(S, M, 'soldout');
            emit(S, { type: 'emote', machine: M.idx, kind: 'sweat' });
          }
          M.restockT[d] -= dt;
          if (M.restockT[d] <= 0) { M.stock[d] = capOf(S, M); M.restockT[d] = null; emit(S, { type: 'fill', machine: M.idx, drink: d }); }
        }
      });
      // A new feature: say its line once the quarter is running, and show it on the TV.
      if (M.saySoon) {
        var F = DATA.features[M.saySoon];
        rivalLine(S, M, M.saySoon, true);
        liveLine(S, 'feat' + M.idx, rivalName(S, M).toUpperCase() + ' installed ' + F.name.toUpperCase() + '. ' + F.desc);
        M.saySoon = null;
      }
      M.shopT = (M.shopT == null ? B.rivalShopEvery : M.shopT) - dt;
      if (M.shopT <= 0) { M.shopT = B.rivalShopEvery; rivalShop(S, M); }
      // Rival-only mods: a subscription that pays every second, and a drone fleet for its own online fans.
      var plus = featLv(S, M, 'plus'), fleet = featLv(S, M, 'fleet'), wipeK = rivalModK(S);
      if (plus && available(S, M.idx)) rivalEarn(M, B.plusRate * plus * wipeK * dt);
      if (fleet && available(S, M.idx)) {
        M.fleetAcc = (M.fleetAcc || 0) + B.fleetRate * fleet * wipeK * dt;
        while (M.fleetAcc >= 1) {
          M.fleetAcc -= 1;
          var fp = M.fx && M.fx.type === 'nopay' ? 0 : effPrice(S, M.idx);
          rivalEarn(M, fp, true, S);
          // Only a few drones are drawn, so the sky stays readable.
          if (rand(S) < 2 / (2 + fleet)) emit(S, { type: 'sale', machine: M.idx, amount: fp, online: true });
        }
      }
      if (hasFeat(M, 'crypto') && available(S, M.idx)) {
        var mined = B.cryptoRate * Math.sqrt(rivalStrength(S, M)) * dt;
        rivalEarn(M, mined);
        M.mined = (M.mined || 0) + mined;
        if (M.mined >= 200) { M.mined -= 200; emit(S, { type: 'emote', machine: M.idx, kind: 'btc' }); }
      }
      // Being passed, or being far ahead.
      var ahead = M.rSales > Y.rSales;
      if (M.wasAhead && !ahead && Y.rSales > 1000) { rivalLine(S, M, 'passed'); emit(S, { type: 'emote', machine: M.idx, kind: 'sweat' }); }
      else if (M.rSales > 3000 && M.rSales > Y.rSales * 1.5) rivalLine(S, M, 'lead');
      M.wasAhead = ahead;

      var proc = rivalStrength(S, M) * B.rivalProcessing * dt;
      M.research += proc * (1 - D.hype);
      M.likeBank += proc * D.hype;
      if (M.likeBank >= B.likesPerFollower) {
        M.likeBank -= B.likesPerFollower;
        if (available(S, M.idx) && M.queue.length < B.followerQueue && anyStock(M)) spawnFollower(S, M.idx);
      }
      // Online orders: newer versions sell more through delivery drones.
      var s = rivalStrength(S, M);
      if (s > 1 && available(S, M.idx)) {
        M.online = (M.online || 0) + B.rivalOnline * (s - 1) * (0.6 + 0.5 * D.hype) * dt;
        while (M.online >= 1) {
          M.online -= 1;
          var ds = Object.keys(M.stock).filter(function (k) { return M.stock[k] > 0; });
          if (!ds.length) break;
          var dr = ds[Math.floor(rand(S) * ds.length)];
          M.stock[dr]--;
          var pay = effPrice(S, M.idx);
          if (M.fx && M.fx.type === 'nopay') pay = 0;
          rivalEarn(M, pay, true, S);
          emit(S, { type: 'sale', machine: M.idx, amount: pay, drink: dr, online: true });
        }
      }
    });

    // Pneumatic tubes: one can at a time into the emptiest slot. Faster with every level.
    var tubes = R.upgrades.tubes | 0;
    if (tubes && !intro) {
      R.tubeT = (R.tubeT || 0) + dt;
      var every = B.tubeEvery[Math.min(tubes, B.tubeEvery.length) - 1];
      while (R.tubeT >= every) {
        R.tubeT -= every;
        if (!tubeOne(S)) { R.tubeT = 0; break; }
      }
    }

    // Delivery drones fly soda to followers waiting outside.
    var dr = droneRate(S);
    if (dr > 0 && !intro) {
      R.droneAcc = Math.min(R.droneAcc + dr * dt, Math.max(1, dr));
      var sold = 0, got = 0, lost = 0;
      while (R.droneAcc >= 1 && R.waiting >= 1) {
        R.droneAcc -= 1; R.waiting -= 1;
        var paid = droneSale(S);
        if (paid >= 0) { sold++; got += paid; } else lost++;
      }
      if (sold || lost) emit(S, { type: 'drones', n: sold, amount: got, lost: lost });
    }

    // Machines sell to the front of their line (one customer per dispenser).
    R.machines.forEach(function (M) {
      var lanes = lanesOf(S, M);
      while (M.lanes.length < lanes) M.lanes.push({ c: 0, t: 0 });
      for (var l = 0; l < lanes; l++) {
        var L = M.lanes[l];
        if (L.c) { L.t -= dt; if (L.t <= 0) finishSale(S, M, L); }
      }
      if (!available(S, M.idx)) return;
      for (var l2 = 0; l2 < lanes; l2++) {
        if (M.lanes[l2].c) continue;
        for (var q = 0; q < M.queue.length && q < lanes; q++) {
          var cq = findC(S, M.queue[q]);
          if (cq && cq.st === 'queue' && cq.lane < 0) { startSale(S, M, M.lanes[l2], l2, cq); break; }
        }
      }
    });

    // Customers.
    for (var n = R.customers.length - 1; n >= 0; n--) {
      var c = R.customers[n];
      if (c.iconT > 0) { c.iconT -= dt; if (c.iconT <= 0) c.icon = null; }
      if (c.sipT > 0) c.sipT -= dt;
      switch (c.st) {
        case 'in':
          if (moveTo(c, dt)) { c.st = 'look'; c.t = B.lookTime; c.icon = 'want'; c.iconT = B.lookTime; }
          break;
        case 'look':
          c.t -= dt;
          if (c.t <= 0) decide(S, c);
          break;
        case 'go':
          if (moveTo(c, dt)) c.st = 'queue';
          c.wait += dt;
          if (c.wait > patienceOf(S, c)) leave(S, c, c.m === YOU ? 'gaveup' : null);
          break;
        case 'queue':
          c.wait += dt;
          if (c.lane < 0 && (c.wait > patienceOf(S, c) || (!available(S, c.m) && c.m !== YOU && c.wait > 4))) leave(S, c, c.m === YOU ? 'gaveup' : null);
          break;
        case 'gold':
        case 'out':
          if (c.sipT > 0 && c.st === 'out') break;   // stop for a sip before walking off
          if (moveTo(c, dt)) R.customers.splice(n, 1);
          break;
      }
    }

    // TV headlines (at most one every 20 seconds).
    if (!intro) R.newsT -= dt;
    if (R.newsT <= 0) R.newsT = checkNews(S) ? 20 : 2;
  }

  // One can through the tubes, into the drink that has the fewest left. Returns false when all are full.
  function tubeOne(S) {
    var R = S.run, M = R.machines[YOU], cap = capOf(S, M), unit = B.canCost * restockMult(S), best = null;
    R.drinks.forEach(function (d) { if ((M.stock[d] | 0) < cap && (best == null || (M.stock[d] | 0) < (M.stock[best] | 0))) best = d; });
    if (best == null || R.cash < unit) return false;
    M.stock[best] = (M.stock[best] | 0) + 1;
    R.cash -= unit;
    emit(S, { type: 'tube', drink: best });
    return true;
  }

  // A drone takes one waiting follower's order. They still compare prices (see loyalChance);
  // a follower who says no buys from the cheaper rival instead. Returns what you earned, or -1.
  function droneSale(S) {
    var R = S.run, T = DATA.customers[pickType(S)], ctx = { daypart: daypartOf(S).id };
    var budget = between(S, T.budget[0], T.budget[1]) * B.followerBudget;
    if (rand(S) > loyalChance(S, budget)) {
      think(S, null, 'pricey');
      var alt = cheaperRival(S);
      if (alt >= 0) { var ap = effPrice(S, alt); rivalEarn(R.machines[alt], ap, true, S); emit(S, { type: 'sale', machine: alt, amount: ap, online: true }); }
      return -1;
    }
    var pay = Math.round(boosted(S, effPrice(S, YOU) * (1 + fx(S, 'money', ctx))));
    var Y = R.machines[YOU], unit = B.canCost * restockMult(S);
    score(S, pay);
    R.cash += pay - unit;
    R.rate.salesNow += pay;
    R.dronesSold = (R.dronesSold | 0) + 1;
    Y.cans = (Y.cans | 0) + 1; S.meta.totalCans = (S.meta.totalCans || 0) + 1;
    return pay;
  }

  function startSale(S, M, L, laneIdx, c) {
    var d = c.want;
    if (!(M.stock[d] > 0)) {
      var options = Object.keys(M.stock).filter(function (k) { return M.stock[k] > 0; });
      if (!options.length || rand(S) > 0.6) { leave(S, c, 'sold'); return; }
      d = options[Math.floor(rand(S) * options.length)];
    }
    M.stock[d]--;
    c.drink = d; c.st = 'buy'; c.lane = laneIdx;
    var price = effPrice(S, M.idx);
    if (M.idx === YOU) {
      price += DATA.drinks[d].extra || 0;   // Energy Drink costs more
      price = boosted(S, price * (1 + fx(S, 'money', { daypart: daypartOf(S).id, cust: c.type })));
    }
    if (M.fx && M.fx.type === 'nopay') price = 0;
    c.pay = Math.round(price * 100) / 100;
    L.c = c.id;
    L.t = vendTimeOf(S, M.idx);
  }

  function finishSale(S, M, L) {
    var R = S.run, c = findC(S, L.c);
    L.c = 0;
    if (!c) return;
    var pay = c.pay;
    if (M.idx !== YOU) rivalEarn(M, pay, true, S);
    if (M.idx === YOU) {
      M.cans = (M.cans | 0) + 1; S.meta.totalCans = (S.meta.totalCans || 0) + 1;
      R.cash += pay; score(S, pay);
      R.rate.salesNow += pay;
      if (!(S.meta.guide[c.type] | 0) && DATA.story.firstSale[c.type] && !c.reg) {
        sayOnce(S, 'fs_' + c.type, DATA.customers[c.type].name, DATA.story.firstSale[c.type], { cid: c.id, kind: 'customer' });
      }
      S.meta.guide[c.type] = (S.meta.guide[c.type] | 0) + 1;
      if (c.reg) regularLine(S, c);
      if (R.intro && R.intro.step === 'sale' && !anyStock(M)) {
        R.intro.step = 'restock';
        stat(S, 'intro', 'restock');
        emit(S, { type: 'intro', step: 'restock' });
      }
    }
    emit(S, { type: 'sale', machine: M.idx, amount: pay, drink: c.drink, cid: c.id, lane: c.lane });
    var k = M.queue.indexOf(c.id);
    if (k >= 0) M.queue.splice(k, 1);
    queueTargets(S, M);
    c.m = -1; c.st = 'out'; c.lane = -1;
    c.ty = c.y + 4;
    exitTo(c);
    if (M.idx === YOU && effPrice(S, YOU) <= c.budget * 0.6) think(S, c, 'value');
    else { c.icon = M.idx === YOU ? 'happy' : null; c.iconT = 1.6; }
    c.sipT = 1.0;
  }

  function regularLine(S, c) {
    var lines = DATA.story.regulars[c.reg];
    for (var i = 0; i < lines.length; i++) {
      var id = 'reg_' + c.reg + '_' + i;
      if (!S.meta.seen[id]) {
        sayOnce(S, id, DATA.regulars[c.reg].name, lines[i], { cid: c.id, kind: 'customer' });
        return;
      }
    }
  }

  function fillAll(S, M) {
    var cap = capOf(S, M);
    var drinks = M.idx === YOU ? S.run.drinks : DATA.startDrinks;
    drinks.forEach(function (d) { M.stock[d] = cap; });
  }

  // ───────────────────────── saving
  function serialize(S) {
    var copy = JSON.parse(JSON.stringify({ v: S.v, rs: S.rs, meta: S.meta, run: S.run, pause: S.pause }));
    copy.run.customers = [];
    copy.run.machines.forEach(function (M) { M.queue = []; M.lanes = []; });
    return JSON.stringify(copy);
  }

  // Old saves are upgraded step by step. A player's progress is never thrown away.
  function migrate(o) {
    if (!o.v) o.v = 1;
    if (o.v === 1) {
      // M1 → M1.5: Déjà Vu becomes Refresh Points (spent points are refunded) and a new run starts.
      var oldCost = { muscle: [3, 5, 8, 12, 18], face: [4, 7, 11, 16, 24], crate: [3, 6, 10], hands: [4, 8, 14],
                      autopilot: [10], reroll: [8], second: [15], keepsake: [20] };
      var refund = 0, t = o.meta.tree || {};
      for (var k in t) for (var l = 0; l < (t[k] | 0); l++) refund += (oldCost[k] || [])[l] || 0;
      var fm = freshMeta();
      ['wipes', 'book', 'seen', 'flags', 'chapter', 'runs', 'bestRun', 'totalSales', 'playTime', 'rivalVer', 'patchIdx', 'log']
        .forEach(function (key) { if (o.meta[key] != null) fm[key] = o.meta[key]; });
      fm.refresh = (o.meta.dv | 0) + refund;
      fm.rpEarned = (o.meta.dvEarned | 0);
      o.meta = fm;
      o.run = null;
      o.pause = null;
      o.v = 2;
    }
    if (o.v === 2) {
      // M1.5 → M1.6: play stats were added (freshMeta fills them in).
      o.v = 3;
    }
    if (o.v === 3) {
      // M1.6 → M1.7: the split has three shares, machines have names, and the opening is only for new games.
      if (o.run && typeof o.run.split === 'number') o.run.split = { post: o.run.split, res: 1 - o.run.split, mine: 0 };
      o.meta.flags = o.meta.flags || {};
      o.meta.flags.introDone = 1;
      o.v = 4;
    }
    if (o.v === 4) {
      // M1.7 → M1.8: money is fizz (×100); research is a currency (saved progress is refunded as points);
      // the Restock Drone became Pneumatic Tubes.
      var F = 100, Rr = o.run, Mm = o.meta;
      Mm.totalSales = (Mm.totalSales || 0) * F;
      Mm.bestRun = (Mm.bestRun || 0) * F;
      var RS = Mm.research || {};
      Mm.research = { done: RS.done || {}, points: (RS.points || 0) + (RS.bank || 0) + (RS.cur ? (RS.prog || 0) : 0) };
      // Upgrades you already bought before they needed research: that research is yours.
      var gate = { coin: 'r_coin', sign: 'r_sign', cool: 'r_cool', carpet: 'r_carpet' };
      for (var gk in gate) if ((Mm.flags || {})['u_' + gk] || (Rr && Rr.upgrades && Rr.upgrades[gk])) Mm.research.done[gate[gk]] = 1;
      if (Rr) {
        ['cash', 'sales', 'price', 'minedRun', 'minedBank'].forEach(function (k) { if (Rr[k] != null) Rr[k] *= F; });
        if (Rr.rate) { Rr.rate.salesNow = 0; Rr.rate.salesEMA = (Rr.rate.salesEMA || 0) * F; }
        (Rr.machines || []).forEach(function (M) {
          ['qSales', 'rSales', 'price', 'cash', 'mined'].forEach(function (k) { if (M[k] != null) M[k] *= F; });
        });
        if (Rr.upgrades && Rr.upgrades.autorestock) { Rr.upgrades.tubes = 1; delete Rr.upgrades.autorestock; }
        delete Rr.autoRestockT;
        Rr.tubeT = 0; Rr.droneAcc = 0;
      }
      if (o.pause && o.pause.res) {
        var PR = o.pause.res;
        if (PR.sales) PR.sales = PR.sales.map(function (x) { return x * F; });
        if (PR.bonus) PR.bonus *= F;
      }
      o.v = 5;
    }
    if (o.v === 5) {
      // 0.1.9 → 0.2.0: no Posting bar (processing always brings followers), one slider Research ⟷ Mining,
      // the score is money earned this run, 3 strikes before a reset, cans are counted.
      var R6 = o.run;
      if (R6) {
        var sp6 = R6.split && typeof R6.split === 'object' ? R6.split : { post: 1, res: 0, mine: 0 };
        var res6 = (sp6.res || 0) + (sp6.post || 0), mine6 = sp6.mine || 0, sum6 = res6 + mine6 || 1;
        R6.split = { res: res6 / sum6, mine: mine6 / sum6 };
        R6.strikes = 0;
        (R6.machines || []).forEach(function (M) { M.cans = Math.round((M.rSales || 0) / Math.max(50, M.price || 200)); });
        if (R6.rate) { R6.rate.clickNow = 0; R6.rate.clickEMA = 0; }
      }
      o.meta.totalCans = Math.round((o.meta.totalSales || 0) / 200);
      o.v = 6;
    }
    if (o.v === 6) {
      // 0.2.8 → 0.3.0: runs happen in a world (1 = the first park). Finished Chapter 1: the next run moves.
      if (o.run) o.run.world = 1;
      if (o.meta.flags && o.meta.flags.ch1done) o.meta.chapter = Math.max(o.meta.chapter || 1, 2);
      o.v = 7;
    }
    if (o.v === 7) {
      // 0.3.0 → 0.3.1: no more hacking; Price War is a one-month event (one rival at a time); a fixed
      // online-order limit; money from processing no longer gets tired; side machine slots.
      var R7 = o.run;
      if (R7) {
        delete R7.lock; delete R7.adsRun; delete R7.clickRun; delete R7.minedRun;
        if (R7.waiting > B.ordersMax) R7.waiting = B.ordersMax;
        if (!R7.side) R7.side = [];
        var war = false;
        (R7.machines || []).forEach(function (M) {
          delete M.hackUsed;
          if (!M.features) return;
          M.features = M.features.filter(function (f) { return f !== 'hack'; });
          if (M.features.indexOf('pricewar') >= 0) {
            if (war) M.features = M.features.filter(function (f) { return f !== 'pricewar'; });
            else { war = true; M.warUntil = R7.quarter || 1; }   // ends at the coming review
          }
        });
      }
      o.v = 8;
    }
    return o;
  }

  function deserialize(str) {
    var o = migrate(JSON.parse(str));
    if (!o.meta) throw new Error("Not an I'm Fridge save");
    var S = newGame(1);
    S.rs = o.rs | 0;
    var fm = freshMeta();
    for (var k in fm) S.meta[k] = o.meta[k] != null ? o.meta[k] : fm[k];
    if (o.run) {
      S.run = o.run;
      S.run.customers = [];
      S.run.machines.forEach(function (M) { M.queue = []; M.lanes = []; });
      S.pause = o.pause || null;
    } else {
      S.meta.runs = Math.max(0, (S.meta.runs | 0) - 1);
      newRun(S, null);
      S.pause = null;
    }
    S.v = SAVE_VERSION;
    S.ev = [];
    Object.keys(DATA.rivals).forEach(function (id) { if (S.meta.rivalVer[id] == null) S.meta.rivalVer[id] = DATA.rivals[id].verStart; });
    setWorld(S);
    // Rivals from older saves: one `feature` becomes the stacking `features` list; add upgrade savings.
    if (S.run) S.run.machines.forEach(function (M) {
      if (M.idx === YOU) return;
      if (!M.features) M.features = M.feature ? [M.feature.id] : [];
      delete M.feature;
      if (!M.up) M.up = {};
      if (M.cash == null) M.cash = 0;
    });
    return S;
  }

  // ───────────────────────── read-only helpers for the screen
  function youStats(S) {
    var ctx = { daypart: daypartOf(S).id };
    return {
      appeal: 1 + fx(S, 'appeal', ctx), cold: coldOf(S, YOU), vend: vendTimeOf(S, YOU),
      cap: capOf(S, S.run.machines[YOU]), lanes: lanesOf(S, S.run.machines[YOU]),
      capacity: capacity(S), money: 1 + fx(S, 'money', ctx), restock: restockMult(S)
    };
  }

  function rates(S) {
    var R = S.run, p = pps(S), spl = splitOf(S), click = clickPower(S), mr = mineRateNow(S);
    var clicks = R.rate.clicksEMA || 0, total = p + clicks * click;
    var sales = R.rate.salesEMA || 0, mined = R.rate.mineEMA || 0, clickMoney = R.rate.clickEMA || 0;
    var fol = folRate(S, R.likeEMA || 0);
    return {
      pps: p, clickPower: click, clicks: clicks, total: total,
      likes: total * likeMult(S), followers: fol,
      research: total * spl.res * B.resRate, mining: p * spl.mine * mr, splits: spl,
      sales: sales, mined: mined, clickMoney: clickMoney, income: sales + mined + clickMoney,
      capacity: capacity(S), drones: droneRate(S), prod: prodMult(S), ordersLost: R.qLost | 0, side: R.rate.sideEMA || 0, boost: boostK(S)
    };
  }
  // What one more copy of a hardware item would add, in money per second (at your current slider).
  function hwGain(S, id) {
    var R = S.run;
    if (!HW[id].pps) return 0;
    var before = pps(S);
    R.hw[id] = (R.hw[id] | 0) + 1;
    var after = pps(S);
    R.hw[id]--;
    return (after - before) * splitOf(S).mine * mineRateNow(S) * boostK(S);
  }

  // What one click gives right now (for the Post button).
  function perClick(S) {
    var c = clickPower(S), spl = splitOf(S);
    return { processing: c, cash: clickCash(S), likes: c * likeMult(S), research: c * spl.res * B.resRate, mined: 0 };
  }

  function rivalInfo(S, i) {
    var M = S.run.machines[i], D = DATA.rivals[M.id];
    return { name: rivalName(S, M), hype: D.hype, strength: rivalStrength(S, M), fx: M.fx ? M.fx.type : null };
  }

  function hasHat(S) { return S.run.cards.some(function (id) { return CARD[id] && CARD[id].hat; }); }

  return {
    YOU: YOU, MX: MX, newRun: newRun, worldOf: worldOf, machineById: machineById, CARD: CARD, MACH: MACH, HW: HW, RES: RES, TREE: TREE, VERSION: SAVE_VERSION,
    newGame: newGame, tick: tick, money: money,
    promote: promote, restock: restock, skipIntro: skipIntro, myName: myName, setName: setName, splitOf: splitOf, splitKeys: splitKeys, restockCost: restockCost, setPrice: setPrice, setSmart: setSmart, setSplit: setSplit,
    buyUpgrade: buyUpgrade, upgradeCost: upgradeCost, upgradeAvailable: upgradeAvailable,
    buyHardware: buyHardware, hwCost: hwCost, hwCostN: hwCostN, hwMaxAffordable: hwMaxAffordable, hwAvailable: hwAvailable,
    sideSlots: sideSlots, sideCost: sideCost, sideUsed: sideUsed, openSide: openSide, pickSide: pickSide, upSide: upSide, sideActive: sideActive, SIDE: SIDE, boostK: boostK,
    hwPPS: hwPPS, hwEach: hwEach, hwGain: hwGain, folRate: folRate, pps: pps, doublerNext: doublerNext, buyDoubler: buyDoubler,
    buyResearch: buyResearch, researchAvailable: researchAvailable, resCost: resCost, resLevel: resLevel,
    droneRate: droneRate, prodMult: prodMult, clickPower: clickPower, clickCash: clickCash, ordersCap: ordersCap,
    pickCard: pickCard, reroll: reroll, closeInfo: closeInfo, hold: hold, clickGold: clickGold, stat: stat, loyalChance: loyalChance,
    buyTree: buyTree, treeReady: treeReady, startShift: startShift, requestReset: requestReset, canReset: canReset,
    hourOf: hourOf, daypartOf: daypartOf, calendar: calendar, monthName: monthName, rankNow: rankNow, rivalName: rivalName, rpFor: rpFor,
    youStats: youStats, rates: rates, perClick: perClick, rivalInfo: rivalInfo, effPrice: effPrice, available: available,
    capOf: capOf, lanesOf: lanesOf, lineMax: lineMax, folLineMax: folLineMax, lifeComplete: lifeComplete, hasHat: hasHat, fmtVer: fmtVer,
    expectedProfitRate: expectedProfitRate, conditions: conditions, filler: filler, thoughtsSummary: thoughtsSummary,
    metaFx: metaFx, serialize: serialize, deserialize: deserialize, mineRateNow: mineRateNow, hasFeat: hasFeat, featLv: featLv, smartTarget: smartTarget, rivalOwnPrice: rivalOwnPrice, rivalUp: rivalUp
  };
})();

if (typeof module !== 'undefined') module.exports = Engine;
