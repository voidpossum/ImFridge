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
  var LAMP_X = 414;   // the park lamp post

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
  // Sky colours [top, middle, horizon] for the hour. Dusk is purple over orange, like a spring evening in the park.
  function skyFor(h, weather) {
    var c;
    if (h < 7) c = ['#6a7ab8', '#e8a08a', '#f8d4a8'];
    else if (h < 16) c = ['#4a90d8', '#7fbcec', '#cfe8f6'];
    else if (h < 18) c = ['#6a8ed0', '#b0b4dc', '#f4d0a0'];
    else if (h < 19.5) c = ['#3a2a6a', '#b04a7a', '#f6904a'];
    else if (h < 21) c = ['#1e1a4a', '#4a2a6a', '#a04a6a'];
    else c = ['#0c0c24', '#141434', '#26244a'];
    if (weather === 'rain' && h < 21) c = ['#5a6478', '#7a8494', '#a0a8b4'];
    return c;
  }
  function darkness(h) {
    if (h < 7) return 0.16 * (7 - h);
    if (h < 17.5) return 0;
    if (h < 21) return (h - 17.5) / 3.5 * 0.3;
    return 0.3 + Math.min(1, (h - 21) / 1.5) * 0.26;
  }

  // A tiny seeded random, so the park looks the same every frame.
  function seeded(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ── the park ────────────────────────────────────────────────
  var BLDG = [], WIN = [];   // city buildings and their windows (made once)
  function makeCity() {
    if (BLDG.length) return;
    for (var i = 0, x = -260; x < 740; i++) {
      var w = 14 + Math.floor(seeded(i) * 22), hgt = 10 + Math.floor(seeded(i + 50) * 34);
      BLDG.push({ x: x, w: w, h: hgt, far: i % 2 });
      for (var wy = 150 - hgt + 3; wy < 147; wy += 4) for (var wx = x + 2; wx < x + w - 2; wx += 3) {
        if (seeded(wx * 7 + wy * 13) < 0.28) WIN.push({ x: wx, y: wy });
      }
      x += w + Math.floor(seeded(i + 99) * 5);
    }
  }

  function drawPark(S, t) {
    var run = S.run, h = Engine.hourOf(S);
    var vx0 = -ox - 2, vx1 = W - ox + 2, vy0 = -oy - 2;
    makeCity();
    // sky: dithered bands from top to the horizon
    var sky = skyFor(h, run.weather), bands = 14, top = vy0, bot = 150, bh = Math.ceil((bot - top) / bands);
    for (var b = 0; b < bands; b++) {
      var k = b / (bands - 1), c0, c1;
      if (k < 0.55) { c0 = mix(sky[0], sky[1], k / 0.55); c1 = mix(sky[0], sky[1], Math.min(1, (k + 0.08) / 0.55)); }
      else { c0 = mix(sky[1], sky[2], (k - 0.55) / 0.45); c1 = mix(sky[1], sky[2], Math.min(1, (k - 0.47) / 0.45)); }
      Sprites.dither(ctx, vx0, top + b * bh, vx1 - vx0, bh, c0, c1, 0.5);
    }
    // stars, sun, clouds
    if (h >= 20.5 && run.weather !== 'rain') {
      for (var st = 0; st < 60; st++) {
        var sx = vx0 + seeded(st) * (vx1 - vx0), sy = top + seeded(st + 7) * (110 - top);
        if ((st + Math.floor(t * 0.7)) % 9) R(ctx, Math.round(sx), Math.round(sy), 1, 1, st % 5 ? '#d8d8ff' : '#fff6d8');
      }
      R(ctx, 96, 18, 7, 7, '#f4ecd0'); R(ctx, 95, 19, 9, 5, '#f4ecd0'); R(ctx, 99, 19, 4, 4, '#d8d0b0');
    }
    if (h >= 16.8 && h < 20 && run.weather !== 'rain') {   // the setting sun, sinking behind the city
      var sunY = 106 + (h - 16.8) * 14;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(118, sunY, 40, 'rgba(255,170,90,0.24)');
      ctx.restore();
      ctx.fillStyle = '#ffe2a0'; pdisc(118, sunY, 9);
      ctx.fillStyle = '#fff4d0'; pdisc(117, sunY - 1, 6);
    } else if (h >= 9 && h < 16 && run.weather === 'hot') {
      ctx.fillStyle = 'rgba(255,240,160,0.35)'; circle(400, 20, 16);
      ctx.fillStyle = '#fff2a0'; circle(400, 20, 9);
    }
    if (run.weather !== 'rain' && h < 20.5) {
      var cc = h >= 17.5 ? 'rgba(255,170,190,0.55)' : 'rgba(255,255,255,0.75)';
      ctx.fillStyle = cc;
      for (var cl = 0; cl < 7; cl++) {
        var cw = 30 + seeded(cl + 3) * 50, cy = 12 + seeded(cl + 5) * 80;
        var cx = vx0 + ((seeded(cl) * 900 + t * (2 + cl % 3)) % (vx1 - vx0 + 120)) - 60;
        ctx.fillRect(Math.round(cx), Math.round(cy), Math.round(cw), 2);
        ctx.fillRect(Math.round(cx + cw * 0.2), Math.round(cy - 2), Math.round(cw * 0.5), 2);
      }
    }
    // far hills
    ctx.fillStyle = mix(sky[2], '#3a3060', h >= 20.5 ? 0.6 : 0.35);
    for (var hx = Math.floor(vx0); hx < vx1; hx += 2) {
      var hy = 128 - 8 * Math.sin(hx / 70) - 5 * Math.sin(hx / 23 + 1);
      ctx.fillRect(hx, Math.round(hy), 2, 150 - Math.round(hy));
    }
    // the city across the street (two depths) with window lights at dusk
    var nightCity = h >= 18.5 || h < 6.5;
    BLDG.forEach(function (bd) {
      ctx.fillStyle = bd.far ? mix(sky[2], '#2a2448', 0.55) : mix(sky[2], '#1e1a34', 0.7);
      ctx.fillRect(bd.x, 150 - bd.h * (bd.far ? 1.3 : 1), bd.w, bd.h * (bd.far ? 1.3 : 1));
    });
    if (nightCity) { ctx.fillStyle = '#ffd98a'; WIN.forEach(function (w, i) { if (i % 3) ctx.fillRect(w.x, w.y, 1, 1); }); }
    // the building with the LED news board on its roof
    R(ctx, 158, 80, 164, 70, mix(sky[2], '#4a4460', 0.72)); R(ctx, 158, 80, 164, 2, mix(sky[2], '#6a6480', 0.6));
    for (var by = 86; by < 146; by += 8) for (var bx = 164; bx < 316; bx += 10) {
      R(ctx, bx, by, 6, 4, nightCity && seeded(bx + by * 3) < 0.45 ? '#ffd98a' : mix(sky[2], '#2e2a44', 0.6));
    }
    R(ctx, TV.x + 14, TV.y + TV.h, 3, 80 - TV.y - TV.h, P.steel3); R(ctx, TV.x + TV.w - 17, TV.y + TV.h, 3, 80 - TV.y - TV.h, P.steel3);
    Sprites.tv(ctx, TV.x, TV.y, TV.w, TV.h, t, darkness(h) > 0.2);
    // the wooden railing at the edge of the park
    R(ctx, vx0, 152, vx1 - vx0, 3, '#3a2418'); R(ctx, vx0, 153, vx1 - vx0, 1, '#7a5238');
    R(ctx, vx0, 162, vx1 - vx0, 2, '#3a2418'); R(ctx, vx0, 162, vx1 - vx0, 1, '#6a4630');
    for (var px = Math.floor(vx0 / 36) * 36; px < vx1; px += 36) { R(ctx, px, 148, 4, 26, '#3a2418'); R(ctx, px + 1, 148, 1, 24, '#7a5238'); R(ctx, px - 1, 147, 6, 2, '#2a1810'); }
    // hedges with fallen petals
    for (var gx = Math.floor(vx0 / 6) * 6; gx < vx1; gx += 6) {
      var gt = 168 - Math.round(3 * Math.sin(gx / 11) + 2 * Math.sin(gx / 5));
      R(ctx, gx, gt, 6, 198 - gt, '#2a4e34');
      R(ctx, gx, gt, 6, 2, '#3e6e46');
      if (seeded(gx) < 0.5) R(ctx, gx + 2, gt + 3 + Math.floor(seeded(gx + 1) * 12), 1, 1, '#f0a8c4');
      if (seeded(gx + 3) < 0.35) R(ctx, gx + 4, gt + 1, 1, 1, '#ffd0e0');
    }
    // trees: trunks now, blossoms later (they hang over everything)
    trunk(40, 198, 1); trunk(446, 198, -1);
    blossoms(h);
    // lamp post, stone park sign, bench, recycle bins
    lampPost(414);
    parkSign(390, 198);
    R(ctx, 64, 180, 48, 4, P.ink); R(ctx, 65, 180, 46, 2, '#b07a50'); R(ctx, 65, 176, 46, 3, '#8a5a3a');
    R(ctx, 68, 184, 3, 12, '#3a2a2a'); R(ctx, 105, 184, 3, 12, '#3a2a2a');
    Sprites.plant(ctx, 372, 198, Math.min(24, (S.meta.runs - 1) * 3));
    recycleBin(118, 198, '#3a7ad0'); recycleBin(130, 198, '#e8e8e8');
    recycleBin(346, 198, '#e8e8e8'); recycleBin(358, 198, '#3a7ad0');
    // the concrete base the machines stand on
    R(ctx, 140, 196, 200, 2, '#d8d4cc'); R(ctx, 140, 198, 200, 6, '#9a968e'); R(ctx, 140, 204, 200, 1, '#5e5a54');
    for (var pb = 140; pb < 340; pb += 25) R(ctx, pb, 198, 1, 6, '#7e7a72');
    // the stone path
    var wet = run.weather === 'rain';
    R(ctx, vx0, 205, vx1 - vx0, H - oy + 4 - 205, wet ? '#6e6a70' : '#8e8880');
    for (var ty = 205, row = 0; ty < H - oy + 4; ty += 12, row++) {
      for (var tx = Math.floor(vx0 / 32) * 32 - (row % 2) * 16; tx < vx1; tx += 32) {
        var shade = seeded(tx * 3 + row * 17) < 0.5 ? (wet ? '#76727a' : '#9a948c') : (wet ? '#6a666e' : '#948e86');
        R(ctx, tx + 1, ty + 1, 30, 10, shade);
        R(ctx, tx + 1, ty + 1, 30, 1, wet ? '#8a8690' : '#aaa49c');
      }
    }
    // fallen petals on the path
    for (var fp = 0; fp < 70; fp++) {
      var fx = vx0 + seeded(fp + 200) * (vx1 - vx0), fy = 206 + seeded(fp + 300) * (H - oy - 206);
      R(ctx, Math.round(fx), Math.round(fy), 2, 1, fp % 3 ? '#f0a8c4' : '#ffd0e0');
    }
    // wet path: the machines' colours reflect in the stone
    if (wet) Engine.MX.forEach(function (mx, i) {
      var L = Sprites.LOOKS[i === 1 ? 'you' : S.run.machines[i].id];
      for (var ry = 0; ry < 26; ry += 2) { ctx.fillStyle = hexA(L.main, 0.22 * (1 - ry / 26)); ctx.fillRect(mx - 20 + (ry % 4), 206 + ry, 40, 1); }
    });
    // the Comfy Carpet under your line (longer with each level)
    var rug = run.upgrades.carpet | 0;
    if (rug) {
      var rx = Engine.MX[1] - 12, ry2 = 207, rl = 16 + rug * 10;
      R(ctx, rx - 1, ry2 - 1, 26, rl + 2, P.ink);
      R(ctx, rx, ry2, 24, rl, '#b8404a'); R(ctx, rx + 2, ry2 + 2, 20, rl - 4, '#d8606a');
      for (var ri = 0; ri < rl - 6; ri += 4) R(ctx, rx + 11, ry2 + 3 + ri, 2, 2, '#f0c060');
      for (var fr = 0; fr < 24; fr += 2) { R(ctx, rx + fr, ry2 - 2, 1, 1, '#f0e0c0'); R(ctx, rx + fr, ry2 + rl + 1, 1, 1, '#f0e0c0'); }
    }
    prints.forEach(function (p) {
      ctx.fillStyle = 'rgba(60,70,90,' + (0.35 * (1 - p.t / 8)).toFixed(2) + ')';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
    });
  }

  // A cherry tree trunk with crooked branches reaching over the scene.
  function trunk(x, y, dir) {
    var bark = '#3a2430', lite = '#5a3a44';
    for (var ty = y; ty > y - 112; ty--) {
      var wob = Math.round(Math.sin(ty / 9) * 1.5), w = 10 + Math.round((ty - (y - 112)) / 30);
      R(ctx, x - (w >> 1) + wob, ty, w, 1, bark);
      R(ctx, x - (w >> 1) + wob + 2, ty, 2, 1, lite);
    }
    R(ctx, x - 9, y - 3, 18, 3, '#2a1820');
    branch(x, y - 108, dir, 0.45, 70, 5, 1);
    branch(x, y - 100, -dir, 0.9, 34, 4, 2);
    branch(x + dir * 28, y - 121, dir, 1.3, 26, 3, 3);
    branch(x + dir * 46, y - 128, dir, 0.2, 40, 3, 4);
  }
  function branch(x, y, dir, rise, len, th, seed) {
    var cx = x, cy = y;
    for (var i = 0; i < len; i++) {
      cx += dir; cy -= rise * (0.6 + seeded(seed * 31 + i) * 0.8);
      var tt = Math.max(1, Math.round(th * (1 - i / len)) + 1);
      R(ctx, Math.round(cx), Math.round(cy), 2, tt, '#3a2430');
    }
  }

  // Blossom clouds, drawn in front of the sky and behind the petals (they hang over the machines).
  var BLOSSOM = [];
  function blossoms(h) {
    if (!BLOSSOM.length) {
      var n = 0;
      [[40, -26, 1], [446, -30, -1]].forEach(function (tr) {
        for (var i = 0; i < 46; i++, n++) {
          var along = seeded(n + 1) * 130, x = tr[0] + tr[2] * along + (seeded(n + 2) - 0.5) * 60;
          var y = tr[1] + along * 0.3 + (seeded(n + 3) - 0.35) * 60;
          var r = 6 + Math.floor(seeded(n + 4) * 9);
          // keep the LED news board clear (its text is drawn on top of the canvas)
          if (x + r > TV.x - 4 && x - r < TV.x + TV.w + 4 && y + r > TV.y - 4 && y - r < TV.y + TV.h + 10) continue;
          BLOSSOM.push({ x: Math.round(x), y: Math.round(y), r: r, n: n });
        }
      });
      BLOSSOM.sort(function (a, b) { return a.y - b.y; });
    }
    var dusk = h >= 17.5 && h < 21;
    var deep = dusk ? '#7a3a78' : '#b0507e', dark = dusk ? '#a64c8e' : '#d0709c', base = dusk ? '#d86aa8' : '#ec98ba',
        hi = dusk ? '#f4a4cc' : '#ffcade', white = dusk ? '#ffd8ea' : '#fff4f8';
    BLOSSOM.forEach(function (bl) { ctx.fillStyle = deep; pdisc(bl.x + 2, bl.y + 3, bl.r); });
    BLOSSOM.forEach(function (bl) {
      ctx.fillStyle = base; pdisc(bl.x, bl.y, bl.r);
      // texture: light flowers on the upper left, shadow on the lower right, a few white petals
      var count = bl.r * bl.r;
      for (var d = 0; d < count; d++) {
        var a = seeded(bl.n * 97 + d) * 6.283, rr = Math.sqrt(seeded(bl.n * 53 + d * 3)) * bl.r;
        var dx = Math.round(Math.cos(a) * rr), dy = Math.round(Math.sin(a) * rr), side = dx + dy;
        var c = side < -bl.r * 0.3 ? (d % 5 ? hi : white) : side > bl.r * 0.5 ? dark : (d % 7 ? null : hi);
        if (c) { ctx.fillStyle = c; ctx.fillRect(bl.x + dx, bl.y + dy, d % 3 ? 1 : 2, 1); }
      }
    });
  }

  // Petals drifting down all over the scene.
  var PETALS = [];
  function petals(dt, t) {
    var want = reduced ? 10 : 36;
    while (PETALS.length < want) PETALS.push({ x: -ox + Math.random() * W, y: -oy - Math.random() * H, s: 8 + Math.random() * 10, ph: Math.random() * 6 });
    PETALS.forEach(function (p) {
      p.y += p.s * dt; p.x += (Math.sin(t * 1.3 + p.ph) * 8 + 4) * dt;
      if (p.y > 270 || p.x > W - ox + 4) { p.y = -oy - 4; p.x = -ox + Math.random() * W; }
      R(ctx, Math.round(p.x), Math.round(p.y), 2, 1, Math.floor(t * 2 + p.ph) % 2 ? '#ffc8dc' : '#f090b8');
    });
  }

  function lampPost(x) {
    R(ctx, x - 1, 100, 4, 98, P.ink); R(ctx, x, 100, 2, 98, '#5a5a6a');
    R(ctx, x - 4, 196, 10, 3, P.ink);
    R(ctx, x - 5, 88, 12, 14, P.ink); R(ctx, x - 4, 90, 10, 10, '#ffe6a8'); R(ctx, x - 6, 86, 14, 3, '#3a3a48');
  }
  function lampGlow(a, x) {
    glow(x + 1, 95, 30, 'rgba(255,214,150,' + (0.1 + a * 0.6).toFixed(3) + ')');
    cone(x + 1, 100, 230, 40, 'rgba(255,200,140,' + (a * 0.14).toFixed(3) + ')');
  }
  function parkSign(x, y) {
    R(ctx, x - 7, y - 46, 14, 46, P.ink); R(ctx, x - 6, y - 45, 12, 45, '#9a968e'); R(ctx, x - 6, y - 45, 12, 2, '#c8c4bc');
    R(ctx, x - 4, y - 40, 8, 32, '#8a867e');
    // carved marks (a park name, too worn to read)
    var G = [[0, 0, 5, 1], [2, 0, 1, 5], [0, 3, 5, 1], [0, 1, 1, 3], [4, 1, 1, 4], [1, 5, 3, 1]];
    for (var i = 0; i < 4; i++) G.forEach(function (g, k) { if ((i * 3 + k) % 4 !== 3) R(ctx, x - 3 + g[0], y - 38 + i * 8 + g[1], g[2], g[3], '#4a4640'); });
    R(ctx, x - 9, y - 3, 18, 3, '#6e6a64');
  }
  function recycleBin(x, y, col) {
    R(ctx, x - 5, y - 18, 11, 18, P.ink); R(ctx, x - 4, y - 17, 9, 17, col); R(ctx, x - 4, y - 17, 9, 2, '#ffffff');
    R(ctx, x - 2, y - 13, 5, 4, '#1a1a24'); R(ctx, x - 1, y - 12, 3, 2, '#33334a');
  }

  function cloud(x, y) { ctx.fillRect(Math.round(x), Math.round(y), 14, 4); ctx.fillRect(Math.round(x) + 3, Math.round(y) - 3, 7, 3); }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); ctx.fill(); }
  // A crisp pixel disc (no smooth edges), in the current fillStyle.
  function pdisc(x, y, r) {
    x = Math.round(x); y = Math.round(y); r = Math.round(r);
    for (var dy = -r; dy <= r; dy++) { var w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8)); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); }
  }
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

  // Rain over everything.
  function rain(t) {
    ctx.fillStyle = 'rgba(210,225,255,0.55)';
    for (var r = 0; r < 90; r++) {
      var rx = -ox + ((r * 53 + t * 30) % (W + 20)) - 10, ry = -oy + ((r * 37 + t * 180) % (H + 10));
      ctx.fillRect(Math.round(rx), Math.round(ry), 1, 4);
    }
    ctx.fillStyle = 'rgba(230,240,255,0.7)';
    for (var sp = 0; sp < 14; sp++) {
      var k = (t * 2 + sp * 0.37) % 1;
      if (k < 0.3) ctx.fillRect(Math.round(-ox + seeded(sp + Math.floor(t * 2)) * W), 210 + Math.round(seeded(sp * 3 + Math.floor(t * 2)) * 50), 3, 1);
    }
  }

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

    drawPark(S, t);

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
    // followers waiting outside: a counter at the left edge of the view
    var wait = Math.floor(run.waiting);
    if (wait >= 1) {
      var lx = -ox + 22, lab2 = String(wait), bw = Sprites.textWidth(lab2) + 11;
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
    petals(dt, t);
    if (run.weather === 'rain') rain(t);

    // night
    var a = darkness(h);
    if (a > 0.01) {
      var vx0 = -ox, vy0 = -oy;
      ctx.fillStyle = 'rgba(20,16,56,' + a.toFixed(3) + ')';
      ctx.fillRect(vx0 - 4, vy0 - 4, W + 8, H + 8);
      ctx.globalCompositeOperation = 'lighter';
      lampGlow(a, LAMP_X);
      ctx.fillStyle = 'rgba(255,217,138,' + Math.min(0.9, a * 1.6).toFixed(3) + ')';
      WIN.forEach(function (w, wi) { if (wi % 3) ctx.fillRect(w.x, w.y, 1, 1); });
      for (var m = 0; m < 3; m++) {
        var L = Sprites.LOOKS[infos[m].id];
        glow(Engine.MX[m] - 4, 150, 46, hexA(L.glow, a * 0.5));
        glow(Engine.MX[m], 212, 30, hexA(L.glow, a * 0.35));
      }
      glow(TV.x + TV.w / 2, TV.y + TV.h / 2, 60, 'rgba(110,180,255,' + (a * 0.25).toFixed(3) + ')');
      ctx.globalCompositeOperation = 'source-over';
      for (var m2 = 0; m2 < 3; m2++) Sprites.machineLights(ctx, Engine.MX[m2], infos[m2], a);
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
