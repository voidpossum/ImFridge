// OUT OF ORDER — play stats report.
// Reads an exported save file and prints how the game was played: one line per quarter, then the event timeline.
// Run:  node tools/stats.js path/to/out-of-order-save.json
// The stats live only in the save file on the player's computer. Nothing is ever sent anywhere.
// © 2026 Void Possum. All rights reserved.

'use strict';
var fs = require('fs');

var file = process.argv[2];
if (!file) { console.log('Usage: node tools/stats.js <save.json>'); process.exit(1); }
var o = JSON.parse(fs.readFileSync(file, 'utf8'));
var st = o.meta && o.meta.stats;
if (!st) { console.log('This save has no play stats (it is older than save version 3).'); process.exit(0); }

function mmss(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
function pad(v, n) { v = String(v == null ? '-' : v); while (v.length < n) v = ' ' + v; return v; }

console.log('Save version ' + o.v + ' · play time ' + mmss(o.meta.playTime) + ' · runs ' + o.meta.runs + ' · resets ' + o.meta.wipes);
console.log('\nSessions:');
st.sessions.forEach(function (s) { console.log('  ' + s.start + '  ' + mmss(s.len) + '  window ' + s.w + '×' + s.h + ' @' + s.dpr + 'x'); });

console.log('\nQuarters:');
console.log('  run  q   time  clicks/s best10  price split   you   left  right rank  cash   pps res wait fps low gold hacks');
st.q.forEach(function (q) {
  console.log('  ' + pad(q.run, 3) + pad(q.q, 3) + pad(mmss(q.t), 7) + pad(q.cps, 9) + pad(q.best10, 7) + pad(q.price, 7) + pad(q.split, 6) +
              pad(Math.round(q.sales[1]), 6) + pad(Math.round(q.sales[0]), 7) + pad(Math.round(q.sales[2]), 7) +
              pad(q.rank + (q.lost ? '!' : ''), 5) + pad(q.cash, 6) + pad(q.pps, 6) + pad(q.research, 4) + pad(q.waiting, 5) +
              pad(q.fps, 4) + pad(q.fpsLow, 4) + pad(q.gold, 5) + pad(q.hacks, 6));
  var th = Object.keys(q.thoughts || {}).map(function (k) { return k + ' ' + q.thoughts[k]; }).join(', ');
  var rv = (q.rivals || []).map(function (r) { return r.id + ' ×' + r.str + (r.feature ? ' [' + r.feature + ']' : ''); }).join(', ');
  console.log('        thoughts: ' + (th || '-') + ' | rivals: ' + rv);
});

console.log('\nMenu tabs opened:');
console.log('  ' + (Object.keys(st.tabs).map(function (k) { return k + ' ' + st.tabs[k]; }).join(', ') || '-'));

console.log('\nEvents (time, kind, details):');
st.ev.forEach(function (e) { console.log('  ' + pad(mmss(e[0]), 6) + '  ' + e.slice(1).join(' ')); });
