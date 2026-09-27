// I'M FRIDGE — Chapter 2 mockups (approval pictures). Draws the Big Park, Grog, the inside of VEND-3 and park items.
// Nothing here is used by the game yet.
// © 2026 Void Possum. All rights reserved.
(function () {
  'use strict';
  var P = Sprites.P, R = Sprites.R, T = Sprites.text;
  var K = 2;   // screen pixels per world pixel

  function seeded(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function disc(g, x, y, r, c) { g.fillStyle = c; for (var dy = -r; dy <= r; dy++) { var w = Math.round(Math.sqrt(r * r - dy * dy)); g.fillRect(x - w, y + dy, w * 2 + 1, 1); } }
  function setup(id, w, h, k) {
    var cv = document.getElementById(id); cv.width = w; cv.height = h;
    cv.style.width = w * (k || K) + 'px'; cv.style.height = h * (k || K) + 'px';
    var g = cv.getContext('2d'); g.imageSmoothingEnabled = false; return g;
  }

  // ── Grog: dark chrome, white text, a spicy orange glow ──────────
  Sprites.LOOKS.grog = { main: '#3c3c48', light: '#5c5c6c', dark: '#26262e', deep: '#16161c', accent: '#f4f4f4', glow: '#ff7a3a', label: 'GROG' };
  // Grog's face: pixel sunglasses and a smirk. Spicy mode: flame eyes. Roast: a laughing mouth.
  function grogFace(g, x, y, mood, t) {
    R(g, x, y, 36, 13, P.scr);
    var c = '#f4f4f4', hot = '#ff7a3a';
    if (mood === 'spicy') {
      [9, 22].forEach(function (ex, i) {
        var f = Math.floor(t * 8 + i) % 2;
        R(g, x + ex, y + 5, 5, 3, hot); R(g, x + ex + 1, y + 3 - f, 3, 2, '#ffd24a'); R(g, x + ex + 2, y + 2 - f, 1, 1, '#fff0a0');
      });
      R(g, x + 12, y + 10, 12, 1, c); R(g, x + 22, y + 9, 2, 1, c);
      return;
    }
    // sunglasses
    R(g, x + 6, y + 3, 24, 1, c);
    R(g, x + 7, y + 4, 9, 4, c); R(g, x + 20, y + 4, 9, 4, c);
    R(g, x + 8, y + 5, 7, 2, '#1a1a22'); R(g, x + 21, y + 5, 7, 2, '#1a1a22');
    R(g, x + 9, y + 5, 2, 1, '#8a8a9a'); R(g, x + 22, y + 5, 2, 1, '#8a8a9a');
    if (mood === 'roast') { R(g, x + 13, y + 9, 10, 1, c); R(g, x + 14, y + 10, 8, 2, hot); R(g, x + 14, y + 12, 8, 1, c); }
    else { R(g, x + 14, y + 10, 7, 1, c); R(g, x + 21, y + 9, 2, 1, c); }   // smirk
  }
  function grogMachine(g, cx, mood, t, extra) {
    var info = { id: 'grog', stock: { cola: 8, lemon: 3, orange: 9 }, cap: 12, drinks: ['cola', 'lemon', 'orange'], t: t, cold: 1, rup: extra || {}, feats: (extra && extra.feats) || [] };
    Sprites.machine(g, cx, info);
    var x0 = Math.round(cx - Sprites.MW / 2), y0 = Sprites.MTOP;
    grogFace(g, x0 + 4, y0 + 12, mood, t);
    // a small "X"-shaped antenna on top (it posts about itself)
    R(g, x0 + 36, y0 - 7, 1, 7, P.steel3); R(g, x0 + 34, y0 - 9, 5, 2, '#f4f4f4');
    if (mood === 'spicy') for (var i = 0; i < 6; i++) {   // flames along the roof
      var fh = 3 + ((i * 5 + Math.floor(t * 9)) % 4);
      R(g, x0 + 3 + i * 7, y0 - fh, 4, fh, i % 2 ? '#ff7a3a' : '#ffb03a'); R(g, x0 + 4 + i * 7, y0 - fh + 1, 2, 2, '#ffe08a');
    }
  }

  // ── park items ─────────────────────────────────────────────────
  // A snack machine you own (instead of a food truck): chips, sandwiches, candy bars behind glass.
  function snackMachine(g, cx, t) {
    var x0 = cx - 21, y0 = 118, w = 42, h = 82;
    R(g, x0 + 2, y0 + h, w, 3, 'rgba(40,20,40,0.3)');
    R(g, x0 - 1, y0 - 1, w + 2, h + 1, P.ink);
    var L = Sprites.LOOKS.you;   // red: it is yours, like VEND-3
    R(g, x0, y0, w, h, L.main); R(g, x0 + 1, y0 + 2, 2, h - 8, L.light); R(g, x0 + w - 4, y0, 4, h, L.dark);
    R(g, x0 + 3, y0 + 3, w - 10, 7, '#1b1826'); T(g, 'SNACKS', x0 + 5, y0 + 4, L.accent);
    R(g, x0 + 3, y0 + 12, 28, 56, '#dcf0f2');
    var cols = [['#e0483f', '#ffd24a'], ['#4a78d0', '#fffaf0'], ['#6cd48a', '#2a5a34'], ['#a58ad8', '#fff0a0']];
    for (var r = 0; r < 4; r++) {
      var ry = y0 + 14 + r * 13;
      for (var k = 0; k < 4; k++) {
        var c = cols[(r + k) % 4];
        if (r === 1) { R(g, x0 + 5 + k * 6, ry + 4, 5, 5, '#e8b48a'); R(g, x0 + 5 + k * 6, ry + 6, 5, 1, '#6cd48a'); }   // sandwiches
        else { R(g, x0 + 5 + k * 6, ry + 1, 5, 8, c[0]); R(g, x0 + 6 + k * 6, ry + 3, 3, 2, c[1]); }                      // bags and bars
      }
      R(g, x0 + 4, ry + 10, 26, 1, '#9197a8');
    }
    R(g, x0 + 33, y0 + 12, 5, 30, L.deep); R(g, x0 + 34, y0 + 14, 3, 4, '#1b1826');
    for (var b = 0; b < 4; b++) R(g, x0 + 34, y0 + 21 + b * 4, 3, 2, '#fffaf0');
    R(g, x0 + 4, y0 + 71, 26, 7, P.ink); R(g, x0 + 5, y0 + 72, 24, 5, '#15121c');
    T(g, 'V3', x0 + 33, y0 + 48, L.accent);   // it is yours
  }
  function clawMachine(g, cx, t) {
    var L = Sprites.LOOKS.you, x0 = cx - 18, y0 = 124, w = 36, h = 76;
    R(g, x0 + 2, y0 + h, w, 3, 'rgba(40,20,40,0.3)');
    R(g, x0 - 1, y0 - 1, w + 2, h + 1, P.ink);
    R(g, x0, y0, w, 12, L.main); T(g, 'CLAW', x0 + 10, y0 + 4, L.accent);
    R(g, x0, y0 + 12, w, 36, '#bfe6f0'); R(g, x0 + 1, y0 + 13, w - 2, 1, '#f6fcfc');
    var cxp = x0 + 10 + Math.round((Math.sin(t * 1.3) + 1) * 8);
    R(g, cxp, y0 + 13, 1, 12, P.steel3); R(g, cxp - 3, y0 + 25, 7, 2, P.steel2); R(g, cxp - 3, y0 + 27, 1, 3, P.steel2); R(g, cxp + 3, y0 + 27, 1, 3, P.steel2);
    [['#ff6b8a', 3], ['#6fe0ff', 11], ['#ffd24a', 19], ['#a58ad8', 26], ['#6cd48a', 7], ['#ff9a5a', 22]].forEach(function (p, i) {
      var px = x0 + 2 + p[1], py = y0 + 40 - (i > 3 ? 5 : 0);
      R(g, px, py, 6, 6, p[0]); R(g, px + 1, py + 2, 1, 1, P.ink); R(g, px + 4, py + 2, 1, 1, P.ink);
    });
    R(g, x0, y0 + 48, w, h - 48, L.main); R(g, x0 + 1, y0 + 50, 2, h - 52, L.light); R(g, x0 + w - 4, y0 + 48, 4, h - 48, L.dark);
    R(g, x0 + 6, y0 + 54, 8, 8, P.ink); R(g, x0 + 9, y0 + 50, 2, 6, P.ink); R(g, x0 + 8, y0 + 48, 4, 3, '#ffd24a');   // joystick
    R(g, x0 + 20, y0 + 55, 7, 5, '#1b1826'); R(g, x0 + 22, y0 + 56, 3, 3, P.gold1);
    R(g, x0 + 6, y0 + 65, 22, 7, '#15121c');
  }
  // Your own side machines: red like VEND-3, smaller than a soda machine (32 × 66). cx = centre, ground at y 200.
  var SIDE_W = 32, SIDE_H = 66;
  function sideMachine(g, cx, kind, t) {
    var L = Sprites.LOOKS.you, w = SIDE_W, h = SIDE_H, x0 = Math.round(cx - w / 2), y0 = 200 - h;
    R(g, x0 + 1, y0 + h, w, 2, 'rgba(40,20,40,0.3)');
    R(g, x0 - 1, y0 - 1, w + 2, h + 1, P.ink);
    R(g, x0, y0, w, h, L.main); R(g, x0 + 1, y0 + 2, 2, h - 6, L.light); R(g, x0 + w - 3, y0, 3, h, L.dark);
    R(g, x0, y0 + h - 5, w, 5, L.dark); R(g, x0 + 2, y0 + h, 4, 1, P.ink); R(g, x0 + w - 6, y0 + h, 4, 1, P.ink);
    var label = { snack: 'SNACK', claw: 'CLAW', coffee: 'CAFE', ice: 'ICE' }[kind];
    R(g, x0 + 3, y0 + 3, w - 7, 7, '#1b1826'); T(g, label, x0 + 3 + Math.floor((w - 7 - Sprites.textWidth(label)) / 2), y0 + 4, L.accent);
    var gx = x0 + 3, gy = y0 + 12, gw = 20, gh = 34;   // the glass
    if (kind === 'snack') {
      R(g, gx, gy, gw, gh, '#dcf0f2');
      var cols = [['#e0483f', '#ffd24a'], ['#4a78d0', '#fffaf0'], ['#6cd48a', '#2a5a34'], ['#a58ad8', '#fff0a0']];
      for (var r = 0; r < 3; r++) {
        var ry = gy + 2 + r * 11;
        for (var k = 0; k < 3; k++) {
          if (r === 1) { R(g, gx + 2 + k * 6, ry + 3, 5, 5, '#e8b48a'); R(g, gx + 2 + k * 6, ry + 5, 5, 1, '#6cd48a'); }   // sandwiches
          else { var c = cols[(r + k) % 4]; R(g, gx + 2 + k * 6, ry, 5, 8, c[0]); R(g, gx + 3 + k * 6, ry + 2, 3, 2, c[1]); }
        }
        R(g, gx + 1, ry + 9, gw - 2, 1, '#9197a8');
      }
    } else if (kind === 'claw') {
      R(g, gx, gy, gw, gh, '#bfe6f0'); R(g, gx, gy, gw, 1, '#f6fcfc');
      var cxp = gx + 5 + Math.round((Math.sin(t * 1.3) + 1) * 5);
      R(g, cxp, gy + 1, 1, 9, P.steel3); R(g, cxp - 2, gy + 10, 5, 2, P.steel2); R(g, cxp - 2, gy + 12, 1, 2, P.steel2); R(g, cxp + 2, gy + 12, 1, 2, P.steel2);
      [['#ff6b8a', 1, 0], ['#6fe0ff', 7, 0], ['#ffd24a', 13, 0], ['#a58ad8', 4, 5], ['#6cd48a', 10, 5]].forEach(function (p) {
        var px = gx + p[1], py = gy + gh - 7 - p[2];
        R(g, px, py, 6, 6, p[0]); R(g, px + 1, py + 2, 1, 1, P.ink); R(g, px + 4, py + 2, 1, 1, P.ink);
      });
    } else if (kind === 'coffee') {
      R(g, gx, gy, gw, gh, '#3a2418'); R(g, gx + 2, gy + 2, gw - 4, 8, '#1b1826');
      T(g, 'HOT', gx + 5, gy + 4, '#ffb07a');
      R(g, gx + 4, gy + 14, 12, 16, '#15121c');                           // the cup bay
      R(g, gx + 7, gy + 21, 6, 8, '#fffaf0'); R(g, gx + 7, gy + 21, 6, 2, '#6c4128'); R(g, gx + 13, gy + 23, 2, 3, '#fffaf0');
      for (var st = 0; st < 3; st++) { var sy = (Math.floor(t * 5) + st * 3) % 7; R(g, gx + 8 + st * 2, gy + 19 - sy, 1, 2, 'rgba(255,255,255,0.6)'); }
      R(g, gx + 9, gy + 14, 2, 4, '#6c4128');                           // the pour
    } else if (kind === 'ice') {
      R(g, gx, gy, gw, gh, '#e8faff'); R(g, gx, gy, gw, 2, '#ffffff');
      for (var i = 0; i < 9; i++) { var ix = gx + 2 + (i % 3) * 6, iy = gy + 4 + Math.floor(i / 3) * 10; R(g, ix, iy, 5, 5, '#9adcf0'); R(g, ix, iy, 5, 1, '#ffffff'); R(g, ix + 1, iy + 1, 1, 1, '#ffffff'); }
      R(g, gx + 1, gy + gh - 3, gw - 2, 2, '#c8f0ff');
      if (Math.floor(t * 2) % 2) R(g, gx + gw - 4, gy + 2, 1, 1, '#ffffff');   // sparkle
    }
    // side panel: a coin slot and buttons, and a little "V3" (it is yours)
    var px = x0 + 24;
    R(g, px, gy, 5, gh, L.deep); R(g, px + 1, gy + 2, 3, 4, '#1b1826'); R(g, px + 2, gy + 3, 1, 2, P.gold1);
    for (var b = 0; b < 3; b++) R(g, px + 1, gy + 9 + b * 4, 3, 2, b === 0 ? L.glow : P.steel1);
    T(g, 'V3', x0 + 9, y0 + 48, L.accent);
    R(g, x0 + 5, y0 + 54, 20, 5, '#15121c');   // the tray
  }
  function slotPlot(g, cx, t) {   // an empty side slot next to VEND-3
    var a = Math.floor(t * 2) % 2 ? '#fffaf0' : '#d8d0c0', x0 = Math.round(cx - SIDE_W / 2), y0 = 200 - SIDE_H;
    for (var i = 0; i < SIDE_W; i += 4) { R(g, x0 + i, y0, 2, 1, a); R(g, x0 + i, 199, 2, 1, a); }
    for (var j = 0; j < SIDE_H; j += 4) { R(g, x0, y0 + j, 1, 2, a); R(g, x0 + SIDE_W - 1, y0 + j, 1, 2, a); }
    R(g, cx - 1, y0 + 24, 3, 9, '#ffd24a'); R(g, cx - 4, y0 + 27, 9, 3, '#ffd24a');
    T(g, 'PICK', cx - 7, y0 + 38, '#fffaf0');
  }
  function bench(g, x, y) {   // x = left, y = ground
    R(g, x, y - 20, 40, 3, P.ink); R(g, x + 1, y - 19, 38, 1, '#b07a50');
    R(g, x, y - 15, 40, 4, P.ink); R(g, x + 1, y - 14, 38, 2, '#b07a50'); R(g, x + 1, y - 12, 38, 1, '#8a5a3a');
    R(g, x - 1, y - 11, 42, 3, P.ink); R(g, x, y - 10, 40, 1, '#c89060');
    R(g, x + 3, y - 8, 3, 8, '#3a2a2a'); R(g, x + 34, y - 8, 3, 8, '#3a2a2a');
    R(g, x + 3, y - 20, 2, 9, '#3a2a2a'); R(g, x + 35, y - 20, 2, 9, '#3a2a2a');
  }
  function lamp(g, x, y, lit) {
    R(g, x - 1, y - 96, 4, 96, P.ink); R(g, x, y - 96, 2, 96, '#5a5a6a');
    R(g, x - 4, y - 2, 10, 3, P.ink);
    R(g, x - 5, y - 108, 12, 14, P.ink); R(g, x - 4, y - 106, 10, 10, lit ? '#fff0b8' : '#e8d8a8'); R(g, x - 6, y - 110, 14, 3, '#3a3a48');
    if (lit) {
      var gr = g.createRadialGradient(x + 1, y - 101, 2, x + 1, y - 101, 34);
      gr.addColorStop(0, 'rgba(255,214,150,0.55)'); gr.addColorStop(1, 'rgba(255,214,150,0)');
      g.fillStyle = gr; g.fillRect(x - 34, y - 136, 70, 70);
      g.fillStyle = 'rgba(255,200,140,0.10)';
      for (var yy = 0; yy < 100; yy++) { var hw = 4 + yy * 0.4; g.fillRect(Math.round(x + 1 - hw), y - 96 + yy, Math.round(hw * 2), 1); }
    }
  }
  function foodTruck(g, x, y, t) {   // 78 wide
    R(g, x + 4, y - 2, 70, 2, 'rgba(40,20,40,0.3)');
    R(g, x - 1, y - 43, 80, 37, P.ink);
    R(g, x, y - 42, 78, 35, '#f2e6c8'); R(g, x, y - 42, 78, 2, '#fffaf0'); R(g, x, y - 12, 78, 5, '#4fb8c0');
    R(g, x + 58, y - 36, 18, 14, P.ink); R(g, x + 59, y - 35, 16, 12, '#9ad0e0'); R(g, x + 60, y - 34, 6, 4, '#d8f0f8');   // cab window
    R(g, x + 6, y - 36, 44, 16, P.ink); R(g, x + 7, y - 35, 42, 14, '#3a2a2a');   // serving hatch
    R(g, x + 8, y - 27, 10, 6, '#e0a020'); R(g, x + 20, y - 26, 12, 5, '#d85a3a'); R(g, x + 34, y - 27, 12, 6, '#f0d060');
    for (var s = 0; s < 11; s++) R(g, x + 5 + s * 4, y - 40, 4, 4, s % 2 ? '#fffaf0' : '#e0483f');   // awning
    R(g, x + 5, y - 36, 45, 1, '#a8362f');
    // hot dog sign on the roof
    R(g, x + 14, y - 54, 32, 11, P.ink); R(g, x + 15, y - 53, 30, 9, '#fffaf0');
    R(g, x + 18, y - 50, 24, 4, '#e8b060'); R(g, x + 20, y - 49, 20, 2, '#c8443c'); R(g, x + 21, y - 49, 3, 1, '#ffd24a'); R(g, x + 30, y - 48, 3, 1, '#ffd24a');
    [x + 14, x + 60].forEach(function (wx) { disc(g, wx, y - 5, 5, P.ink); disc(g, wx, y - 5, 3, '#5a5a6a'); R(g, wx, y - 6, 1, 1, '#c3c8d4'); });
    if (Math.floor(t * 2) % 2) R(g, x + 70, y - 20, 3, 3, '#ffd24a');   // blinker
    // steam
    for (var p = 0; p < 3; p++) { var sy = (Math.floor(t * 6) + p * 5) % 14; R(g, x + 22 + p * 7, y - 58 - sy, 2, 2, 'rgba(255,255,255,' + (0.5 - sy / 30).toFixed(2) + ')'); }
  }
  function fountain(g, x, y, t) {   // x = centre
    R(g, x - 32, y - 2, 64, 3, 'rgba(40,20,40,0.3)');
    R(g, x - 31, y - 14, 62, 13, P.ink); R(g, x - 30, y - 13, 60, 11, '#b8b2a8'); R(g, x - 30, y - 13, 60, 2, '#e0dcd4');
    R(g, x - 27, y - 11, 54, 4, '#4a90c8'); R(g, x - 27, y - 11, 54, 1, '#8ad0f0');
    R(g, x - 4, y - 34, 8, 22, P.ink); R(g, x - 3, y - 33, 6, 21, '#c8c2b8');
    R(g, x - 15, y - 38, 30, 6, P.ink); R(g, x - 14, y - 37, 28, 4, '#b8b2a8'); R(g, x - 13, y - 36, 26, 2, '#4a90c8');
    R(g, x - 2, y - 46, 4, 9, '#c8c2b8'); R(g, x - 3, y - 48, 6, 3, '#e0dcd4');
    // water arcs
    for (var i = 0; i < 14; i++) {
      var k = ((i * 3 + Math.floor(t * 12)) % 14) / 14, side = i % 2 ? 1 : -1;
      var wx = x + side * Math.round(k * 16), wy = y - 48 + Math.round(-6 * Math.sin(k * Math.PI) + k * 12);
      R(g, wx, wy, 1, 1, k < 0.5 ? '#d8f4ff' : '#8ad0f0');
    }
    for (var d = 0; d < 8; d++) R(g, x - 26 + ((d * 7 + Math.floor(t * 5)) % 52), y - 10, 2, 1, '#d8f4ff');
    // coins in the water
    R(g, x - 18, y - 9, 1, 1, P.gold1); R(g, x + 10, y - 9, 1, 1, P.gold1); R(g, x + 21, y - 10, 1, 1, P.gold1);
  }
  function busStop(g, x, y) {   // 70 wide
    R(g, x - 1, y - 58, 72, 5, P.ink); R(g, x, y - 57, 70, 3, '#4a78d0');
    R(g, x + 2, y - 54, 2, 54, '#434857'); R(g, x + 66, y - 54, 2, 54, '#434857');
    g.fillStyle = 'rgba(200,236,255,0.35)'; g.fillRect(x + 4, y - 52, 62, 38);
    R(g, x + 4, y - 52, 62, 1, 'rgba(255,255,255,0.7)');
    // ad poster: VEND-3
    R(g, x + 40, y - 48, 22, 30, P.ink); R(g, x + 41, y - 47, 20, 28, '#d9544b');
    R(g, x + 43, y - 44, 16, 8, P.scr); R(g, x + 46, y - 42, 2, 3, '#8affc8'); R(g, x + 53, y - 42, 2, 3, '#8affc8');
    T(g, 'V3', x + 47, y - 33, '#ffd24a');
    // seat
    R(g, x + 8, y - 14, 28, 3, P.ink); R(g, x + 9, y - 13, 26, 1, '#9197a8'); R(g, x + 10, y - 11, 2, 11, '#434857'); R(g, x + 32, y - 11, 2, 11, '#434857');
    // sign pole
    R(g, x + 76, y - 64, 2, 64, '#636a7c'); disc(g, x + 77, y - 68, 6, P.ink); disc(g, x + 77, y - 68, 5, '#4a78d0'); T(g, 'B', x + 76, y - 70, '#fffaf0');
  }
  function bins(g, x, y) {
    [['#3a7ad0', 0], ['#e8e8e8', 12], ['#6cd48a', 24]].forEach(function (b) {
      R(g, x + b[1] - 5, y - 18, 11, 18, P.ink); R(g, x + b[1] - 4, y - 17, 9, 17, b[0]); R(g, x + b[1] - 4, y - 17, 9, 2, '#ffffff');
      R(g, x + b[1] - 2, y - 13, 5, 4, '#1a1a24');
    });
  }
  // An empty plot you can build on: a chalk outline, a "+" and a price tag.
  function plot(g, x, y, w, label, t) {
    var a = Math.floor(t * 2) % 2 ? '#fffaf0' : '#d8d0c0';
    for (var i = 0; i < w; i += 4) { R(g, x + i, y - 30, 2, 1, a); R(g, x + i, y - 1, 2, 1, a); }
    for (var j = 0; j < 30; j += 4) { R(g, x, y - 30 + j, 1, 2, a); R(g, x + w - 1, y - 30 + j, 1, 2, a); }
    var cx = x + (w >> 1);
    R(g, cx - 1, y - 21, 3, 9, '#ffd24a'); R(g, cx - 4, y - 18, 9, 3, '#ffd24a');
    T(g, label, cx - (Sprites.textWidth(label) >> 1), y - 8, '#fffaf0');
  }

  // ── the Big Park background ────────────────────────────────────
  function bigPark(g, WW, WH, t, eve, o) {
    o = o || { tv: 276, plinths: [[150, 300], [420, 570]] };
    var sky = eve ? ['#3a3a7a', '#c86a8a', '#ffb07a'] : ['#6ab4f0', '#a8d8f8', '#e8f4f8'];
    for (var b = 0; b < 14; b++) {
      var k = b / 13, c = k < 0.55 ? mixc(sky[0], sky[1], k / 0.55) : mixc(sky[1], sky[2], (k - 0.55) / 0.45);
      R(g, 0, b * 11, WW, 11, c);
    }
    if (!eve) { g.fillStyle = 'rgba(255,255,255,0.8)'; for (var cl = 0; cl < 9; cl++) { var cx = seeded(cl) * WW, cy = 14 + seeded(cl + 5) * 60, cw = 30 + seeded(cl + 3) * 50; g.fillRect(cx, cy, cw, 2); g.fillRect(cx + cw * 0.2, cy - 2, cw * 0.5, 2); } }
    else { disc(g, 150, 120, 9, '#ffe2a0'); }
    g.fillStyle = mixc(sky[2], '#3a3060', 0.35);
    for (var hx = 0; hx < WW; hx += 2) { var hy = 126 - 8 * Math.sin(hx / 70) - 5 * Math.sin(hx / 23 + 1); g.fillRect(hx, Math.round(hy), 2, 150 - Math.round(hy)); }
    // skyline: taller now, a big city behind the big park
    for (var i = 0, x = 0; x < WW; i++) {
      var w = 16 + Math.floor(seeded(i + 40) * 26), h = 26 + Math.floor(seeded(i + 90) * 60), far = i % 3 === 0;
      g.fillStyle = far ? mixc(sky[2], '#2a2448', 0.5) : mixc(sky[2], '#1e1a34', 0.68);
      g.fillRect(x, 150 - h, w, h);
      if (eve) { g.fillStyle = '#ffd98a'; for (var wy = 150 - h + 4; wy < 146; wy += 6) for (var wx = x + 3; wx < x + w - 3; wx += 5) if (seeded(wx * 3 + wy) < 0.4) g.fillRect(wx, wy, 2, 2); }
      x += w + (far ? -6 : 2);
    }
    // the big LED board in the middle
    R(g, o.tv + 14, 76, 3, 74, P.steel3); R(g, o.tv + 151, 76, 3, 74, P.steel3);
    Sprites.tv(g, o.tv, 36, 168, 40, t, eve);
    T(g, o.hello || 'WELCOME TO THE BIG PARK', o.tv + 14, 50, '#8ad0f0');
    // railing + hedge
    R(g, 0, 152, WW, 3, '#3a2418'); R(g, 0, 153, WW, 1, '#7a5238'); R(g, 0, 162, WW, 2, '#3a2418');
    for (var px = 0; px < WW; px += 36) { R(g, px, 148, 4, 26, '#3a2418'); R(g, px + 1, 148, 1, 24, '#7a5238'); }
    for (var gx = 0; gx < WW; gx += 6) {
      var gt = 168 - Math.round(3 * Math.sin(gx / 11) + 2 * Math.sin(gx / 5));
      R(g, gx, gt, 6, 199 - gt, '#2a4e34'); R(g, gx, gt, 6, 2, '#3e6e46');
      if (seeded(gx) < 0.5) R(g, gx + 2, gt + 3 + Math.floor(seeded(gx + 1) * 12), 1, 1, '#f0a8c4');
    }
    // lawn strip + path
    R(g, 0, 199, WW, 6, '#4e8a48'); R(g, 0, 199, WW, 1, '#6aa85a');
    R(g, 0, 205, WW, WH - 205, '#8e8880');
    for (var ty = 205, row = 0; ty < WH; ty += 12, row++) for (var tx = -(row % 2) * 16; tx < WW; tx += 32) {
      R(g, tx + 1, ty + 1, 30, 10, seeded(tx * 3 + row * 17) < 0.5 ? '#9a948c' : '#948e86'); R(g, tx + 1, ty + 1, 30, 1, '#aaa49c');
    }
    // two machine plinths
    o.plinths.forEach(function (p) {
      R(g, p[0], 196, p[1] - p[0], 2, '#d8d4cc'); R(g, p[0], 198, p[1] - p[0], 6, '#9a968e'); R(g, p[0], 204, p[1] - p[0], 1, '#5e5a54');
    });
  }
  function mixc(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k), gg = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k), bb = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
    return 'rgb(' + r + ',' + gg + ',' + bb + ')';
  }
  function tree(g, x, y, dir, dusk) {
    for (var ty = y; ty > y - 100; ty--) { var w = 10 + Math.round((ty - (y - 100)) / 30); R(g, x - (w >> 1) + Math.round(Math.sin(ty / 9) * 1.5), ty, w, 1, '#3a2430'); }
    var base = dusk ? '#d86aa8' : '#ec98ba', hi = dusk ? '#f4a4cc' : '#ffcade', deep = dusk ? '#7a3a78' : '#b0507e';
    for (var i = 0; i < 26; i++) {
      var bx = x + dir * seeded(i + x) * 70 + (seeded(i + 3 + x) - 0.5) * 50, by = y - 100 + (seeded(i + 7 + x) - 0.5) * 50, r = 7 + Math.floor(seeded(i + 11 + x) * 8);
      disc(g, Math.round(bx) + 2, Math.round(by) + 3, r, deep); disc(g, Math.round(bx), Math.round(by), r, base); disc(g, Math.round(bx) - 2, Math.round(by) - 2, Math.max(2, r - 5), hi);
    }
  }
  var PEOPLE = 0;
  function person(g, type, x, y, t, o) {
    var c = { id: ++PEOPLE, type: type, look: (PEOPLE * 7919 + 13) >>> 0, x: x, y: y, tx: x, ty: y, st: 'queue', m: 0, fol: -1, sipT: 0 };
    for (var k in o || {}) c[k] = o[k];
    Sprites.person(g, c, t, { weather: 'normal' });
  }
  var MXS = { chug: 190, you: 260, clawd: 460, grog: 530 };
  function machines(g, t, full) {
    Sprites.machine(g, MXS.chug, { id: 'chug', stock: { cola: 6, lemon: 7, orange: 4 }, cap: 12, drinks: ['cola', 'lemon', 'orange'], t: t, cold: 1, rup: { sign: 2 }, feats: ['crypto'] });
    Sprites.machine(g, MXS.you, { id: 'you', name: 'VEND-3', stock: { cola: 10, lemon: 8, orange: 11, grape: 6 }, cap: 12, drinks: ['cola', 'lemon', 'orange', 'grape'], t: t, cold: 1.2, up: { sign: full ? 4 : 2, cool: 2 }, hw: { fan: 1, ram: 1 }, pps: 3, lanes: 2 });
    Sprites.machine(g, MXS.clawd, { id: 'clawd', stock: { cola: 7, lemon: 5, orange: 9 }, cap: 12, drinks: ['cola', 'lemon', 'orange'], t: t, cold: 1, rup: {} });
    grogMachine(g, MXS.grog, 'smirk', t, { feats: full ? ['crypto'] : [] });
  }
  function lines(g, t) {
    person(g, 'office', 186, 213, t, { st: 'buy' }); person(g, 'kid', 191, 224, t);
    person(g, 'boss', 256, 213, t, { st: 'buy' }); person(g, 'gym', 262, 223, t, { fol: 1 }); person(g, 'intern', 258, 233, t, { fol: 1 }); person(g, 'office', 261, 243, t);
    person(g, 'intern', 458, 214, t, { st: 'buy' });
    person(g, 'gym', 528, 213, t, { st: 'buy' }); person(g, 'office', 532, 224, t);
    person(g, 'boss', 90, 250, t, { st: 'in', tx: 200 }); person(g, 'kid', 340, 256, t, { st: 'in', tx: 400 });
    person(g, 'office', 620, 247, t, { st: 'out', tx: 700, drink: 'grape', sipT: 0.4 });
  }
  function laptopFrame(g, cx, w, h, WH) {
    var x0 = cx - (w >> 1), y0 = WH - h;
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.fillRect(0, 0, x0, WH); g.fillRect(x0 + w, 0, 9999, WH);
    for (var i = 0; i < w; i += 6) { R(g, x0 + i, y0, 3, 1, '#ffd24a'); R(g, x0 + i, WH - 1, 3, 1, '#ffd24a'); }
    for (var j = 0; j < h; j += 6) { R(g, x0, y0 + j, 1, 3, '#ffd24a'); R(g, x0 + w - 1, y0 + j, 1, 3, '#ffd24a'); }
    R(g, x0 + 2, y0 + 2, 142, 8, 'rgba(20,10,20,0.75)'); T(g, 'A LAPTOP SEES THIS PART', x0 + 4, y0 + 4, '#ffd24a');
    R(g, x0 + w + 4, 30, 44, 8, 'rgba(20,10,20,0.75)'); T(g, 'DRAG >', x0 + w + 6, 32, '#ffd24a');
  }

  var WW = 720, WH = 270;
  function drawParkEmpty(t) {
    var g = setup('parkEmpty', WW, WH);
    bigPark(g, WW, WH, t, false);
    tree(g, 32, 199, 1, false); tree(g, 690, 199, -1, false);
    plot(g, 14, 199, 80, 'FOOD TRUCK $', t);
    plot(g, 102, 199, 42, 'BENCH $', t);
    plot(g, 318, 199, 84, 'FOUNTAIN $$$', t);
    plot(g, 580, 199, 40, 'LAMP $', t);
    plot(g, 626, 199, 60, 'BUS STOP $$', t);
    machines(g, t, false);
    lines(g, t);
    laptopFrame(g, 260, 512, 270, WH);
  }
  function drawParkFull(t) {
    var g = setup('parkFull', WW, WH);
    bigPark(g, WW, WH, t, true);
    tree(g, 32, 199, 1, true); tree(g, 690, 199, -1, true);
    foodTruck(g, 14, 199, t); bench(g, 104, 199);
    fountain(g, 360, 201, t);
    bins(g, 300, 199);
    busStop(g, 614, 199);
    machines(g, t, true);
    lamp(g, 318, 199, true); lamp(g, 402, 199, true); lamp(g, 590, 199, true);
    g.fillStyle = 'rgba(30,20,70,0.22)'; g.fillRect(0, 0, WW, WH);
    lines(g, t);
    person(g, 'office', 118, 190, t, { sipT: 0.5, drink: 'cola', st: 'out', tx: 118 });
    person(g, 'kid', 52, 214, t, { st: 'look' });
  }
  function drawGrog(t) {
    var g = setup('grog', 330, 150, 3);
    R(g, 0, 0, 330, 150, '#2a2432');
    R(g, 0, 100, 330, 50, '#8e8880');
    function at(dx, mood, label, feats) {
      g.save(); g.translate(dx, -60);
      grogMachine(g, 40, mood, t, { feats: feats || [] });
      g.restore();
      T(g, label, dx + 40 - (Sprites.textWidth(label) >> 1), 142, '#ffd24a');
    }
    at(0, 'smirk', 'NORMAL');
    at(80, 'spicy', 'SPICY MODE');
    at(160, 'roast', 'ROAST');
    at(240, 'smirk', 'CRYPTO', ['crypto']);
  }

  // ── inside the machine ─────────────────────────────────────────
  function drawInside(t) {
    var W = 480, H = 270, g = setup('inside', W, H);
    R(g, 0, 0, W, H, '#101826');
    g.fillStyle = 'rgba(80,140,220,0.10)';
    for (var gx = 0; gx < W; gx += 12) g.fillRect(gx, 0, 1, H);
    for (var gy = 0; gy < H; gy += 12) g.fillRect(0, gy, W, 1);
    // the shell, opened
    var L = Sprites.LOOKS.you, x0 = 120, x1 = 360, y0 = 6, y1 = 264;
    R(g, x0 - 2, y0, x1 - x0 + 4, y1 - y0, P.ink);
    R(g, x0, y0 + 2, x1 - x0, y1 - y0 - 4, L.main); R(g, x0 + 2, y0 + 4, 3, y1 - y0 - 8, L.light); R(g, x1 - 6, y0 + 2, 6, y1 - y0 - 4, L.dark);
    R(g, x0 + 8, y0 + 4, 60, 10, '#1b1826'); T(g, 'VEND-3', x0 + 26, y0 + 7, L.accent);
    R(g, x0 + 76, y0 + 4, 40, 10, '#1b1826'); R(g, x0 + 86, y0 + 7, 2, 4, '#8affc8'); R(g, x0 + 104, y0 + 7, 2, 4, '#8affc8'); R(g, x0 + 90, y0 + 11, 12, 1, '#8affc8');
    T(g, '3.2 PPS', x0 + 180, y0 + 7, '#ffd24a');
    // the soda column on the left (what customers see)
    var cx0 = x0 + 8, cw = 44;
    R(g, cx0, 20, cw, 234, '#dcf0f2');
    ['cola', 'lemon', 'orange', 'grape'].forEach(function (d, r) {
      var dd = DATA.drinks[d];
      for (var s = 0; s < 3; s++) {
        var ry = 26 + r * 57 + s * 18;
        R(g, cx0 + 2, ry + 12, cw - 4, 1, '#d8443c');
        for (var n = 0; n < 8; n++) if ((n + s + r) % 7) Sprites.can(g, cx0 + 4 + n * 5, ry + 5, dd);
      }
    });
    T(g, 'SODA', cx0 + 12, 246, '#467a8a');
    // floors on the right
    var fx0 = x0 + 58, fw = x1 - 8 - fx0, fh = 38;
    var floors = [
      { name: 'LOGIC BOARD', bg: '#1c3a2a' },
      { name: 'COOLING', bg: '#1a2a3a' },
      { name: 'GRAPHICS', bg: '#2a1a3a' },
      { name: 'DRONE HANGAR', bg: '#2a2a2a' },
      { name: 'SERVER ROOM', bg: '#202028', locked: true }
    ];
    floors.forEach(function (f, i) {
      var fy = 20 + i * (fh + 2);
      R(g, fx0, fy, fw, fh, f.locked ? '#18161e' : f.bg);
      R(g, fx0, fy + fh - 2, fw, 2, '#0c0a10');
      T(g, f.name, fx0 + 3, fy + 2, f.locked ? '#4a4658' : '#8a86a0');
      if (f.locked) {
        R(g, fx0 + fw / 2 - 5, fy + 14, 10, 9, '#4a4658'); R(g, fx0 + fw / 2 - 3, fy + 10, 6, 5, '#18161e'); R(g, fx0 + fw / 2 - 3, fy + 10, 1, 5, '#4a4658'); R(g, fx0 + fw / 2 + 2, fy + 10, 1, 5, '#4a4658');
        T(g, 'RESEARCH TO OPEN', fx0 + fw / 2 - 31, fy + 27, '#4a4658');
        return;
      }
      if (i === 0) {   // scripts + RAM
        for (var s = 0; s < 6; s++) { var sx = fx0 + 4 + s * 18; R(g, sx, fy + 10, 15, 11, '#0c1620'); R(g, sx, fy + 10, 15, 2, '#3a5a8a'); T(g, '>', sx + 2, fy + 14, '#6cd48a'); if ((Math.floor(t * 3) + s) % 2) R(g, sx + 6, fy + 18, 3, 1, '#6cd48a'); }
        for (var m = 0; m < 5; m++) { var mx = fx0 + 118 + m * 10; R(g, mx, fy + 9, 6, 24, '#2e6a3a'); R(g, mx + 1, fy + 11, 4, 18, '#1a4a26'); for (var l = 0; l < 4; l++) R(g, mx + 2, fy + 12 + l * 4, 2, 2, (Math.floor(t * 6) + l + m) % 3 ? '#3a7a4a' : P.green); }
        T(g, 'X12', fx0 + 4, fy + 26, '#fffaf0'); T(g, 'X8', fx0 + 150, fy + 2, '#fffaf0');
      }
      if (i === 1) {   // fans + overclock
        for (var fn = 0; fn < 3; fn++) {
          var fcx = fx0 + 18 + fn * 30, fcy = fy + 21, a = t * 14 + fn;
          disc(g, fcx, fcy, 12, '#434857'); disc(g, fcx, fcy, 10, '#232838');
          for (var bl = 0; bl < 4; bl++) { var an = a + bl * Math.PI / 2; for (var rr = 2; rr < 10; rr++) R(g, Math.round(fcx + Math.cos(an + rr * 0.08) * rr), Math.round(fcy + Math.sin(an + rr * 0.08) * rr), 1, 1, '#c3c8d4'); }
          disc(g, fcx, fcy, 2, '#9197a8');
        }
        var ox = fx0 + 110, glow = 0.5 + 0.5 * Math.sin(t * 5);
        R(g, ox, fy + 10, 22, 22, '#3a2020'); R(g, ox + 3, fy + 13, 16, 16, 'rgb(' + Math.round(200 + 55 * glow) + ',80,40)'); T(g, 'OC', ox + 8, fy + 19, '#fff0a0');
        for (var h2 = 0; h2 < 4; h2++) R(g, ox + 4 + h2 * 5, fy + 6 - ((Math.floor(t * 8) + h2) % 3), 1, 2, 'rgba(255,160,90,0.7)');
        T(g, 'X3', fx0 + 4, fy + 30, '#fffaf0'); T(g, 'X1', ox + 26, fy + 26, '#fffaf0');
      }
      if (i === 2) {   // GPU
        R(g, fx0 + 10, fy + 11, 90, 20, '#1a1a22'); R(g, fx0 + 10, fy + 11, 90, 2, '#6fe0ff');
        [fx0 + 34, fx0 + 74].forEach(function (gcx, n) {
          disc(g, gcx, fy + 22, 8, '#2e2e3a');
          for (var bl = 0; bl < 3; bl++) { var an = t * 18 + n + bl * 2.09; for (var rr = 2; rr < 7; rr++) R(g, Math.round(gcx + Math.cos(an) * rr), Math.round(fy + 22 + Math.sin(an) * rr), 1, 1, '#9197a8'); }
        });
        for (var rb = 0; rb < 12; rb++) R(g, fx0 + 12 + rb * 7, fy + 31, 4, 1, 'hsl(' + ((rb * 30 + t * 120) % 360) + ',80%,60%)');
        T(g, 'X1', fx0 + 110, fy + 20, '#fffaf0');
      }
      if (i === 3) {   // drones
        for (var d = 0; d < 3; d++) { R(g, fx0 + 8 + d * 28, fy + 30, 22, 2, '#ffd24a'); Sprites.drone(g, fx0 + 19 + d * 28, fy + 25, t + d, null); }
        var lift = (t * 20) % 40;
        R(g, fx0 + fw - 30, fy + 6, 28, 26, '#101826');   // hatch open to the sky
        Sprites.drone(g, fx0 + fw - 16 + Math.round(lift / 3), fy + 24 - Math.round(lift / 2), t, '#e0483f');
        T(g, 'X4', fx0 + 96, fy + 20, '#fffaf0');
      }
    });
    // the locked door at the bottom (the wetware teaser)
    var dy = 20 + 5 * (fh + 2), pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
    R(g, fx0, dy, fw, y1 - 8 - dy, '#0a0810');
    var dcx = fx0 + (fw >> 1);
    disc(g, dcx, dy + 22, 16, '#3a3a48'); disc(g, dcx, dy + 22, 13, '#26222f');
    g.fillStyle = 'rgba(255,120,160,' + (0.15 + 0.35 * pulse).toFixed(2) + ')';
    for (var ring = 0; ring < 3; ring++) { g.fillRect(dcx - 8 + ring * 2, dy + 14 + ring * 5, 16 - ring * 4, 2); }
    R(g, dcx - 2, dy + 20, 5, 5, 'rgba(255,120,160,' + (0.4 + 0.5 * pulse).toFixed(2) + ')');
    T(g, 'DO NOT OPEN', fx0 + 6, dy + 3, '#6a5a70');
    // side notes
    T(g, 'CLICK A ROOM TO BUY MORE', 8, 250, '#8a86a0');
    T(g, 'ESC: BACK TO THE PARK', 370, 250, '#8a86a0');
  }

  function drawItems(t) {
    var g = setup('items', 470, 130, 3);
    g.translate(0, 40);
    R(g, 0, -40, 470, 130, '#2a2432'); R(g, 0, 72, 470, 18, '#8e8880'); R(g, 0, 70, 470, 2, '#4e8a48');
    foodTruck(g, 6, 72, t); bench(g, 96, 72); fountain(g, 180, 74, t); busStop(g, 222, 72); bins(g, 330, 72); lamp(g, 380, 72, false); lamp(g, 420, 72, true);
    T(g, 'FOOD TRUCK', 20, 80, '#fffaf0'); T(g, 'BENCH', 104, 80, '#fffaf0'); T(g, 'FOUNTAIN', 166, 80, '#fffaf0'); T(g, 'BUS STOP', 240, 80, '#fffaf0'); T(g, 'RECYCLING', 322, 80, '#fffaf0'); T(g, 'LAMPS', 390, 80, '#fffaf0');
  }

  // Version 5 (Void Possum's Photoshop layout): ChugGPT, [your slot], VEND-3, [your slot], lamp, Clawd, Grog.
  // VEND-3 in the exact centre (x 240), under the news board. One lamp. The edges stay free for the trees and the menus.
  var LAYOUT = { chug: 138, slotL: 191, you: 240, slotR: 289, lamp1: 316, clawd: 345, grog: 413 };
  function drawParkTight(t, full) {
    var W = 480, g = setup(full ? 'tightFull' : 'tight', W, WH, 3), X = LAYOUT;
    bigPark(g, W, WH, t, full, { tv: 156, plinths: [[108, 444]], hello: 'GROG MOVED IN' });
    tree(g, 26, 199, 1, full); tree(g, 454, 199, -1, full);
    lamp(g, X.lamp1, 199, full);
    Sprites.machine(g, X.chug, { id: 'chug', stock: { cola: 6, lemon: 7, orange: 4 }, cap: 12, drinks: ['cola', 'lemon', 'orange'], t: t, cold: 1, rup: { sign: 2 }, feats: ['crypto', 'plus'] });
    Sprites.machine(g, X.you, { id: 'you', name: 'VEND-3', stock: { cola: 10, lemon: 8, orange: 11, grape: 6 }, cap: 12, drinks: ['cola', 'lemon', 'orange', 'grape'], t: t, cold: 1.2, up: { sign: 3, cool: 2 }, hw: { fan: 1, ram: 1 }, pps: 3, lanes: 2 });
    Sprites.machine(g, X.clawd, { id: 'clawd', stock: { cola: 7, lemon: 5, orange: 9 }, cap: 12, drinks: ['cola', 'lemon', 'orange'], t: t, cold: 1, rup: {}, feats: ['snacks'] });
    grogMachine(g, X.grog, 'smirk', t, { feats: ['crypto'] });
    if (full) { sideMachine(g, X.slotL, 'snack', t); sideMachine(g, X.slotR, 'claw', t); }
    else { slotPlot(g, X.slotL, t); slotPlot(g, X.slotR, t); }
    if (full) { g.fillStyle = 'rgba(30,20,70,0.22)'; g.fillRect(0, 0, W, WH); }
    person(g, 'office', 135, 213, t, { st: 'buy' }); person(g, 'kid', 140, 224, t);
    person(g, 'boss', 237, 213, t, { st: 'buy' }); person(g, 'gym', 242, 223, t, { fol: 1 }); person(g, 'intern', 239, 233, t, { fol: 1 }); person(g, 'office', 241, 243, t);
    person(g, 'intern', 343, 214, t, { st: 'buy' });
    person(g, 'gym', 411, 213, t, { st: 'buy' }); person(g, 'office', 415, 224, t);
    person(g, 'boss', 40, 250, t, { st: 'in', tx: 200 }); person(g, 'kid', 450, 252, t, { st: 'in', tx: 300 });
    if (full) { person(g, 'office', 191, 212, t, { sipT: 0.5, drink: 'cola', st: 'out', tx: 191 }); person(g, 'kid', 289, 212, t, { st: 'look' }); }
  }
  // The four side-machine choices (you pick one for each slot).
  function drawSideChoices(t) {
    var g = setup('sides', 200, 90, 3);
    R(g, 0, 0, 200, 90, '#2a2432'); g.save(); g.translate(0, -122);
    R(g, 0, 200, 200, 12, '#8e8880'); R(g, 0, 198, 200, 2, '#4e8a48');
    ['snack', 'claw', 'coffee', 'ice'].forEach(function (k, i) { sideMachine(g, 28 + i * 48, k, t); });
    Sprites.machine(g, -40, { id: 'you', stock: {}, cap: 12, drinks: ['cola'], t: t, cold: 1, up: {} });
    g.restore();
    ['SNACK', 'CLAW', 'COFFEE', 'ICE'].forEach(function (k, i) { T(g, k, 28 + i * 48 - (Sprites.textWidth(k) >> 1), 82, '#ffd24a'); });
  }

  // Shared with tools/export.html (PNG export for Photoshop mockups).
  window.Mock = { grogMachine: grogMachine, grogFace: grogFace, sideMachine: sideMachine, lamp: lamp, tree: tree, person: person,
                  bigPark: bigPark, SIDE_W: SIDE_W, SIDE_H: SIDE_H, LAYOUT: LAYOUT };

  var t = 3.3;
  if (document.getElementById('tight')) { drawParkTight(t, false); drawParkTight(t, true); drawSideChoices(t); drawParkEmpty(t); drawParkFull(t); drawGrog(t); drawInside(t); drawItems(t); }
})();
