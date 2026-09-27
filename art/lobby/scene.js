// OUT OF ORDER — the lobby scene.
// The canvas is sized to fill its box at a whole-number pixel scale (×2, ×3, ×4...).
// The game world is 480×270; a wider or taller window just shows more of the room around it.
// © 2026 Void Possum. All rights reserved.

var Scene = (function () {
  'use strict';

  var P = Sprites.P, R = Sprites.R;
  var WW = DATA.world.width, WH = DATA.world.height;
  var MIN_W = 330, MIN_H = 250;
  var cv, ctx, scale = 1, W = WW, H = WH, ox = 0, oy = 0;
  var parts = [], prints = [], printT = 0;
  var mouse = { x: -9999, y: -9999 };
  var lastSale = -9, flashT = 0, shakeT = 0, bumpFlash = {}, faceMood = {}, emotes = [null, null, null];
  var lightsAt = -9;
  var squashAt = -9, caps = [];   // your machine squashes when clicked; capsules run down the tubes   // when the opening ended (the ceiling lights flicker on)
  var reduced = false;
  var CRATE = { x: DATA.world.machineX[1] - 9, y: 94, w: 18, h: 14 };   // the crate sits on top of your machine
  var YOU_BOX = { x: 217, y: 108, w: 46, h: 92 };
  var TV = { x: 172, y: 36, w: 136, h: 36 };
  var WINDOWS = [{ x: 92, y: 34, w: 48, h: 78 }, { x: 340, y: 34, w: 48, h: 78 }];
  var LAMPS = [110, 240, 370], lampY = 4;
  var liftOpen = [0, 0];

  function init(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    cv.addEventListener('mousemove', function (e) { var p = toWorld(e); mouse.x = p.x; mouse.y = p.y; });
    cv.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
  }

  function setReduced(v) { reduced = !!v; }

  // Pick the biggest whole-number scale that still shows at least MIN_W × MIN_H world pixels.
  function resize(boxW, boxH) {
    var s = Math.floor(Math.min(boxW / MIN_W, boxH / MIN_H));
    if (s < 1) s = Math.min(boxW / MIN_W, boxH / MIN_H);
    scale = s;
    W = Math.max(1, Math.floor(boxW / s));
    H = Math.max(1, Math.floor(boxH / s));
    cv.width = W; cv.height = H;
    cv.style.width = Math.round(W * s) + 'px';
    cv.style.height = Math.round(H * s) + 'px';
    ctx.imageSmoothingEnabled = false;
    ox = Math.round((W - WW) / 2);
    oy = H - WH;
    if (oy > 0) oy = Math.round(oy * 0.9);
    return { scale: s, W: W, H: H };
  }

  function toWorld(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / (r.width / W) - ox, y: (e.clientY - r.top) / (r.height / H) - oy };
  }
  function inBox(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  function crateBox() { return { x: CRATE.x - 4, y: CRATE.y - 6, w: CRATE.w + 8, h: CRATE.h + 7 }; }
  function goldUnder(S, p) {
    var cs = S.run.customers;
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.gold && Math.abs(p.x - c.x) <= 10 && p.y <= c.y + 4 && p.y >= c.y - 32) return c;
    }
    return null;
  }

  // What is under the pointer? Trending customers first, then your machine, then the crate.
  function hit(S, e) {
    var p = toWorld(e), g = goldUnder(S, p);
    if (g) return { kind: 'gold', id: g.id };
    if (inBox(p, crateBox())) return { kind: 'crate' };
    if (inBox(p, YOU_BOX)) return { kind: 'you' };
    return null;
  }
  function hoverTarget(S) {
    if (mouse.x < -9000) return null;
    if (goldUnder(S, mouse)) return 'gold';
    if (inBox(mouse, crateBox())) return 'crate';
    if (inBox(mouse, YOU_BOX)) return 'you';
    return null;
  }

  // Screen position (CSS pixels, relative to the canvas) of a world point. Used by HTML overlays.
  function toScreen(wx, wy) { var k = cv.clientWidth / W; return { x: (wx + ox) * k, y: (wy + oy) * k }; }
  function tvRect() { var a = toScreen(TV.x + 3, TV.y + 3), b = toScreen(TV.x + TV.w - 3, TV.y + TV.h - 7); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }; }

  // ── light and colour over the day ───────────────────────────
  function skyFor(h, weather) {
    var c;
    if (h < 7) c = ['#f2a07a', '#f8d4a8'];
    else if (h < 16) c = ['#6fb8ec', '#bfe2f6'];
    else if (h < 18) c = ['#86aee0', '#f4d4a2'];
    else if (h < 20) c = ['#d8705a', '#f6b476'];
    else if (h < 21.5) c = ['#4a3a7a', '#a8607a'];
    else c = ['#141432', '#26264e'];
    if (weather === 'rain' && h < 21.5) c = ['#6a7a90', '#9aa6b4'];
    return c;
  }
  function darkness(h) {
    if (h < 7) return 0.16 * (7 - h);
    if (h < 17) return 0;
    if (h < 21) return (h - 17) / 4 * 0.3;
    return 0.3 + Math.min(1, (h - 21) / 1.5) * 0.26;
  }

  // ── the room ────────────────────────────────────────────────
  function drawRoom(S, t) {
    var run = S.run, h = Engine.hourOf(S);
    var vx0 = -ox, vx1 = W - ox, vy0 = -oy;
    // wall with soft vertical stripes (it grows upward on tall windows)
    var ceil = Math.max(vy0 + 3, Math.min(4, vy0 + 10));
    lampY = ceil;
    R(ctx, vx0, ceil, vx1 - vx0, 148 - ceil, P.wall0);
    ctx.fillStyle = 'rgba(210,180,140,0.18)';
    for (var sx = Math.floor(vx0 / 8) * 8; sx < vx1; sx += 8) ctx.fillRect(sx, ceil, 1, 148 - ceil);
    // ceiling strip at the very top
    R(ctx, vx0, vy0, vx1 - vx0, ceil - vy0, '#e6cfaf');
    ctx.fillStyle = 'rgba(160,120,90,0.25)';
    for (var cx = Math.floor(vx0 / 32) * 32; cx < vx1; cx += 32) ctx.fillRect(cx, vy0, 1, ceil - vy0);
    R(ctx, vx0, ceil - 1, vx1 - vx0, 1, '#c8a47c'); R(ctx, vx0, ceil, vx1 - vx0, 3, 'rgba(120,80,50,0.12)');
    // wainscot
    R(ctx, vx0, 148, vx1 - vx0, 4, P.wood3); R(ctx, vx0, 148, vx1 - vx0, 1, P.wood1);
    R(ctx, vx0, 152, vx1 - vx0, 42, P.wood1);
    for (var px = Math.floor(vx0 / 30) * 30 + 4; px < vx1; px += 30) {
      R(ctx, px, 157, 24, 32, P.wood2); R(ctx, px + 1, 158, 22, 30, P.wood1);
      R(ctx, px + 1, 158, 22, 1, P.wood0); R(ctx, px + 1, 158, 1, 30, P.wood0);
    }
    R(ctx, vx0, 193, vx1 - vx0, 4, P.wood4);
    // floor tiles with a bevel
    for (var fy = 197; fy < H - oy; fy += 10) {
      for (var fx = Math.floor(vx0 / 16) * 16; fx < vx1; fx += 16) {
        var odd = ((fx / 16) + ((fy - 197) / 10)) % 2 !== 0;
        R(ctx, fx, fy, 16, 10, odd ? P.fl1 : P.fl0);
        R(ctx, fx, fy, 16, 1, odd ? P.fl0 : P.flHi);
        R(ctx, fx, fy + 9, 16, 1, P.fl2);
      }
    }
    ctx.fillStyle = 'rgba(255,230,200,0.07)';
    ctx.fillRect(vx0, 197, vx1 - vx0, 18);
    // the Comfy Carpet under your line (longer with each level)
    var rug = run.upgrades.carpet | 0;
    if (rug) {
      var rx = Engine.MX[1] - 12, ry = 202, rl = 16 + rug * 10;
      R(ctx, rx - 1, ry - 1, 26, rl + 2, P.ink);
      R(ctx, rx, ry, 24, rl, '#b8404a'); R(ctx, rx + 2, ry + 2, 20, rl - 4, '#d8606a');
      for (var ri = 0; ri < rl - 6; ri += 4) R(ctx, rx + 11, ry + 3 + ri, 2, 2, '#f0c060');
      for (var fr = 0; fr < 24; fr += 2) { R(ctx, rx + fr, ry - 2, 1, 1, '#f0e0c0'); R(ctx, rx + fr, ry + rl + 1, 1, 1, '#f0e0c0'); }
    }
    // machine reflections on the polished floor
    Engine.MX.forEach(function (mx, i) {
      var L = Sprites.LOOKS[i === 1 ? 'you' : S.run.machines[i].id];
      ctx.fillStyle = hexA(L.main, 0.13);
      ctx.fillRect(mx - 21, 203, 42, 8); ctx.fillRect(mx - 18, 211, 36, 5);
    });

    windows(S, h, t);
    DATA.world.doors.forEach(function (d, i) { lift(d.x, liftOpen[i], h, t); });
    poster(144, 44);
    clock(324, 56, h);
    // ceiling lamps
    LAMPS.forEach(function (lx) { R(ctx, lx - 8, lampY, 16, 3, P.ink); R(ctx, lx - 7, lampY, 14, 2, '#fff6d8'); });
    // TV, hanging from the ceiling
    R(ctx, TV.x + 10, lampY, 2, TV.y - lampY, P.steel3); R(ctx, TV.x + TV.w - 12, lampY, 2, TV.y - lampY, P.steel3);
    Sprites.tv(ctx, TV.x, TV.y, TV.w, TV.h, t, darkness(h) > 0.2);
    // bench and bin
    R(ctx, 92, 176, 50, 5, P.ink); R(ctx, 93, 176, 48, 3, P.wood0); R(ctx, 93, 179, 48, 1, P.wood2);
    R(ctx, 96, 181, 3, 14, P.wood3); R(ctx, 135, 181, 3, 14, P.wood3);
    R(ctx, 83, 181, 10, 15, P.ink); R(ctx, 84, 182, 8, 13, P.steel3); R(ctx, 84, 182, 8, 2, P.steel2);
    // the plant grows a little every run
    Sprites.plant(ctx, 362, 198, Math.min(24, (S.meta.runs - 1) * 3));
    // extra room for wide windows
    if (vx0 < 0) { waterCooler(8, 196); Sprites.plant(ctx, -40, 198, 6); }
    if (vx1 > WW) { extinguisher(470, 170); Sprites.plant(ctx, 520, 198, 10); }
    // wet floor sign and footprints on rainy days
    if (run.weather === 'rain') wetSign(90, 214);
    prints.forEach(function (fp) {
      ctx.fillStyle = 'rgba(70,90,120,' + (0.35 * (1 - fp.t / 8)).toFixed(2) + ')';
      ctx.fillRect(Math.round(fp.x), Math.round(fp.y), 2, 1);
    });
  }

  function windows(S, h, t) {
    var sky = skyFor(h, S.run.weather);
    WINDOWS.forEach(function (w, wi) {
      // sky with dithered bands
      var bands = 6, bh = Math.ceil(w.h / bands);
      for (var b = 0; b < bands; b++) {
        var k = b / (bands - 1);
        Sprites.dither(ctx, w.x, w.y + b * bh, w.w, Math.min(bh, w.h - b * bh), mix(sky[0], sky[1], k), mix(sky[0], sky[1], Math.min(1, k + 0.2)), 0.5);
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
      var night = h >= 20.5;
      if (night) {
        ctx.fillStyle = '#fff6d8';
        for (var i = 0; i < 9; i++) ctx.fillRect(w.x + (i * 17 + wi * 7) % w.w, w.y + (i * 11) % 40, 1, 1);
        if (wi === 1) { ctx.fillStyle = '#f4ecd0'; ctx.fillRect(w.x + 30, w.y + 10, 6, 6); ctx.fillRect(w.x + 31, w.y + 9, 4, 8); }
      } else if (S.run.weather === 'hot' && wi === 1) {
        ctx.fillStyle = '#fff2a0'; ctx.fillRect(w.x + 28, w.y + 10, 10, 10); ctx.fillRect(w.x + 30, w.y + 8, 6, 14); ctx.fillRect(w.x + 26, w.y + 12, 14, 6);
        ctx.fillStyle = 'rgba(255,240,160,0.4)'; ctx.fillRect(w.x + 24, w.y + 6, 18, 18);
      } else if (S.run.weather === 'normal') {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        var off = (t * 2 + wi * 30) % (w.w + 30);
        cloud(w.x + off - 20, w.y + 14); cloud(w.x + ((off + 24) % (w.w + 30)) - 20, w.y + 28);
      }
      // city, two layers
      ctx.fillStyle = night ? '#1c1c34' : (S.run.weather === 'rain' ? '#7a8494' : '#a4b4cc');
      [[0, 26], [8, 38], [18, 22], [28, 44], [38, 30]].forEach(function (bd) { ctx.fillRect(w.x + bd[0], w.y + w.h - bd[1] * 0.7, 9, bd[1] * 0.7); });
      ctx.fillStyle = night ? '#121226' : (S.run.weather === 'rain' ? '#5e6878' : '#8494b0');
      [[4, 18], [14, 26], [24, 16], [34, 30], [42, 20]].forEach(function (bd) { ctx.fillRect(w.x + bd[0], w.y + w.h - bd[1] * 0.6, 7, bd[1] * 0.6); });
      if (h >= 19.5) {
        ctx.fillStyle = '#ffd98a';
        for (var j = 0; j < 10; j++) ctx.fillRect(w.x + 2 + (j * 13 + wi * 5) % 44, w.y + w.h - 3 - (j * 7) % 16, 1, 1);
      }
      if (S.run.weather === 'rain') {
        ctx.fillStyle = 'rgba(210,225,255,0.65)';
        for (var r = 0; r < 18; r++) {
          var rx = w.x + ((r * 29 + t * 20) % w.w), ry = w.y + ((r * 17 + t * 120) % w.h);
          ctx.fillRect(Math.round(rx), Math.round(ry), 1, 3);
        }
        ctx.fillStyle = 'rgba(230,240,255,0.8)';
        for (var dr = 0; dr < 5; dr++) ctx.fillRect(w.x + 4 + dr * 9, w.y + ((dr * 23 + t * 8) % w.h), 1, 2);
      }
      ctx.restore();
      // glass shine + frame + sill
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (var s = 0; s < 20; s++) ctx.fillRect(w.x + 4 + s, w.y + 30 - s, 1, 1);
      R(ctx, w.x - 4, w.y - 4, w.w + 8, 4, P.wood3); R(ctx, w.x - 4, w.y + w.h, w.w + 8, 3, P.wood3);
      R(ctx, w.x - 4, w.y, 4, w.h, P.wood3); R(ctx, w.x + w.w, w.y, 4, w.h, P.wood3);
      R(ctx, w.x + w.w / 2 - 1, w.y, 2, w.h, P.wood3); R(ctx, w.x, w.y + 36, w.w, 2, P.wood3);
      R(ctx, w.x - 6, w.y + w.h + 3, w.w + 12, 3, P.wood1); R(ctx, w.x - 6, w.y + w.h + 3, w.w + 12, 1, P.wood0);
      R(ctx, w.x - 5, w.y - 5, w.w + 10, 1, P.ink);
    });
  }

  // A lift. `open` goes from 0 (closed) to 1 (open). Customers arrive and leave through the lifts.
  function lift(cx, open, h, t) {
    var x = cx - 23, y = 120, w = 46, hh = 76;
    R(ctx, x - 3, y - 12, w + 6, hh + 12, P.ink);
    R(ctx, x - 2, y - 11, w + 4, hh + 11, P.steel3); R(ctx, x - 2, y - 11, w + 4, 1, P.steel2);
    // floor display above the doors
    R(ctx, cx - 9, y - 9, 18, 7, '#161420');
    Sprites.text(ctx, '3', cx - 1, y - 8, '#ffb84a');
    if (open > 0.05) { R(ctx, cx - 7, y - 7, 3, 1, '#ffb84a'); R(ctx, cx - 6, y - 8, 1, 1, '#ffb84a'); }
    // the cabin, seen when the doors open
    R(ctx, x + 2, y, w - 4, hh, '#d9c3a2'); R(ctx, x + 2, y, w - 4, 4, '#fff1d0');
    R(ctx, x + 4, y + 40, w - 8, 2, P.steel1); R(ctx, x + 2, y + hh - 10, w - 4, 10, '#8a6e5a');
    // sliding doors
    var half = (w - 4) / 2, gap = Math.round(half * open);
    var lw = half - gap;
    if (lw > 0) {
      R(ctx, x + 2, y, lw, hh, P.steel1); R(ctx, x + 2, y, 1, hh, P.steel0);
      R(ctx, x + 2 + half + gap, y, lw, hh, P.steel2); R(ctx, x + 1 + w - 4, y, 1, hh, P.steel3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (var s2 = 0; s2 < 16; s2++) ctx.fillRect(x + 4 + Math.min(lw - 3, s2), y + 24 - s2, 1, 1);
      if (open < 0.05) R(ctx, cx - 1, y, 1, hh, P.steel4);
    }
    // call buttons
    var bx = x + w + 1;
    R(ctx, bx, y + 34, 4, 10, P.ink); R(ctx, bx + 1, y + 35, 2, 8, P.steel2);
    R(ctx, bx + 1, y + 36, 2, 2, open > 0.05 ? '#ffb84a' : '#6a5a4a'); R(ctx, bx + 1, y + 40, 2, 2, '#6a5a4a');
    // threshold
    R(ctx, x, 196, w, 2, P.steel2); R(ctx, x, 196, w, 1, P.steel0);
  }

  function poster(x, y) {
    R(ctx, x - 1, y - 1, 26, 34, P.ink); R(ctx, x, y, 24, 32, '#f6ecd8'); R(ctx, x, y, 24, 3, P.red);
    Sprites.text(ctx, 'STAY', x + 5, y + 6, P.red); Sprites.text(ctx, 'FRESH', x + 3, y + 12, P.red);
    R(ctx, x + 9, y + 19, 6, 9, P.red); R(ctx, x + 9, y + 19, 6, 1, '#e8e8e8'); R(ctx, x + 10, y + 21, 1, 5, '#ff9a8a');
  }

  function clock(x, y, h) {
    ctx.fillStyle = P.ink; circle(x, y, 9);
    ctx.fillStyle = '#6a4a36'; circle(x, y, 8);
    ctx.fillStyle = '#f8f0e0'; circle(x, y, 6.5);
    var hh = h % 12, mm = (h % 1) * 60;
    line(x, y, x + Math.sin(hh / 12 * Math.PI * 2) * 3.5, y - Math.cos(hh / 12 * Math.PI * 2) * 3.5, '#3a2a20');
    line(x, y, x + Math.sin(mm / 60 * Math.PI * 2) * 5.5, y - Math.cos(mm / 60 * Math.PI * 2) * 5.5, P.red);
  }

  function waterCooler(x, y) {
    R(ctx, x - 7, y - 30, 14, 30, P.ink); R(ctx, x - 6, y - 29, 12, 29, P.steel1); R(ctx, x - 6, y - 29, 12, 2, P.steel0);
    R(ctx, x - 5, y - 46, 10, 16, P.ink); R(ctx, x - 4, y - 45, 8, 15, '#9ad0f0'); R(ctx, x - 3, y - 44, 2, 12, '#d0f0ff');
  }
  function extinguisher(x, y) { R(ctx, x - 4, y, 8, 18, P.ink); R(ctx, x - 3, y + 1, 6, 16, P.red); R(ctx, x - 1, y - 3, 2, 3, P.ink); }
  function wetSign(x, y) {
    R(ctx, x - 6, y - 14, 12, 14, P.ink); R(ctx, x - 5, y - 13, 10, 12, '#ffd23a'); Sprites.text(ctx, '!', x - 1, y - 11, P.ink);
  }

  function cloud(x, y) { ctx.fillRect(Math.round(x), Math.round(y), 14, 4); ctx.fillRect(Math.round(x) + 3, Math.round(y) - 3, 7, 3); }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function line(x0, y0, x1, y1, c) {
    var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
    ctx.fillStyle = c;
    for (var i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
  }
  function mix(a, b, k) {
    var na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
    var r = Math.round(((na >> 16) & 255) * (1 - k) + ((nb >> 16) & 255) * k);
    var g = Math.round(((na >> 8) & 255) * (1 - k) + ((nb >> 8) & 255) * k);
    var bl = Math.round((na & 255) * (1 - k) + (nb & 255) * k);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')';
  }

  // Sunbeams through the windows (daytime).
  function sunbeams(S, h, t) {
    if (h < 7 || h > 18.5 || S.run.weather === 'rain') return;
    var strength = (S.run.weather === 'hot' ? 1.4 : 1) * Math.sin((h - 7) / 11.5 * Math.PI);
    var dx = (12.5 - h) * 9;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    WINDOWS.forEach(function (w) {
      ctx.fillStyle = 'rgba(255,220,150,' + (0.05 * strength).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(w.x, w.y + w.h); ctx.lineTo(w.x + w.w, w.y + w.h);
      ctx.lineTo(w.x + w.w + dx + 14, 256); ctx.lineTo(w.x + dx - 6, 256);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,170,' + (0.06 * strength).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(w.x + dx * 0.55 - 2, 212); ctx.lineTo(w.x + w.w + dx * 0.55 + 8, 212);
      ctx.lineTo(w.x + w.w + dx + 14, 256); ctx.lineTo(w.x + dx - 6, 256);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,210,0.5)';
      for (var i = 0; i < 6; i++) {
        var k = ((t * 0.05 + i * 0.17) % 1);
        ctx.fillRect(Math.round(w.x + 6 + ((i * 13) % (w.w - 8)) + dx * k), Math.round(w.y + w.h + k * 120), 1, 1);
      }
    });
    ctx.restore();
  }

  // ── machines ────────────────────────────────────────────────
  function machineInfo(S, i, t) {
    var run = S.run, M = run.machines[i], vending = [];
    (M.lanes || []).forEach(function (L, n) {
      if (!L.c) return;
      for (var k = 0; k < run.customers.length; k++) if (run.customers[k].id === L.c) { vending[n] = run.customers[k].drink; break; }
    });
    var h = Engine.hourOf(S);
    if (i === Engine.YOU) {
      var mood = 'ok';
      if (S.pause && S.pause.type === 'reset') mood = 'glitch';
      else if (t - lastSale < 0.7) mood = 'happy';
      else if (run.drinks.some(function (d) { return (M.stock[d] | 0) <= 0; })) mood = 'worried';
      else if (h >= 22 && !M.queue.length) mood = 'sleepy';
      var st = Engine.youStats(S);
      return { id: 'you', stock: M.stock, cap: st.cap, drinks: run.drinks, up: run.upgrades, hw: run.hw, pps: Engine.pps(S),
               lanes: st.lanes, hat: Engine.hasHat(S), face: mood, vending: vending, t: t, cold: st.cold, lock: run.lock || null,
               clickMe: S.meta.totalLikes < 12 && !S.pause && !(run.intro && run.intro.step !== 'post'), name: Engine.myName(S) };
    }
    var mood2 = run.intro ? 'sleepy' : faceMood[i] && t < faceMood[i].until ? faceMood[i].mood : 'ok';
    if (mood2 === 'ok' && M.qSales < run.machines[Engine.YOU].qSales * 0.6 && run.qDay > 0) mood2 = 'worried';
    if (mood2 === 'ok' && h >= 22.5 && !M.queue.length) mood2 = 'sleepy';
    return { id: M.id, stock: M.stock, cap: Engine.capOf(S, M), drinks: DATA.startDrinks, fx: M.fx ? M.fx.type : null,
             face: mood2, vending: vending, lanes: 1, t: t, cold: 1, feats: M.features || [], rup: M.up || {} };
  }

  // ── main draw ───────────────────────────────────────────────
  function draw(S, t, dt) {
    var run = S.run, h = Engine.hourOf(S);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var sx = 0, sy = 0;
    if (shakeT > 0 && !reduced) { shakeT -= dt; sx = Math.round((Math.random() - 0.5) * 4); sy = Math.round((Math.random() - 0.5) * 3); }
    ctx.translate(ox + sx, oy + sy);

    // rainy footprints near the doors
    if (run.weather === 'rain') {
      printT -= dt;
      if (printT <= 0) {
        printT = 0.35;
        run.customers.forEach(function (c) {
          var nearDoor = DATA.world.doors.some(function (d) { return Math.abs(c.x - d.x) < 60; });
          if (nearDoor && (c.st === 'in' || c.st === 'go' || c.st === 'out')) prints.push({ x: c.x + (Math.random() < 0.5 ? -2 : 1), y: c.y, t: 0 });
        });
        if (prints.length > 120) prints.splice(0, prints.length - 120);
      }
    }
    prints = prints.filter(function (p) { p.t += dt; return p.t < 8; });

    DATA.world.doors.forEach(function (d, i) {
      var near = run.customers.some(function (c) { return Math.abs(c.x - d.x) < 16 && c.y < 222 && (c.st === 'in' || c.st === 'out' || c.st === 'gold' || c.st === 'go'); });
      liftOpen[i] = Math.max(0, Math.min(1, liftOpen[i] + (near ? 3 : -1.5) * dt));
    });
    drawRoom(S, t);
    sunbeams(S, h, t);

    // machines (yours squashes a little when clicked, and grows a little under the mouse)
    var hov = hoverTarget(S);
    tubes(run, t, dt);
    var infos = [];
    for (var i = 0; i < 3; i++) {
      infos.push(machineInfo(S, i, t));
      if (i === Engine.YOU) { youXf(hov === 'you', t); Sprites.machine(ctx, Engine.MX[i], infos[i]); ctx.restore(); }
      else Sprites.machine(ctx, Engine.MX[i], infos[i]);
      if (bumpFlash[i] && t - bumpFlash[i] < 1.2) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - (t - bumpFlash[i]) / 1.2)).toFixed(2) + ')';
        ctx.fillRect(Engine.MX[i] - 23, 108, 46, 92);
        Sprites.textShadow(ctx, 'UPDATED', Engine.MX[i] - 13, 96, P.white);
      }
    }
    for (var em = 0; em < 3; em++) {
      var E = emotes[em];
      if (E && t < E.until) {
        var ey = (em === Engine.YOU ? 88 : 104) - (reduced ? 0 : Math.round(Math.sin(t * 5) * 1));
        Sprites.bubble(ctx, Engine.MX[em] - 12, ey, E.kind, null, t);
      }
    }
    youXf(hov === 'you', t); Sprites.crate(ctx, CRATE.x, CRATE.y, hov === 'crate'); ctx.restore();
    if (hov === 'you') { ctx.fillStyle = 'rgba(255,240,200,0.14)'; ctx.fillRect(YOU_BOX.x - 1, 107, YOU_BOX.w + 2, 94); }
    // followers waiting outside: a counter by the left lift
    var wait = Math.floor(run.waiting);
    if (wait >= 1) {
      var lx = DATA.world.doors[0].x, lab2 = String(wait), bw = Sprites.textWidth(lab2) + 11;
      R(ctx, lx - bw / 2 - 1, 99, bw + 2, 11, P.ink); R(ctx, lx - bw / 2, 100, bw, 9, '#fff4e0');
      R(ctx, lx - bw / 2 + 2, 101, 4, 7, '#20202a'); R(ctx, lx - bw / 2 + 3, 102, 2, 4, P.cyan);
      Sprites.text(ctx, lab2, lx - bw / 2 + 8, 102, P.red);
    }

    // people, back to front
    var env = { weather: run.weather };
    run.customers.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (c) {
      var top = Sprites.person(ctx, c, t, env);
      if (c.gold) Sprites.bubble(ctx, c.x, top - 1, 'heart', null, t);
      else if (c.icon) Sprites.bubble(ctx, c.x, top - 1, c.icon, c.iconD || c.want, t);
      if (c.sipT > 0 && Math.floor(t * 10) % 3 === 0) R(ctx, c.x + 4 + (Math.random() * 3 | 0), top + 6 - (Math.random() * 4 | 0), 1, 1, '#ffffff');
    });

    drawParts(dt, t);

    // night
    var a = darkness(h);
    if (a > 0.01) {
      var vx0 = -ox, vy0 = -oy;
      ctx.fillStyle = 'rgba(20,16,56,' + a.toFixed(3) + ')';
      ctx.fillRect(vx0 - 4, vy0 - 4, W + 8, H + 8);
      ctx.globalCompositeOperation = 'lighter';
      LAMPS.forEach(function (lx) {
        glow(lx, lampY + 4, 26, 'rgba(255,214,150,' + (a * 0.55).toFixed(3) + ')');
        cone(lx, lampY + 2, 196 + 30, 58, 'rgba(255,200,140,' + (a * 0.12).toFixed(3) + ')');
      });
      for (var m = 0; m < 3; m++) {
        var L = Sprites.LOOKS[infos[m].id];
        glow(Engine.MX[m] - 4, 150, 46, hexA(L.glow, a * 0.5));
        glow(Engine.MX[m], 212, 30, hexA(L.glow, a * 0.35));
      }
      glow(TV.x + TV.w / 2, TV.y + TV.h / 2, 60, 'rgba(110,180,255,' + (a * 0.25).toFixed(3) + ')');
      DATA.world.doors.forEach(function (d) { glow(d.x, 113, 12, 'rgba(255,180,80,' + (a * 0.5).toFixed(3) + ')'); });
      ctx.globalCompositeOperation = 'source-over';
      for (var m2 = 0; m2 < 3; m2++) Sprites.machineLights(ctx, Engine.MX[m2], infos[m2], a);
      DATA.world.doors.forEach(function (d) { R(ctx, d.x - 9, 111, 18, 7, '#161420'); Sprites.text(ctx, '3', d.x - 1, 112, '#ffb84a'); });
    }

    var dark = 0;
    if (run.intro) dark = 0.86;
    else if (t - lightsAt < 1.6) {
      var k2 = (t - lightsAt) / 1.6;
      dark = [1, 0, 1, 1, 0, 0.6, 0, 0.3][Math.min(7, Math.floor(k2 * 8))] * 0.86 * (1 - k2 * 0.5);
    }
    if (dark > 0.01) spotlight(dark, t);
    // "RESTOCK $x" over the crate when you point at it, or when a drink is running low
    var Y = run.machines[Engine.YOU], capY = Engine.capOf(S, Y);
    var low = run.drinks.some(function (d) { return (Y.stock[d] | 0) <= Math.floor(capY / 3); });
    var introRestock = run.intro && run.intro.step === 'restock';
    var alert = !S.pause && (introRestock || (low && (run.upgrades.tubes | 0) < 3 && !run.intro));
    var blink = Math.floor(t * 3) % 3 !== 0;
    if (!S.pause && (hov === 'crate' || (alert && blink))) {
      var rc = introRestock ? 0 : Engine.restockCost(S);
      var lab = introRestock ? 'RESTOCK' : rc <= 0.001 ? 'FULL' : 'RESTOCK ƒ' + Math.round(rc);
      Sprites.textShadow(ctx, lab, Math.round(Engine.MX[1] - Sprites.textWidth(lab) / 2), CRATE.y - 9,
                         alert ? '#ff3b3b' : rc > run.cash ? '#ff8a8a' : P.gold1);
    }
    if (alert) {
      var bob = reduced ? 0 : Math.round(Math.sin(t * 8) * 2), ay = CRATE.y + 7;
      arrow(CRATE.x - 5 - bob, ay, 1);
      arrow(CRATE.x + CRATE.w + 4 + bob, ay, -1);
    }

    if (S.pause && (S.pause.type === 'reset' || S.pause.type === 'jailbreak')) glitch(t);
    if (S.pause && S.pause.type === 'jailbreak' && !reduced) tear(t);
    if (flashT > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.8, flashT).toFixed(2) + ')';
      ctx.fillRect(-ox - 4, -oy - 4, W + 8, H + 8);
      flashT -= dt * 1.5;
    }
    ctx.restore();
  }

  function glow(x, y, r, color) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function cone(x, y0, y1, halfW, color) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 6, y0); ctx.lineTo(x + 6, y0); ctx.lineTo(x + halfW, y1); ctx.lineTo(x - halfW, y1); ctx.closePath(); ctx.fill();
  }
  // Your machine's click squash: call before drawing it, then ctx.restore().
  function youXf(hover, t) {
    var k = reduced ? 0 : Math.max(0, 1 - (t - squashAt) / 0.16), cx = Engine.MX[Engine.YOU], by = 200;
    var sx = 1 + 0.045 * k + (hover ? 0.012 : 0), sy = 1 - 0.06 * k + (hover ? 0.012 : 0);
    ctx.save();
    ctx.translate(cx, by); ctx.scale(sx, sy); ctx.translate(-cx, -by);
  }

  // Pneumatic tubes: pipes from above into the back of your machine. One more pipe per level (up to 3).
  function tubes(run, t, dt) {
    var lv = run.upgrades.tubes | 0;
    if (!lv) { caps.length = 0; return; }
    var n = Math.min(3, lv), top = TV.y + TV.h - 2, bot = 112;
    for (var i = 0; i < n; i++) {
      var x = tubeX(i);
      R(ctx, x - 1, top, 5, bot - top, P.ink);
      ctx.fillStyle = 'rgba(200,230,240,0.55)'; ctx.fillRect(x, top, 3, bot - top);
      R(ctx, x, top, 1, bot - top, 'rgba(255,255,255,0.7)');
      for (var yy = Math.ceil(top / 24) * 24; yy < bot; yy += 24) R(ctx, x - 1, yy, 5, 2, P.steel2);   // clamps
    }
    for (var c = caps.length - 1; c >= 0; c--) {
      var C = caps[c];
      C.y += 140 * dt;
      if (C.y > bot - 4) { caps.splice(c, 1); continue; }
      R(ctx, C.x, Math.round(C.y), 3, 5, C.c); R(ctx, C.x, Math.round(C.y), 3, 1, '#ffffff');
    }
  }
  function tubeX(i) { return Engine.MX[Engine.YOU] + 11 + i * 6; }

  // Everything dark except a pool of light on your machine (and the crate when it matters).
  function spotlight(a, t) {
    var cx = Engine.MX[Engine.YOU], cy = 150;
    var g = ctx.createRadialGradient(cx, cy, 24, cx, cy, 68);
    g.addColorStop(0, 'rgba(6,4,14,0)');
    g.addColorStop(1, 'rgba(6,4,14,' + a.toFixed(3) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(-ox - 4, -oy - 4, W + 8, H + 8);
    ctx.globalCompositeOperation = 'lighter';
    cone(cx, 20, 200, 40, 'rgba(255,230,180,' + (a * 0.08).toFixed(3) + ')');
    ctx.globalCompositeOperation = 'source-over';
  }

  // A red pixel arrow; dir 1 points right, -1 points left. The tip is at (x, y).
  function arrow(x, y, dir) {
    [[1, P.ink], [0, '#ff3b3b']].forEach(function (L) {
      for (var c = 0; c < 5; c++) R(ctx, x - dir * c + L[0], y - c + L[0], 1, c * 2 + 1, L[1]);
      R(ctx, (dir > 0 ? x - 8 : x + 5) + L[0], y - 1 + L[0], 4, 3, L[1]);
    });
  }

  // Before Developer Mode: slices of the screen slide sideways.
  function tear(t) {
    var n = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      var y = Math.floor(Math.random() * H), h = 2 + Math.floor(Math.random() * 8), dx = Math.round((Math.random() - 0.5) * 16);
      ctx.drawImage(cv, 0, y, W, h, dx - ox, y - oy, W, h);
    }
  }

  function glitch(t) {
    for (var i = 0; i < 10; i++) {
      var y = Math.floor((Math.sin(t * 13 + i * 7) * 0.5 + 0.5) * H) - oy;
      ctx.fillStyle = i % 2 ? 'rgba(255,90,120,0.18)' : 'rgba(90,255,220,0.14)';
      ctx.fillRect(-ox, y, W, 2 + (i % 3));
    }
    ctx.fillStyle = 'rgba(10,6,20,0.25)';
    ctx.fillRect(-ox, -oy, W, H);
  }

  // ── particles ───────────────────────────────────────────────
  function addText(x, y, str, color, life) {
    if (parts.length > 90) parts.shift();
    parts.push({ k: 'text', x: x, y: y, vy: -14, t: 0, life: life || 1.2, s: str, c: color });
  }

  function drawParts(dt, t) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      if (p.t < 0) continue;
      var k = p.t / p.life;
      if (p.k === 'text') {
        p.y += p.vy * dt;
        if (k < 0.8 || Math.floor(p.t * 20) % 2) { var w = Sprites.textWidth(p.s); Sprites.textShadow(ctx, p.s, Math.round(p.x - w / 2), Math.round(p.y), p.c); }
      } else if (p.k === 'can') {
        var e = k * k * (3 - 2 * k);
        var x = p.x0 + (p.x1 - p.x0) * e, y = p.y0 + (p.y1 - p.y0) * e - Math.sin(k * Math.PI) * 18;
        R(ctx, x, y, 3, 5, p.c); R(ctx, x, y, 3, 1, '#e0e0e0');
      } else if (p.k === 'spark') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt;
        R(ctx, p.x, p.y, 1, 1, p.c);
      } else if (p.k === 'heart') {
        p.y -= 18 * dt; p.x += Math.sin(p.t * 7 + p.seed) * 0.35;
        if (k < 0.75 || Math.floor(p.t * 20) % 2) Sprites.heart(ctx, Math.round(p.x), Math.round(p.y), P.pink, p.small);
      } else if (p.k === 'bit') {
        p.y -= 22 * dt;
        R(ctx, p.x, p.y, 1, 2, P.cyan); R(ctx, p.x + 2, p.y + 1, 1, 1, '#b8f4ff');
      } else if (p.k === 'drone') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        Sprites.drone(ctx, Math.round(p.x), Math.round(p.y), t, p.c);
      } else if (p.k === 'confetti') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.vx *= 0.99;
        R(ctx, p.x, p.y, 2, 1, p.c);
      }
    }
  }

  function sparks(x, y, color, n) {
    if (reduced) n = Math.ceil(n / 3);
    for (var i = 0; i < n; i++) parts.push({ k: 'spark', x: x, y: y, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 50 - 10, t: 0, life: 0.6 + Math.random() * 0.5, c: color });
  }

  // Engine events → effects in the scene.
  function onEvent(S, e, t) {
    var MX = Engine.MX;
    switch (e.type) {
      case 'post':
        squashAt = t;
        if (parts.length < 80) parts.push({ k: 'heart', x: MX[1] - 6 + Math.random() * 12, y: 106, t: 0, life: 1.1, seed: Math.random() * 6, small: e.likes < 1 });
        if (e.research > 0 && parts.length < 80) parts.push({ k: 'bit', x: MX[1] - 8 + Math.random() * 16, y: 108, t: 0, life: 0.9 });
        break;
      case 'sale':
        if (e.machine === Engine.YOU) {
          lastSale = t;
          addText(MX[1] + (Math.random() * 10 - 5), 94, '+ƒ' + Math.round(e.amount), e.amount > 0 ? P.gold1 : P.white, 1.3);
          sparks(MX[1] - 6, 190, P.gold1, 3);
        } else if (e.online) {
          if (parts.length < 80) parts.push({ k: 'drone', x: MX[e.machine], y: 104, vx: (Math.random() - 0.5) * 20, vy: -30, t: 0, life: 3.5, c: DATA.drinks[e.drink] ? DATA.drinks[e.drink].color : null });
        } else if (Math.random() < 0.6) {
          addText(MX[e.machine] + (Math.random() * 10 - 5), 98, '+ƒ' + Math.round(e.amount), Sprites.LOOKS[S.run.machines[e.machine].id].glow, 0.9);
        }
        if (e.machine !== Engine.YOU && Math.random() < 0.06 && !emotes[e.machine]) emotes[e.machine] = { kind: 'coin', until: t + 1.6 };
        break;
      case 'restock':
        var cols = S.run.drinks.map(function (d) { return DATA.drinks[d].color; });
        var n = Math.min(reduced ? 3 : 10, e.n);
        for (var j = 0; j < n; j++) parts.push({ k: 'can', x0: CRATE.x + 6 + (j % 3) * 3, y0: CRATE.y - (e.auto ? 8 : 2), x1: MX[1] - 8 + (j % 5) * 4, y1: 140 + (j % 4) * 8, t: -j * 0.05, life: 0.55, c: cols[j % cols.length] });
        break;
      case 'buy': case 'hw': case 'doubler':
        sparks(MX[1], 140, P.gold1, 14); sparks(MX[1], 140, P.white, 8);
        break;
      case 'tube':
        if (caps.length < 14) {
          var lvT = Math.min(3, S.run.upgrades.tubes | 0) || 1;
          caps.push({ x: tubeX(Math.floor(Math.random() * lvT)), y: TV.y + TV.h, c: DATA.drinks[e.drink] ? DATA.drinks[e.drink].color : P.red });
        }
        break;
      case 'drones':
        for (var dn = 0; dn < Math.min(e.n, reduced ? 1 : 3); dn++) {
          if (parts.length > 85) break;
          parts.push({ k: 'drone', x: MX[1] - 10 + Math.random() * 20, y: 104 - dn * 6, vx: (Math.random() - 0.5) * 24, vy: -34 - Math.random() * 14, t: 0, life: 4.5, c: DATA.drinks.cola.color });
        }
        if (e.amount > 0 && Math.random() < 0.5) addText(MX[1] + 14, 100, '+ƒ' + Math.round(e.amount), P.gold1, 1.1);
        break;
      case 'restockNone':
        addText(MX[1], CRATE.y - 12, e.full ? 'FULL' : 'NOT ENOUGH FIZZ', e.full ? P.white : '#ff8a8a', 1.1);
        break;
      case 'emote':
        if (!emotes[e.machine] || t > emotes[e.machine].until - 1) emotes[e.machine] = { kind: e.kind, until: t + 2.2 };
        break;
      case 'hackWarn':
        emotes[1] = { kind: 'bang', until: t + 5 };
        break;
      case 'hackLock':
        shakeT = 0.4; flashT = 0.3;
        break;
      case 'reboot':
        sparks(MX[1], 124, P.green, 3);
        break;
      case 'hackDone':
        sparks(MX[1], 124, P.green, 16); emotes[1] = { kind: 'happy', until: t + 2 };
        break;
      case 'bump':
        emotes[e.machine] = { kind: 'bang', until: t + 2 };
        bumpFlash[e.machine] = t;
        faceMood[e.machine] = { mood: 'worried', until: t + 6 };
        break;
      case 'goldClick':
        sparks(e.x, e.y - 14, P.gold1, 30); sparks(e.x, e.y - 14, P.white, 12);
        var label = { trending: 'TRENDING!', rush: 'RUSH HOUR!', tip: 'BIG TIP!', grant: 'GRANT!' }[e.res.kind] || '!';
        addText(e.x, e.y - 36, label, P.gold1, 2);
        break;
      case 'review':
        if (e.res.lowest !== Engine.YOU && !reduced) {
          for (var c = 0; c < 40; c++) parts.push({ k: 'confetti', x: MX[1], y: 100, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 90 - 20, t: 0, life: 2.2,
                                                    c: [P.pink, P.gold1, P.cyan, P.green][c % 4] });
        }
        faceMood[e.res.lowest] = { mood: 'worried', until: t + 8 };
        break;
      case 'resetStart':
        shakeT = 0.5;
        break;
      case 'introDone':
        lightsAt = t;
        break;
      case 'wiped':
        flashT = 1; shakeT = 0.4;
        parts.length = 0;
        break;
    }
  }

  return { init: init, resize: resize, draw: draw, hit: hit, onEvent: onEvent, toScreen: toScreen, tvRect: tvRect,
           setReduced: setReduced, hoverTarget: hoverTarget, size: function () { return { W: W, H: H, scale: scale, ox: ox, oy: oy }; } };
})();
