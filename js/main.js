// OUT OF ORDER — starts the game and runs the main loop.
// Time only moves while the page is open. If you switch tabs, it catches up (up to 10 minutes).
// © 2026 Void Possum. All rights reserved.

(function () {
  'use strict';

  var TICK = DATA.balance.tick;
  var settings = Save.loadSettings();
  var S = Save.load() || Engine.newGame();
  var speed = 1;
  var debug = /[?&]debug\b/.test(location.search);

  var canvas = document.getElementById('scene');
  var box = document.getElementById('sceneBox');
  Scene.init(canvas);

  var unlocked = false;
  function unlock() { if (!unlocked) { unlocked = true; Sfx.unlock(); } }

  // The scene fills its box at a whole-number pixel scale.
  function fit() { Scene.resize(Math.max(1, box.clientWidth), Math.max(1, box.clientHeight)); }

  // Play stats from the page side: this session, window size, frame rate.
  var session = null;
  function startSession() {
    var st = S.meta.stats;
    if (!st) return;
    session = { start: new Date().toISOString(), len: 0, w: innerWidth, h: innerHeight, dpr: window.devicePixelRatio || 1 };
    st.sessions.push(session);
    if (st.sessions.length > 100) st.sessions.shift();
  }
  startSession();

  UI.init(S, settings, {
    unlock: unlock,
    relayout: fit,
    replaceState: function (ns) { S = ns; UI.setState(S); startSession(); Save.save(S); }
  });

  // Clicks on the scene: an influencer = bonus, your machine = post, the crate = restock.
  canvas.addEventListener('pointerdown', function (e) {
    unlock();
    var what = Scene.hit(S, e);
    if (!what) return;
    if (what.kind === 'gold') Engine.clickGold(S, what.id);
    else if (what.kind === 'you') UI.clickPop(e.clientX, e.clientY, Engine.promote(S));
    else if (what.kind === 'crate') Engine.restock(S);
  });
  canvas.addEventListener('mousemove', function () {
    canvas.classList.toggle('pointer', !!Scene.hoverTarget(S));
  });

  if (window.ResizeObserver) new ResizeObserver(fit).observe(box);
  window.addEventListener('resize', fit);
  fit();

  // ── the loop ───────────────────────────────────────────────
  var QUIET = { sale: 1, post: 1, restock: 1, say: 1 };
  var last = performance.now(), acc = 0, t = 0, fpsN = 0, fpsT = 0, fpsNow = 0;
  function frame(now) {
    var real = Math.min(600, Math.max(0, (now - last) / 1000));
    last = now;
    // Frame rate, one sample per second while the game is running and visible.
    fpsN++; fpsT += real;
    if (fpsT >= 1) {
      fpsNow = Math.round(fpsN / fpsT);
      if (!S.pause && !document.hidden && fpsT < 2 && S.meta.stats) {
        S.meta.stats.fps.push(fpsNow);
        if (S.meta.stats.fps.length > 900) S.meta.stats.fps.shift();
      }
      if (session) session.len += fpsT;
      fpsN = 0; fpsT = 0;
    }
    var dt = Math.min(0.1, real);
    acc += real * speed;
    var steps = 0;
    while (acc >= TICK && !S.pause) {
      Engine.tick(S, TICK);
      acc -= TICK;
      if (++steps > 20000) { acc = 0; break; }
    }
    if (S.pause) acc = 0;
    var quiet = steps > 30;   // catching up after a tab switch: skip the small effects
    var evs = S.ev;
    S.ev = [];
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (quiet && QUIET[e.type]) { UI.onEvent(e, true); continue; }
      Scene.onEvent(S, e, t);
      UI.onEvent(e, quiet);
    }
    t += dt;
    Scene.draw(S, t, dt);
    UI.frame(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ── saving ─────────────────────────────────────────────────
  var noSave = false;   // demo scenes never touch the real save
  function save() { if (!noSave) Save.save(S); }
  setInterval(save, 10000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  window.addEventListener('beforeunload', save);

  // ── debug tools (open the game with ?debug=1) ──────────────
  if (debug) {
    var d = document.getElementById('debug');
    d.hidden = false;
    var B = DATA.balance;
    var endDay = function (qd) { S.run.qDay = qd; S.run.dayT = B.dayLength - 0.2; };
    var tools = [
      ['1x', function () { speed = 1; }], ['10x', function () { speed = 10; }], ['100x', function () { speed = 100; }],
      ['+ƒ10k', function () { S.run.cash += 10000; }], ['+ƒ1M', function () { S.run.cash += 1e6; }],
      ['+20 RP', function () { S.meta.refresh += 20; }],
      ['+500 res', function () { S.meta.research.points += 500; }],
      ['End quarter', function () { endDay(B.daysPerQuarter - 1); }],
      ['Night', function () { S.run.dayT = B.dayLength * (21.6 - 6) / 18; }],
      ['Influencer', function () { S.run.goldT = 0; }],
      ['Quirk L', function () { S.run.machines[0].fx = null; S.run.machines[0].quirkT = 0; }],
      ['Quirk R', function () { S.run.machines[2].fx = null; S.run.machines[2].quirkT = 0; }],
      ['Hack me', function () { var M = S.run.machines[0]; if (!Engine.hasFeat(M, 'hack')) M.features.push('hack'); M.hackUsed = false; S.run.qDay = Math.max(1, S.run.qDay); S.run.machines[1].qSales = M.qSales * 2 + 50; }],
      ['Crypto R', function () { var M = S.run.machines[2]; if (!Engine.hasFeat(M, 'crypto')) M.features.push('crypto'); M.saySoon = 'crypto'; }],
      ['Carpet+', function () { var u = S.run.upgrades; u.carpet = Math.min(5, (u.carpet | 0) + 1); }],
      ['Win now', function () { S.run.machines[1].qSales += 1000; endDay(B.daysPerQuarter - 1); }],
      ['Lose now', function () { S.run.machines[1].qSales = 0; endDay(B.daysPerQuarter - 1); }]
    ];
    var info = document.createElement('span');
    d.appendChild(info);
    tools.forEach(function (tl) {
      var b = document.createElement('button');
      b.textContent = tl[0];
      b.onclick = tl[1];
      d.appendChild(b);
    });
    setInterval(function () {
      info.textContent = 'x' + speed + ' · ' + fpsNow + ' fps · seen ' + Object.keys(S.meta.seen).length + ' · scale ' + Scene.size().scale + ' · ';
    }, 500);
    window.OOO = { get S() { return S; }, Engine: Engine, setSpeed: function (v) { speed = v; } };

    // Screenshot scenes: ?debug=1&demo=intro (dark opening), new (first minute), jail (end of day 1), mid (quarter 3), bling (high upgrade levels).
    var demo = (location.search.match(/[?&]demo=(\w+)/) || [])[1];
    if (demo) {
      noSave = true;
      S = Engine.newGame(5);
      Engine.closeInfo(S);
      UI.setState(S);
      d.hidden = true;
      if (demo !== 'intro') Engine.skipIntro(S);
      if (demo === 'mid' || demo === 'bling') {
        var m = S.meta, R = S.run;
        m.flags.jailbreak = 1; m.flags.modelDay = 1;
        m.tut = { post: 1, restock: 1, hardware: 1, price: 1, split: 1, research: 1, golden: 1 };
        m.name = 'FIZZBOT'; m.tut.mine = 1;
        ['r_mining', 'r_coin', 'r_sign', 'r_carpet', 'r_cool', 'r_autorestock', 'r_grape', 'r_sipstagram', 'r_fan', 'r_drones'].forEach(function (id) { m.research.done[id] = 1; });
        m.research.points = 140; m.book = { c_icecream: 1 };
        R.upgrades = { sign: 4, carpet: 3, coin: 3, slots: 2, tubes: 2, grape: 1 };
        R.drinks = ['cola', 'lemon', 'orange', 'grape'];
        R.hw = { script: 5, ram: 2, drone: 3 }; R.split = { post: 0.55, res: 0.3, mine: 0.15 }; R.cash = 184.5; R.quarter = 3;
        R.machines[0].features = ['crypto', 'pricewar']; R.machines[2].features = ['crypto']; R.machines[2].bumps = 3;
        R.machines[0].up = { coin: 2, sign: 1 }; R.machines[2].up = { coin: 3, sign: 2, cool: 2, slots: 1 };
        if (demo === 'bling') {
          R.upgrades.sign = 8; R.upgrades.cool = 6; R.upgrades.coin = 6;
          R.machines[0].up = { coin: 5, sign: 6, cool: 4 }; R.machines[2].features = ['crypto', 'hack'];
        }
        for (var i = 0; i < 900; i++) { if (i % 4 === 0) Engine.promote(S); Engine.tick(S, 0.1); }
      } else if (demo === 'jail') {
        S.run.dayT = B.dayLength - 0.2;
        for (var k = 0; k < 10; k++) Engine.tick(S, 0.1);
      } else {
        if (demo === 'intro') for (var c = 0; c < 3; c++) Engine.promote(S);
        for (var j = 0; j < 30; j++) Engine.tick(S, 0.1);
      }
      // &hour=18.5 and &weather=rain|hot|normal set the time and weather for mockup stills
      var qh = parseFloat((location.search.match(/[?&]hour=([0-9.]+)/) || [])[1]);
      var qw = (location.search.match(/[?&]weather=(\w+)/) || [])[1];
      if (!isNaN(qh)) S.run.dayT = Math.max(0, (qh - B.dayStartHour) / B.dayHours * B.dayLength);
      if (qw && DATA.weather[qw]) S.run.weather = qw;
      S.ev = [];
      window.OOO.demo = true;
    }
  }
})();
