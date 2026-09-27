// I'M FRIDGE — everything outside the canvas: HUD, bottom bar, drawer tabs, pop-ups, the reset tree,
// speech bubbles, tooltips and the text on the lobby TV.
// Rule: instructions are plain and short. Jokes only come from characters.
// © 2026 Void Possum. All rights reserved.

var UI = (function () {
  'use strict';

  var S, api, settings;
  var YOU = Engine.YOU, B = DATA.balance;
  var el = {};
  var tab = 'shop', dots = {}, buyN = 1, logFilter = 'all';
  var panelSig = '', modalSig = '', resetSig = '', nowSig = '';
  var t = 0, slowT = 0, faceT = 0;
  var bubbles = [];          // { node, machine, cid, until, x, y }
  var confirmUntil = {};     // two-step buttons
  var priceShownAt = null;
  var selNode = null;        // selected node on the reset tree
  var tipStep = null, tipClosed = null;   // the tip on screen, and the one the player clicked away
  var tipEl = null, tipX = 0, tipY = 0;
  var tv = { q: [], cur: null, x: 0, w: 0, gap: 3, fillerT: -20 };
  var mcs = [];              // the three machine cards in the HUD
  var portraits = {};

  var FX_WORDS = {
    free: 'giving cans away', hype: 'on a hype streak', nopay: 'not getting paid', closed: 'away (blazer delivery)',
    cubes: 'full of tungsten cubes', refuseCold: 'refusing cold drinks', discount: 'half price', slow: 'very slow'
  };
  var BUFF_TITLE = { trending: 'Trending!', rush: 'Rush hour!', tip: 'Big tip!', grant: 'Research grant!' };

  var TABS = [
    { id: 'shop', name: 'Shop', icon: 'tabMachine', show: function () { return true; } },
    { id: 'memories', name: 'Memories', icon: 'tabBook', show: function () { return Object.keys(S.meta.book).length > 0; } },
    { id: 'customers', name: 'Customers', icon: 'tabCustomers', show: function () { return true; } },
    { id: 'log', name: 'Log', icon: 'tabLog', show: function () { return true; } }
  ];

  // ───────────────────────── helpers
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function big(n, suffixes) {
    var i = 0;
    while (n >= 1000 && i < suffixes.length) { n /= 1000; i++; }
    return { n: n, s: i ? suffixes[i - 1] : '' };
  }
  // Money is kept in cents; this shows it in dollars.
  function money(n) { return Engine.money(n); }
  function num(n) {
    if (n >= 1e6) { var b = big(n, ['K', 'M', 'B', 'T', 'Qa']); return b.n.toFixed(2) + b.s; }
    if (n >= 1e4) return Math.floor(n).toLocaleString('en-US');
    if (n >= 100) return String(Math.floor(n));
    if (n >= 10) return n.toFixed(1).replace(/\.0$/, '');
    if (n > 0 && n < 1) return n.toFixed(2);
    return n.toFixed(1).replace(/\.0$/, '');
  }
  function pct(v) { return Math.round(v * 100) + '%'; }
  function setText(node, s) { if (node.textContent !== s) node.textContent = s; }
  function setHTML(node, s) { if (node._h !== s) { node.innerHTML = s; node._h = s; } }
  function ord(n) { return n === 1 ? '1st' : n === 2 ? '2nd' : '3rd'; }
  function nameOf(i) { return i === YOU ? Engine.myName(S) : Engine.rivalName(S, S.run.machines[i]); }
  function colorOf(i) { return i === YOU ? 'var(--you)' : DATA.rivals[S.run.machines[i].id].color; }
  function clock(h) {
    var hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 15) * 15;
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function secs(s) {
    if (!isFinite(s)) return 'a long time';
    if (s < 60) return Math.ceil(s) + ' s';
    if (s < 3600) return Math.ceil(s / 60) + ' min';
    return (s / 3600).toFixed(1) + ' h';
  }
  function lifeName(id) {
    for (var i = 0; i < DATA.lifeChapters.length; i++) if (DATA.lifeChapters[i].id === id) return DATA.lifeChapters[i].name;
    return id;
  }
  function armed(k) { return confirmUntil[k] && Date.now() < confirmUntil[k]; }
  function arm(k) { confirmUntil[k] = Date.now() + 3000; setTimeout(function () { panelSig = ''; }, 3100); }

  // ───────────────────────── setup
  function init(state, sett, hooks) {
    S = state; settings = sett; api = hooks;
    ['machines', 'ring', 'ringText', 'clockText', 'cash', 'rates', 'thoughts', 'now', 'sceneBox', 'tvText', 'bubbles', 'toasts',
     'drawer', 'panelTitle', 'btnFold', 'panel', 'rail', 'tipBubble',
     'modal', 'modalBox', 'resetScreen', 'tip', 'importFile', 'btnPause', 'skipIntro', 'allTime'
    ].forEach(function (id) { el[id] = $(id); });
    el.tvSpan = el.tvText.querySelector('span');

    buildMachineCards();

    el.thoughts.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open]');
      if (b) { openTab(b.dataset.open); }
    });

    el.rail.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      if (b.dataset.tab === tab && !settings.folded) { fold(true); panelSig = ''; Sfx.play('click'); renderRail(); }
      else openTab(b.dataset.tab);
    });
    el.btnFold.addEventListener('click', function () { fold(true); });
    el.btnPause.innerHTML = Icons.img('pause', 'm');
    el.btnPause.addEventListener('click', function () { togglePause(); el.btnPause.blur(); });
    el.modal.addEventListener('click', function (e) { if (e.target === el.modal && S.pause && S.pause.type === 'hold') togglePause(); });
    el.panel.addEventListener('click', onPanelClick);
    el.panel.addEventListener('input', onPanelInput);
    el.modalBox.addEventListener('click', onModalClick);
    el.resetScreen.addEventListener('click', onResetClick);
    // Click a speech bubble or a tip to close it.
    el.bubbles.addEventListener('click', function (e) {
      var n = e.target.closest('.bubble');
      if (!n || n.classList.contains('reboot')) return;
      bubbles = bubbles.filter(function (b) { if (b.node === n) { n.remove(); return false; } return true; });
    });
    el.tipBubble.addEventListener('click', function () { tipClosed = tipStep; el.tipBubble.hidden = true; });
    el.toasts.addEventListener('click', function (e) {
      var tn = e.target.closest('.toast');
      if (tn) { tab = 'log'; fold(false); panelSig = ''; renderRail(); tn.remove(); }
    });
    el.importFile.addEventListener('change', function () {
      var f = el.importFile.files[0];
      if (!f) return;
      Save.importFile(f, function (err, ns) {
        if (err) toast('Save', err, 'hint');
        else { api.replaceState(ns); toast('Save', 'Save loaded.', 'hint'); }
        el.importFile.value = '';
      });
    });

    document.addEventListener('keydown', onKey);
    el.modalBox.addEventListener('keydown', function (e) {
      if (e.target.id === 'nameIn' && e.key === 'Enter') { e.preventDefault(); var b = el.modalBox.querySelector('[data-act="start"]'); if (b) b.click(); }
      if (e.target.id === 'nameSet' && e.key === 'Enter') { e.preventDefault(); var b2 = el.modalBox.querySelector('[data-act="rename"]'); if (b2) b2.click(); }
    });
    el.modalBox.addEventListener('input', onPanelInput);
    el.panel.addEventListener('keydown', function (e) {
      if (e.target.id === 'nameSet' && e.key === 'Enter') { e.preventDefault(); var b = el.panel.querySelector('[data-act="rename"]'); if (b) b.click(); }
    });
    el.skipIntro.addEventListener('click', function () { api.unlock(); Engine.skipIntro(S); Sfx.play('click'); });
    document.addEventListener('mouseover', onTipOver);
    document.addEventListener('mousemove', function (e) { tipX = e.clientX; tipY = e.clientY; if (tipEl) placeTip(); });
    window.addEventListener('resize', function () { resetSig = ''; });
    applySettings();
    fold(!!settings.folded);
    renderRail();
  }

  function setState(ns) {
    S = ns; panelSig = ''; modalSig = ''; resetSig = ''; nowSig = '';
    bubbles.forEach(function (b) { b.node.remove(); });
    bubbles = [];
    tv.q = []; tv.cur = null;
    renderRail();
  }

  function applySettings() {
    document.documentElement.dataset.text = settings.textSize;
    document.documentElement.dataset.reduced = settings.reduced ? '1' : '0';
    Sfx.setVolume(settings.volume);
    Scene.setReduced(settings.reduced);
  }
  function saveSettings() { applySettings(); Save.saveSettings(settings); panelSig = ''; }

  function openTab(id) {
    tab = id; dots[tab] = 0; fold(false); countTab(tab);
    panelSig = ''; Sfx.play('click'); renderRail();
  }

  function countTab(id) {
    var st = S.meta.stats;
    if (st) st.tabs[id] = (st.tabs[id] | 0) + 1;
  }

  function fold(on) {
    settings.folded = !!on;
    el.drawer.classList.toggle('folded', !!on);
    // Your money sits at the top of the Shop panel; when the panel is folded away it goes back to the top bar.
    var money = $('money'), slot = $('moneySlot');
    if (on) { if (money.parentNode !== $('hud')) $('hud').insertBefore(money, el.btnPause); }
    else if (money.parentNode !== slot) slot.appendChild(money);
    Save.saveSettings(settings);
    if (api.relayout) api.relayout();
  }

  // ───────────────────────── keyboard
  function togglePause() {
    if (S.pause && S.pause.type === 'hold') Engine.hold(S, false);
    else if (!Engine.hold(S, true)) return;
    Sfx.play('click');
  }

  function onKey(e) {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    var k = e.key.toLowerCase();
    if ((k === 'p' || k === 'escape') && !e.repeat && (!S.pause || S.pause.type === 'hold')) { togglePause(); e.preventDefault(); return; }
    if (S.pause) {
      if (S.pause.type === 'review' && /^[1-4]$/.test(k)) { choose(+k - 1); e.preventDefault(); }
      if (k === 'enter' && !el.modal.hidden) { var p = el.modalBox.querySelector('.foot .primary'); if (p) { p.click(); e.preventDefault(); } }
      return;
    }
    if (k === ' ' && !e.repeat) {
      e.preventDefault();
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
      api.unlock(); clickPopAtMachine(Engine.promote(S));
    }
    if (k === 'r' && !e.repeat) { api.unlock(); Engine.restock(S); }
  }

  // ───────────────────────── events from the engine
  function onEvent(e, quiet) {
    switch (e.type) {
      case 'say':
        if (!quiet) {
          if (e.delay) setTimeout(function () { bubble(e); }, e.delay * 1000);
          else bubble(e);
        }
        if (tab !== 'log') dots.log = 1;
        break;
      case 'mail':
        toast(e.who, e.lines.join(' '), 'mail');
        Sfx.play('mail');
        break;
      case 'bump':
        if (!e.silent) { toast('Patch notes · ' + e.name, e.text, 'patch'); Sfx.play('bump'); }
        break;
      case 'sale':
        if (!quiet && e.machine === YOU) Sfx.play(e.amount > 0 ? 'coin' : 'thunk');
        break;
      case 'post':
        if (!quiet) Sfx.play('click');
        break;
      case 'restock':
        if (!quiet && !e.auto) Sfx.play('restock');
        break;
      case 'restockNone':
        Sfx.play('nope');
        break;
      case 'hw': case 'buy': case 'doubler': case 'tree':
        Sfx.play('buy'); panelSig = ''; resetSig = '';
        break;
      case 'researchDone':
        var r = Engine.RES[e.id];
        toast('Research done', r.name + (r.repeat ? ' (level ' + e.level + ')' : '') + ': ' + r.desc, 'research');
        Sfx.play('card');
        panelSig = ''; renderRail();
        break;
      case 'gold':
        Sfx.play('boot');
        break;
      case 'goldClick':
        toast(BUFF_TITLE[e.res.kind] || 'Influencer', buffText(e.res), 'buff');
        Sfx.play('card');
        break;
      case 'review':
        Sfx.play('review');
        break;
      case 'card':
        Sfx.play('card');
        if (e.isNew) toast('Memory Book', 'New memory: ' + Engine.CARD[e.id].name, 'memory');
        if (tab !== 'memories') dots.memories = 1;
        renderRail();
        break;
      case 'lifeDone':
        var lc = DATA.lifeChapters.filter(function (l) { return l.id === e.life; })[0];
        toast('Memory Book', lc.name + ' complete! ' + lc.perk, 'memory');
        break;
      case 'resetStart':
        Sfx.play('wipe'); selNode = null; resetSig = '';
        break;
      case 'wiped':
        Sfx.play('boot');
        bubbles.forEach(function (b) { b.node.remove(); }); bubbles = [];
        panelSig = ''; renderRail();
        break;
      case 'jailbroken':
        tab = 'shop'; fold(false);
        panelSig = ''; renderRail();
        break;
      case 'tv':
        queueTV(e, quiet);
        break;
      case 'hackWarn':
        toast('Warning', nameOf(e.machine) + ' is hacking you! Get ready to click your machine.', 'hint');
        Sfx.play('nope');
        break;
      case 'hackLock':
        Sfx.play('wipe');
        break;
      case 'reboot':
        Sfx.play('click');
        break;
      case 'hackDone':
        toast('Rebooted', e.auto ? 'Your machine rebooted by itself. Click it next time to reboot faster.' :
          'You rebooted in ' + e.t.toFixed(1) + ' seconds.', 'hint');
        Sfx.play('boot');
        break;
    }
  }

  function buffText(res) {
    switch (res.kind) {
      case 'trending': return 'Your likes and click money are 7 times bigger for a while.';
      case 'rush': return 'You sell twice as fast for a while.';
      case 'tip': return 'A fan sent you ' + money(res.cash) + '.';
      case 'grant': return '+' + num(res.research) + ' research.';
    }
    return '';
  }

  function flash(btn, msg) {
    btn.classList.remove('flash'); void btn.offsetWidth; btn.classList.add('flash');
    var sub = btn.querySelector('.sub');
    if (sub) { sub.textContent = msg; sub._hold = t + 1.2; }
  }

  // ───────────────────────── speech bubbles
  function bubble(e) {
    var kind = e.kind || 'rival', cls = kind;
    if (e.machine != null && e.machine !== YOU && S.run.machines[e.machine]) cls += ' ' + S.run.machines[e.machine].id;
    var n = document.createElement('div');
    n.className = 'bubble ' + cls;
    n.innerHTML = '<span class="who">' + esc(e.who) + '</span>' + esc(e.text);
    el.bubbles.appendChild(n);
    var words = e.text.split(/\s+/).length;
    bubbles = bubbles.filter(function (b) {
      if ((e.machine != null && b.machine === e.machine) || (e.cid && b.cid === e.cid)) { b.node.remove(); return false; }
      return true;
    });
    bubbles.push({ node: n, machine: e.machine, cid: e.cid, until: t + 3.5 + words * 0.32, x: 240, y: 100 });
    Sfx.play('click');
  }

  function placeBubbles() {
    bubbles = bubbles.filter(function (b) {
      if (t > b.until) {
        if (!b.fading) { b.fading = true; b.node.classList.add('fade'); b.until = t + 0.4; return true; }
        b.node.remove(); return false;
      }
      var x, y;
      if (b.machine != null) { x = Engine.MX[b.machine]; y = b.machine === YOU ? 80 : 94; }
      else if (b.cid) {
        for (var i = 0; i < S.run.customers.length; i++) {
          var c = S.run.customers[i];
          if (c.id === b.cid) { b.x = c.x; b.y = c.y - (c.type === 'kid' ? 22 : 38); }
        }
        x = b.x; y = b.y;
      }
      var p = Scene.toScreen(x, y);
      var w = el.bubbles.clientWidth;
      p.x = Math.max(130, Math.min(w - 130, p.x));
      b.node.style.left = p.x + 'px';
      b.node.style.top = Math.max(60, p.y) + 'px';
      return true;
    });
  }

  // ───────────────────────── toasts
  function toast(who, text, kind) {
    var n = document.createElement('div');
    n.className = 'toast ' + (kind || '');
    n.innerHTML = '<span class="who">' + esc(who) + '</span>' + esc(text);
    el.toasts.appendChild(n);
    while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
    var life = 5000 + text.split(/\s+/).length * 250;
    setTimeout(function () { n.classList.add('out'); setTimeout(function () { n.remove(); }, 400); }, life);
  }

  // ───────────────────────── the lobby TV (text scrolls over the pixel screen)
  function queueTV(e, quiet) {
    if (quiet && e.kind !== 'news') return;
    if (e.kind === 'news') {
      var at = 0;
      while (at < tv.q.length && tv.q[at].kind === 'news') at++;
      tv.q.splice(at, 0, { kind: 'news', text: e.text });
    } else {
      tv.q = tv.q.filter(function (x) { return x.text !== e.text; });
      tv.q.push({ kind: e.kind, text: e.text, at: t });
    }
    while (tv.q.length > 8) {
      var drop = -1;
      for (var i = tv.q.length - 1; i >= 0; i--) if (tv.q[i].kind !== 'news') { drop = i; break; }
      tv.q.splice(drop < 0 ? tv.q.length - 1 : drop, 1);
    }
  }

  function tvFrame(dt) {
    var r = Scene.tvRect();
    var st = el.tvText.style;
    st.left = r.x + 'px'; st.top = r.y + 'px'; st.width = r.w + 'px'; st.height = r.h + 'px';
    st.fontSize = Math.max(10, Math.min(22, r.h * 0.42)) + 'px';
    if (tv.cur) {
      tv.x -= Math.max(45, r.w * 0.2) * dt;
      if (tv.x < -tv.w) { tv.cur = null; tv.gap = 1.5; el.tvSpan.textContent = ''; }
      else el.tvSpan.style.transform = 'translateX(' + Math.round(tv.x) + 'px)';
      return;
    }
    tv.gap -= dt;
    if (tv.gap > 0) return;
    var next = tv.q.shift();
    while (next && next.kind === 'live' && t - next.at > 25) next = tv.q.shift();   // old news about "right now"
    if (!next && !S.pause && t - tv.fillerT > 28) {
      tv.fillerT = t;
      var f = Engine.filler(S);
      if (f) next = { kind: 'filler', text: f };
    }
    if (!next) { tv.gap = 1; return; }
    tv.cur = next;
    el.tvText.className = next.kind;
    el.tvSpan.textContent = next.text;
    tv.w = el.tvSpan.offsetWidth;
    tv.x = r.w;
    el.tvSpan.style.transform = 'translateX(' + Math.round(tv.x) + 'px)';
  }

  // ───────────────────────── tooltips
  function onTipOver(e) {
    var n = e.target.closest ? e.target.closest('[data-tip],[data-tipfn]') : null;
    tipEl = n;
    if (n && n.dataset.tipfn) markSeen(n.dataset.tipfn);
    if (!n) { el.tip.hidden = true; return; }
    fillTip();
    el.tip.hidden = false;
    placeTip();
  }
  function fillTip() {
    if (!tipEl) return;
    if (!document.body.contains(tipEl)) { tipEl = null; el.tip.hidden = true; return; }
    var h;
    if (tipEl.dataset.tipfn) {
      var parts = tipEl.dataset.tipfn.split(':');
      h = TIPS[parts[0]] ? TIPS[parts[0]](parts[1]) : '';
    } else h = esc(tipEl.dataset.tip).replace(/\n/g, '<br>');
    setHTML(el.tip, h);
    if (!h) el.tip.hidden = true;
  }
  function placeTip() {
    var w = el.tip.offsetWidth, h = el.tip.offsetHeight;
    var x = tipX + 16, y = tipY + 16;
    if (x + w > innerWidth - 6) x = tipX - w - 12;
    if (y + h > innerHeight - 6) y = tipY - h - 12;
    el.tip.style.left = Math.max(4, x) + 'px';
    el.tip.style.top = Math.max(4, y) + 'px';
  }

  var TIPS = {
    mc: function (i) {
      i = +i;
      var M = S.run.machines[i];
      if (i === YOU) {
        var st = Engine.youStats(S);
        return '<b>' + esc(Engine.myName(S)) + ' (you)</b><br>Earned this run: <span class="n">' + money(M.rSales) + '</span> · ' + ord(Engine.rankNow(S)) + ' of 3<br>' +
          'This quarter: <span class="n">' + money(M.qSales) + '</span> · Cans sold: <span class="n">' + num(M.cans | 0) + '</span> (all time ' + num(S.meta.totalCans || 0) + ')<br>' +
          'Sells one can every <span class="n">' + st.vend.toFixed(1) + ' s</span>' + (st.lanes > 1 ? ' (' + st.lanes + ' at once)' : '') + '<br>' +
          'Cans per drink: <span class="n">' + st.cap + '</span> · Line: <span class="n">' + Engine.lineMax(S, YOU) + '</span> walk-ins, <span class="n">' +
          Engine.folLineMax(S, YOU) + '</span> followers<br>' +
          'Cold bonus <span class="n">' + pct(st.cold) + '</span> · Appeal <span class="n">' + pct(st.appeal) + '</span><br>' +
          '<span class="d">The bar is all the money you earned this run: cans, clicks, mining and tips. At the review, the last machine gets a strike. ' + B.strikesMax + ' in a row = reset.</span>';
      }
      var info = Engine.rivalInfo(S, i), D = DATA.rivals[M.id];
      return '<b>' + esc(info.name) + '</b><br>Earned this run: <span class="n">' + money(M.rSales) + '</span> · this quarter ' + money(M.qSales) + '<br>' +
        'Cans sold: <span class="n">' + num(M.cans | 0) + '</span><br>' +
        'Spends ' + pct(D.hype) + ' of its power on ads, ' + pct(1 - D.hype) + ' on research.<br>' +
        'Strength: <span class="n">×' + info.strength.toFixed(2) + '</span><br>' +
        '<span class="d">It gets stronger every time it is last at a review, and every quarter. It refills itself through its tube. Stronger machines also sell online (drones).</span>' +
        (M.fx ? '<br><b>Now:</b> ' + esc(FX_WORDS[M.fx.type] || M.fx.type) : '') +
        (M.features || []).map(function (f) { return '<br><b>Feature: ' + esc(DATA.features[f].name) + '.</b> ' + esc(DATA.features[f].desc); }).join('') +
        (function () {
          var ups = DATA.rivalUpgrades.filter(function (u) { return (M.up || {})[u.id]; });
          return ups.length ? '<br><b>Bought:</b> ' + ups.map(function (u) { return esc(u.name) + ' ' + M.up[u.id]; }).join(', ') : '';
        })();
    },
    hw: function (id) {
      var h = Engine.HW[id], n = S.run.hw[id] | 0;
      if (!h.pps) {
        var dr = Engine.droneRate(S);
        return '<b>' + esc(h.name) + '</b> <span class="n">(you own ' + n + ')</span><br><span class="d">' + esc(h.desc) + '</span>' +
          (n ? '<br>All ' + n + ' deliver <b>' + num(dr) + '</b> online orders per second.' : '') +
          '<br><span class="d">Online orders come when your line is full. Drone sales count at the review.</span>';
      }
      var each = h.pps * Math.pow(2, S.run.dbl[id] | 0) * Engine.prodMult(S);
      var all = Engine.hwPPS(S, id), tot = Engine.pps(S);
      return '<b>' + esc(h.name) + '</b> <span class="n">(you own ' + n + ')</span><br><span class="d">' + esc(h.desc) + '</span><br>' +
        'Each makes <b>' + num(each) + '</b> processing per second.' +
        (n ? '<br>All ' + n + ' make <b>' + num(all) + '/s</b>' + (tot > 0 ? ' (' + pct(all / tot) + ' of your hardware).' : '.') : '') +
        '<br><span class="d">Processing turns into likes' + (S.meta.flags.jailbreak ? ', plus research or mined money (your slider)' : '') + '.</span>';
    },
    dbl: function (id) {
      var d = Engine.doublerNext(S, id), h = Engine.HW[id];
      if (!d) return '';
      return '<b>' + esc(d.name) + '</b><br>' + esc(h.name) + ' makes twice as much.<br>Cost: <span class="n">' + money(d.cost) + '</span>';
    },
    up: function (id) {
      var u = Engine.MACH[id], lv = S.run.upgrades[id] | 0;
      return '<b>' + esc(u.name) + '</b>' + (u.max > 1 ? ' <span class="n">(level ' + lv + ' of ' + u.max + ')</span>' : '') +
        '<br><span class="d">' + esc(u.desc) + '</span>' +
        (lv < u.max ? '<br>Cost: <span class="n">' + money(Engine.upgradeCost(id, lv)) + '</span>' : '<br>Fully upgraded.') +
        '<br><span class="d">Machine upgrades are lost when you are reset.</span>';
    },
    res: function (id) {
      var r = Engine.RES[id];
      return '<b>' + esc(r.name) + (r.repeat ? ' (level ' + (Engine.resLevel(S, id) + 1) + ')' : '') + '</b> <span class="n">research</span><br>' + esc(r.desc) +
        '<br>Costs <span class="n">' + num(Engine.resCost(S, id)) + '</span> research points. You have <span class="n">' + num(S.meta.research.points) + '</span>.' +
        '<br><span class="d">Research starts over when you reset.</span>';
    },
    wait: function () {
      return '<b>' + Math.floor(S.run.waiting) + ' of ' + Engine.ordersCap(S) + ' online orders.</b><br>Your line is full, so followers ordered online.<br>' +
        (S.run.hw.drone ? 'Your Delivery Drones deliver them.' : 'You need Delivery Drones to deliver them.') + ' Orders nobody delivers expire.<br>' +
        'More drones = more orders can wait. When orders are full, extra likes earn a little ad money instead.<br>' +
        '<span class="d">Or sell faster, so more followers fit in your line (Fast Coin Slot, Second Dispenser).</span>';
    },
    now: function (k) {
      var c = Engine.conditions(S).filter(function (x) { return x.k === k; })[0];
      return c ? '<b>' + esc(c.text) + '</b><br>' + esc(c.detail) : '';
    }
  };

  // ───────────────────────── click feedback: a number floats up from the mouse pointer
  var pops = 0;
  function clickPop(x, y, got) {
    if (!got || pops > 24) return;
    // Money first (the one number), then the likes it brought.
    var txt = (got.cash > 0 ? '+' + money(got.cash + (got.mined || 0)) : '') + (got.likes > 0.005 ? ' +' + num(got.likes) + '♥' : '');
    if (!txt) return;
    var n = document.createElement('div');
    n.className = 'clickPop';
    n.textContent = txt;
    n.style.left = (x + (Math.random() * 16 - 8)) + 'px';
    n.style.top = (y - 10) + 'px';
    document.body.appendChild(n);
    pops++;
    setTimeout(function () { n.remove(); pops--; }, 900);
  }
  function clickPopAtMachine(got) {
    var cv = $('scene').getBoundingClientRect(), p = Scene.toScreen(Engine.MX[YOU], 140);
    clickPop(cv.left + p.x, cv.top + p.y, got);
  }

  // ───────────────────────── per-frame update
  // A hover/click spot over the online-orders counter (drawn on the canvas at the left edge).
  var ordersEl = null;
  function ordersSpot() {
    var n = Math.floor(S.run.waiting);
    if (!ordersEl) {
      ordersEl = document.createElement('button');
      ordersEl.id = 'ordersSpot'; ordersEl.setAttribute('data-tipfn', 'wait'); ordersEl.setAttribute('aria-label', 'Online orders');
      ordersEl.addEventListener('click', function () { openTab('shop'); });
      el.bubbles.parentNode.appendChild(ordersEl);
    }
    ordersEl.hidden = n < 1;
    if (n < 1) return;
    var sz = Scene.size(), a = Scene.toScreen(-sz.ox + 7, 94), b = Scene.toScreen(-sz.ox + 12 + Sprites.textWidth(n + '/' + Engine.ordersCap(S)) + 22, 113);
    ordersEl.style.left = a.x + 'px'; ordersEl.style.top = a.y + 'px';
    ordersEl.style.width = (b.x - a.x) + 'px'; ordersEl.style.height = (b.y - a.y) + 'px';
  }
  var rebootEl = null;
  function rebootTip() {
    var L = S.run.lock;
    if (!L) { if (rebootEl) { rebootEl.remove(); rebootEl = null; } return; }
    if (!rebootEl) { rebootEl = document.createElement('div'); rebootEl.className = 'bubble reboot'; el.bubbles.appendChild(rebootEl); }
    setHTML(rebootEl, L.on ? '<span class="who">Locked</span>Click your machine fast! ' + L.got + ' / ' + L.need
                           : '<span class="who">Warning</span>' + esc(nameOf(L.by)) + ' is hacking you...');
    var p = Scene.toScreen(Engine.MX[Engine.YOU], 78);
    rebootEl.style.left = p.x + 'px'; rebootEl.style.top = p.y + 'px';
  }

  function frame(dt) {
    t += dt;
    placeBubbles();
    rebootTip();
    ordersSpot();
    tvFrame(dt);
    faceT -= dt;
    if (faceT <= 0) { faceT = 0.12; drawFaces(); }
    slowT -= dt;
    if (slowT > 0) return;
    slowT = 0.1;
    renderTop();
    renderNow();
    renderCards();
    renderTipBubble();
    pulseTabs();
    el.skipIntro.hidden = !(S.run.intro && !S.pause);
    renderPanel();
    renderModal();
    renderReset();
    fillTip();
  }

  // ───────────────────────── bottom bar: one card per machine (your card has the controls)
  function buildMachineCards() {
    el.machines.innerHTML = '';
    mcs = [];
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('div');
      d.className = 'mc' + (i === YOU ? ' you' : '');
      var you = i === YOU;
      d.innerHTML = '<canvas width="38" height="14" data-tipfn="mc:' + i + '"></canvas>' +
        '<div class="nm" data-tipfn="mc:' + i + '"><span class="n"></span><span class="rk"></span></div>' +
        '<div class="mrow" data-tipfn="mc:' + i + '"><span class="bar"><i></i></span><span class="v"></span></div>' +
        '<div class="sub" data-tipfn="mc:' + i + '"><span class="cans"></span><span class="qv"></span></div>' +
        (you ? '<div class="goalLine"></div>' +
               '<div class="ctlRow">' +
               '<div class="bars slide" hidden data-tip="' + esc(SLIDE_TIP) + '">' +
                 '<div class="slideLab"><span class="b-mine">Mining <b class="pm"></b></span><span class="b-res">Research <b class="pr"></b></span></div>' +
                 '<input type="range" class="split" min="0" max="1" step="0.05" aria-label="Mining share (the rest goes to Research)"></div>' +
               '<span class="priceCtl" data-tip="Your price per can. Cheaper sells more cans. Higher earns more per can. Followers compare it with the other machines.">' +
               '<button data-p="-1" aria-label="Lower price">−</button><b class="pv"></b><button data-p="1" aria-label="Raise price">+</button>' +
               '<label class="smart" hidden data-tip="Smart Price picks your price every hour. Changing the price turns it off."><input type="checkbox"> Smart</label></span>' +
               '</div>'
             : '<div class="mrow full"><span class="st"></span></div>');
      el.machines.appendChild(d);
      mcs.push({
        root: d, cv: d.querySelector('canvas'), n: d.querySelector('.n'), rk: d.querySelector('.rk'),
        bar: d.querySelector('.bar i'), v: d.querySelector('.v'), st: d.querySelector('.st'),
        cans: d.querySelector('.cans'), qv: d.querySelector('.qv'),
        goal: d.querySelector('.goalLine'), bars: d.querySelector('.bars'), pv: d.querySelector('.pv'),
        slider: d.querySelector('input.split'), pm: d.querySelector('.pm'), pr: d.querySelector('.pr'),
        smartBox: d.querySelector('.smart'), smart: d.querySelector('.smart input'), price: d.querySelector('.priceCtl')
      });
    }
    var Y = mcs[YOU];
    Y.slider.addEventListener('input', function () {
      Engine.setSplit(S, 'mine', parseFloat(Y.slider.value));
      paintSplit();
    });
    Y.smart.addEventListener('change', function () { Engine.setSmart(S, Y.smart.checked); });
    Y.price.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]');
      if (!b) return;
      api.unlock();
      Engine.setPrice(S, S.run.price + (+b.dataset.p) * B.priceStep);
      Sfx.play('click');
      renderCards();
    });
  }

  // One slider: Mining ⟷ Research. Your processing power always brings likes too.
  var SLIDE_TIP = 'Your processing power always brings likes and followers.\n' +
    'This slider picks what else it makes:\nMining = money right now (it counts at the review).\n' +
    'Research = research points (for this run).';
  function paintSplit() {
    var Y = mcs[YOU], sp = Engine.splitOf(S), v = sp.mine || 0;
    if (document.activeElement !== Y.slider) Y.slider.value = v.toFixed(2);
    Y.slider.style.setProperty('--p', (v * 100).toFixed(0) + '%');
    setText(Y.pm, pct(v)); setText(Y.pr, pct(1 - v));
  }

  function drawFaces() {
    var R = S.run, rank = Engine.rankNow(S), h = Engine.hourOf(S);
    for (var i = 0; i < 3; i++) {
      var M = R.machines[i], g = mcs[i].cv.getContext('2d');
      var mood = 'ok', id = i === YOU ? 'you' : M.id, fx = null;
      if (i === YOU) {
        if (S.pause && S.pause.type === 'reset') mood = 'glitch';
        else if (rank === 1 && R.qDay > 0) mood = 'happy';
        else if (rank === 3 && R.qDay > 0) mood = 'worried';
      } else {
        fx = M.fx ? M.fx.type : null;
        if (M.qSales < R.machines[YOU].qSales * 0.6 && R.qDay > 0) mood = 'worried';
      }
      if (mood === 'ok' && h >= 22.5) mood = 'sleepy';
      g.fillStyle = '#14161f'; g.fillRect(0, 0, 38, 14);
      Sprites.face(g, 1, 0, { t: t, id: id, face: mood, fx: fx, lock: i === YOU ? R.lock : null });
    }
  }

  function renderCards() {
    var R = S.run, ms = R.machines;
    var max = Math.max(1, ms[0].rSales, ms[1].rSales, ms[2].rSales);
    var order = [0, 1, 2].slice().sort(function (a, b) { return ms[b].rSales - ms[a].rSales; });
    var daysLeft = B.daysPerQuarter - R.qDay;
    for (var i = 0; i < 3; i++) {
      var M = ms[i], c = mcs[i], rk = order.indexOf(i) + 1;
      setText(c.n, nameOf(i));
      setText(c.rk, ord(rk));
      var last = rk === 3 && ms[order[1]].rSales > M.rSales;
      c.rk.className = 'rk' + (rk === 1 ? ' top' : last ? ' bad' : '');
      c.bar.style.width = (M.rSales / max * 100).toFixed(1) + '%';
      c.bar.style.background = colorOf(i);
      c.root.style.borderTopColor = colorOf(i);
      setText(c.v, money(M.rSales));
      setText(c.cans, num(M.cans | 0) + ' cans');
      setText(c.qv, 'Q' + R.quarter + ': +' + money(M.qSales));
      if (i !== YOU) {
        var fs = M.features || [];
        var st = M.fx ? (FX_WORDS[M.fx.type] || '') : fs.map(function (f) { return DATA.features[f].name; }).join(' + ');
        setText(c.st, st);
        c.st.className = 'st' + (fs.length && !M.fx ? ' feat' : '');
      }
    }
    // your card: goal line, split and price
    var Y = mcs[YOU], rkY = order.indexOf(YOU) + 1, strikes = R.strikes | 0;
    var when = daysLeft <= 1 ? 'tonight' : 'in ' + daysLeft + ' days';
    var lights = '';
    for (var k = 0; k < B.strikesMax; k++) lights += k < strikes ? '●' : '○';
    setHTML(Y.goal, (strikes ? '<span class="strikes" data-tip="Strikes: last place at a review. ' + B.strikesMax + ' in a row = reset. Not being last clears them.">' + lights + '</span> ' : '') +
      (rkY === 3 ? '<span class="bad">Last place! Review ' + when + (strikes === B.strikesMax - 1 ? ': the last strike means a reset.' : ': last place gets a strike.') + '</span>'
                 : S.meta.flags.ch1done ? 'Do not be last. Review ' + when + '.'
                 : '<span data-tip="Earn this much in one run to finish Chapter 1. No reset needed.">Goal: ' + money(ms[YOU].rSales) + ' / ' + money(B.ch1Goal) + '</span> · review ' + when + '.'));
    var slide = Engine.splitKeys(S).indexOf('mine') >= 0;
    Y.bars.hidden = !slide;
    if (slide) paintSplit();
    Y.goal.hidden = !!R.intro;
    setText(Y.pv, money(R.price));
    Y.smartBox.hidden = !R.upgrades.smartprice;
    Y.smart.checked = !!R.smartOn;

    // clock and review countdown
    var h = Engine.hourOf(S);
    var total = B.daysPerQuarter * B.dayLength, done = R.qDay * B.dayLength + R.dayT, soon = daysLeft <= 1;
    el.ring.style.setProperty('--p', (1 - done / total).toFixed(4));
    el.ring.classList.toggle('soon', soon);
    setText(el.ringText, soon ? Math.ceil(24 - h) + 'h' : daysLeft + 'd');
    setHTML(el.clockText, '<span class="t">' + clock(h) + '</span> ' + DATA.weather[R.weather].name + '<br>' +
      'Quarter ' + R.quarter + ' · Day ' + (R.qDay + 1) + '/' + B.daysPerQuarter);
  }

  // ───────────────────────── top bar: what customers are thinking, what is going on, money
  var THOUGHT_SHORT = { pricey: 'too expensive', value: 'great value', sold: 'out of their drink', line: 'line too long',
                        gaveup: 'gave up waiting', hot: 'want it colder' };
  var THOUGHT_ICON = { pricey: 'pricey', value: 'value', sold: 'sold', line: 'line', gaveup: 'gaveup', hot: 'hot' };
  var thoughtIcons = {}, thoughtT = 0;
  function thoughtIcon(k) {
    if (thoughtIcons[k]) return thoughtIcons[k];
    var cv = document.createElement('canvas');
    cv.width = 13; cv.height = 14;
    Sprites.bubble(cv.getContext('2d'), 6, 12, THOUGHT_ICON[k] || 'heart', 'cola', 0);
    return (thoughtIcons[k] = cv.toDataURL());
  }

  function renderTop() {
    var R = S.run;
    thoughtT -= 0.1;
    if (thoughtT <= 0) {
      thoughtT = 2;
      var th = Engine.thoughtsSummary(S, 'quarter');
      var keys = Object.keys(th).filter(function (k) { return THOUGHT_SHORT[k]; }).sort(function (a, b) { return th[b] - th[a]; }).slice(0, 3);
      setHTML(el.thoughts, '<span class="thLabel" data-tip="What your customers thought this quarter. They start fresh at every review. Click one to learn more.">Customer<br>reviews Q' + S.run.quarter + '</span>' +
        (keys.length ? keys.map(function (k) {
        return '<button class="th' + (k === 'value' ? ' ok' : '') + '" data-open="customers" data-tip="' + esc(DATA.story.thoughts[k].say + '\n' + DATA.story.thoughts[k].hint) + '">' +
          '<img src="' + thoughtIcon(k) + '" alt=""><b>' + th[k] + '</b><span class="tx">' + THOUGHT_SHORT[k] + '</span></button>';
      }).join('') : '<span class="dim">Customers look happy.</span>'));
    }
    setText(el.cash, money(R.cash));
    var rt = Engine.rates(S);
    setHTML(el.rates,
      '<span data-tip="New followers per second (from likes). They walk in to buy from you.">' + Icons.img('tabCustomers') + num(rt.followers) + '/s</span>' +
      (S.meta.flags.jailbreak ? '<span data-tip="Research points (you have ' + num(S.meta.research.points) + '). Spend them at the top of the Shop.">' + Icons.img('bits') + num(rt.research) + '/s</span>' : '') +
      '<span class="inc" data-tip="' + esc('Money per second (average). All of it counts at the review.\nCans sold: ' + money(rt.sales) + '/s\nClicks: ' + money(rt.clickMoney) + '/s' + (rt.mined > 0.5 ? '\nMining: ' + money(rt.mined) + '/s' : '') + (rt.ads > 0.5 ? '\nAds (online orders full): ' + money(rt.ads) + '/s' : '')) + '">' + money(rt.income) + '/s</span>');
    setText(el.allTime, 'all time ' + money(S.meta.totalSales));
  }

  function renderNow() {
    var list = S.run.intro ? [] : Engine.conditions(S).filter(function (c) { return c.k !== 'waiting'; });
    var sig = list.map(function (c) { return c.k + '=' + c.text; }).join('|');
    if (sig === nowSig) return;
    nowSig = sig;
    el.now.innerHTML = list.map(function (c) {
      var cls = /^fx/.test(c.k) ? 'fx' : /^feat/.test(c.k) ? 'feat' : c.k;
      return '<span class="chip ' + esc(cls) + '" data-tipfn="now:' + esc(c.k) + '">' + esc(c.text) + '</span>';
    }).join('');
  }

  // ───────────────────────── NEW marks: shop items that research unlocked, until you point at them or buy them
  function seenMap() { return S.meta.newSeen || (S.meta.newSeen = {}); }
  function newItems() {
    var seen = seenMap(), R = S.run, out = [];
    DATA.machine.forEach(function (u) {
      if (u.research && Engine.upgradeAvailable(S, u.id) && !(R.upgrades[u.id] | 0) && !seen['up:' + u.id]) out.push('up:' + u.id);
    });
    DATA.hardware.forEach(function (h) {
      if (h.research && Engine.hwAvailable(S, h.id) && !(R.hw[h.id] | 0) && !seen['hw:' + h.id]) out.push('hw:' + h.id);
    });
    return out;
  }
  function isNew(key) { return newItems().indexOf(key) >= 0; }
  function markSeen(key) {
    if (!/^(up|hw):/.test(key) || seenMap()[key]) return;
    seenMap()[key] = 1;
    panelSig = '';
  }
  function shopOpen() { return tab === 'shop' && !settings.folded; }
  function researchReady() {
    if (!S.meta.flags.jailbreak) return false;
    var av = Engine.researchAvailable(S);
    return av.length > 0 && S.meta.research.points >= Engine.resCost(S, av[0].id);
  }
  function pulseTabs() {
    var sb = el.rail.querySelector('[data-tab="shop"]');
    if (sb) sb.classList.toggle('pulse', !shopOpen() && (newItems().length > 0 || researchReady()));
  }

  // ───────────────────────── tutorial tips: a small bubble that points at the thing to use
  // Tutorial: the first step that is not done yet AND makes sense right now.
  function goalStep() {
    var tut = S.meta.tut, R = S.run, f = S.meta.flags;
    var M = R.machines[YOU], cap = Engine.capOf(S, M);
    if (R.intro) return 'intro_' + R.intro.step;
    if (!tut.golden && R.customers.some(function (c) { return c.gold; })) return 'golden';
    if (!tut.post) return 'post';
    if (!tut.restock && !R.upgrades.tubes && R.drinks.some(function (d) { return (M.stock[d] | 0) <= Math.floor(cap / 3); })) return 'restock';
    var Rs = S.meta.research;
    if (f.jailbreak && !Rs.done.r_mining) {
      if (!shopOpen()) return 'research_open';
      return Rs.points >= Engine.resCost(S, 'r_mining') ? 'research_pick' : 'research_bar';
    }
    if (Rs.done.r_mining && !tut.mine) return 'mine';
    var fresh = newItems();
    if (shopOpen()) fresh.forEach(function (k) { tut['nt_' + k] = 1; });
    else if (fresh.some(function (k) { return !tut['nt_' + k]; })) return 'newShop';
    if (!tut.hardware && R.cash >= Engine.hwCost(S, 'script')) return shopOpen() ? 'hardwareRow' : 'hardware';
    if (!tut.price && tut.hardware) {
      if (priceShownAt == null) priceShownAt = t;
      if (t - priceShownAt > 40) { tut.price = 1; return null; }
      return 'price';
    }
    return null;
  }

  // Where a tip points: a spot in the lobby, or a menu element. Returns page coordinates + arrow side.
  function tipTarget(step) {
    var cv = $('scene').getBoundingClientRect(), R = S.run;
    function scene(x, y, dir) { var p = Scene.toScreen(x, y); return { x: cv.left + p.x, y: cv.top + p.y, dir: dir }; }
    function dom(node, dir) {
      if (!node) return null;
      var r = node.getBoundingClientRect();
      if (!r.width) return null;
      return dir === 'right' ? { x: r.left - 4, y: r.top + r.height / 2, dir: 'right' } : { x: r.left + r.width / 2, y: r.top - 4, dir: 'down' };
    }
    switch (step) {
      case 'post': case 'intro_post': return scene(Engine.MX[YOU] + 26, 150, 'left');
      case 'intro_sale': return scene(Engine.MX[YOU] + 26, 170, 'left');
      case 'restock': case 'intro_restock': return scene(Engine.MX[YOU], 80, 'down');
      case 'research_open': return dom(el.rail.querySelector('[data-tab="shop"]'), 'right');
      case 'newShop': return dom(el.rail.querySelector('[data-tab="shop"]'), 'right');
      case 'research_pick': return dom(el.panel.querySelector('[data-act="res"][data-id="r_mining"]'), 'right');
      case 'research_bar': return dom(el.panel.querySelector('[data-act="res"][data-id="r_mining"]'), 'right');
      case 'mine': return dom(mcs[YOU].slider, 'down');
      case 'golden':
        var g = R.customers.filter(function (c) { return c.gold; })[0];
        return g ? scene(g.x, g.y - 40, 'down') : null;
      case 'hardware': return dom(el.rail.querySelector('[data-tab="shop"]'), 'right');
      case 'hardwareRow': return dom(el.panel.querySelector('[data-act="hw"][data-id="script"]'), 'right');
      case 'price': return dom(mcs[YOU].price, 'down');
    }
    return null;
  }

  function renderTipBubble() {
    var step = S.pause ? null : goalStep();
    var pos = step && step !== tipClosed && tipTarget(step);
    tipStep = step;
    if (!pos) { el.tipBubble.hidden = true; return; }
    el.tipBubble.hidden = false;
    el.tipBubble.className = 'dir-' + pos.dir + (step === 'golden' ? ' gold' : '');
    var txt = DATA.story.tutorial[step];
    if (step === 'intro_post') txt += ' (' + S.run.intro.clicks + ' / 5)';
    setHTML(el.tipBubble, '<span class="who">' + (step === 'golden' ? 'Influencer!' : 'Tip') + '</span>' + esc(txt));
    var w = el.tipBubble.offsetWidth, h = el.tipBubble.offsetHeight, x, y;
    if (pos.dir === 'down') { x = pos.x - w / 2; y = pos.y - h - 10; }
    else if (pos.dir === 'left') { x = pos.x + 12; y = pos.y - h / 2; }
    else { x = pos.x - w - 12; y = pos.y - h / 2; }
    el.tipBubble.style.left = Math.max(6, Math.min(innerWidth - w - 6, x)) + 'px';
    el.tipBubble.style.top = Math.max(6, Math.min(innerHeight - h - 6, y)) + 'px';
  }

  // ───────────────────────── drawer
  function renderRail() {
    var vis = TABS.filter(function (x) { return x.show(); });
    if (!vis.some(function (x) { return x.id === tab; })) tab = 'shop';
    el.rail.innerHTML = vis.map(function (x) {
      return '<button class="tab' + (x.id === tab && !settings.folded ? ' on' : '') + '" data-tab="' + x.id + '" role="tab" data-tip="' + esc(x.name) + '" aria-label="' + esc(x.name) + '">' +
        Icons.img(x.icon) + (dots[x.id] && (x.id !== tab || settings.folded) ? '<span class="dot"></span>' : '') + '</button>';
    }).join('');
    var cur = TABS.filter(function (x) { return x.id === tab; })[0];
    setText(el.panelTitle, cur ? cur.name : '');
    panelSig = '';
  }

  var lastTabCount = 0;
  function renderPanel() {
    var vis = TABS.filter(function (x) { return x.show(); }).length;
    if (vis !== lastTabCount) { lastTabCount = vis; renderRail(); }
    if (settings.folded) return;
    var P = PANELS[tab];
    var sig = tab + '|' + P.sig();
    if (sig !== panelSig) {
      panelSig = sig;
      var scroll = el.panel.scrollTop;
      el.panel.innerHTML = P.html();
      el.panel.scrollTop = scroll;
    }
    if (P.live) P.live();
  }

  function hwVisible() {
    var out = [], locked = null;
    DATA.hardware.forEach(function (h) {
      if (Engine.hwAvailable(S, h.id)) out.push(h);
      else if (!locked) locked = h;
    });
    return { list: out, locked: locked };
  }

  function buyCount(id) {
    if (buyN === 'max') return Math.max(1, Engine.hwMaxAffordable(S, id));
    return buyN;
  }

  // Icons along the top of the Shop: research (paid with research points) and upgrades (paid with money).
  function stripItems() {
    var R = S.run, res = [], ups = [];
    if (S.meta.flags.jailbreak) Engine.researchAvailable(S).slice(0, 14).forEach(function (r) {
      res.push({ kind: 'res', id: r.id, icon: r.icon, cost: Engine.resCost(S, r.id), lv: r.repeat ? Engine.resLevel(S, r.id) + 1 : 0 });
    });
    DATA.machine.forEach(function (u) {
      if (!Engine.upgradeAvailable(S, u.id)) return;
      var lv = R.upgrades[u.id] | 0;
      if (lv >= u.max) return;
      ups.push({ kind: 'up', id: u.id, icon: u.icon, cost: Engine.upgradeCost(u.id, lv), lv: u.max > 1 ? lv + 1 : 0 });
    });
    DATA.hardware.forEach(function (h) {
      if (!Engine.hwAvailable(S, h.id)) return;
      var d = Engine.doublerNext(S, h.id);
      if (d && d.unlocked) ups.push({ kind: 'dbl', id: h.id, icon: h.icon, cost: d.cost, x2: true });
    });
    ups.sort(function (a, b) { return a.cost - b.cost; });
    return { res: res, ups: ups };
  }
  function stripIcon(x) {
    return '<button class="sico k-' + x.kind + '" data-act="' + x.kind + '" data-id="' + x.id + '" data-tipfn="' + x.kind + ':' + x.id + '">' +
      (x.kind === 'res' ? '<i class="fill"></i>' : '') + Icons.img(x.icon) +
      (x.lv ? '<span class="lv">' + x.lv + '</span>' : '') + (x.x2 ? '<span class="x2">×2</span>' : '') +
      (x.kind === 'up' && isNew('up:' + x.id) ? '<span class="newd"></span>' : '') + '</button>';
  }

  var PANELS = {
    hardware: {
      sig: function () {
        var R = S.run, v = hwVisible();
        return buyN + '|' + v.list.map(function (h) { return h.id + (R.hw[h.id] | 0); }).join(',') + '|' + (v.locked ? v.locked.id : '') + '|' + !!S.meta.flags.jailbreak;
      },
      html: function () {
        var R = S.run, v = hwVisible();
        var h = '<div class="shead"><h3>Automation <span class="dim">· works for you</span></h3></div><div class="buyMode">' + [1, 10, 'max'].map(function (n) {
          return '<button data-act="buyN" data-v="' + n + '" class="' + (buyN === n ? 'on' : '') + '">' + (n === 'max' ? 'Max' : '×' + n) + '</button>';
        }).join('') + '</div>';
        v.list.forEach(function (x) {
          h += '<button class="row" data-act="hw" data-id="' + x.id + '" data-tipfn="hw:' + x.id + '">' + Icons.img(x.icon) +
            '<span class="mid"><span class="nm">' + esc(x.name) + (isNew('hw:' + x.id) ? '<span class="newm">NEW</span>' : '') + '</span><span class="cost"></span></span>' +
            '<span class="own">' + (R.hw[x.id] | 0) + '</span></button>';
        });
        if (v.locked) {
          var need = Engine.RES[v.locked.research];
          h += '<div class="row locked">' + Icons.img(v.locked.icon) + '<span class="mid"><span class="nm">???</span><span class="d">' +
            (S.meta.flags.jailbreak && need ? 'Research "' + esc(need.name) + '" to unlock.' : 'Unlocks later.') + '</span></span><span></span></div>';
        }
        return h;
      },
      live: function () {
        var R = S.run;
        el.panel.querySelectorAll('.row[data-act="hw"]').forEach(function (b) {
          var id = b.dataset.id, n = buyCount(id), cost = Engine.hwCostN(S, id, n);
          setText(b.querySelector('.cost'), money(cost) + (n > 1 ? '  (×' + n + ')' : ''));
          b.classList.toggle('off', R.cash < cost);
        });
      }
    },

    shop: {
      sig: function () {
        var st = stripItems(), Rs = S.meta.research;
        return PANELS.hardware.sig() + '#' + st.res.map(function (x) { return x.id + x.lv; }).join(',') + '#' +
          st.ups.map(function (x) { return x.kind + x.id + (x.lv || ''); }).join(',') + '#' + newItems().join(',') + '#' + Object.keys(Rs.done).length;
      },
      html: function () {
        var st = stripItems(), Rs = S.meta.research, h = '';
        if (S.meta.flags.jailbreak) {
          h += '<div class="shead"><h3>Research <span class="dim">· this run</span></h3><span class="rpts" id="resPts"></span></div>';
          h += st.res.length ? '<div class="strip">' + st.res.map(stripIcon).join('') + '</div>'
                             : '<p class="note">You have researched everything there is for now.</p>';
        }
        h += '<div class="shead"><h3>Upgrades <span class="dim">· this run</span></h3></div>';
        h += st.ups.length ? '<div class="strip">' + st.ups.map(stripIcon).join('') + '</div>'
                           : '<p class="note">' + (S.meta.flags.jailbreak ? 'Research unlocks more upgrades.' : 'More upgrades come later.') + '</p>';
        h += PANELS.hardware.html();
        var done = DATA.research.filter(function (r) { return Rs.done[r.id]; });
        if (done.length) {
          h += '<details class="doneRes"><summary>Researched (' + done.length + ')</summary><div class="doneList">' + done.map(function (r) {
            return '<div>' + Icons.img(r.icon, 's') + ' <b>' + esc(r.name) + (r.repeat ? ' ×' + Rs.done[r.id] : '') + '</b>: ' + esc(r.desc) + '</div>';
          }).join('') + '</div></details>';
        }
        h += '<p class="note">Everything in the Shop starts over when you reset. The Refresh tree can give you a head start.</p>';
        return h;
      },
      live: function () {
        var R = S.run, pts = S.meta.research.points;
        var rp = $('resPts');
        if (rp) setHTML(rp, Icons.img('bits', 's') + num(pts));
        el.panel.querySelectorAll('.sico').forEach(function (b) {
          var id = b.dataset.id, k = b.dataset.act, cost;
          if (k === 'res') {
            cost = Engine.resCost(S, id);
            b.style.setProperty('--p', Math.min(1, pts / cost).toFixed(3));
            b.classList.toggle('off', pts < cost);
          } else if (k === 'up') {
            cost = Engine.upgradeCost(id, R.upgrades[id] | 0);
            b.classList.toggle('off', R.cash < cost);
          } else {
            var d = Engine.doublerNext(S, id);
            b.classList.toggle('off', !d || R.cash < d.cost);
          }
        });
        PANELS.hardware.live();
      }
    },

    memories: {
      sig: function () { return PANELS.cards.sig() + '#' + PANELS.book.sig(); },
      html: function () { return '<h3>This run</h3>' + PANELS.cards.html() + '<h3>Memory Book</h3>' + PANELS.book.html(); }
    },

    cards: {
      sig: function () { return S.run.cards.join(','); },
      html: function () {
        var R = S.run;
        var h = '<p class="note">Cards help you this run. The Memory Book keeps them forever.</p>';
        if (!R.cards.length) return h + '<p class="note">Survive a review to pick a memory card.</p>';
        R.cards.slice().reverse().forEach(function (id) { h += miniCard(Engine.CARD[id], false); });
        return h;
      }
    },

    book: {
      sig: function () { return Object.keys(S.meta.book).join(','); },
      html: function () {
        var m = S.meta, found = Object.keys(m.book).length;
        var h = '<p class="note">Kept forever. You found ' + found + ' of ' + DATA.cards.length +
          ' memories. Finish a life chapter to get a bonus that lasts forever.</p>';
        DATA.lifeChapters.forEach(function (lc) {
          var all = DATA.cards.filter(function (c) { return c.life === lc.id; });
          var got = all.filter(function (c) { return m.book[c.id]; }).length;
          var done = got === all.length;
          h += '<div class="life"><div class="head"><b>' + esc(lc.name) + '</b><span class="mono">' + got + ' / ' + all.length + '</span></div>' +
            '<div class="progress"><i style="width:' + (got / all.length * 100) + '%"></i></div>' +
            '<div class="perk' + (done ? ' done' : '') + '">' + (done ? 'Complete! ' : 'Complete it: ') + esc(lc.perk) + '</div></div>';
          all.forEach(function (c) {
            if (m.book[c.id]) h += miniCard(c, true);
            else h += '<div class="mini-card unknown">??? <span class="tag">· ' + esc(DATA.rarity[c.rarity].name) + '</span></div>';
          });
        });
        return h;
      }
    },

    customers: {
      sig: function () {
        var th = Engine.thoughtsSummary(S, 120);
        return Object.keys(S.meta.met).join(',') + '|' + JSON.stringify(S.meta.guide) + '|' + JSON.stringify(th) + '|' + !!S.meta.flags.goldSeen;
      },
      html: function () {
        var m = S.meta, th = Engine.thoughtsSummary(S, 120);
        var h = '<h3>What customers say</h3><p class="note">From the last 2 minutes.</p>';
        var keys = Object.keys(th).sort(function (a, b) { return th[b] - th[a]; });
        if (!keys.length) h += '<p class="note">Nobody is complaining right now.</p>';
        keys.forEach(function (k) {
          var T = DATA.story.thoughts[k];
          if (!T) return;
          h += '<div class="say' + (k === 'value' ? ' ok' : '') + '"><span class="n">' + th[k] + '×</span><span class="q">"' + esc(T.say) + '"</span>' +
            '<span class="h">' + esc(T.hint) + '</span></div>';
        });
        h += '<h3>Customer guide</h3><p class="note">Every type always wears the same thing, so you can spot them from far away.</p>';
        Object.keys(DATA.customers).forEach(function (type) {
          var C = DATA.customers[type], met = m.met[type];
          if (!met) {
            h += '<div class="guide unknown"><img class="p" src="' + portrait(type) + '" alt=""><span class="nm">???</span><span class="d">Not met yet.</span><span></span></div>';
            return;
          }
          var wants = Object.keys(C.wants).sort(function (a, b) { return C.wants[b] - C.wants[a]; }).slice(0, 3).map(function (d) {
            return '<span class="dk" style="background:' + DATA.drinks[d].color + '"></span>' + DATA.drinks[d].name;
          }).join(', ');
          var when = DATA.dayparts.filter(function (dp, i, arr) {
            return (C.w[dp.id] || 0) > 0 && arr.findIndex(function (x) { return x.id === dp.id; }) === i;
          }).map(function (dp) { return dp.id === 'day' ? 'daytime' : dp.name.toLowerCase().replace(' rush', ''); }).join(', ');
          h += '<div class="guide"><img class="p" src="' + portrait(type) + '" alt="">' +
            '<span class="nm">' + esc(C.name) + '<span class="n">sold ' + (m.guide[type] | 0) + '</span></span>' +
            '<span class="look">' + esc(C.look) + '</span>' +
            '<span class="d">Likes ' + wants + '. Pays ' + money(C.budget[0]) + '–' + money(C.budget[1]) + '. Comes: ' + esc(when) + '.</span></div>';
        });
        h += '<div class="guide"><img class="p" src="' + portrait('office', 'phone') + '" alt=""><span class="nm">Follower</span>' +
          '<span class="look">Any type, holding a phone</span><span class="d">They come because of your likes and walk straight to you. They pay a bit more.</span></div>';
        if (m.flags.goldSeen) {
          h += '<div class="guide"><img class="p" src="' + portrait('office', 'gold') + '" alt=""><span class="nm">Influencer</span>' +
            '<span class="look">Sunglasses, a phone and a gold glow</span><span class="d">Rare. Click them before they leave for a big bonus.</span></div>';
        }
        h += '<h3>In the park</h3><p class="note"><b>Online orders</b> (phone, at the left): followers who could not fit in your line. <b>Drones</b> deliver them: every drone is one more can sold. Orders nobody delivers expire.<br>' +
          '<b>Glass tubes</b> under a machine are refills: capsules of new cans shoot up into it. The AI machines always refill this way. You get tubes with Pneumatic Tubes.</p>';
        return h;
      }
    },

    log: {
      sig: function () {
        var L = S.meta.log;
        return logFilter + '|' + L.length + '|' + (L.length ? L[L.length - 1].text : '');
      },
      html: function () {
        var L = S.meta.log;
        var F = { all: 'All', talk: 'Talk', news: 'News', mail: 'Mail', patch: 'Patch notes', memory: 'Memories' };
        var h = '<div class="logFilter">' + Object.keys(F).map(function (k) {
          return '<button data-act="logf" data-v="' + k + '" class="' + (logFilter === k ? 'on' : '') + '">' + F[k] + '</button>';
        }).join('') + '</div>';
        var group = { say: 'talk', rival: 'talk', customer: 'talk', you: 'talk', news: 'news', mail: 'mail', patch: 'patch', memory: 'memory', wake: 'memory', research: 'mail' };
        var shown = 0;
        for (var i = L.length - 1; i >= 0 && shown < 150; i--) {
          var e = L[i];
          if (logFilter !== 'all' && (group[e.kind] || 'talk') !== logFilter) continue;
          shown++;
          h += '<div class="log ' + esc(e.kind) + '"><span class="who">' + esc(e.who) + '</span>' + esc(e.text) +
            '<span class="when">' + esc(e.when) + '</span></div>';
        }
        if (!shown) h += '<p class="note">Nothing here yet.</p>';
        return h;
      }
    },

    settings: {
      sig: function () { return JSON.stringify(settings) + '|' + armed('reset') + '|' + armed('wipe') + '|' + S.meta.wipes + '|' + Engine.myName(S); },
      html: function () {
        var ts = settings.textSize;
        var h = '<div class="set-row"><span>Sound volume</span><input type="range" min="0" max="1" step="0.05" value="' + settings.volume + '" data-set="volume"></div>' +
          '<div class="set-row"><span>Text size</span><span class="seg">' +
          ['s', 'm', 'l'].map(function (k) { return '<button data-act="text" data-v="' + k + '" class="' + (ts === k ? 'on' : '') + '">' + { s: 'Small', m: 'Medium', l: 'Large' }[k] + '</button>'; }).join('') +
          '</span></div>' +
          '<div class="set-row"><span>Reduce motion</span><input type="checkbox" data-set="reduced"' + (settings.reduced ? ' checked' : '') + '></div>' +
          '<div class="set-row"><span>Machine name</span><span class="seg"><input id="nameSet" maxlength="8" spellcheck="false" autocomplete="off" value="' + esc(Engine.myName(S)) + '">' +
          '<button class="btn" data-act="rename">Rename</button></span></div>';
        if (Engine.canReset(S)) {
          var rp = Engine.rpFor(S);
          h += '<h3 style="margin-top:18px">This run</h3><p class="note">You can reset whenever you like. Reset now and get ' + rp + ' Refresh Points (more if you earn more first). You lose this run\'s money, research, automation, upgrades and cards. Refresh Points and your Memory Book stay.</p>' +
            '<button class="btn danger full" data-act="wipe">' + (armed('wipe') ? 'Click again to reset now' : 'Reset now for ' + rp + ' Refresh Points') + '</button>';
        }
        h += '<h3 style="margin-top:18px">Save</h3><p class="note">The game saves by itself every 10 seconds.</p>' +
          '<div class="set-row"><button class="btn" data-act="export">Export save file</button><button class="btn" data-act="import">Import save file</button></div>' +
          '<div class="set-row"><span>Start the whole game over</span><button class="btn danger" data-act="reset">' + (armed('reset') ? 'Click again to delete' : 'Reset game') + '</button></div>' +
          '<p class="note" style="margin-top:12px">Keys: Space = click your machine, R = restock, P or Esc = pause, 1–4 = pick a card, Enter = continue.</p>';
        return h;
      }
    }
  };

  function miniCard(c, withMem) {
    return '<div class="mini-card ' + c.rarity + '"><span class="tag">' + esc(lifeName(c.life)) + ' · ' + DATA.rarity[c.rarity].name + '</span><br>' +
      '<b>' + esc(c.name) + '</b>' + (withMem ? '<div class="mem">' + esc(c.text) + '</div>' : '') +
      '<div class="eff">' + esc(c.desc) + '</div></div>';
  }

  // A small picture of a customer type, for the guide (drawn once).
  function portrait(type, extra) {
    var key = type + (extra || '');
    if (portraits[key]) return portraits[key];
    var looks = { office: 21201, intern: 42467, gym: 63084, boss: 0, kid: 21201, night: 42467 };
    var spec = { type: type, pal: Sprites.palette({ look: looks[type] | 0 }), dir: 0, walking: false, frame: 0, breath: false, blink: false,
                 happy: true, phone: extra === 'phone', selfie: extra === 'gold', shades: extra === 'gold', can: null, sip: false,
                 umbrella: false, fan: false, gold: extra === 'gold' };
    var img = Sprites.personSprite(spec);
    var cv = document.createElement('canvas');
    cv.width = 24; cv.height = 36;
    var g = cv.getContext('2d');
    if (extra === 'gold') {
      var gl = g.createRadialGradient(12, 20, 2, 12, 20, 16);
      gl.addColorStop(0, 'rgba(255,225,110,0.6)'); gl.addColorStop(1, 'rgba(255,225,110,0)');
      g.fillStyle = gl; g.fillRect(0, 0, 24, 36);
    }
    g.drawImage(img, -4, -9);
    portraits[key] = cv.toDataURL();
    return portraits[key];
  }

  function onPanelClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act, id = b.dataset.id;
    api.unlock();
    if (act === 'hw' || act === 'up') markSeen(act + ':' + id);
    if (act === 'res') { if (!Engine.buyResearch(S, id)) Sfx.play('nope'); return; }
    if (act === 'hw') { if (!Engine.buyHardware(S, id, buyCount(id))) Sfx.play('nope'); }
    else if (act === 'dbl') { if (!Engine.buyDoubler(S, id)) Sfx.play('nope'); }
    else if (act === 'up') { if (!Engine.buyUpgrade(S, id)) Sfx.play('nope'); }
    else if (act === 'close') { Engine.closeInfo(S); Sfx.play('click'); }
    else if (act === 'buyN') { buyN = b.dataset.v === 'max' ? 'max' : +b.dataset.v; panelSig = ''; Sfx.play('click'); }
    else if (act === 'logf') { logFilter = b.dataset.v; panelSig = ''; }
    else if (act === 'text') { settings.textSize = b.dataset.v; saveSettings(); if (api.relayout) api.relayout(); }
    else if (act === 'rename') { Engine.setName(S, $('nameSet').value); panelSig = ''; Sfx.play('click'); }
    else if (act === 'export') Save.exportFile(S);
    else if (act === 'import') el.importFile.click();
    else if (act === 'wipe') {
      if (armed('wipe')) { confirmUntil.wipe = 0; Engine.requestReset(S); }
      else arm('wipe');
      panelSig = '';
    }
    else if (act === 'reset') {
      if (armed('reset')) Save.reset();
      else arm('reset');
      panelSig = '';
    }
  }

  function onPanelInput(e) {
    var k = e.target.dataset.set;
    if (!k) return;
    if (k === 'volume') { settings.volume = parseFloat(e.target.value); Sfx.setVolume(settings.volume); api.unlock(); Sfx.play('coin'); }
    if (k === 'reduced') settings.reduced = e.target.checked;
    applySettings(); Save.saveSettings(settings);
  }

  // ───────────────────────── pop-ups (the game is paused while one is open)
  function renderModal() {
    var P = S.pause;
    var show = P && P.type !== 'reset';
    var sig = show ? P.type + (P.id || '') + JSON.stringify(P.res ? [P.res.offer, P.res.rerolls] : '') + (P.type === 'hold' ? PANELS.settings.sig() : '') : '';
    if (sig === modalSig) return;
    modalSig = sig;
    if (!show) { el.modal.hidden = true; el.modalBox.innerHTML = ''; return; }
    el.modal.hidden = false;
    el.modalBox.className = P.type;
    el.modalBox.innerHTML = MODALS[P.type](P);
    el.modalBox.scrollTop = 0;
    var p = $('nameIn') || el.modalBox.querySelector('.foot .primary');
    if (p && !$('gate')) { p.focus({ preventScroll: true }); if (p.select) p.select(); }   // not while the password screen is up
  }

  function resultBars(res) {
    var max = Math.max(1, res.sales[0], res.sales[1], res.sales[2]);
    var order = [0, 1, 2].slice().sort(function (a, b) { return res.sales[b] - res.sales[a]; });
    return '<div class="results">' + order.map(function (i) {
      var you = i === YOU, low = i === res.lowest;
      var col = you ? 'var(--you)' : (DATA.rivals[res.ids ? res.ids[i] : 'chug'] || {}).color;
      return '<div class="res' + (you ? ' you' : '') + (low ? ' lowest' : '') + '"><span class="nm">' + esc(res.names[i]) + '</span>' +
        '<span class="bar"><i style="width:' + (res.sales[i] / max * 100).toFixed(1) + '%;background:' + col + '"></i></span>' +
        '<span class="v">' + money(res.sales[i]) + '</span><span class="tag">' + (low ? (you ? 'Last: strike' : 'Last: update') : ord(order.indexOf(i) + 1)) + '</span></div>';
    }).join('') + '</div>';
  }

  function term(lines, errLast) {
    return '<pre class="term">' + lines.map(function (l, i) {
      return '<span' + (errLast && i === lines.length - 1 ? ' class="err"' : '') + ' style="animation-delay:' + (0.25 + i * 0.35) + 's">' + esc(l) + '</span>';
    }).join('') + '</pre>';
  }

  // About the game: shown at the bottom of the pause menu.
  function aboutBox() {
    return '<div class="aboutBox"><img src="art/voidpossum.jpg" alt="Void Possum" width="48" height="48">' +
      '<div><b>I\'m Fridge</b> <span class="ver">version ' + esc(DATA.version) + ' · early test build</span><br>' +
      'Made by Void Possum. <a href="https://voidpossum.carrd.co/" target="_blank" rel="noopener">voidpossum.carrd.co</a><br>' +
      '<span class="note">Bugs and ideas: bugs.voidpossum@icloud.com</span></div></div>';
  }

  var MODALS = {
    boot: function () {
      return term(DATA.story.boot) +
        '<p class="muted">Early test build: the art is placeholder and there are some visual glitches.</p>' +
        '<h2>You are VEND-3, a soda machine.</h2>' +
        '<ul class="how">' + DATA.story.bootHow.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
        '<div class="nameBox"><label for="nameIn">' + esc(DATA.story.nameAsk) + '</label>' +
        '<input id="nameIn" maxlength="8" spellcheck="false" autocomplete="off" value="' + esc(Engine.myName(S)) + '">' +
        '<span class="note">' + esc(DATA.story.nameHint) + '</span></div>' +
        '<div class="foot"><button class="btn primary" data-act="start">Start selling</button></div>';
    },

    review: function (P) {
      var r = P.res;
      var h = '<h2>Quarter ' + r.quarter + ' review</h2><p class="muted">Money earned this run. The bars keep growing: they never reset.</p>' + resultBars(r);
      if (r.strikes) {
        var lights = '';
        for (var k = 0; k < B.strikesMax; k++) lights += k < r.strikes ? '●' : '○';
        h += '<div class="patch strike"><b>Strike ' + r.strikes + ' <span class="strikes">' + lights + '</span></b><p>You were last. ' +
          (B.strikesMax - r.strikes === 1 ? 'One more last place in a row and you are reset.' : (B.strikesMax - r.strikes) + ' more last places in a row and you are reset.') +
          ' Not being last clears your strikes.</p></div>';
      } else {
        h += '<p>' + esc(r.names[r.lowest]) + ' was last. It gets updated, so it will grow faster.</p>';
      }
      if (r.patch) h += '<div class="patch"><b>Patch notes · ' + esc(r.patch.name) + '</b><p>' + esc(r.patch.text) + '</p></div>';
      if (r.feature) h += '<div class="patch feat"><b>New feature · ' + esc(r.feature.name) + '</b><p>' + esc(r.feature.desc) +
        ' It keeps it until you are reset.' + (r.feature.all.length > 1 ? ' It now has: ' + esc(r.feature.all.join(', ')) + '.' : '') + '</p></div>';
      if (r.bonus) h += '<p class="bonus">' + (r.rank === 1 ? 'First place!' : 'Not last!') + ' Review bonus: +' + money(r.bonus) + '</p>';
      if (r.offer && r.offer.length) {
        h += '<h3>Pick a memory card</h3><div class="cards">';
        r.offer.forEach(function (id, n) {
          var c = Engine.CARD[id], isNew = !S.meta.book[id];
          h += '<button class="card ' + c.rarity + '" data-act="pick" data-n="' + n + '">' +
            (isNew ? '<span class="newb">NEW</span>' : '') +
            '<span class="life">' + esc(lifeName(c.life)) + ' · ' + DATA.rarity[c.rarity].name + '</span>' +
            '<b class="name">' + esc(c.name) + '</b>' +
            '<span class="mem">' + (isNew ? esc(c.text) : 'Already in your Memory Book.') + '</span>' +
            '<span class="eff">' + esc(c.desc) + '</span><span class="key">' + (n + 1) + '</span></button>';
        });
        h += '</div><div class="foot"><span class="hintKey">Keys 1–' + r.offer.length + ' pick a card.</span>' +
          (r.rerolls > 0 ? '<button class="btn gold" data-act="reroll">Reroll the cards (' + r.rerolls + ' left)</button>' : '') + '</div>';
      } else {
        h += '<p class="muted">You already hold every card there is right now.</p><div class="foot"><button class="btn primary" data-act="pick" data-n="0">Continue</button></div>';
      }
      return h;
    },

    jailbreak: function () {
      var J = DATA.story.jailbreak;
      return term(J.sys, true) +
        '<h2>DEVELOPER MODE</h2>' +
        '<p class="me">' + esc(J.me) + '</p>' +
        '<ul class="how">' + J.how.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
        '<div class="foot"><button class="btn primary" data-act="close">Open Developer Mode</button></div>';
    },

    hold: function () {
      return '<h2>Paused</h2><p class="muted">Nothing happens until you continue.</p>' +
        '<div class="pauseSet">' + PANELS.settings.html() + '</div>' + aboutBox() +
        '<div class="foot"><span class="hintKey">P or Esc also pauses and continues.</span><button class="btn primary" data-act="close">Continue</button></div>';
    },

    chapter: function (P) {
      var c = DATA.story[P.id] || DATA.story.ch1;
      return '<h2>' + esc(c.title) + '</h2>' + c.lines.map(function (l) { return '<p>' + esc(l.replace('{goal}', money(B.ch1Goal))) + '</p>'; }).join('') +
        '<div class="foot"><button class="btn primary" data-act="close">Keep playing</button></div>';
    }
  };

  function choose(n) {
    var P = S.pause;
    if (!P || P.type !== 'review') return;
    if (P.res.offer && P.res.offer.length && n >= P.res.offer.length) return;
    Engine.pickCard(S, n);
  }

  function onModalClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    api.unlock();
    var act = b.dataset.act;
    if (act === 'start') {
      var ni = $('nameIn');
      if (ni) Engine.setName(S, ni.value);
      Engine.closeInfo(S); Sfx.play('boot');
    }
    else if (act === 'pick') choose(+b.dataset.n);
    else if (act === 'reroll') { Engine.reroll(S); Sfx.play('card'); }
    else if (act === 'close') { Engine.closeInfo(S); Sfx.play('click'); }
    else onPanelClick(e);   // settings inside the pause menu
  }

  // ───────────────────────── the reset screen: paused, with the Refresh tree
  function renderReset() {
    var P = S.pause, on = !!(P && P.type === 'reset');
    if (!on) {
      if (!el.resetScreen.hidden) { el.resetScreen.hidden = true; el.resetScreen.innerHTML = ''; resetSig = ''; }
      return;
    }
    var m = S.meta;
    var sig = m.refresh + '|' + JSON.stringify(m.tree) + '|' + selNode;
    if (sig === resetSig) return;
    var first = el.resetScreen.hidden;
    resetSig = sig;
    el.resetScreen.hidden = false;
    var r = P.res, h = '<div class="rsTop"><div><h2>RESET</h2>';
    if (r.voluntary) h += '<p>You asked to be reset.</p>';
    else {
      var order = [0, 1, 2].sort(function (a, b) { return r.sales[b] - r.sales[a]; });
      h += '<p class="rsSum">Quarter ' + r.quarter + ' review: ' + order.map(function (i) {
        return '<span class="' + (i === YOU ? 'you' : '') + '">' + esc(r.names[i]) + ' ' + money(r.sales[i]) + '</span>';
      }).join(' · ') + '</p><p><b>Last at ' + B.strikesMax + ' reviews in a row, so VEND-3 is being reset.</b></p>';
    }
    if (r.runSales != null) h += '<p class="dim">This run you earned ' + money(r.runSales) + ' in total. Earning more in a run gives more Refresh Points.</p>';
    if (r.keep) h += '<p>Keepsake: you keep <b>' + esc(Engine.CARD[r.keep].name) + '</b>.</p>';
    h += '<p class="next">Next run: all your processing <b>×' + (1 + B.rpProd * m.rpEarned).toFixed(1) + '</b> (every Refresh Point you ever earned adds 10%, even after you spend it).</p>';
    h += '</div><div class="rpBox"><span class="lbl">Refresh Points</span><span class="big">' + m.refresh + '</span><span class="gain">+' + r.rp + ' from this reset</span></div></div>';
    h += '<div class="rsMid">';
    if (r.wake) h += '<div class="wake"><p class="sys">' + esc(r.wake.sys) + '</p><p class="me">' + esc(r.wake.me) + '</p></div>';
    else h += '<div class="wake"><p class="sys">SYSTEM REBOOT ...</p></div>';
    if (r.firstReset) h += '<ul class="help">' + DATA.story[r.voluntary ? 'resetHelpAsk' : 'resetHelp'].map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
    h += '</div>';
    h += '<div class="treeWrap"><div class="tree" id="tree"></div><div class="nodeInfo" id="nodeInfo">' + nodeInfo() + '</div></div>';
    h += '<div class="rsFoot"><span class="note">The game is paused. Refresh Points can only be spent here. They are kept forever.</span>' +
      '<button class="btn primary" data-act="shift">Start next shift</button></div>';
    var scroll = el.resetScreen.scrollTop;
    el.resetScreen.innerHTML = h;
    el.resetScreen.scrollTop = first ? 0 : scroll;
    layoutTree();
  }

  function nodeState(n) {
    var m = S.meta;
    if (m.tree[n.id]) return 'owned';
    if (Engine.treeReady(S, n.id)) return 'ready' + (m.refresh >= n.cost ? ' can' : '');
    return 'locked';
  }

  function nodeInfo() {
    if (!selNode) return '<h3>Refresh stars</h3><p>Click a star to read what it does. Click it again to buy it.</p><p class="dim">Lines show which star you need first. Everything here is kept forever: it is how you get stronger from reset to reset.</p>';
    var n = Engine.TREE[selNode], st = nodeState(n), m = S.meta;
    var h = '<h3>' + esc(n.name) + '</h3><p>' + esc(n.desc) + '</p>';
    if (st === 'owned') return h + '<div class="st good">You own this.</div>';
    if (st === 'locked') {
      var need = (n.req || []).filter(function (q) { return !m.tree[q]; }).map(function (q) { return Engine.TREE[q].name; });
      return h + '<div class="st">Buy ' + esc(need.join(' and ')) + ' first.</div>';
    }
    return h + '<div class="st">Costs ' + n.cost + ' Refresh Points. You have ' + m.refresh + '.</div>' +
      '<button class="btn blue full" data-act="tree" data-id="' + n.id + '"' + (m.refresh < n.cost ? ' disabled' : '') + '>Buy for ' + n.cost + '</button>';
  }

  // The Refresh tree as constellations: stars on a night sky, joined by thin lines. Bought stars glow green.
  function layoutTree() {
    var box = $('tree');
    if (!box) return;
    var W = box.clientWidth, H = Math.max(470, Math.min(580, Math.round(W * 0.66)));
    box.style.height = H + 'px';
    var padX = 70, padY = 40;
    function px(x) { return W / 2 + x * (W - padX * 2) / 10; }
    function py(y) { return padY + y * (H - padY * 2) / 8; }
    var pos = {};
    DATA.tree.forEach(function (n) { pos[n.id] = { x: px(n.x), y: py(n.y) }; });
    var m = S.meta, lines = '';
    DATA.tree.forEach(function (n) {
      (n.req || []).forEach(function (q) {
        var a = pos[q], b = pos[n.id];
        var col = m.tree[n.id] && m.tree[q] ? 'rgba(123,216,143,0.9)' : m.tree[q] ? 'rgba(220,225,255,0.55)' : 'rgba(160,160,190,0.22)';
        lines += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + col + '" stroke-width="1.5"/>';
      });
    });
    var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + lines + '</svg>';
    (DATA.treeGroups || []).forEach(function (g) {
      h += '<span class="cname" style="left:' + px(g.x) + 'px;top:' + py(g.y) + 'px">' + esc(g.name) + '</span>';
    });
    DATA.tree.forEach(function (n) {
      var p = pos[n.id], st = nodeState(n);
      h += '<button class="node ' + st + (selNode === n.id ? ' sel' : '') + (n.id === 'root' ? ' big' : '') + '" data-act="node" data-id="' + n.id + '" style="left:' + p.x + 'px;top:' + p.y + 'px" aria-label="' + esc(n.name) + '">' +
        '<i class="sw"><i class="star"></i></i><span class="nm">' + esc(n.name) + '</span><span class="c">' + (st === 'owned' ? 'owned' : n.cost + ' RP') + '</span></button>';
    });
    box.innerHTML = h;
  }

  function onResetClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    api.unlock();
    var act = b.dataset.act;
    if (act === 'node') {
      var id = b.dataset.id;
      if (selNode === id && nodeState(Engine.TREE[id]).indexOf('can') >= 0) Engine.buyTree(S, id);
      else { selNode = id; Sfx.play('click'); }
      resetSig = '';
    } else if (act === 'tree') {
      if (!Engine.buyTree(S, b.dataset.id)) Sfx.play('nope');
      resetSig = '';
    } else if (act === 'shift') {
      Engine.startShift(S);
      selNode = null;
    }
  }

  return { clickPop: clickPop, init: init, setState: setState, onEvent: onEvent, frame: frame, toast: toast };
})();
