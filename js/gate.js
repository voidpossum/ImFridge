// I'M FRIDGE — the start screen with a password ("soda").
// Not security: it only stops people who stumble on the page from walking straight in.
// Once the password is typed, this browser remembers it. ?debug=1 skips the screen (for testing).
// © 2026 Void Possum. All rights reserved.

(function () {
  'use strict';
  var KEY = 'outoforder-gate', gate = document.getElementById('gate');
  if (!gate) return;
  var ok = false;
  try { ok = localStorage.getItem(KEY) === '1'; } catch (e) { /* storage blocked: ask every time */ }
  if (ok || /[?&]debug=1/.test(location.search)) { gate.remove(); return; }

  var ver = document.getElementById('gateVer');
  if (ver && typeof DATA !== 'undefined') ver.textContent = 'Version ' + DATA.version + ' · early test build';
  var input = document.getElementById('gatePass'), msg = document.getElementById('gateMsg');
  document.getElementById('gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value.trim().toLowerCase() === 'soda') {
      try { localStorage.setItem(KEY, '1'); } catch (err) { /* fine */ }
      gate.remove();
      var first = document.getElementById('nameIn') || document.querySelector('#modalBox .foot .primary');
      if (first) { first.focus(); if (first.select) first.select(); }
    } else {
      msg.textContent = 'That is not it. Ask Void Possum for the password.';
      input.select();
    }
  });
  input.focus();
})();
