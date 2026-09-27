// I'M FRIDGE — sound effects, made by the browser (no audio files).
// Volume 0 means fully silent: nothing is created or played.
// © 2026 Void Possum. All rights reserved.

var Sfx = (function () {
  'use strict';
  var ac = null, master = null, vol = 0.6, last = {};

  function ensure() {
    if (vol <= 0) return null;
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = vol * 0.5;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function setVolume(v) {
    vol = Math.max(0, Math.min(1, v));
    if (master) master.gain.value = vol * 0.5;
  }

  function tone(freq, start, dur, type, gain, slideTo) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function noise(start, dur, gain, freq) {
    var len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq || 800;
    g.gain.value = gain || 0.3;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(start);
  }

  var SOUNDS = {
    coin: function (t) { tone(1320, t, 0.06, 'square', 0.08); tone(1760, t + 0.05, 0.1, 'square', 0.07); },
    thunk: function (t) { noise(t, 0.08, 0.25, 500); tone(140, t, 0.08, 'sine', 0.2, 70); },
    wave: function (t) { tone(520, t, 0.12, 'triangle', 0.12, 880); },
    meh: function (t) { tone(330, t, 0.14, 'triangle', 0.1, 220); },
    restock: function (t) { for (var i = 0; i < 4; i++) { noise(t + i * 0.05, 0.05, 0.18, 900); tone(200 + i * 40, t + i * 0.05, 0.05, 'square', 0.05); } },
    buy: function (t) { tone(660, t, 0.08, 'square', 0.1); tone(880, t + 0.07, 0.08, 'square', 0.1); tone(1320, t + 0.14, 0.16, 'square', 0.09); },
    nope: function (t) { tone(200, t, 0.1, 'square', 0.08); tone(160, t + 0.08, 0.12, 'square', 0.08); },
    click: function (t) { tone(900 * (0.92 + Math.random() * 0.16), t, 0.03, 'square', 0.05); },   // a little different every time
    review: function (t) { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, t + i * 0.09, 0.18, 'square', 0.09); }); },
    card: function (t) { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, t + i * 0.05, 0.25, 'triangle', 0.1); }); },
    bump: function (t) { tone(300, t, 0.3, 'sawtooth', 0.06, 900); },
    wipe: function (t) { tone(880, t, 0.9, 'sawtooth', 0.12, 60); noise(t + 0.2, 0.7, 0.2, 2000); },
    boot: function (t) { [392, 523, 659].forEach(function (f, i) { tone(f, t + i * 0.12, 0.2, 'triangle', 0.1); }); },
    mail: function (t) { tone(988, t, 0.08, 'sine', 0.1); tone(1318, t + 0.09, 0.12, 'sine', 0.1); }
  };

  function play(name) {
    if (vol <= 0 || !SOUNDS[name]) return;
    var now = performance.now();
    if (last[name] && now - last[name] < 70) return; // don't stack the same sound
    last[name] = now;
    if (!ensure()) return;
    SOUNDS[name](ac.currentTime + 0.01);
  }

  return { play: play, setVolume: setVolume, unlock: ensure };
})();
