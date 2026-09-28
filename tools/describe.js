// I'M FRIDGE — game data as readable sections (used by tools/wiki.html and tools/gen-docs.js).
// Wiki.build(D, src) turns the DATA object into sections with tables. `src` = the data files' source text
// (optional: then the // comments in the files are shown too).
// Editable cells carry a path into DATA (e.g. "machine[slots].base"), the value, and how to show it.
// © 2026 Void Possum. All rights reserved.

var Wiki = (function () {
  'use strict';

  // Which file each top-level DATA key lives in (for the exported change list).
  var FILE = {
    balance: 'core.js', months: 'core.js', drinks: 'core.js', startDrinks: 'core.js', rivalDrinks: 'core.js', dayparts: 'core.js', weather: 'core.js',
    customers: 'core.js', regulars: 'core.js', world: 'core.js', worlds: 'core.js',
    machine: 'machine.js', hardware: 'hardware.js', doublerAt: 'hardware.js', doublerCost: 'hardware.js',
    research: 'research.js', tree: 'tree.js', treeGroups: 'tree.js',
    cards: 'cards.js', lifeChapters: 'cards.js', rarity: 'cards.js',
    rivals: 'rivals.js', rivalUpgrades: 'rivals.js', features: 'rivals.js',
    side: 'side.js', sideSlots: 'side.js', chips: 'chips.js', chipGroups: 'chips.js'
  };

  // Balance numbers that are money (cents): shown and edited in dollars.
  var MONEY_KEYS = { canCost: 1, startCash: 1, startPrice: 1, priceMin: 1, priceMax: 1, priceStep: 1,
    ch1Goal: 1, ch2Goal: 1, loyalMargin: 1, lineTolerance: 1, loyalFade: 1, pricewarCut: 1 };

  // What each effect key means (cards, research, the Refresh tree, machine upgrades).
  var FX = {
    appeal: ['+{p} appeal', 'how much customers like your machine'],
    money: ['+{p} money per can', ''],
    cold: ['+{p} cold bonus', 'stronger on hot days'],
    restock: ['restocking costs {p} less', ''],
    click: ['clicks make +{v} processing', ''],
    clickMult: ['clicks make +{p} processing', ''],
    clickPct: ['every click also adds {p} of your hardware processing per second', ''],
    fans: ['+{p} new fans from sales', ''],
    review: ['+{p} review bonus', ''],
    loyal: ['fans pay up to {m} more than the cheapest rival', ''],
    goldRate: ['influencers come +{p} more often', ''],
    goldEye: ['influencers stay twice as long', ''],
    vend: ['sell {p} faster', ''],
    cap: ['+{v} cans per drink', ''],
    queue: ['+{p} line length', ''],
    patience: ['people in your line wait {p} longer', ''],
    tubes: ['tubes +{v} level (faster refills)', ''],
    drink: ['adds the drink {v}', ''],
    lanes: ['+{v} dispenser (serve two at once)', ''],
    smartPrice: ['Smart Price', ''],
    startCash: ['start every run with {m}', ''],
    startRes: ['start every run with {v} research points', ''],
    startResearch: ['start every run with {r} researched', ''],
    startHardware: ['start every run with {v} Auto-Click Script and RAM Stick', ''],
    hwDiscount: ['hardware costs {p} less', ''],
    reroll: ['reroll the card offer once per review', ''],
    cardChoices: ['+{v} card to choose from at every review', ''],
    keepCard: ['keep your best card when you are reset', ''],
    prod: ['+{p} processing', ''],
    mine: ['+{p} money from hardware (mining)', ''],
    boost: ['+{p} of all your money', ''],
    traffic: ['+{p} walk-in customers', ''],
    drone: ['drones +{p} faster', ''],
    hw: ['hardware makes +{p}', ''],
    hwRamp: ['hardware +{p} for every month of this run', ''],
    free7: ['every 7th copy of any hardware is free', ''],
    carry: ['every drone delivery sells 2 cans; drones {p} slower', ''],
    fanSoft: ['new fans come +{p} more easily', ''],
    lineMoney: ['+{p} money per person in your line', ''],
    noLeave: ['lost orders never make fans leave', ''],
    extraMult: ['soda extra prices +{p}', ''],
    reserve: ['an empty soda gets {v} free cans (once a minute)', ''],
    streak: ['+{p} money per review in a row not last', ''],
    quirkSlow: ['rival quirks come +{p} less often', '']
  };
  var DAYPART = { morning: 'in the morning', day: 'in the daytime', lunch: 'at lunch', evening: 'in the evening', night: 'at night' };

  function money(c) {
    var neg = c < 0; c = Math.abs(c);
    var s = (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : (c >= 100000 ? 0 : 2), maximumFractionDigits: 2 });
    return (neg ? '-$' : '$') + s;
  }
  function pct(v) { return Math.round(v * 1000) / 10 + '%'; }
  function num(v) { return typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : String(v); }

  // One effect in plain words, e.g. {k:'appeal', v:0.25, c:{price_le:150}} → "+25% appeal while your price is $1.50 or less".
  function fxText(f, D) {
    var t = FX[f.k] ? FX[f.k][0] : f.k + ' ' + f.v;
    var rname = f.k === 'startResearch' && D && D.research ? ((D.research.filter(function (r) { return r.id === f.v; })[0] || {}).name || f.v) : '';
    t = t.replace('{p}', typeof f.v === 'number' ? pct(f.v) : f.v).replace('{v}', f.v).replace('{m}', typeof f.v === 'number' ? money(f.v) : f.v).replace('{r}', rname);
    var c = f.c;
    if (c) {
      if (c.price_le != null) t += ' while your price is ' + money(c.price_le) + ' or less';
      if (c.price_ge != null) t += ' while your price is ' + money(c.price_ge) + ' or more';
      if (c.daypart) t += ' ' + (DAYPART[c.daypart] || c.daypart);
      if (c.weather) t += ' on ' + c.weather + ' days';
      if (c.dayparts) t += ' ' + c.dayparts.map(function (d) { return DAYPART[d] || d; }).join(' and ');
      if (c.line_ge != null) t += ' while ' + c.line_ge + ' or more people are in your line';
      if (c.week_ge != null) t += ' from week ' + c.week_ge + ' of the month';
      if (c.notFirst) t += ' while you are not 1st';
      if (c.cust) t += ' with ' + ((D && D.customers && D.customers[c.cust] && D.customers[c.cust].name) || c.cust) + 's';
    }
    return t;
  }
  function fxList(fx, D) { return (fx || []).map(function (f) { return fxText(f, D); }).join('; ') || '—'; }

  // ── paths into DATA: "machine[slots].base", "customers.office.budget.0", "rivals.chug.quirks[chug_please].fx.dur"
  function seg(p) { return p.split('.').map(function (s) { var m = s.match(/^(\w+)\[(.+)\]$/); return m ? [m[1], m[2]] : [s]; }); }
  function step(o, s) {
    if (o == null) return undefined;
    var v = o[s[0]];
    if (s.length > 1) { if (!Array.isArray(v)) return undefined; for (var i = 0; i < v.length; i++) if (v[i] && v[i].id === s[1]) return v[i]; return undefined; }
    return v;
  }
  function get(D, path) { var o = D; seg(path).forEach(function (s) { o = step(o, s); }); return o; }
  function set(D, path, val) {
    var ss = seg(path), o = D;
    for (var i = 0; i < ss.length - 1; i++) o = step(o, ss[i]);
    if (o == null) return false;
    var last = ss[ss.length - 1];
    if (last.length > 1) return false;
    o[last[0]] = val;
    return true;
  }
  function fileOf(path) { return FILE[seg(path)[0][0]] || 'data'; }

  // ── cells
  // kind: 'money' (cents, shown in $), 'num', 'text', 'list' (numbers separated by commas)
  function ed(D, path, kind, label) { return { path: path, kind: kind, v: get(D, path), label: label }; }
  function show(kind, v) {
    if (v == null) return '—';
    if (kind === 'money') return money(v);
    if (kind === 'list') return (v || []).join(', ');
    if (kind === 'pct') return pct(v);
    return typeof v === 'number' ? num(v) : String(v);
  }

  // Comments from a data file: the header lines, and "key: value, // comment" lines.
  function headerOf(txt) {
    if (!txt) return '';
    // Only the plain part: stop at the notes for programmers (lists of keys, `code`, indented lines).
    var out = [], stop = false;
    txt.split('\n').some(function (l) {
      var m = l.match(/^\/\/\s?(.*)$/);
      if (!m) return true;
      if (/©|I'M FRIDGE —/.test(m[1])) return false;
      if (/`|^\s{2,}|^(Effect keys|Conditions|Quirk effect types|Owning|Hardware lives|`)/.test(m[1]) || /^[a-z]+ *=/.test(m[1])) stop = true;
      if (!stop && m[1].trim()) out.push(m[1]);
      return false;
    });
    var first = (txt.match(/^\/\/ I'M FRIDGE — (.*)$/m) || [])[1];
    return (first ? first.charAt(0).toUpperCase() + first.slice(1) + ' ' : '') + out.join(' ');
  }
  // The balance block, in groups (the comment-only lines inside it start a new group).
  function balanceGroups(D, txt) {
    var keys = Object.keys(D.balance), groups = [];
    if (!txt) return [{ title: 'All numbers', keys: keys.map(function (k) { return { k: k, c: '' }; }) }];
    var a = txt.indexOf('DATA.balance = {'), b = txt.indexOf('\n};', a);
    // A blank line or a comment line starts a new group. Titles: by the group's first number, else from its comment.
    var TITLE = { tick: 'Time', baseTraffic: 'Walk-in customers', canCost: 'Cans and prices', clickPower: 'Clicks and processing',
      loyalMargin: 'Followers and your price', reviewBonus: 'Reviews and chapter goals', rivalBump: 'Rivals', rpProd: 'Refresh Points (prestige)',
      goldFirst: 'Influencers', lineStart: 'Your line', rivalSpend: 'Rival features and rival-only mods' };
    var cur = null, pending = [], seen = {}, brk = true;
    function close() { if (cur && cur.keys.length) groups.push(cur); cur = null; }
    txt.slice(a, b).split('\n').slice(1).forEach(function (l) {
      if (!l.trim()) { brk = true; return; }
      var cm = l.match(/^\s*\/\/\s?(.*)$/);
      if (cm) { if (!pending.length) brk = true; pending.push(cm[1]); return; }
      var km = l.match(/^\s*(\w+):\s*(.*?)\s*(?:\/\/\s?(.*))?$/);
      if (!km || D.balance[km[1]] === undefined) return;
      if (brk || !cur) {
        var all = pending.join(' ');
        if (TITLE[km[1]] || all || !cur) {
          close();
          cur = { title: TITLE[km[1]] || all.split(/[:.(]/)[0] || 'More numbers', note: all, keys: [] };
        } else if (all) cur.note = (cur.note ? cur.note + ' ' : '') + all;
        pending = []; brk = false;
      }
      cur.keys.push({ k: km[1], c: km[3] || '' });
      seen[km[1]] = 1;
    });
    close();
    var rest = keys.filter(function (k) { return !seen[k]; });
    if (rest.length) groups.push({ title: 'Other', keys: rest.map(function (k) { return { k: k, c: '' }; }) });
    return groups;
  }

  function table(title, cols, rows, note) { return { type: 'table', title: title, cols: cols, rows: rows, note: note || '' }; }
  function text(t) { return { type: 'text', text: t }; }

  function build(D, src) {
    src = src || {};
    var B = D.balance, S = [];
    var rname = function (id) { return ((D.research.filter(function (r) { return r.id === id; })[0]) || {}).name || id; };

    // 1. Overview
    S.push({ id: 'overview', title: 'Overview', blocks: [
      text('Game version ' + D.version + '. Everything below is read from the game\'s data files (js/data/*.js), so it is always up to date.'),
      text('**How money works.** There is one number: money earned this run (the score at every review). It comes from: hardware (like Cookie Clicker buildings: every point of processing in Mining earns ' + money(B.procCash) + ' a second, half before the SodaCoin Wallet); cans sold in person and by drone (every soda sells for your price + its own extra); clicks (processing too: the slider splits each click into money and research); tips and influencer bonuses. Side machines (the new park) add a % of all of it while their condition is true.'),
      text('**Fans and drones.** Every can you sell brings a new fan with chance ' + B.fanChance + ' ÷ (1 + fans ÷ ' + B.fanSoft + '), so fans come slower the more you have. Every fan orders ' + B.fanOrder + ' cans per second online (at most ' + B.ordersMax + ' orders wait). Orders walk to your line when there is room; drones deliver the rest, each with a can from your machine (no cans: the order waits). Extra or expired orders are lost, and each one makes a fan leave with chance ' + B.fanLeave + '.'),
      text('**Moving.** After the Chapter 1 goal you can move to the new park without a reset: you keep everything. That run uses the new park\'s movedK / movedGrow for rival-only mods (it has no new Refresh Points yet).'),
      text('**Reviews.** At the end of every month (4 weeks). Last place = a strike; ' + B.strikesMax + ' strikes in a row = reset. Not being last: a card (1 of 3) and a cash bonus of ' + pct(B.reviewBonus) + ' of the month\'s earnings.'),
      text('**Chapters.** Chapter 1: earn ' + money(B.ch1Goal) + ' in one run (or reset once). Chapter 2 (the new park): earn ' + money(B.ch2Goal) + ' in one run there.'),
      text('**Resets (prestige).** Refresh Points = floor(' + B.rpK + ' × cube root of the run\'s money in cents) + reviews survived. Every Refresh Point ever earned: +' + pct(B.rpProd) + ' to all processing. Spend them in the Refresh tree.')
    ] });

    // 2. Balance numbers
    var bal = [];
    balanceGroups(D, src['core.js']).forEach(function (g) {
      bal.push(table(g.title, ['Name', 'Value', 'What it does'], g.keys.map(function (x) {
        var v = B[x.k], kind = Array.isArray(v) ? 'list' : MONEY_KEYS[x.k] ? 'money' : 'num';
        return [{ t: x.k, name: true }, ed(D, 'balance.' + x.k, kind, 'Balance › ' + x.k), { t: x.c }];
      }), g.note));
    });
    S.push({ id: 'balance', title: 'Balance numbers', intro: 'From js/data/core.js. Money is in cents in the file; here it is shown in dollars.', blocks: bal });

    // 3. Machine upgrades
    S.push({ id: 'machine', title: 'Machine upgrades', intro: headerOf(src['machine.js']), blocks: [
      table('Upgrades (bought with money, lost at a reset)', ['', 'Upgrade', 'Needs research', 'Base cost', 'Growth', 'Max level', 'Effect per level', 'Description', 'Cost of each level'],
        D.machine.map(function (u) {
          var costs = [];
          for (var l = 0; l < u.max; l++) costs.push(money(Math.round(u.base * Math.pow(u.grow, l))));
          return [{ icon: u.icon }, ed(D, 'machine[' + u.id + '].name', 'text', 'Machine upgrades › ' + u.name + ' › name'),
            { t: u.research ? rname(u.research) : '— (from the start)' },
            ed(D, 'machine[' + u.id + '].base', 'money', 'Machine upgrades › ' + u.name + ' › base cost'),
            ed(D, 'machine[' + u.id + '].grow', 'num', 'Machine upgrades › ' + u.name + ' › growth'),
            ed(D, 'machine[' + u.id + '].max', 'num', 'Machine upgrades › ' + u.name + ' › max level'),
            u.fx.length === 1 && typeof u.fx[0].v === 'number' ? { t: fxText(u.fx[0], D), sub: ed(D, 'machine[' + u.id + '].fx.0.v', 'num', 'Machine upgrades › ' + u.name + ' › effect value') } : { t: fxList(u.fx, D) },
            ed(D, 'machine[' + u.id + '].desc', 'text', 'Machine upgrades › ' + u.name + ' › description'),
            { t: costs.join(', '), small: true }];
        }))
    ] });

    // 4. Hardware
    var hwRows = D.hardware.map(function (h) {
      var g = h.grow || B.hardwareGrow, c = function (n) { return Math.ceil(h.base * Math.pow(g, n)); };
      var per = h.pps ? function (n) { return num(h.pps / (c(n) / 100)); } : null;
      return [{ icon: h.icon }, ed(D, 'hardware[' + h.id + '].name', 'text', 'Hardware › ' + h.name + ' › name'),
        { t: h.research ? rname(h.research) : '— (from the start)' },
        ed(D, 'hardware[' + h.id + '].base', 'money', 'Hardware › ' + h.name + ' › base cost'),
        h.grow ? ed(D, 'hardware[' + h.id + '].grow', 'num', 'Hardware › ' + h.name + ' › growth per copy') : { t: num(B.hardwareGrow) + ' (default)' },
        h.pps ? ed(D, 'hardware[' + h.id + '].pps', 'num', 'Hardware › ' + h.name + ' › processing per second') :
                ed(D, 'hardware[' + h.id + '].serve', 'num', 'Hardware › ' + h.name + ' › online orders served per second'),
        { t: money(c(0)) + ' / ' + money(c(9)) + ' / ' + money(c(24)), small: true },
        { t: per ? per(0) + ' / ' + per(9) + ' / ' + per(24) : '—', small: true },
        ed(D, 'hardware[' + h.id + '].desc', 'text', 'Hardware › ' + h.name + ' › description')];
    });
    var dblRows = [];
    D.hardware.forEach(function (h) {
      h.doublers.forEach(function (n, i) {
        dblRows.push([{ t: h.name }, ed(D, 'hardware[' + h.id + '].doublers.' + i, 'text', 'Hardware › ' + h.name + ' › doubler ' + (i + 1)),
          { t: 'own ' + D.doublerAt[i] }, { t: money(h.base * D.doublerCost[i]) }]);
      });
    });
    S.push({ id: 'hardware', title: 'Hardware', intro: headerOf(src['hardware.js']), blocks: [
      table('Hardware (processing when you are not clicking)', ['', 'Item', 'Needs research', 'Base cost', 'Growth', 'Per second (each)', 'Cost of copy 1 / 10 / 25', 'Processing per $ (copy 1 / 10 / 25)', 'Description'], hwRows,
        'Processing per second is before doublers and your Refresh Point bonus. Each point in Mining earns ' + money(B.procCash) + '/s. Auto-Click Script: +' + B.scriptPerHw + ' per other hardware owned. Once an item has its 2nd doubler, the item before it gets +' + pct(B.hwSynergy) + ' per copy of it. The drone is not processing: it delivers online orders.'),
      table('When doublers unlock and what they cost', ['Doubler', 'Own this many', 'Cost (× the item\'s base cost)'], D.doublerAt.map(function (x, i) {
        return [{ t: 'Doubler ' + (i + 1) }, ed(D, 'doublerAt.' + i, 'num', 'Hardware › doubler ' + (i + 1) + ' › own'), ed(D, 'doublerCost.' + i, 'num', 'Hardware › doubler ' + (i + 1) + ' › cost ×')];
      })),
      table('Doublers (each one doubles that item)', ['Item', 'Name', 'Unlocks at', 'Cost'], dblRows)
    ] });

    // 4a. Talent chips (sockets on VEND-3's board)
    if (D.chips) {
      S.push({ id: 'chips', title: 'Talent chips', intro: headerOf(src['chips.js']), blocks: [
        table('Groups (each open group: 1 socket and 1 free chip that is always on)', ['Group', 'Opens at Refresh Points earned', 'Free chip'], D.chipGroups.map(function (g) {
          var fc = D.chips.filter(function (c) { return c.id === g.free; })[0] || {};
          return [ed(D, 'chipGroups[' + g.id + '].name', 'text', 'Chips › group ' + g.name + ' › name'), ed(D, 'chipGroups[' + g.id + '].at', 'num', 'Chips › group ' + g.name + ' › Refresh Points needed'), { t: fc.name || g.free }];
        })),
        table('Chips', ['Chip', 'Group', 'Effect (the numbers)', 'Description (what players read)'], D.chips.map(function (c) {
          var L = 'Chips › ' + c.name + ' › ';
          return [ed(D, 'chips[' + c.id + '].name', 'text', L + 'name'), { t: c.group + (D.chipGroups.some(function (g) { return g.free === c.id; }) ? ' (free)' : '') },
            { t: fxList(c.fx, D), sub: ed(D, 'chips[' + c.id + '].fx.0.v', 'num', L + 'number') }, ed(D, 'chips[' + c.id + '].desc', 'text', L + 'description')];
        }), 'Slow Burn stops at +' + pct(B.chipRampMax) + ', Momentum at +' + pct(B.chipStreakMax) + '. A new chip starts working at the next review (or reset).')
      ] });
    }

    // 4b. Side machines (the new park)
    if (D.side) {
      S.push({ id: 'side', title: 'Side machines', intro: headerOf(src['side.js']), blocks: [
        table('Slots', ['Slot', 'Needs research', 'Fans this run'], D.sideSlots.map(function (sl, i) {
          return [{ t: sl.name }, { t: rname(sl.research) }, ed(D, 'sideSlots.' + i + '.fans', 'num', 'Side machines › ' + sl.name + ' › fans needed')];
        })),
        table('Machines (pick one per slot, then buy levels)', ['', 'Machine', 'Works', 'Price to pick', 'Growth', 'Max level', 'Effect per level', 'Description', 'Cost of each level'],
          D.side.map(function (m) {
            var L = 'Side machines › ' + m.name + ' › ', costs = [];
            for (var l = 0; l < m.max; l++) costs.push(money(Math.round(m.base * Math.pow(m.grow, l))));
            return [{ icon: 'side' + m.id.charAt(0).toUpperCase() + m.id.slice(1) }, ed(D, 'side[' + m.id + '].name', 'text', L + 'name'), ed(D, 'side[' + m.id + '].short', 'text', L + 'when it works'),
              ed(D, 'side[' + m.id + '].base', 'money', L + 'price to pick'), ed(D, 'side[' + m.id + '].grow', 'num', L + 'growth'), ed(D, 'side[' + m.id + '].max', 'num', L + 'max level'),
              { t: fxList(m.fx, D), sub: ed(D, 'side[' + m.id + '].fx.0.v', 'num', L + 'bonus per level') },
              ed(D, 'side[' + m.id + '].desc', 'text', L + 'description'), { t: costs.join(', '), small: true }];
          }))
      ] });
    }

    // 5. Research
    S.push({ id: 'research', title: 'Research', intro: headerOf(src['research.js']), blocks: [
      table('Research projects (research points, start over every run)', ['', 'Project', 'Cost (points)', 'Needs', 'Unlocks', 'Shows up when', 'Repeatable', 'Effect', 'Description'],
        D.research.map(function (r) {
          var L = 'Research › ' + r.name + ' › ';
          return [{ icon: r.icon }, ed(D, 'research[' + r.id + '].name', 'text', L + 'name'),
            ed(D, 'research[' + r.id + '].cost', 'num', L + 'cost'),
            { t: (r.req || []).map(rname).join(', ') || '—' },
            { t: r.unlock || '—' },
            { t: (r.when ? Object.keys(r.when).map(function (k) { return r.when[k] + ' ' + k + ' waiting'; }).join(', ') : '') + (r.world ? (r.when ? ', ' : '') + 'new park only' : '') || '—' },
            r.repeat ? ed(D, 'research[' + r.id + '].repeat', 'num', L + 'cost × per level') : { t: '—' },
            r.fx && r.fx.length === 1 ? { t: fxText(r.fx[0], D), sub: ed(D, 'research[' + r.id + '].fx.0.v', 'num', L + 'effect value') } : { t: fxList(r.fx, D) },
            ed(D, 'research[' + r.id + '].desc', 'text', L + 'description')];
        }))
    ] });

    // 6. Refresh tree
    var treeBlocks = [];
    var groupOf = function (n) {   // the tree groups are drawn by position: top left, top right, bottom left, bottom right
      if (n.id === 'root') return 'The centre';
      var top = n.y < 4, left = n.x < 0;
      return top ? (left ? 'The Machine' : 'The Lab') : (left ? 'The Crowd' : 'Memories');
    };
    ['The centre', 'The Machine', 'The Lab', 'The Crowd', 'Memories'].forEach(function (gname) {
      var rows = D.tree.filter(function (n) { return groupOf(n) === gname; }).map(function (n) {
        var L = 'Refresh tree › ' + n.name + ' › ';
        return [ed(D, 'tree[' + n.id + '].name', 'text', L + 'name'), ed(D, 'tree[' + n.id + '].cost', 'num', L + 'cost'),
          { t: (n.req || []).map(function (q) { return (D.tree.filter(function (x) { return x.id === q; })[0] || {}).name || q; }).join(', ') || '—' },
          n.fx.length === 1 && typeof n.fx[0].v === 'number' ? { t: fxText(n.fx[0], D), sub: ed(D, 'tree[' + n.id + '].fx.0.v', 'num', L + 'effect value') } : { t: fxList(n.fx, D) },
          ed(D, 'tree[' + n.id + '].desc', 'text', L + 'description')];
      });
      if (rows.length) treeBlocks.push(table(gname, ['Star', 'Cost (Refresh Points)', 'Needs', 'Effect', 'Description'], rows));
    });
    S.push({ id: 'tree', title: 'Refresh tree (prestige)', intro: headerOf(src['tree.js']), blocks: treeBlocks });

    // 7. Memory cards
    var cardBlocks = [
      text('After every review you are not last at, you pick 1 of 3 cards (4 with Second Look). Odds of each rarity: winner of the review 60% common / 30% rare / 10% legendary; otherwise 75 / 22 / 3. Cards you never took are 2.5× more likely. Cards last until the next reset; the first time you take one, it goes into the Memory Book forever.'),
      table('Life chapters (take every card of one = a bonus forever)', ['Life chapter', 'Perk', 'Perk effect'], D.lifeChapters.map(function (lc) {
        return [ed(D, 'lifeChapters[' + lc.id + '].name', 'text', 'Cards › life chapter ' + lc.name + ' › name'), ed(D, 'lifeChapters[' + lc.id + '].perk', 'text', 'Cards › life chapter ' + lc.name + ' › perk text'),
          lc.perkFx.length === 1 ? { t: fxText(lc.perkFx[0], D), sub: ed(D, 'lifeChapters[' + lc.id + '].perkFx.0.v', 'num', 'Cards › life chapter ' + lc.name + ' › perk value') } : { t: fxList(lc.perkFx, D) }];
      }))
    ];
    D.lifeChapters.forEach(function (lc) {
      var rows = D.cards.filter(function (c) { return c.life === lc.id; }).map(function (c) {
        var L = 'Cards › ' + c.name + ' › ';
        return [ed(D, 'cards[' + c.id + '].name', 'text', L + 'name'), { t: (D.rarity[c.rarity] || {}).name || c.rarity, color: (D.rarity[c.rarity] || {}).color },
          { t: fxList(c.fx, D), subs: c.fx.map(function (f, i) { return ed(D, 'cards[' + c.id + '].fx.' + i + '.v', 'num', L + 'effect ' + (i + 1) + ' value'); }) },
          ed(D, 'cards[' + c.id + '].desc', 'text', L + 'bonus text'), ed(D, 'cards[' + c.id + '].text', 'text', L + 'memory text')];
      });
      cardBlocks.push(table(lc.name + ' cards', ['Card', 'Rarity', 'Effect (from the data)', 'Bonus text (what players read)', 'Memory'], rows));
    });
    S.push({ id: 'cards', title: 'Memory cards', intro: headerOf(src['cards.js']), blocks: cardBlocks });

    // 8. Rivals
    var rivBlocks = [];
    Object.keys(D.rivals).forEach(function (id) {
      var R = D.rivals[id], L = 'Rivals › ' + R.name + ' › ';
      var pricing = R.pricing === 'undercut' ? 'copies your price, $0.25 cheaper (its own price: $3.00 + $0.25 per version)' :
                    R.pricing === 'chaos' ? 'a new price every day' : 'a steady fair price (+$0.15 per version)';
      var rows = [
        [{ t: 'Parody of' }, { t: R.parody }],
        [{ t: 'Appeal (how much customers like it)' }, ed(D, 'rivals.' + id + '.appeal', 'num', L + 'appeal')],
        [{ t: 'Hype (share of its processing that brings it customers; the rest is research)' }, ed(D, 'rivals.' + id + '.hype', 'num', L + 'hype')],
        [{ t: 'Pricing' }, { t: pricing }]
      ];
      if (R.fairPrice) rows.push([{ t: 'Fair price' }, ed(D, 'rivals.' + id + '.fairPrice', 'money', L + 'fair price')]);
      if (R.chaosMin) rows.push([{ t: 'Daily price from' }, ed(D, 'rivals.' + id + '.chaosMin', 'money', L + 'lowest daily price')], [{ t: 'Daily price up to' }, ed(D, 'rivals.' + id + '.chaosMax', 'money', L + 'highest daily price')]);
      rows.push([{ t: 'Restock delay (seconds)' }, ed(D, 'rivals.' + id + '.restockDelay', 'num', L + 'restock delay')],
        [{ t: 'Seconds between quirks' }, ed(D, 'rivals.' + id + '.quirkEvery', 'list', L + 'seconds between quirks')],
        [{ t: 'Features it likes after an update (weights)' }, { t: Object.keys(R.features).map(function (f) { return D.features[f].name + ' ' + R.features[f]; }).join(', ') }],
        [{ t: 'Rival-only mods: the month each arrives' }, { t: Object.keys(R.mods || {}).map(function (f) { return D.features[f].name + ': month ' + R.mods[f]; }).join(', ') || '—' }],
        [{ t: 'First version' }, { t: R.name + R.verPrefix + R.verStart + ' (+' + R.verStep + ' per update)' }]);
      rivBlocks.push(table(R.name, ['', ''], rows));
      rivBlocks.push(table(R.name + ': quirks', ['Quirk', 'Effect', 'Seconds', 'Strength', 'What it says'], R.quirks.map(function (q) {
        var Q = L + 'quirk ' + q.id + ' › ';
        return [{ t: q.id.replace(/^[a-z]+_/, '') }, { t: q.fx.type }, ed(D, 'rivals.' + id + '.quirks[' + q.id + '].fx.dur', 'num', Q + 'seconds'),
          q.fx.mult != null ? ed(D, 'rivals.' + id + '.quirks[' + q.id + '].fx.mult', 'num', Q + 'strength') : { t: '—' },
          ed(D, 'rivals.' + id + '.quirks[' + q.id + '].text', 'text', Q + 'text')];
      }), 'Effects: free = gives cans away; hype = more appeal; nopay = sells but earns nothing; closed / cubes = nobody can buy; refuseCold = bad on hot days; discount = price × strength; slow = sells slower; roast = its line walks away and people keep away.'));
    });
    rivBlocks.push(table('Rival upgrades (bought with the rival\'s own money: ' + pct(B.rivalSpend) + ' of every sale)', ['Upgrade', 'Base cost', 'Growth', 'Max level', 'Effect per level'],
      D.rivalUpgrades.map(function (u) {
        var eff = Object.keys(u).filter(function (k) { return ['id', 'name', 'base', 'grow', 'max'].indexOf(k) < 0; }).map(function (k) { return k + ' +' + u[k]; }).join(', ');
        var L2 = 'Rival upgrades › ' + u.name + ' › ';
        return [{ t: u.name }, ed(D, 'rivalUpgrades[' + u.id + '].base', 'money', L2 + 'base cost'), ed(D, 'rivalUpgrades[' + u.id + '].grow', 'num', L2 + 'growth'), ed(D, 'rivalUpgrades[' + u.id + '].max', 'num', L2 + 'max level'), { t: eff }];
      })));
    rivBlocks.push(table('Features and rival-only mods', ['Name', 'Kind', 'Description (what players read)', 'Numbers (Balance)'], Object.keys(D.features).map(function (f) {
      var F = D.features[f];
      var nums = { crypto: 'cryptoRate ' + B.cryptoRate + '¢/s × √strength',
        pricewar: 'pricewarCut ' + money(B.pricewarCut) + ', one month, one rival at a time', snacks: 'snackBonus +' + pct(B.snackBonus) + ' per level', fleet: 'fleetRate ' + B.fleetRate + ' sales/s per level',
        plus: 'plusRate ' + B.plusRate + '¢/s per level' }[f] || '';
      return [ed(D, 'features.' + f + '.name', 'text', 'Features › ' + F.name + ' › name'), { t: F.lv ? 'rival-only mod (levels ×' + B.modGrow + ' per month, ×' + ((D.worlds[2] && D.worlds[2].modGrow) || B.modGrow) + ' in the new park)' : 'feature (after losing a review)' },
        ed(D, 'features.' + f + '.desc', 'text', 'Features › ' + F.name + ' › description'), { t: nums }];
    }), 'Rival-only mods earn ×' + ((D.worlds[1] && D.worlds[1].rivalK) || 1) + ' in the first park and ×' + (D.worlds[2] && D.worlds[2].rivalK) + ' in the new park, times (your Refresh processing bonus)^' + B.rivalPow + '.'));
    S.push({ id: 'rivals', title: 'Rivals', intro: headerOf(src['rivals.js']), blocks: rivBlocks });

    // 9. The park
    var dps = ['morning', 'day', 'lunch', 'evening', 'night'];
    S.push({ id: 'park', title: 'The park', intro: 'Customers, drinks, weather, parts of the day and the two parks (js/data/core.js).', blocks: [
      table('Customers', ['Type', 'Look', 'Budget from', 'Budget up to', 'Walk speed', 'Favourite drinks (weight)'].concat(dps.map(function (d) { return 'How common: ' + d; })),
        Object.keys(D.customers).map(function (k) {
          var c = D.customers[k], L = 'Customers › ' + c.name + ' › ';
          return [ed(D, 'customers.' + k + '.name', 'text', L + 'name'), { t: c.look }, ed(D, 'customers.' + k + '.budget.0', 'money', L + 'budget from'), ed(D, 'customers.' + k + '.budget.1', 'money', L + 'budget up to'),
            ed(D, 'customers.' + k + '.speed', 'num', L + 'walk speed'), { t: Object.keys(c.wants).map(function (d) { return d + ' ' + c.wants[d]; }).join(', ') }]
            .concat(dps.map(function (d) { return ed(D, 'customers.' + k + '.w.' + d, 'num', L + 'how common ' + d); }));
        }), 'Fans pay ×' + B.followerBudget + ' of their budget.'),
      table('Parts of the day (more or fewer walk-ins)', ['Part', 'From', 'To', 'Walk-ins ×'], D.dayparts.map(function (p, i) {
        return [{ t: p.name }, { t: p.from + ':00' }, { t: p.to + ':00' }, ed(D, 'dayparts.' + i + '.mult', 'num', 'Park › ' + p.name + ' ' + p.from + '–' + p.to + ' › walk-ins ×')];
      })),
      table('Weather', ['Weather', 'Chance', 'Walk-ins ×'], Object.keys(D.weather).map(function (w) {
        return [{ t: D.weather[w].name }, ed(D, 'weather.' + w + '.chance', 'num', 'Park › weather ' + w + ' › chance'), ed(D, 'weather.' + w + '.traffic', 'num', 'Park › weather ' + w + ' › walk-ins ×')];
      })),
      table('Drinks', ['Drink', 'Colour', 'Sells for price +'], Object.keys(D.drinks).map(function (d) { return [{ t: D.drinks[d].name }, { t: D.drinks[d].color, swatch: D.drinks[d].color }, ed(D, 'drinks.' + d + '.extra', 'money', 'Park › ' + D.drinks[d].name + ' › extra')]; }),
        'You start with: ' + D.startDrinks.join(', ') + ' (the others are Shop upgrades). Rivals sell: ' + D.rivalDrinks.join(', ') + '. A customer without their favourite still likes the machine ×' + B.otherDrink + '.'),
      table('The parks', ['Park', 'Machines (left to right)', 'Machine x positions', 'Rival-only mods ×', 'Mod levels × per month', 'After moving in: mods ×', 'After moving in: levels ×'], Object.keys(D.worlds).map(function (w) {
        var W = D.worlds[w];
        return [{ t: w + ': ' + W.name }, { t: W.order.join(', ') }, { t: W.machineX.join(', ') }, W.rivalK ? ed(D, 'worlds.' + w + '.rivalK', 'num', 'Park › ' + W.name + ' › rival-only mods ×') : { t: '1' },
          W.modGrow ? ed(D, 'worlds.' + w + '.modGrow', 'num', 'Park › ' + W.name + ' › mod levels × per month') : { t: B.modGrow + ' (balance.modGrow)' },
          W.movedK != null ? ed(D, 'worlds.' + w + '.movedK', 'num', 'Park › ' + W.name + ' › after moving in: mods ×') : { t: '—' },
          W.movedGrow != null ? ed(D, 'worlds.' + w + '.movedGrow', 'num', 'Park › ' + W.name + ' › after moving in: levels ×') : { t: '—' }];
      }))
    ] });
    return S;
  }

  return { build: build, get: get, set: set, fileOf: fileOf, show: show, money: money, pct: pct, fxText: fxText, FILE: FILE };
})();
