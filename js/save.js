// I'M FRIDGE — saving and loading.
// The game saves itself every 10 seconds, when you switch tabs, and when you close the page.
// © 2026 Void Possum. All rights reserved.

var Save = (function () {
  'use strict';
  var KEY = 'outoforder_save';
  var SET_KEY = 'outoforder_settings';
  var resetting = false;   // stops the "save on close" from undoing a reset

  function store() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function load() {
    var ls = store();
    if (!ls) return null;
    try {
      var raw = ls.getItem(KEY);
      return raw ? Engine.deserialize(raw) : null;
    } catch (e) {
      // Keep the broken save aside instead of throwing it away.
      try { ls.setItem(KEY + '_broken_' + Date.now(), ls.getItem(KEY)); } catch (e2) {}
      return null;
    }
  }

  function save(S) {
    if (resetting || !S) return false;
    var ls = store();
    if (!ls) return false;
    try { ls.setItem(KEY, Engine.serialize(S)); return true; } catch (e) { return false; }
  }

  function exportFile(S) {
    var blob = new Blob([Engine.serialize(S)], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = 'out-of-order-save-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function importFile(file, done) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var S = Engine.deserialize(String(r.result));
        done(null, S);
      } catch (e) { done("That file is not an I'm Fridge save."); }
    };
    r.onerror = function () { done('Could not read that file.'); };
    r.readAsText(file);
  }

  function reset() {
    resetting = true;
    var ls = store();
    if (ls) try { ls.removeItem(KEY); } catch (e) {}
    location.reload();
  }

  function loadSettings() {
    var def = { volume: 0.6, reduced: false, textSize: 'm' };
    var ls = store();
    if (!ls) return def;
    try { var o = JSON.parse(ls.getItem(SET_KEY) || '{}'); for (var k in o) def[k] = o[k]; } catch (e) {}
    return def;
  }

  function saveSettings(o) {
    var ls = store();
    if (ls) try { ls.setItem(SET_KEY, JSON.stringify(o)); } catch (e) {}
  }

  return { load: load, save: save, exportFile: exportFile, importFile: importFile, reset: reset,
           loadSettings: loadSettings, saveSettings: saveSettings,
           isResetting: function () { return resetting; } };
})();
