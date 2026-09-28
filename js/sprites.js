// I'M FRIDGE — pixel art, drawn in code.
// Everything that is "art" lives here: the palette, people, machines, the TV, room pieces and icons.
// All drawing uses whole pixels. People are drawn once into small cached images, then outlined.
// © 2026 Void Possum. All rights reserved.

var Sprites = (function () {
  'use strict';

  // ── palette: warm lights, cool shadows ─────────────────────
  var P = {
    ink: '#2a1c2c', ink2: '#3e2b3f', white: '#fffaf0',
    wall0: '#f6e4c6', wall1: '#ecd3ad', wall2: '#dcbd94', wall3: '#c7a07a',
    wood0: '#d59a65', wood1: '#b87c4b', wood2: '#935d37', wood3: '#6c4128', wood4: '#4b2b1d',
    fl0: '#a58570', fl1: '#937361', fl2: '#7d6052', fl3: '#634a40', flHi: '#bb9a82',
    steel0: '#eef1f6', steel1: '#c3c8d4', steel2: '#9197a8', steel3: '#636a7c', steel4: '#434857',
    glass0: '#e4f6f8', glass1: '#b2dde4', glass2: '#78b2c0', glass3: '#467a8a',
    scr: '#14161f', scr2: '#1d2130',
    leaf0: '#9ad86e', leaf1: '#62b052', leaf2: '#3d8043', leaf3: '#2a5a34', pot0: '#d77a4a', pot1: '#a9532f',
    gold0: '#fff0a0', gold1: '#ffd24a', gold2: '#e0a020',
    red: '#e0483f', blue: '#4a78d0', pink: '#ff6b8a', cyan: '#6fe0ff', green: '#6cd48a'
  };

  // ── tiny 3×5 pixel font ─────────────────────────────────────
  var FONT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '011', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
    'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
    'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
    'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'],
    'I': ['111', '010', '010', '010', '111'], 'J': ['001', '001', '001', '101', '010'],
    'K': ['101', '101', '110', '101', '101'], 'L': ['100', '100', '100', '100', '111'],
    'M': ['101', '111', '111', '101', '101'], 'N': ['110', '101', '101', '101', '101'],
    'O': ['010', '101', '101', '101', '010'], 'P': ['110', '101', '110', '100', '100'],
    'Q': ['010', '101', '101', '110', '011'], 'R': ['110', '101', '110', '101', '101'],
    'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'],
    'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'],
    'W': ['101', '101', '111', '111', '101'], 'X': ['101', '101', '010', '101', '101'],
    'Y': ['101', '101', '010', '010', '010'], 'Z': ['111', '001', '010', '100', '111'],
    '$': ['011', '110', '010', '011', '110'], 'ƒ': ['011', '010', '111', '010', '110'], '.': ['000', '000', '000', '000', '010'],
    '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'],
    '!': ['010', '010', '010', '000', '010'], '?': ['110', '001', '010', '000', '010'],
    ':': ['000', '010', '000', '010', '000'], '%': ['101', '001', '010', '100', '101'],
    '/': ['001', '001', '010', '100', '100'], ' ': ['000', '000', '000', '000', '000'],
    '>': ['100', '010', '001', '010', '100'], '#': ['101', '111', '101', '111', '101']
  };

  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function textWidth(str) { return String(str).length * 4 - 1; }
  // Pixel text is drawn once per string and colour into a small image, then reused.
  var textCache = {}, textCount = 0;
  function text(ctx, str, x, y, color) {
    str = String(str).toUpperCase();
    if (!str.length) return;
    var key = color + '|' + str, img = textCache[key];
    if (!img) {
      if (textCount > 600) { textCache = {}; textCount = 0; }
      img = document.createElement('canvas');
      img.width = Math.max(1, textWidth(str)); img.height = 5;
      var g = img.getContext('2d');
      g.fillStyle = color;
      for (var i = 0; i < str.length; i++) {
        var gl = FONT[str[i]] || FONT['?'];
        for (var r = 0; r < 5; r++) for (var c = 0; c < 3; c++) if (gl[r][c] === '1') g.fillRect(i * 4 + c, r, 1, 1);
      }
      textCache[key] = img; textCount++;
    }
    ctx.drawImage(img, Math.round(x), Math.round(y));
  }
  function textShadow(ctx, str, x, y, color, shadow) { text(ctx, str, x + 1, y + 1, shadow || 'rgba(20,10,20,0.6)'); text(ctx, str, x, y, color); }

  // Two colours mixed in a checker pattern (classic pixel-art dithering).
  var patCache = {}, patCount = 0;
  function dither(ctx, x, y, w, h, a, b, level) {
    R(ctx, x, y, w, h, a);
    var lv = level >= 0.75 ? 3 : level >= 0.5 ? 2 : 1, key = b + '|' + lv, pat = patCache[key];
    if (!pat) {
      if (patCount > 300) { patCache = {}; patCount = 0; }
      var c = document.createElement('canvas');
      c.width = 2; c.height = 2;
      var g = c.getContext('2d');
      g.fillStyle = b;
      for (var yy = 0; yy < 2; yy++) for (var xx = 0; xx < 2; xx++) {
        var on = lv === 3 ? ((xx + yy) % 2 === 0 || yy % 2 === 0) : lv === 2 ? (xx + yy) % 2 === 0 : (xx % 2 === 0 && yy % 2 === 0);
        if (on) g.fillRect(xx, yy, 1, 1);
      }
      pat = patCache[key] = ctx.createPattern(c, 'repeat');
      patCount++;
    }
    ctx.fillStyle = pat;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  // ── people ─────────────────────────────────────────────────
  // Every customer type always wears its signature, so you can read them from far away:
  // office = white shirt + ID badge · intern = round glasses + lanyard + coffee · gym = T-shaped, shirtless, sweating
  // boss = suit, red tie, briefcase · kid = small, cap, lollipop · night shift = safety vest + hard hat
  // follower = phone in hand · influencer = sunglasses + selfie phone + gold outline
  var SKIN = ['#f5d2b0', '#e8b48c', '#cc8f64', '#9d6947', '#6f4631'];
  var HAIR = ['#2b1b13', '#5b3a22', '#8b5a2b', '#d9a441', '#eadbb2', '#a33b2b', '#3b3b4b', '#7a7a86'];
  var SHIRT = ['#7fa6e0', '#e8836a', '#86c0a0', '#f2cf8f', '#a58ad8', '#c8b8a8', '#6ab0b0', '#e07a9a', '#f0a8c0'];
  var PANTS = ['#3c3c5c', '#4e3c2c', '#2e2e38', '#5c6c8c', '#5c4c6c'];
  var CAP = ['#e0483f', '#4a78d0', '#6cd48a', '#ffd24a', '#a58ad8'];
  var CANDY = ['#ff6b8a', '#6fe0ff', '#ffd24a', '#8fd06a', '#c890ff'];

  function palette(c) {
    var n = c.look | 0;
    if (c.reg) {
      var G = DATA.regulars[c.reg];
      return { skin: G.skin, hair: G.hair, shirt: G.shirt, pants: '#34344e', style: 1, cap: CAP[0], candy: CANDY[0] };
    }
    return { skin: SKIN[n % 5], hair: HAIR[(n >> 3) % 8], shirt: SHIRT[(n >> 6) % 9], pants: PANTS[(n >> 9) % 5],
             style: (n >> 12) % 4, cap: CAP[(n >> 14) % 5], candy: CANDY[(n >> 5) % 5] };
  }

  var cache = {}, cacheCount = 0;
  var SPR_W = 32, SPR_H = 46, FOOT_X = 16, FOOT_Y = 43;

  // Draw one person (no outline) into a small canvas. Feet at (FOOT_X, FOOT_Y).
  function drawPersonRaw(g, s) {
    var p = s.pal, kid = s.type === 'kid', gym = s.type === 'gym', x = FOOT_X, y = FOOT_Y;
    var legH = kid ? 3 : 8, bodyH = kid ? 5 : 12, bw = kid ? 8 : 12, hw = kid ? 8 : 11, hh = kid ? 6 : 10;
    var legW = kid ? 2 : 3, f = s.frame, walking = s.walking;
    var lUp = walking && f === 0 ? 1 : 0, rUp = walking && f === 2 ? 1 : 0, bob = walking && (f === 1 || f === 3) ? 1 : 0;
    if (s.breath) bob = 1;
    var bx = x - bw / 2, by = y - legH - bodyH - bob, hx = x - Math.floor(hw / 2), hy = by - hh + 1;
    var shirt = p.shirt, pants = p.pants, skin = p.skin, shoe = '#2a1f24';
    if (s.type === 'office') shirt = '#f6f4ee';
    if (s.type === 'boss') { shirt = '#3a3f5c'; pants = '#2c3048'; }
    if (s.type === 'night') pants = '#3d4a66';
    if (s.type === 'techbro') { shirt = '#cfe0f0'; pants = '#c8b48a'; }
    if (gym) pants = '#2f3a6a';
    var lx = kid ? x - 2 : x - 4, rx = x + 1;

    // backpack (kid) sits behind the body
    if (kid) R(g, s.dir < 0 ? bx + bw - 2 : bx - 2, by, 4, 5, p.cap);

    // legs + shoes (gym people wear shorts)
    R(g, lx, y - legH + lUp, legW, legH - lUp, pants); R(g, rx, y - legH + rUp, legW, legH - rUp, pants);
    if (gym) { R(g, lx, y - 4 + lUp, legW, 4 - lUp, skin); R(g, rx, y - 4 + rUp, legW, 4 - rUp, skin); }
    R(g, lx - 1, y - lUp, legW + 1, 1, gym ? '#f4f4f4' : shoe); R(g, rx, y - rUp, legW + 1, 1, gym ? '#f4f4f4' : shoe);

    // body
    var sw = walking ? (f === 0 ? 1 : f === 2 ? -1 : 0) : 0;
    if (gym) {
      // T-shape: wide shoulders, narrow waist, big arms
      R(g, bx - 3, by, bw + 6, 5, skin);
      R(g, bx - 1, by + 5, bw + 2, 3, skin);
      R(g, bx + 1, by + 8, bw - 2, bodyH - 8, skin);
      R(g, bx - 3, by + 4, bw + 6, 1, 'rgba(0,0,0,0.10)');
      R(g, x - 3, by + 7, 2, 1, 'rgba(0,0,0,0.15)'); R(g, x + 1, by + 7, 2, 1, 'rgba(0,0,0,0.15)');
      R(g, x - 3, by + 9, 2, 1, 'rgba(0,0,0,0.15)'); R(g, x + 1, by + 9, 2, 1, 'rgba(0,0,0,0.15)');
      R(g, x - 1, by + 5, 1, 6, 'rgba(0,0,0,0.10)');
      R(g, bx - 6, by + 1 - sw, 3, bodyH - 3, skin); R(g, bx + bw + 3, by + 1 + sw, 3, bodyH - 3, skin);
      R(g, bx - 6, by + 3 - sw, 1, 3, 'rgba(255,255,255,0.25)'); R(g, bx + bw + 5, by + 3 + sw, 1, 3, 'rgba(0,0,0,0.12)');
      R(g, bx + bw + 1, by - 1, 3, 3, '#f4f4f4'); R(g, bx + bw + 2, by + 2, 2, 4, '#f4f4f4');
      R(g, bx - 6, by + bodyH - 3 - sw, 3, 1, '#e0483f');
    } else {
      R(g, bx, by, bw, bodyH, shirt);
      R(g, bx, by + bodyH - 2, bw, 2, 'rgba(0,0,0,0.12)');
      R(g, bx + 1, by + 1, 1, bodyH - 3, 'rgba(255,255,255,0.20)');
      g.clearRect(bx, by, 1, 1); g.clearRect(bx + bw - 1, by, 1, 1);
      var armW = kid ? 1 : 2;
      R(g, bx - armW, by + 1 - sw, armW, bodyH - 3, shirt); R(g, bx + bw, by + 1 + sw, armW, bodyH - 3, shirt);
      R(g, bx - armW, by + bodyH - 2 - sw, armW, 2, skin); R(g, bx + bw, by + bodyH - 2 + sw, armW, 2, skin);
    }

    // clothes: the signature of each type
    switch (s.type) {
      case 'office':
        R(g, x - 2, by, 4, 2, '#dcd8ce'); R(g, x, by + 2, 1, bodyH - 4, '#dcd8ce');
        R(g, x + 2, by + 3, 3, 3, '#ffffff'); R(g, x + 2, by + 3, 3, 1, P.blue);
        R(g, bx, by + bodyH - 3, bw, 1, '#5a3a2a');
        break;
      case 'intern':
        R(g, x - 2, by, 1, 5, P.blue); R(g, x + 1, by, 1, 5, P.blue); R(g, x - 1, by + 5, 2, 3, '#f4f4f4');
        var cx = s.dir < 0 ? bx - 5 : bx + bw + 1;
        R(g, cx, by + bodyH - 6, 4, 5, '#f4f0e8'); R(g, cx, by + bodyH - 4, 4, 1, '#9a6a44'); R(g, cx, by + bodyH - 7, 4, 1, '#ffffff');
        break;
      case 'boss':
        R(g, x - 2, by, 4, 4, '#f4f4f4'); R(g, x - 1, by, 2, 8, P.red); R(g, x - 1, by + 8, 2, 1, '#9a2a22');
        R(g, bx + 2, by, 1, 6, '#2c3048'); R(g, bx + bw - 3, by, 1, 6, '#2c3048');
        var bcx = s.dir < 0 ? bx - 8 : bx + bw + 2;
        R(g, bcx, by + bodyH - 4, 7, 6, '#7a4a2a'); R(g, bcx + 2, by + bodyH - 5, 3, 1, '#4a2a1a'); R(g, bcx, by + bodyH + 1, 7, 1, '#5a3420');
        break;
      case 'kid':
        R(g, bx, by + 2, bw, 1, 'rgba(255,255,255,0.45)');
        var lpx = s.dir < 0 ? bx - 3 : bx + bw + 1;
        R(g, lpx + 1, by - 4, 1, 6, '#f4f4f4');
        R(g, lpx, by - 8, 3, 3, p.candy); R(g, lpx + 1, by - 9, 1, 1, p.candy); R(g, lpx + 1, by - 5, 1, 1, p.candy);
        R(g, lpx - 1, by - 7, 1, 1, p.candy); R(g, lpx + 3, by - 7, 1, 1, p.candy); R(g, lpx + 1, by - 7, 1, 1, '#ffffff');
        break;
      case 'techbro':   // a puffer vest over a light shirt, and a phone
        R(g, bx, by, 4, bodyH - 1, '#2b3140'); R(g, bx + bw - 4, by, 4, bodyH - 1, '#2b3140');
        R(g, bx + 1, by + 4, 3, 1, '#3b4254'); R(g, bx + bw - 4, by + 4, 3, 1, '#3b4254'); R(g, bx + bw - 3, by + 2, 1, 1, '#e8e8e8');
        var tpx = s.dir < 0 ? bx - 4 : bx + bw + 1;
        R(g, tpx, by + bodyH - 6, 3, 5, '#20202a'); R(g, tpx + 1, by + bodyH - 5, 1, 3, P.cyan);
        break;
      case 'night':
        R(g, bx, by, bw, bodyH, '#f0822a');
        R(g, bx, by + 4, bw, 1, '#fff35a'); R(g, bx, by + 8, bw, 1, '#fff35a'); R(g, x - 1, by, 2, bodyH, shirt);
        break;
    }

    // head
    R(g, hx, hy, hw, hh, skin);
    g.clearRect(hx, hy, 1, 1); g.clearRect(hx + hw - 1, hy, 1, 1);
    R(g, hx, hy + hh - 1, hw, 1, 'rgba(0,0,0,0.08)');
    if (s.type === 'night') {
      R(g, hx - 1, hy - 2, hw + 2, 4, '#ffd23a'); R(g, hx + 1, hy - 3, hw - 2, 1, '#ffd23a'); R(g, hx - 2, hy + 1, hw + 4, 1, '#e0a820');
    } else if (kid) {
      R(g, hx - 1, hy - 2, hw + 2, 3, p.cap); R(g, s.dir < 0 ? hx - 4 : hx + hw - 1, hy, 5, 1, p.cap);
    } else {
      R(g, hx - 1, hy - 1, hw + 2, 3, p.hair); R(g, hx, hy - 2, hw, 1, p.hair);
      if (s.type === 'boss') { R(g, hx - 1, hy + 2, 1, 3, p.hair); R(g, hx + hw, hy + 2, 1, 3, p.hair); }
      else if (p.style === 1) { R(g, hx - 1, hy + 2, 2, 9, p.hair); R(g, hx + hw - 1, hy + 2, 2, 9, p.hair); }
      else if (p.style === 2) { R(g, hx + 2, hy - 3, hw - 4, 1, p.hair); }
      else if (p.style === 3) { R(g, hx - 1, hy + 2, 1, 5, p.hair); R(g, hx + hw, hy + 2, 1, 5, p.hair); R(g, hx + (s.dir < 0 ? 1 : hw - 5), hy + 2, 4, 1, p.hair); }
      if (gym) R(g, hx - 1, hy + 1, hw + 2, 2, P.red);
    }
    // face
    var ex = s.dir < 0 ? -1 : (s.dir > 0 ? 1 : 0), eyeY = hy + (kid ? 3 : 5);
    var eL = hx + (kid ? 2 : 3) + ex, eR = hx + hw - (kid ? 3 : 4) + ex;
    if (s.shades || s.type === 'techbro') {
      R(g, eL - 2, eyeY - 1, eR - eL + 5, 3, '#15121c'); R(g, eL - 1, eyeY - 1, 1, 1, '#8a86a0'); R(g, eR, eyeY - 1, 1, 1, '#8a86a0');
    } else {
      if (s.blink) { R(g, eL, eyeY + 1, 2, 1, '#2a1a1a'); R(g, eR - 1, eyeY + 1, 2, 1, '#2a1a1a'); }
      else { R(g, eL, eyeY, 1, 2, '#2a1a1a'); R(g, eR, eyeY, 1, 2, '#2a1a1a'); }
      if (s.type === 'intern') {
        [eL, eR].forEach(function (ex2) {
          R(g, ex2 - 1, eyeY - 1, 3, 1, '#2a2a3a'); R(g, ex2 - 1, eyeY + 2, 3, 1, '#2a2a3a');
          R(g, ex2 - 2, eyeY, 1, 2, '#2a2a3a'); R(g, ex2 + 2, eyeY, 1, 2, '#2a2a3a');
        });
        R(g, eL + 2, eyeY, eR - eL - 3, 1, '#2a2a3a');
      }
    }
    R(g, eL - 1, eyeY + 2, 1, 1, 'rgba(240,120,120,0.45)'); R(g, eR + 1, eyeY + 2, 1, 1, 'rgba(240,120,120,0.45)');
    if (s.happy) R(g, x - 1 + ex, eyeY + 3, 2, 1, '#8a3a3a');
    if (gym) {
      var d1 = (f + (s.walking ? 0 : 1)) % 4;
      R(g, hx - 2, hy + 3 + d1, 1, 2, '#8fd8ff'); R(g, hx + hw + 1, hy + 5 + ((d1 + 2) % 4), 1, 2, '#8fd8ff');
      R(g, bx - 3 + (d1 % 2) * 2, by + 6 + d1, 1, 1, '#8fd8ff');
    }

    // held items
    var handX = s.dir < 0 ? bx - 4 : bx + bw + 1, handY = by + bodyH - 4;
    if (s.selfie) {
      var sx = s.dir < 0 ? hx - 5 : hx + hw + 1;
      R(g, sx, hy + 1, 4, 7, '#15121c'); R(g, sx + 1, hy + 2, 2, 4, P.cyan); R(g, sx + 1, hy + 8, 2, 4, skin);
    } else if (s.phone) {
      var px2 = s.dir < 0 ? bx - 4 : bx + bw;
      R(g, px2, by + 1, 4, 6, '#20202a'); R(g, px2 + 1, by + 2, 2, 4, P.cyan);
    }
    if (s.can) {
      if (s.sip) { var sxx = x + (s.dir < 0 ? -6 : 3); R(g, sxx, hy + hh - 3, 3, 5, s.can); R(g, sxx, hy + hh - 3, 3, 1, '#e8e8e8'); }
      else { R(g, handX, handY - 1, 3, 5, s.can); R(g, handX, handY - 1, 3, 1, '#e8e8e8'); }
    }
    if (s.umbrella) { R(g, handX + 1, handY - 9, 1, 12, '#3a3a4a'); R(g, handX, handY - 9, 3, 7, P.blue); }
    if (s.fan) R(g, hx - 4, hy + 4 - (s.frame % 2), 3, 4, '#f4f0e8');
  }

  // Outline a sprite: every empty pixel next to a filled one becomes the outline colour.
  // Done with image drawing only (no pixel read-back), so it stays fast.
  var tint = null;
  function outline(src, color) {
    var w = src.width, h = src.height;
    if (!tint) { tint = document.createElement('canvas'); tint.width = w; tint.height = h; }
    var tg = tint.getContext('2d');
    tg.globalCompositeOperation = 'source-over';
    tg.clearRect(0, 0, w, h);
    tg.drawImage(src, 0, 0);
    tg.globalCompositeOperation = 'source-in';
    tg.fillStyle = color;
    tg.fillRect(0, 0, w, h);
    tg.globalCompositeOperation = 'source-over';
    var out = document.createElement('canvas'); out.width = w; out.height = h;
    var og = out.getContext('2d');
    og.drawImage(tint, -1, 0); og.drawImage(tint, 1, 0); og.drawImage(tint, 0, -1); og.drawImage(tint, 0, 1);
    og.drawImage(src, 0, 0);
    return out;
  }

  function personSprite(spec) {
    var key = [spec.type, spec.pal.skin, spec.pal.hair, spec.pal.shirt, spec.pal.pants, spec.pal.style, spec.pal.cap, spec.pal.candy,
               spec.frame, spec.dir, spec.walking ? 1 : 0, spec.breath ? 1 : 0, spec.blink ? 1 : 0, spec.happy ? 1 : 0,
               spec.phone ? 1 : 0, spec.selfie ? 1 : 0, spec.shades ? 1 : 0, spec.can || '', spec.sip ? 1 : 0,
               spec.umbrella ? 1 : 0, spec.fan ? 1 : 0, spec.gold ? 1 : 0].join('|');
    var c = cache[key];
    if (c) return c;
    if (++cacheCount > 1500) { cache = {}; cacheCount = 0; }
    var raw = document.createElement('canvas'); raw.width = SPR_W; raw.height = SPR_H;
    drawPersonRaw(raw.getContext('2d'), spec);
    c = outline(raw, spec.gold ? P.gold2 : P.ink);
    cache[key] = c;
    return c;
  }

  // Draw a customer at their world position. Returns the y of the top of their head.
  function person(ctx, c, t, env) {
    var x = Math.round(c.x), y = Math.round(c.y);
    var walking = c.st === 'in' || c.st === 'go' || (c.st === 'out' && !(c.sipT > 0)) || c.st === 'gold';
    var dir = c.tx < c.x - 0.5 ? -1 : (c.tx > c.x + 0.5 ? 1 : 0);
    if (!walking && c.m >= 0) dir = 0;
    var kid = c.type === 'kid';
    var spec = {
      type: c.type, pal: palette(c), dir: dir, walking: walking,
      frame: walking ? Math.floor(t * 8 + c.id) % 4 : (c.type === 'gym' ? Math.floor(t * 4 + c.id) % 4 : 0),
      breath: !walking && Math.floor(t * 1.2 + c.id * 0.37) % 3 === 0,
      blink: Math.floor(t * 4 + c.id) % 23 === 0,
      happy: c.icon === 'happy' || c.icon === 'heart' || c.icon === 'value' || c.sipT > 0,
      phone: c.fol >= 0 && c.st !== 'out',
      selfie: !!c.gold, shades: !!c.gold,
      can: (c.st === 'out' && c.drink && DATA.drinks[c.drink]) ? DATA.drinks[c.drink].color : null,
      sip: c.sipT > 0,
      umbrella: env.weather === 'rain' && (c.look & 3) === 1 && !kid,
      fan: env.weather === 'hot' && (c.look & 3) === 2 && walking && !kid,
      gold: !!c.gold
    };
    ctx.fillStyle = 'rgba(40,20,40,0.28)';
    if (kid) { ctx.fillRect(x - 4, y, 9, 2); }
    else { ctx.fillRect(x - 7, y, 15, 2); ctx.fillRect(x - 5, y + 2, 11, 1); }
    if (c.gold) {
      var gl = ctx.createRadialGradient(x, y - 16, 2, x, y - 16, 22);
      gl.addColorStop(0, 'rgba(255,225,110,' + (0.45 + 0.15 * Math.sin(t * 6)).toFixed(2) + ')');
      gl.addColorStop(1, 'rgba(255,225,110,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(x - 22, y - 38, 44, 44);
    }
    ctx.drawImage(personSprite(spec), x - FOOT_X, y - FOOT_Y);
    var top = y - (kid ? 17 : 32);
    if (c.gold) {
      for (var i = 0; i < 4; i++) {
        var a = t * 3 + i * Math.PI / 2;
        R(ctx, x + Math.cos(a) * 12, y - 16 + Math.sin(a) * 15, 1, 1, P.gold0);
      }
    }
    return top;
  }

  // ── thought bubbles over heads ──────────────────────────────
  function bubble(ctx, x, y, kind, drink, t) {
    x = Math.round(x); y = Math.round(y);
    var bx = x - 6, by = y - 12;
    R(ctx, bx, by + 1, 13, 9, P.ink); R(ctx, bx + 1, by, 11, 11, P.ink);
    R(ctx, bx + 1, by + 1, 11, 9, P.white);
    R(ctx, x - 1, by + 11, 2, 1, P.ink); R(ctx, x, by + 12, 1, 1, P.ink);
    var cx = bx + 6, cy = by + 5;
    switch (kind) {
      case 'want': { var d = DATA.drinks[drink] || DATA.drinks.cola; can(ctx, cx - 1, cy - 3, d); break; }
      case 'sold': { var d2 = DATA.drinks[drink] || DATA.drinks.cola; can(ctx, cx - 1, cy - 3, d2);
        R(ctx, cx - 3, cy - 3, 1, 1, P.red); R(ctx, cx - 2, cy - 2, 1, 1, P.red); R(ctx, cx - 1, cy - 1, 1, 1, P.red); R(ctx, cx, cy, 1, 1, P.red);
        R(ctx, cx + 1, cy + 1, 1, 1, P.red); R(ctx, cx + 2, cy + 2, 1, 1, P.red); break; }
      case 'pricey': text(ctx, '$', cx - 4, cy - 2, P.red); text(ctx, '$', cx, cy - 2, P.red); break;
      case 'value': R(ctx, cx, cy - 3, 1, 7, '#3aa860'); R(ctx, cx - 3, cy, 7, 1, '#3aa860'); R(ctx, cx - 1, cy - 1, 3, 3, '#6cd48a'); break;
      case 'line': for (var qi = 0; qi < 3; qi++) { R(ctx, cx - 4 + qi * 3, cy - 2, 2, 2, '#5a5a7a'); R(ctx, cx - 4 + qi * 3, cy + 1, 2, 3, '#5a5a7a'); } break;   // a queue
      case 'gaveup': R(ctx, cx - 2, cy - 3, 5, 1, '#7a5a3a'); R(ctx, cx - 2, cy + 3, 5, 1, '#7a5a3a');
        R(ctx, cx - 1, cy - 2, 3, 2, '#e0b060'); R(ctx, cx, cy, 1, 1, '#e0b060'); R(ctx, cx - 1, cy + 1, 3, 2, '#e0b060'); break;
      case 'hot': R(ctx, cx, cy - 3, 1, 7, P.cyan); R(ctx, cx - 3, cy, 7, 1, P.cyan); R(ctx, cx - 2, cy - 2, 1, 1, P.cyan);
        R(ctx, cx + 2, cy + 2, 1, 1, P.cyan); R(ctx, cx + 2, cy - 2, 1, 1, P.cyan); R(ctx, cx - 2, cy + 2, 1, 1, P.cyan); break;
      case 'heart': heart(ctx, cx, cy, P.pink); break;
      case 'star': star(ctx, cx, cy, P.gold1); break;   // a Trending customer
      case 'flavor': { var d3 = DATA.drinks[drink] || DATA.drinks.cola; can(ctx, cx - 3, cy - 3, d3); text(ctx, '?', cx + 1, cy - 2, '#6a4a9a'); break; }   // wanted another soda
      case 'phone': R(ctx, cx - 2, cy - 3, 4, 7, '#20202a'); R(ctx, cx - 1, cy - 2, 2, 4, P.cyan); R(ctx, cx + 3, cy - 4, 1, 3, P.gold1); R(ctx, cx + 2, cy - 3, 3, 1, P.gold1); break;
      case 'happy': R(ctx, cx - 1, cy - 3, 1, 5, '#6a4a9a'); R(ctx, cx, cy - 3, 2, 1, '#6a4a9a'); R(ctx, cx - 3, cy + 1, 3, 2, '#6a4a9a'); break;
      case 'sweat': R(ctx, cx, cy - 3, 1, 1, '#4aa8e0'); R(ctx, cx - 1, cy - 2, 3, 2, '#4aa8e0'); R(ctx, cx - 2, cy, 5, 2, '#4aa8e0');
        R(ctx, cx - 1, cy + 2, 3, 1, '#4aa8e0'); R(ctx, cx - 1, cy - 1, 1, 1, '#d0f0ff'); break;
      case 'btc': R(ctx, cx - 3, cy - 3, 7, 7, P.gold2); R(ctx, cx - 2, cy - 4, 5, 9, P.gold2); R(ctx, cx - 2, cy - 2, 5, 5, P.gold1);
        text(ctx, 'B', cx - 1, cy - 2, '#7a4a10'); break;
      case 'skull': R(ctx, cx - 3, cy - 3, 7, 5, '#dcdce4'); R(ctx, cx - 2, cy + 2, 5, 2, '#dcdce4');
        R(ctx, cx - 2, cy - 1, 2, 2, P.ink); R(ctx, cx + 1, cy - 1, 2, 2, P.ink); R(ctx, cx - 1, cy + 3, 1, 1, P.ink); R(ctx, cx + 1, cy + 3, 1, 1, P.ink); break;
      case 'bang': R(ctx, cx, cy - 4, 2, 6, P.red); R(ctx, cx, cy + 3, 2, 2, P.red); break;
      case 'coin': R(ctx, cx - 2, cy - 3, 5, 7, P.gold2); R(ctx, cx - 3, cy - 2, 7, 5, P.gold2); R(ctx, cx - 1, cy - 2, 3, 5, P.gold1); break;
      default: return;
    }
  }

  function can(ctx, x, y, d) { R(ctx, x, y, 3, 6, d.color); R(ctx, x, y, 3, 1, '#e8e8e8'); R(ctx, x + 1, y + 2, 1, 3, d.light); }
  function star(ctx, x, y, color) {
    R(ctx, x, y - 3, 1, 7, color); R(ctx, x - 3, y, 7, 1, color); R(ctx, x - 1, y - 1, 3, 3, color);
    R(ctx, x - 2, y + 2, 1, 1, color); R(ctx, x + 2, y + 2, 1, 1, color); R(ctx, x, y, 1, 1, '#fff6d0');
  }
  function heart(ctx, x, y, color, small) {
    if (small) { R(ctx, x - 1, y, 1, 1, color); R(ctx, x + 1, y, 1, 1, color); R(ctx, x - 1, y + 1, 3, 1, color); R(ctx, x, y + 2, 1, 1, color); return; }
    R(ctx, x - 3, y - 2, 2, 1, color); R(ctx, x + 1, y - 2, 2, 1, color);
    R(ctx, x - 3, y - 1, 6, 2, color); R(ctx, x - 2, y + 1, 4, 1, color); R(ctx, x - 1, y + 2, 2, 1, color);
    R(ctx, x - 2, y - 1, 1, 1, '#ffd0dc');
  }

  // ── vending machines ────────────────────────────────────────
  var MW = 46, MH = 92, MTOP = 108;
  var LOOKS = {
    you:   { main: '#d9544b', light: '#ef7a68', dark: '#a8362f', deep: '#7a2226', accent: '#ffd24a', glow: '#ffb0a0', label: 'VEND-3' },
    chug:  { main: '#3fbf98', light: '#6fe0bc', dark: '#27876c', deep: '#1a5e4c', accent: '#b8ffe8', glow: '#7fffd0', label: 'CHUG' },
    clawd: { main: '#e0895a', light: '#f5a87c', dark: '#a85a38', deep: '#7a3e26', accent: '#ffe0c8', glow: '#ffc49a', label: 'CLAWD' },
    grog:  { main: '#3c3c48', light: '#5c5c6c', dark: '#26262e', deep: '#16161c', accent: '#f4f4f4', glow: '#ff7a3a', label: 'GROG' }
  };

  // Where each soda goes behind the glass: [{ d, row, half, col }]. Three shelves; halves for 4+ sodas.
  function glassCells(drinks) {
    var n = drinks.length, out = [];
    if (n <= 3) {
      var order = n === 1 ? [0, 0, 0] : n === 2 ? [0, 1, 0] : [0, 1, 2];
      order.forEach(function (k, row) { out.push({ d: drinks[k], row: row, half: false, col: 0 }); });
      return out;
    }
    for (var i = 0; i < 6; i++) out.push({ d: drinks[i] || null, row: Math.floor(i / 2), half: true, col: i % 2 });
    return out;
  }

  // info: { id, stock, cap, drinks, face, fx, vending:[drinks], lanes, up, hat, t, ver, hw, heat }
  function machine(ctx, cx, info) {
    var L = LOOKS[info.id] || LOOKS.you, x0 = Math.round(cx - MW / 2), y0 = MTOP, t = info.t;
    var U = (info.id === 'you' ? info.up : info.rup) || {};
    // shadow
    ctx.fillStyle = 'rgba(40,20,40,0.32)';
    ctx.fillRect(x0 - 3, y0 + MH, MW + 6, 3); ctx.fillRect(x0 - 1, y0 + MH + 3, MW + 2, 1);
    coolGlow(ctx, x0, y0, U.cool | 0);
    // outline + body
    R(ctx, x0 - 1, y0 + 2, MW + 2, MH - 2, P.ink); R(ctx, x0 + 1, y0, MW - 2, 2, P.ink); R(ctx, x0, y0 + 1, MW, 1, P.ink);
    R(ctx, x0, y0 + 2, MW, MH - 2, L.main); R(ctx, x0 + 1, y0 + 1, MW - 2, 1, L.main);
    R(ctx, x0 + 1, y0 + 3, 2, MH - 10, L.light);
    R(ctx, x0 + MW - 5, y0 + 2, 5, MH - 4, L.dark); R(ctx, x0 + MW - 1, y0 + 3, 1, MH - 6, L.deep);
    R(ctx, x0, y0 + MH - 7, MW, 7, L.dark); R(ctx, x0 + 2, y0 + MH - 5, MW - 4, 1, L.deep);
    R(ctx, x0 + 2, y0 + MH, 5, 2, P.ink); R(ctx, x0 + MW - 7, y0 + MH, 5, 2, P.ink);
    // name plate
    R(ctx, x0 + 4, y0 + 3, MW - 10, 7, '#1b1826');
    var lab = info.name || L.label;
    text(ctx, lab, x0 + 4 + Math.floor((MW - 10 - textWidth(lab)) / 2), y0 + 4, L.accent);
    // face screen
    R(ctx, x0 + 3, y0 + 11, MW - 8, 15, P.steel3); R(ctx, x0 + 3, y0 + 11, MW - 8, 1, P.steel2);
    R(ctx, x0 + 4, y0 + 12, MW - 10, 13, P.scr);
    face(ctx, x0 + 4, y0 + 12, info);
    // glass
    var gx = x0 + 4, gy = y0 + 28, gw = 27, gh = 48;
    R(ctx, gx - 1, gy - 1, gw + 2, gh + 2, P.steel2); R(ctx, gx - 1, gy - 1, gw + 2, 1, P.steel0);
    R(ctx, gx, gy, gw, gh, info.dim ? '#3a5260' : '#dcf0f2');
    R(ctx, gx, gy, gw, 6, info.dim ? '#445e6e' : '#f6fcfc');
    // Always three shelves. 1–3 sodas: full-width shelves (one soda fills all three, two sodas share them).
    // 4–6 sodas: every shelf splits into a left and a right half (3 cans wide, 2 high).
    var cells = glassCells(info.drinks), rowH = Math.floor((gh - 2) / 3);
    cells.forEach(function (cl, ci) {
      var d = cl.d, cw = cl.half ? 13 : gw - 2, cx0 = gx + 1 + (cl.half && cl.col ? 14 : 0), ry = gy + 1 + cl.row * rowH;
      // spiral coil + shelf
      R(ctx, cx0, ry + rowH - 2, cw, 1, '#fffaf0');
      for (var k = 0; k < cw - 3; k += 5) { R(ctx, cx0 + 1 + k, ry + rowH - 2, 3, 1, '#d8443c'); R(ctx, cx0 + 2 + k, ry + rowH - 1, 2, 1, (k / 5 + ci) % 3 ? '#6cd48a' : '#6fc3ff'); }
      R(ctx, cx0, ry + rowH - 1, 1, 1, P.glass3); R(ctx, cx0 + cw - 1, ry + rowH - 1, 1, 1, P.glass3);
      if (cl.half && !cl.col) R(ctx, cx0 + 13, ry + 1, 1, rowH - 2, 'rgba(160,190,200,0.55)');   // divider
      if (!d) return;
      var dd = DATA.drinks[d], cap = info.cap, st = info.stock[d] | 0;
      var perRow = cl.half ? 3 : 6, subRows = cl.half || cap > 6 ? 2 : 1;
      var show = st <= 0 ? 0 : Math.max(1, Math.ceil(perRow * subRows * st / Math.max(1, cap)));
      for (var n = 0; n < show; n++) {
        var sr = Math.floor(n / perRow), col = n % perRow;
        var cxn = cx0 + 1 + col * 4, cyn = ry + rowH - 8 - sr * 6 + (subRows === 1 ? 0 : 1);
        if (info.fx === 'cubes') { R(ctx, cxn, cyn + 2, 3, 3, '#8a8a96'); R(ctx, cxn, cyn + 2, 3, 1, '#c8c8d4'); }
        else can(ctx, cxn, cyn, dd);
      }
      if (st <= 0 && info.id === 'you' && Math.floor(t * 3) % 2) {   // empty: a blinking warning on that shelf
        var wx = cx0 + Math.floor(cw / 2) - 3;
        R(ctx, wx, ry + rowH - 9, 7, 7, P.red); text(ctx, '!', wx + 2, ry + rowH - 8, P.white);
      }
    });
    // glass shine and condensation
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (var s = 0; s < gh - 4; s++) { ctx.fillRect(gx + 3 + Math.floor(s / 8), gy + 2 + s, 1, 1); ctx.fillRect(gx + 6 + Math.floor(s / 8), gy + 2 + s, 1, 1); }
    if (info.cold > 1.05) {
      ctx.fillStyle = 'rgba(240,252,255,0.9)';
      var drops = Math.min(14, Math.round((info.cold - 0.9) * 30));
      for (var q = 0; q < drops; q++) ctx.fillRect(gx + 1 + ((q * 7) % (gw - 2)), gy + gh - 2 - ((q * 11 + Math.floor(t * 2)) % 10), 1, 1);
    }
    coolFrost(ctx, gx, gy, gw, gh, U.cool | 0, t);
    // control panel
    var px = x0 + 33, py = y0 + 28;
    R(ctx, px, py, 8, 48, L.deep); R(ctx, px, py, 8, 1, L.dark);
    coinGlow(ctx, px, py, U.coin | 0, t);
    R(ctx, px + 2, py + 3, 4, 6, '#1b1826'); R(ctx, px + 3, py + 4, 2, 4, U.coin ? P.gold1 : P.steel3);
    for (var b = 0; b < 6; b++) R(ctx, px + 1 + (b % 2) * 3, py + 13 + Math.floor(b / 2) * 4, 2, 2, b === 0 ? L.glow : P.steel1);
    if (info.up && info.up.smartprice) R(ctx, px + 2, py + 28, 4, 2, Math.floor(t * 2) % 2 ? P.green : '#2a6a3a');
    R(ctx, px + 2, py + 38, 4, 3, '#1b1826');
    // dispenser bay(s)
    var lanes = info.lanes || 1;
    for (var l = 0; l < lanes; l++) {
      var dx = x0 + 4 + l * 19, dw = lanes > 1 ? 17 : 36;
      R(ctx, dx, y0 + 79, dw, 9, P.ink); R(ctx, dx + 1, y0 + 80, dw - 2, 7, '#15121c'); R(ctx, dx + 1, y0 + 80, dw - 2, 2, '#2a2432');
      if (info.vending && info.vending[l]) {
        var vd = DATA.drinks[info.vending[l]] || DATA.drinks.cola;
        R(ctx, dx + Math.floor(dw / 2) - 2, y0 + 83, 5, 3, vd.color);
      }
    }
    // your machine: things you bought show up here
    if (info.id === 'you' && info.up) {
      if (info.hw && info.hw.fan) { // a spinning CPU fan on the side
        var fx0 = x0 + MW - 4, fy0 = y0 + 40, a = Math.floor(t * 12) % 2;
        R(ctx, fx0, fy0, 4, 8, '#1b1826'); R(ctx, fx0 + 1, fy0 + (a ? 1 : 3), 2, 1, P.steel1); R(ctx, fx0 + 1, fy0 + (a ? 5 : 4), 2, 1, P.steel1);
      }
      if (info.hw && (info.hw.ram || info.hw.script)) { // blinking activity lights, faster with more processing
        var n2 = Math.min(5, 1 + Math.floor(Math.log(1 + info.pps * 4)));
        for (var li = 0; li < n2; li++) R(ctx, x0 + MW - 4, y0 + 30 + li * 2, 2, 1, (Math.floor(t * (3 + info.pps)) + li) % 3 ? '#3a7a4a' : P.green);
      }
      if (info.up.sign) sign(ctx, x0, y0, info);
    }
    // Grog: a small antenna (it posts about itself); flames on the roof in spicy mode
    if (info.id === 'grog') {
      R(ctx, x0 + 36, y0 - 7, 1, 7, P.steel3); R(ctx, x0 + 34, y0 - 9, 5, 2, '#f4f4f4');
      if (info.fx === 'hype') for (var fl = 0; fl < 6; fl++) {
        var fh = 3 + ((fl * 5 + Math.floor(t * 9)) % 4);
        R(ctx, x0 + 3 + fl * 7, y0 - fh, 4, fh, fl % 2 ? '#ff7a3a' : '#ffb03a'); R(ctx, x0 + 4 + fl * 7, y0 - fh + 1, 2, 2, '#ffe08a');
      }
    }
    // rival sign: a row of bulbs on top, in its own colour; they run from level 3
    if (info.id !== 'you' && U.sign) marquee(ctx, x0, y0, U.sign >= 3 ? t : 0, U.sign, U.sign >= 5 ? null : L.glow);
    // ...and from level 4 a light strip down both sides, in its own colour
    if (info.id !== 'you' && U.sign >= 4) [x0 - 4, x0 + MW].forEach(function (sx, side) {
      R(ctx, sx, y0 + 8, 4, 70, P.ink); R(ctx, sx + 1, y0 + 9, 2, 68, L.deep);
      for (var i = 0; i < 17; i++) R(ctx, sx + 1, y0 + 10 + i * 4, 2, 2, (i + side + Math.floor(t * (4 + U.sign))) % 3 === 0 ? L.glow : L.dark);
    });
    // rival quirk marker
    if (info.id !== 'you' && info.fx) fxMark(ctx, x0 + 30, y0 - 16 + (Math.floor(t * 3) % 2), info.fx);
    // rival feature badge (installed after an update)
    (info.feats || []).forEach(function (f, n) { featBadge(ctx, x0 - 5, y0 + 26 + n * 12, f, t); });
    // party hat (Birthday Party card)
    if (info.hat) {
      var hx = info.id === 'you' ? x0 + 35 : x0 + 31, hy = y0;
      R(ctx, hx + 3, hy - 10, 1, 1, P.gold1);
      R(ctx, hx + 2, hy - 9, 3, 2, P.pink); R(ctx, hx + 1, hy - 7, 5, 2, P.cyan); R(ctx, hx, hy - 5, 7, 3, P.pink);
      R(ctx, hx - 1, hy - 2, 9, 1, P.ink);
    }
  }

  // The LED sign on your machine. Every level looks different:
  // 1 left strip · 2 both strips · 3 running lights · 4 brighter + lights on top · 5 colour cycle · 6+ rainbow + sparkles (more each level)
  var SIGN_COLORS = ['#ff6b5b', '#ffd24a', '#7bd88f', '#6fc3ff', '#c890ff'];
  function sign(ctx, x0, y0, info) {
    var t = info.t, lv = info.up.sign;
    var base = lv >= 4 ? '#ffa090' : '#ff6b5b';
    var col = lv >= 5 && lv < 6 ? SIGN_COLORS[Math.floor(t * 2) % SIGN_COLORS.length] : base;
    var top = y0 + 6, h = 74, speed = 6 + lv;
    var sides = lv >= 2 ? [x0 - 8, x0 + MW + 2] : [x0 - 8];
    sides.forEach(function (sx, side) {
      R(ctx, sx - 1, top - 1, 7, h + 2, P.ink); R(ctx, sx, top, 5, h, '#1b1826');
      R(ctx, sx + 1, top + h + 1, 3, 3, P.steel3);
      if (side === 0) {
        var nm = (info.name || 'VEND3').replace(/-/g, ''), step = nm.length > 6 ? 7 : 8;
        nm.split('').forEach(function (ch, i) {
          text(ctx, ch, sx + 1, top + 4 + i * step, lv >= 6 ? SIGN_COLORS[(i + Math.floor(t * 4)) % SIGN_COLORS.length] : col);
        });
        for (var d = 0; top + 6 + nm.length * step + d * 8 < top + h - 2; d++)
          R(ctx, sx + 2, top + 6 + nm.length * step + d * 8, 1, 1, lv >= 3 && (d + Math.floor(t * speed)) % 3 === 0 ? P.gold1 : col);
      } else {
        for (var i = 0; i < Math.floor(h / 4); i++) {
          var on = lv >= 3 ? (i + Math.floor(t * speed)) % 3 === 0 : i % 2 === 0;
          R(ctx, sx + 2, top + 2 + i * 4, 1, 2, on ? (lv >= 6 ? SIGN_COLORS[i % SIGN_COLORS.length] : P.gold1) : '#4a4050');
        }
      }
    });
    if (lv >= 4) marquee(ctx, x0, y0, t, lv, lv >= 6 ? null : P.gold1);
    if (lv >= 6) {   // sparkles around the strips, more with each level
      for (var k = 0; k < (lv - 5) * 2; k++) {
        var ph = Math.floor(t * 3 + k * 1.7);
        var sx2 = (k % 2 ? x0 + MW + 1 : x0 - 11) + ((ph * 5 + k * 3) % 9);
        var sy2 = top + ((ph * 23 + k * 31) % h);
        if ((ph + k) % 3) { R(ctx, sx2, sy2, 1, 1, P.white); if (lv >= 8) { R(ctx, sx2 - 1, sy2, 3, 1, 'rgba(255,255,255,0.5)'); R(ctx, sx2, sy2 - 1, 1, 3, 'rgba(255,255,255,0.5)'); } }
      }
    }
  }

  // A row of light bulbs along the top edge of a machine (bigger signs, and rival signs). color null = rainbow.
  function marquee(ctx, x0, y0, t, lv, color) {
    R(ctx, x0, y0 - 3, MW, 3, P.ink);
    for (var i = 0; i < 11; i++) {
      var on = (i + Math.floor(t * (4 + lv))) % 3 !== 0;
      R(ctx, x0 + 2 + i * 4, y0 - 2, 2, 1, on ? (color || SIGN_COLORS[i % SIGN_COLORS.length]) : '#4a4050');
    }
  }

  // Upgrades that show on any machine (yours in your colours, rivals in theirs).
  // Cooling: frost on the glass + a cold blue glow on the floor. Coin slot: a gold glow that pulses faster each level.
  function coolFrost(ctx, gx, gy, gw, gh, lv, t) {
    if (!lv) return;
    var n = Math.min(48, lv * 6);
    ctx.fillStyle = 'rgba(232,248,255,0.85)';
    for (var q = 0; q < n; q++) {
      var edge = q % 4, k = (q * 37) % 100 / 100, depth = (q * 13) % Math.min(6, 1 + lv);
      if (edge === 0) ctx.fillRect(gx + Math.floor(k * gw), gy + depth, 1, 1);
      else if (edge === 1) ctx.fillRect(gx + Math.floor(k * gw), gy + gh - 1 - depth, 1, 1);
      else if (edge === 2) ctx.fillRect(gx + depth, gy + Math.floor(k * gh), 1, 1);
      else ctx.fillRect(gx + gw - 1 - depth, gy + Math.floor(k * gh), 1, 1);
    }
  }
  function coolGlow(ctx, x0, y0, lv) {
    if (!lv) return;
    ctx.fillStyle = 'rgba(120,200,255,' + Math.min(0.4, 0.05 * lv).toFixed(2) + ')';
    ctx.fillRect(x0 - 4, y0 + MH + 1, MW + 8, 2); ctx.fillRect(x0 - 1, y0 + MH + 3, MW + 2, 2);
  }
  function coinGlow(ctx, px, py, lv, t) {
    if (!lv) return;
    var a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * (2 + lv * 1.2)));
    ctx.fillStyle = 'rgba(255,210,74,' + a.toFixed(2) + ')';
    ctx.fillRect(px + 1, py + 2, 6, 8);
    if (lv >= 4) ctx.fillRect(px, py + 4, 8, 4);
  }

  // Faces: every machine has one. Moods: ok, happy, worried, sleepy, glitch, and quirk moods for rivals.
  function face(ctx, x, y, info) {
    var t = info.t, id = info.id, mood = info.face || 'ok', fxm = info.fx;
    var col = id === 'chug' ? '#8affd8' : id === 'clawd' ? '#ffcf9a' : '#8affc8';
    var blink = (Math.floor(t * 10 + (id === 'chug' ? 7 : id === 'clawd' ? 13 : 0)) % 41) === 0;
    var L = x + 10, Rr = x + 23, ey = y + 3;
    if (mood === 'glitch') {
      for (var g = 0; g < 6; g++) R(ctx, x + ((g * 13 + Math.floor(t * 40)) % 34), y + ((g * 5) % 12), 3, 1, g % 2 ? '#ff6b8a' : col);
      return;
    }
    if (info.clickMe && Math.floor(t * 1.6) % 2) { text(ctx, 'CLICK', x + 8, y + 1, P.gold1); text(ctx, 'ME!', x + 12, y + 7, P.gold1); return; }
    if (fxm === 'closed') { text(ctx, 'BRB', x + 12, y + 4, col); return; }
    if (fxm === 'slow') { var dots = Math.floor(t * 3) % 4; for (var d = 0; d < dots; d++) R(ctx, x + 12 + d * 4, y + 6, 2, 2, col); return; }
    if (fxm === 'nopay') { text(ctx, '$?', x + 14, y + 4, col); return; }
    if (id === 'grog') { grogFace(ctx, x, y, info, blink); return; }
    var happy = mood === 'happy' || fxm === 'hype' || fxm === 'free';
    // eyes
    if (blink || mood === 'sleepy') { R(ctx, L - 1, ey + 3, 4, 1, col); R(ctx, Rr - 1, ey + 3, 4, 1, col); }
    else if (fxm === 'free') { heartEye(ctx, L, ey + 1, P.pink); heartEye(ctx, Rr, ey + 1, P.pink); }
    else if (fxm === 'cubes') { R(ctx, L - 1, ey, 4, 4, col); R(ctx, L, ey + 1, 2, 2, P.scr); R(ctx, Rr - 1, ey, 4, 4, col); R(ctx, Rr, ey + 1, 2, 2, P.scr); }
    else if (happy) { R(ctx, L - 1, ey + 2, 1, 1, col); R(ctx, L, ey + 1, 2, 1, col); R(ctx, L + 2, ey + 2, 1, 1, col);
                      R(ctx, Rr - 1, ey + 2, 1, 1, col); R(ctx, Rr, ey + 1, 2, 1, col); R(ctx, Rr + 2, ey + 2, 1, 1, col); }
    else if (id === 'chug') { R(ctx, L - 1, ey, 4, 5, col); R(ctx, Rr - 1, ey, 4, 5, col); R(ctx, L, ey + 1, 1, 1, '#ffffff'); R(ctx, Rr, ey + 1, 1, 1, '#ffffff'); }
    else if (id === 'clawd') { R(ctx, L, ey + 2, 2, 2, col); R(ctx, Rr, ey + 2, 2, 2, col); R(ctx, L - 1, ey, 3, 1, col); R(ctx, Rr, ey, 3, 1, col); }
    else { R(ctx, L, ey, 2, 5, col); R(ctx, Rr, ey, 2, 5, col); }
    // mouth
    var my = y + 10;
    if (mood === 'worried' || fxm === 'refuseCold') { R(ctx, x + 14, my, 2, 1, col); R(ctx, x + 16, my - 1, 2, 1, col); R(ctx, x + 18, my, 2, 1, col); }
    else if (id === 'chug' || happy) { R(ctx, x + 13, my - 1, 9, 1, col); R(ctx, x + 14, my, 7, 1, col); R(ctx, x + 15, my + 1, 5, 1, happy ? '#ff9ab0' : col); }
    else if (id === 'clawd') { R(ctx, x + 15, my, 1, 1, col); R(ctx, x + 16, my + 1, 3, 1, col); R(ctx, x + 19, my, 1, 1, col); }
    else { R(ctx, x + 14, my, 1, 1, col); R(ctx, x + 15, my + 1, 6, 1, col); R(ctx, x + 21, my, 1, 1, col); }
    // Clawd sweats when things go wrong
    if (id === 'clawd' && (mood === 'worried' || fxm)) { var sy = y + 1 + Math.floor(t * 4) % 3; R(ctx, x + 32, sy, 2, 3, '#8fd8ff'); R(ctx, x + 32, sy, 1, 1, '#ffffff'); }
    if (mood === 'sleepy') text(ctx, 'Z', x + 30, y + 1 - Math.floor(t * 2) % 2, col);
  }
  // Grog: pixel sunglasses and a smirk. Spicy mode (hype): flame eyes. Roast: a laughing mouth.
  function grogFace(ctx, x, y, info, blink) {
    var t = info.t, fxm = info.fx, c = '#f4f4f4', hot = '#ff7a3a';
    if (fxm === 'hype') {
      [9, 22].forEach(function (ex, i) {
        var f = Math.floor(t * 8 + i) % 2;
        R(ctx, x + ex, y + 5, 5, 3, hot); R(ctx, x + ex + 1, y + 3 - f, 3, 2, P.gold1); R(ctx, x + ex + 2, y + 2 - f, 1, 1, P.gold0);
      });
      R(ctx, x + 12, y + 10, 12, 1, c); R(ctx, x + 22, y + 9, 2, 1, c);
      return;
    }
    R(ctx, x + 6, y + 3, 24, 1, c);                                              // sunglasses
    R(ctx, x + 7, y + 4, 9, 4, c); R(ctx, x + 20, y + 4, 9, 4, c);
    R(ctx, x + 8, y + 5, 7, 2, '#1a1a22'); R(ctx, x + 21, y + 5, 7, 2, '#1a1a22');
    if (!blink) { R(ctx, x + 9, y + 5, 2, 1, '#8a8a9a'); R(ctx, x + 22, y + 5, 2, 1, '#8a8a9a'); }
    if (fxm === 'roast' || fxm === 'free' || info.face === 'happy') { R(ctx, x + 13, y + 9, 10, 1, c); R(ctx, x + 14, y + 10, 8, 2, hot); R(ctx, x + 14, y + 12, 8, 1, c); }
    else if (info.face === 'worried' || fxm === 'nopay') { R(ctx, x + 14, y + 10, 8, 1, c); }
    else { R(ctx, x + 14, y + 10, 7, 1, c); R(ctx, x + 21, y + 9, 2, 1, c); }   // smirk
  }

  // A big cardboard box: the spot for a machine that arrives later.
  // Your side machines (the new park): small, red like VEND-3, 32×66, standing on the path (ground y = 200).
  // on: its bonus is working right now (lit sign); t: time for the small animations.
  var SIDE_W = 32, SIDE_H = 66;
  function sideMachine(g, cx, kind, t, on) {
    var L = LOOKS.you, w = SIDE_W, h = SIDE_H, x0 = Math.round(cx - w / 2), y0 = 200 - h;
    R(g, x0 + 1, y0 + h, w, 2, 'rgba(40,20,40,0.3)');
    R(g, x0 - 1, y0 - 1, w + 2, h + 1, P.ink);
    R(g, x0, y0, w, h, L.main); R(g, x0 + 1, y0 + 2, 2, h - 6, L.light); R(g, x0 + w - 3, y0, 3, h, L.dark);
    R(g, x0, y0 + h - 5, w, 5, L.dark); R(g, x0 + 2, y0 + h, 4, 1, P.ink); R(g, x0 + w - 6, y0 + h, 4, 1, P.ink);
    var label = { snack: 'SNACK', claw: 'CLAW', coffee: 'CAFE', ice: 'ICE' }[kind];
    R(g, x0 + 3, y0 + 3, w - 7, 7, '#1b1826');
    text(g, label, x0 + 3 + Math.floor((w - 7 - textWidth(label)) / 2), y0 + 4, on === false ? '#6a5a60' : L.accent);
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
      var cxp = gx + 5 + Math.round((Math.sin(t * (on === false ? 0.3 : 1.3)) + 1) * 5);
      R(g, cxp, gy + 1, 1, 9, P.steel3); R(g, cxp - 2, gy + 10, 5, 2, P.steel2); R(g, cxp - 2, gy + 12, 1, 2, P.steel2); R(g, cxp + 2, gy + 12, 1, 2, P.steel2);
      [['#ff6b8a', 1, 0], ['#6fe0ff', 7, 0], ['#ffd24a', 13, 0], ['#a58ad8', 4, 5], ['#6cd48a', 10, 5]].forEach(function (p) {
        var px = gx + p[1], py = gy + gh - 7 - p[2];
        R(g, px, py, 6, 6, p[0]); R(g, px + 1, py + 2, 1, 1, P.ink); R(g, px + 4, py + 2, 1, 1, P.ink);
      });
    } else if (kind === 'coffee') {
      R(g, gx, gy, gw, gh, '#3a2418'); R(g, gx + 2, gy + 2, gw - 4, 8, '#1b1826');
      text(g, 'HOT', gx + 5, gy + 4, on === false ? '#6a5040' : '#ffb07a');
      R(g, gx + 4, gy + 14, 12, 16, '#15121c');                           // the cup bay
      R(g, gx + 7, gy + 21, 6, 8, '#fffaf0'); R(g, gx + 7, gy + 21, 6, 2, '#6c4128'); R(g, gx + 13, gy + 23, 2, 3, '#fffaf0');
      if (on !== false) {
        for (var st = 0; st < 3; st++) { var sy = (Math.floor(t * 5) + st * 3) % 7; R(g, gx + 8 + st * 2, gy + 19 - sy, 1, 2, 'rgba(255,255,255,0.6)'); }
        R(g, gx + 9, gy + 14, 2, 4, '#6c4128');                         // the pour
      }
    } else if (kind === 'ice') {
      R(g, gx, gy, gw, gh, '#e8faff'); R(g, gx, gy, gw, 2, '#ffffff');
      for (var i = 0; i < 9; i++) { var ix = gx + 2 + (i % 3) * 6, iy = gy + 4 + Math.floor(i / 3) * 10; R(g, ix, iy, 5, 5, '#9adcf0'); R(g, ix, iy, 5, 1, '#ffffff'); R(g, ix + 1, iy + 1, 1, 1, '#ffffff'); }
      R(g, gx + 1, gy + gh - 3, gw - 2, 2, '#c8f0ff');
      if (on !== false && Math.floor(t * 2) % 2) R(g, gx + gw - 4, gy + 2, 1, 1, '#ffffff');   // sparkle
    }
    // side panel: a coin slot and buttons, and a little "V3" (it is yours)
    var px = x0 + 24;
    R(g, px, gy, 5, gh, L.deep); R(g, px + 1, gy + 2, 3, 4, '#1b1826'); R(g, px + 2, gy + 3, 1, 2, P.gold1);
    for (var b = 0; b < 3; b++) R(g, px + 1, gy + 9 + b * 4, 3, 2, b === 0 ? (on === false ? P.steel1 : L.glow) : P.steel1);
    text(g, 'V3', x0 + 9, y0 + 48, L.accent);
    R(g, x0 + 5, y0 + 54, 20, 5, '#15121c');   // the tray
  }
  // An empty side slot: a dashed outline. open: blinking "PICK" with a plus; otherwise a short label (e.g. "120/200").
  function sideSlot(g, cx, t, open, label) {
    var a = open ? (Math.floor(t * 2) % 2 ? '#fffaf0' : '#d8d0c0') : 'rgba(255,250,240,0.35)', x0 = Math.round(cx - SIDE_W / 2), y0 = 200 - SIDE_H;
    for (var i = 0; i < SIDE_W; i += 4) { R(g, x0 + i, y0, 2, 1, a); R(g, x0 + i, 199, 2, 1, a); }
    for (var j = 0; j < SIDE_H; j += 4) { R(g, x0, y0 + j, 1, 2, a); R(g, x0 + SIDE_W - 1, y0 + j, 1, 2, a); }
    if (open) {
      R(g, cx - 1, y0 + 24, 3, 9, P.gold1); R(g, cx - 4, y0 + 27, 9, 3, P.gold1);
      text(g, 'PICK', cx - 7, y0 + 38, '#fffaf0');
    } else if (label) textShadow(g, label, cx - Math.floor(textWidth(label) / 2), y0 + 30, '#fffaf0');
  }

  function box(ctx, cx) {
    var x0 = cx - 25, y0 = 108, w = 50, h = 92;
    R(ctx, x0, y0 + h, w + 2, 3, 'rgba(40,20,40,0.32)');
    R(ctx, x0 - 1, y0 - 1, w + 2, h + 1, P.ink);
    R(ctx, x0, y0, w, h, '#c8955a');
    R(ctx, x0, y0, w, 2, '#e0b27a'); R(ctx, x0 + w - 6, y0, 6, h, '#a87440'); R(ctx, x0 + w - 6, y0, 1, h, '#8a5c30');
    R(ctx, x0, y0 + 10, w - 6, 1, '#a87440');
    R(ctx, x0 + 18, y0, 8, h, '#d8c090'); R(ctx, x0 + 18, y0, 1, h, '#b8a070'); R(ctx, x0 + 25, y0, 1, h, '#b8a070');   // packing tape
    R(ctx, x0, y0 + 4, w - 6, 5, '#d8c090');
    [x0 + 5, x0 + 32].forEach(function (ax) {   // "this side up"
      R(ctx, ax + 2, y0 + 14, 1, 1, '#3a2418'); R(ctx, ax + 1, y0 + 15, 3, 1, '#3a2418'); R(ctx, ax, y0 + 16, 5, 1, '#3a2418'); R(ctx, ax + 1, y0 + 17, 3, 5, '#3a2418');
    });
    R(ctx, x0 + 4, y0 + 30, 12, 14, '#f6ecd8'); R(ctx, x0 + 4, y0 + 30, 12, 2, P.red);   // fragile
    R(ctx, x0 + 7, y0 + 34, 6, 3, P.red); R(ctx, x0 + 9, y0 + 37, 2, 4, P.red); R(ctx, x0 + 7, y0 + 41, 6, 1, P.red);
    var sy = y0 + 54;                                                                        // SOON stamp
    R(ctx, x0 + 5, sy, 34, 13, P.red); R(ctx, x0 + 6, sy + 1, 32, 11, '#c8955a'); R(ctx, x0 + 7, sy + 2, 30, 9, P.red); R(ctx, x0 + 8, sy + 3, 28, 7, '#c8955a');
    text(ctx, 'SOON', x0 + 14, sy + 4, P.red);
    R(ctx, x0 + 28, y0 + 30, 14, 10, '#fffaf0'); for (var l = 0; l < 3; l++) R(ctx, x0 + 30, y0 + 32 + l * 2, 10 - l * 3, 1, '#8a86a0');
    R(ctx, x0 + 2, y0 + h - 3, w - 8, 1, '#a87440');
  }

  // Crypto mining = gold coin with a spinning fan; price war = a minus sign and a dollar.
  function featBadge(ctx, x, y, feat, t) {
    R(ctx, x - 1, y - 1, 11, 13, P.ink); R(ctx, x, y, 9, 11, '#1b1826');
    if (feat === 'crypto') {
      R(ctx, x + 2, y + 2, 5, 5, P.gold2); R(ctx, x + 3, y + 3, 3, 3, P.gold1);
      R(ctx, x + 1 + (Math.floor(t * 10) % 7), y + 9, 1, 1, P.gold0);
    } else if (feat === 'pricewar') {
      text(ctx, '-$', x + 1, y + 3, P.red);
    } else if (feat === 'snacks') {   // a sandwich
      R(ctx, x + 1, y + 3, 7, 2, '#e8b48a'); R(ctx, x + 1, y + 5, 7, 1, P.green); R(ctx, x + 1, y + 6, 7, 1, P.red); R(ctx, x + 1, y + 7, 7, 2, '#e8b48a');
    } else if (feat === 'fleet') {    // a small drone, bobbing
      var b = Math.floor(t * 4) % 2;
      R(ctx, x + 1, y + 3 - b, 3, 1, P.steel0); R(ctx, x + 5, y + 3 - b, 3, 1, P.steel0); R(ctx, x + 2, y + 4 - b, 5, 2, P.steel2); R(ctx, x + 4, y + 6 - b, 1, 2, P.red);
    } else if (feat === 'plus') {     // a gold plus
      R(ctx, x + 3, y + 2, 3, 7, P.gold1); R(ctx, x + 1, y + 4, 7, 3, P.gold1);
    }
  }

  function heartEye(ctx, x, y, c) { R(ctx, x - 1, y, 1, 1, c); R(ctx, x + 1, y, 1, 1, c); R(ctx, x - 1, y + 1, 3, 1, c); R(ctx, x, y + 2, 1, 1, c); }

  function fxMark(ctx, bx, by, fx) {
    R(ctx, bx - 1, by, 15, 11, P.ink); R(ctx, bx, by - 1, 13, 13, P.ink); R(ctx, bx, by, 13, 11, P.white);
    R(ctx, bx + 2, by + 12, 2, 2, P.ink);
    switch (fx) {
      case 'free': text(ctx, '0$', bx + 3, by + 3, '#2a8f72'); break;
      case 'hype': R(ctx, bx + 6, by + 2, 1, 7, P.gold2); R(ctx, bx + 3, by + 5, 7, 1, P.gold2); R(ctx, bx + 5, by + 4, 3, 3, P.gold1); break;
      case 'nopay': text(ctx, '$?', bx + 3, by + 3, P.red); break;
      case 'closed': R(ctx, bx + 5, by + 2, 3, 7, P.red); R(ctx, bx + 3, by + 2, 2, 7, '#2a4a9a'); R(ctx, bx + 8, by + 2, 2, 7, '#2a4a9a'); break;
      case 'cubes': R(ctx, bx + 3, by + 3, 7, 6, '#8a8a96'); R(ctx, bx + 3, by + 3, 7, 2, '#c8c8d4'); break;
      case 'refuseCold': R(ctx, bx + 6, by + 2, 1, 7, '#6fc3ff'); R(ctx, bx + 3, by + 5, 7, 1, '#6fc3ff'); R(ctx, bx + 2, by + 9, 9, 1, P.red); break;
      case 'discount': text(ctx, '%', bx + 5, by + 3, P.red); break;
      case 'slow': text(ctx, '...', bx + 1, by + 3, '#555'); break;
    }
  }

  // Things that give off light, drawn again on top of the night darkness.
  function machineLights(ctx, cx, info, a) {
    var x0 = Math.round(cx - MW / 2), y0 = MTOP;
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.4 + a * 1.2);
    ctx.fillStyle = 'rgba(210,240,250,0.30)';
    ctx.fillRect(x0 + 4, y0 + 28, 27, 48);
    ctx.globalAlpha = 1;
    R(ctx, x0 + 4, y0 + 12, MW - 10, 13, P.scr);
    face(ctx, x0 + 4, y0 + 12, info);
    var L = LOOKS[info.id] || LOOKS.you;
    var lab = info.name || L.label;
    text(ctx, lab, x0 + 4 + Math.floor((MW - 10 - textWidth(lab)) / 2), y0 + 4, L.accent);
    if (info.id === 'you' && info.up && info.up.sign) {
      if (info.up.sign >= 10) {
        ctx.fillStyle = 'rgba(255,120,200,' + (a * 0.18).toFixed(3) + ')';
        ctx.fillRect(x0 - 12, y0 + 2, 10, 82); ctx.fillRect(x0 + MW, y0 + 2, 10, 82);
      }
      sign(ctx, x0, y0, info);
    }
    ctx.restore();
  }

  // ── room pieces ─────────────────────────────────────────────
  function crate(ctx, x, y, hover) {
    R(ctx, x - 1, y + 14, 20, 2, 'rgba(40,20,40,0.3)');
    R(ctx, x - 1, y - 1, 20, 16, P.ink);
    R(ctx, x, y, 18, 14, hover ? P.wood0 : P.wood1);
    R(ctx, x, y, 18, 1, '#e8b880'); R(ctx, x, y + 6, 18, 1, P.wood2); R(ctx, x, y + 13, 18, 1, P.wood3);
    R(ctx, x, y, 1, 14, P.wood2); R(ctx, x + 17, y, 1, 14, P.wood2);
    text(ctx, 'SODA', x + 2, y + 8, P.wood4);
    R(ctx, x + 3, y - 2, 3, 2, '#c0604a'); R(ctx, x + 8, y - 2, 3, 2, '#d6f28a'); R(ctx, x + 13, y - 2, 3, 2, '#ffc070');
  }

  function drone(ctx, x, y, t, carrying) {
    var b = Math.floor(t * 4) % 2;
    R(ctx, x - 5, y - 1 - b, 11, 5, P.ink);
    R(ctx, x - 4, y - b, 9, 3, P.steel2); R(ctx, x - 4, y - b, 9, 1, P.steel1);
    R(ctx, x - 7, y - 3 - b, 5, 1, Math.floor(t * 20) % 2 ? P.steel0 : P.steel2);
    R(ctx, x + 3, y - 3 - b, 5, 1, Math.floor(t * 20) % 2 ? P.steel2 : P.steel0);
    R(ctx, x, y + 1 - b, 1, 1, P.green);
    if (carrying) { R(ctx, x - 1, y + 3 - b, 3, 5, carrying); R(ctx, x - 1, y + 3 - b, 3, 1, '#e8e8e8'); }
  }

  function tv(ctx, x, y, w, h, t, lit) {
    R(ctx, x + 10, y - 6, 2, 6, P.steel3); R(ctx, x + w - 12, y - 6, 2, 6, P.steel3);
    R(ctx, x - 1, y - 1, w + 2, h + 2, P.ink);
    R(ctx, x, y, w, h, '#26222f'); R(ctx, x, y, w, 1, '#3b3548');
    R(ctx, x + 3, y + 3, w - 6, h - 9, '#0c1620');
    ctx.fillStyle = 'rgba(80,160,200,0.08)';
    for (var s = 0; s < h - 9; s += 2) ctx.fillRect(x + 3, y + 3 + s, w - 6, 1);
    text(ctx, 'PARK NEWS', x + 4, y + h - 5, '#8a86a0');
    R(ctx, x + w - 8, y + h - 5, 3, 3, Math.floor(t * 2) % 2 ? '#ff4a4a' : '#7a2a2a');
    if (lit) { ctx.fillStyle = 'rgba(120,200,255,0.06)'; ctx.fillRect(x + 3, y + 3, w - 6, h - 9); }
  }

  function plant(ctx, x, y, grow) {
    R(ctx, x - 8, y - 15, 16, 15, P.ink); R(ctx, x - 7, y - 14, 14, 14, P.pot0); R(ctx, x - 7, y - 14, 14, 2, '#e89868');
    R(ctx, x + 3, y - 12, 3, 11, P.pot1); R(ctx, x - 9, y - 17, 18, 4, P.ink); R(ctx, x - 8, y - 16, 16, 2, '#e8905e');
    var hgt = 18 + grow;
    R(ctx, x, y - 16 - hgt, 1, hgt, P.leaf3);
    var leaves = 6 + Math.floor(grow / 3);
    for (var i = 0; i < leaves; i++) {
      var side = i % 2 ? 1 : -1, ly = y - 20 - Math.floor(i * (hgt - 4) / leaves), lx = x + side * (2 + (i % 3));
      R(ctx, lx - (side < 0 ? 5 : 0), ly - 1, 6, 4, P.ink);
      R(ctx, lx - (side < 0 ? 4 : 0) + (side < 0 ? 0 : 1), ly, 4, 2, i % 3 ? P.leaf1 : P.leaf0);
      R(ctx, lx - (side < 0 ? 4 : 0) + (side < 0 ? 0 : 1), ly + 2, 4, 1, P.leaf2);
    }
  }

  return {
    P: P, R: R, text: text, textShadow: textShadow, textWidth: textWidth, dither: dither,
    person: person, bubble: bubble, heart: heart, can: can,
    machine: machine, machineLights: machineLights, face: face, LOOKS: LOOKS,
    crate: crate, drone: drone, tv: tv, plant: plant, box: box, sideMachine: sideMachine, sideSlot: sideSlot, SIDE_W: SIDE_W, SIDE_H: SIDE_H,
    MW: MW, MH: MH, MTOP: MTOP, palette: palette, personSprite: personSprite
  };
})();
