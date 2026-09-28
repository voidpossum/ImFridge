// I'M FRIDGE — the game data wiki page (tools/wiki.html).
// Shows the sections from tools/describe.js. Every value with a dashed underline can be edited:
// edits and notes stay in this browser (localStorage), and "Export changes" makes a list to send.
// © 2026 Void Possum. All rights reserved.
(function () {
  'use strict';

  var EKEY = 'imfridge_wiki_edits', NKEY = 'imfridge_wiki_notes';
  var FILES = ['core.js', 'cards.js', 'rivals.js', 'story.js', 'machine.js', 'hardware.js', 'research.js', 'tree.js', 'news.js', 'side.js', 'chips.js'];
  var ORIG = JSON.parse(JSON.stringify(DATA));   // the game's values, never changed
  var src = {}, edits = load(EKEY), notes = load(NKEY), sections = [];
  var $ = function (id) { return document.getElementById(id); };

  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // **bold** in the overview texts
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

  // The data with your edits applied (so costs per level etc. update while you edit).
  function current() {
    var D = JSON.parse(JSON.stringify(ORIG));
    Object.keys(edits).forEach(function (p) { Wiki.set(D, p, edits[p].v); });
    return D;
  }

  // ── editing
  function editText(kind, v) {
    if (kind === 'money') return (v / 100).toFixed(2);
    if (kind === 'list') return (v || []).join(', ');
    return v == null ? '' : String(v);
  }
  function parse(kind, s) {
    s = s.replace(/ /g, ' ').trim();
    if (kind === 'text') return s;
    if (kind === 'list') {
      var parts = s.split(/[,;]\s*/).map(parseFloat);
      return parts.some(isNaN) ? undefined : parts;
    }
    var n = parseFloat(s.replace(/[$,\s]/g, ''));
    if (isNaN(n)) return undefined;
    return kind === 'money' ? Math.round(n * 100) : n;
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function cellHTML(c) {
    if (!c) return '';
    if (c.path) {
      var orig = Wiki.get(ORIG, c.path), changed = !!edits[c.path];
      return '<span class="ed ' + c.kind + (changed ? ' changed' : '') + '" contenteditable="true" spellcheck="' + (c.kind === 'text') + '" data-path="' + esc(c.path) +
        '" data-kind="' + c.kind + '" data-label="' + esc(c.label) + '"' + (changed ? ' title="' + esc('Was: ' + Wiki.show(c.kind, orig)) + '"' : '') + '>' + esc(Wiki.show(c.kind, c.v)) + '</span>';
    }
    if (c.icon) return typeof Icons !== 'undefined' ? Icons.img(c.icon) : '';
    var h = c.swatch ? '<span class="swatch" style="background:' + esc(c.swatch) + '"></span>' : '';
    h += c.color ? '<b style="color:' + esc(c.color) + '">' + esc(c.t) + '</b>' : c.name ? '<span class="nm">' + esc(c.t) + '</span>' : esc(c.t);
    if (c.sub) h += '<span class="sub">value: ' + cellHTML(c.sub) + '</span>';
    if (c.subs) h += '<span class="sub">values: ' + c.subs.map(cellHTML).join(' · ') + '</span>';
    return h;
  }
  function tdHTML(c) { return '<td' + (c && c.small ? ' class="small"' : '') + '>' + cellHTML(c) + '</td>'; }

  function blockHTML(b) {
    if (b.type === 'text') return '<p class="txt">' + rich(b.text) + '</p>';
    return '<h3>' + esc(b.title) + '</h3><div class="tw"><table><thead><tr>' + b.cols.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      b.rows.map(function (r) { return '<tr>' + r.map(tdHTML).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      (b.note ? '<p class="note">' + esc(b.note) + '</p>' : '');
  }

  function render() {
    var y = window.scrollY;
    sections = Wiki.build(current(), src);
    var n = Object.keys(edits).length;
    $('nEd').textContent = n;
    $('nav').innerHTML = sections.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.title) + '</a>'; }).join('') +
      '<p class="help">Values with a dashed line can be edited. Changed values turn yellow (hover to see the old value). ' +
      'Your edits and notes stay in this browser. When you are happy, press <b>Export changes</b> and send the list.</p>';
    $('main').innerHTML = (Object.keys(src).length ? '' : '<p class="banner">Opened as a file: the explanations from the data files are missing. Open it from the game (Konami code) or from the website to see them.</p>') +
      sections.map(function (s) {
        return '<section id="' + s.id + '"><h2>' + esc(s.title) + '</h2>' + (s.intro ? '<p class="intro">' + esc(s.intro) + '</p>' : '') +
          s.blocks.map(blockHTML).join('') +
          '<textarea class="notes" data-sec="' + s.id + '" placeholder="My notes about ' + esc(s.title.toLowerCase()) + '… (saved in this browser, included in the export)">' + esc(notes[s.id] || '') + '</textarea></section>';
      }).join('');
    filter();
    window.scrollTo(0, y);
  }

  // Focus: show the raw editable value ($ → plain dollars). Leave: check it, store it, redraw.
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('ed')) return;
    el.textContent = editText(el.dataset.kind, Wiki.get(current(), el.dataset.path));
    var r = document.createRange(); r.selectNodeContents(el);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  });
  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('ed')) return;
    var path = el.dataset.path, kind = el.dataset.kind, v = parse(kind, el.textContent), orig = Wiki.get(ORIG, path);
    if (v === undefined || (kind === 'text' && !v)) { render(); return; }   // not a valid value: back to what it was
    if (same(v, orig)) delete edits[path];
    else edits[path] = { v: v, label: el.dataset.label, kind: kind };
    save(EKEY, edits);
    render();
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('ed')) return;
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') { el.textContent = editText(el.dataset.kind, Wiki.get(current(), el.dataset.path)); el.blur(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('notes')) {
      var id = e.target.dataset.sec;
      if (e.target.value.trim()) notes[id] = e.target.value; else delete notes[id];
      save(NKEY, notes);
    }
  });
  // Pasting into a value: plain text only.
  document.addEventListener('paste', function (e) {
    if (!e.target.classList || !e.target.classList.contains('ed')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' '));
  });

  // ── search: hide rows, tables and sections that do not match
  function filter() {
    var q = $('q').value.trim().toLowerCase();
    document.querySelectorAll('#main section').forEach(function (sec) {
      var any = !q || sec.querySelector('h2').textContent.toLowerCase().indexOf(q) >= 0;
      var whole = any && !!q;
      sec.querySelectorAll('.tw').forEach(function (tw) {
        var shown = 0;
        tw.querySelectorAll('tbody tr').forEach(function (tr) {
          var ok = !q || whole || tr.textContent.toLowerCase().indexOf(q) >= 0;
          tr.classList.toggle('hide', !ok);
          if (ok) shown++;
        });
        var h3 = tw.previousElementSibling, note = tw.nextElementSibling;
        var titleHit = q && h3 && h3.textContent.toLowerCase().indexOf(q) >= 0;
        if (titleHit) { tw.querySelectorAll('tbody tr').forEach(function (tr) { tr.classList.remove('hide'); }); shown = 1; }
        tw.classList.toggle('hide', !shown); if (h3) h3.classList.toggle('hide', !shown);
        if (note && note.classList.contains('note')) note.classList.toggle('hide', !shown);
        if (shown) any = true;
      });
      sec.querySelectorAll('p.txt, p.intro').forEach(function (p) {
        var ok = !q || p.textContent.toLowerCase().indexOf(q) >= 0;
        p.classList.toggle('hide', !ok);
        if (ok && q) any = true;
      });
      sec.classList.toggle('hide', !any);
    });
  }
  $('q').addEventListener('input', filter);

  // ── export, undo, document
  function exportText() {
    var keys = Object.keys(edits), L = [];
    L.push("I'm Fridge — changes from the game data wiki");
    L.push('Game version ' + DATA.version + ' · ' + new Date().toISOString().slice(0, 10));
    L.push('');
    L.push('Changes (' + keys.length + '):');
    if (!keys.length) L.push('(none)');
    keys.forEach(function (p) {
      var e = edits[p], o = Wiki.get(ORIG, p);
      L.push('- ' + e.label + ': ' + Wiki.show(e.kind, o) + ' → ' + Wiki.show(e.kind, e.v) +
             '   [' + Wiki.fileOf(p) + ': ' + p + ' ' + JSON.stringify(o) + ' → ' + JSON.stringify(e.v) + ']');
    });
    var nk = Object.keys(notes);
    if (nk.length) {
      L.push('');
      L.push('Notes:');
      sections.forEach(function (s) { if (notes[s.id]) L.push('[' + s.title + '] ' + notes[s.id].trim()); });
    }
    return L.join('\n');
  }
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  $('bExport').onclick = function () { $('mText').value = exportText(); $('modal').classList.remove('hide'); };
  $('mClose').onclick = function () { $('modal').classList.add('hide'); };
  $('mCopy').onclick = function () {
    $('mText').select();
    if (navigator.clipboard) navigator.clipboard.writeText($('mText').value).catch(function () { document.execCommand('copy'); });
    else document.execCommand('copy');
    $('mCopy').textContent = 'Copied!'; setTimeout(function () { $('mCopy').textContent = 'Copy'; }, 1500);
  };
  $('mSave').onclick = function () { download('imfridge-changes-' + DATA.version + '.txt', $('mText').value, 'text/plain'); };
  $('bUndo').onclick = function () {
    var n = Object.keys(edits).length;
    if (!n) return;
    if (!confirm('Undo all ' + n + ' changes? (Your notes stay.)')) return;
    edits = {}; save(EKEY, edits); render();
  };
  // One HTML file with everything (the values as they are now, your changes marked), for reading offline or printing.
  $('bDoc').onclick = function () {
    var css = document.querySelector('style').textContent;
    var body = $('main').cloneNode(true);
    body.querySelectorAll('[contenteditable]').forEach(function (el) { el.removeAttribute('contenteditable'); });
    body.querySelectorAll('textarea.notes').forEach(function (t) {
      if (!t.value.trim()) { t.remove(); return; }
      var p = document.createElement('p'); p.className = 'banner'; p.textContent = 'My notes: ' + t.value; t.replaceWith(p);
    });
    body.querySelectorAll('.hide').forEach(function (el) { el.classList.remove('hide'); });
    download('imfridge-game-data-' + DATA.version + '.html',
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>I\'m Fridge — game data ' + DATA.version + '</title><style>' + css +
      ' main{padding:16px 24px} .ed{border-bottom:0}</style></head><body><header><h1>I\'m Fridge — game data <small>version ' + DATA.version +
      (Object.keys(edits).length ? ' · ' + Object.keys(edits).length + ' changes marked in yellow' : '') + '</small></h1></header><main>' + body.innerHTML +
      '</main><p class="note" style="padding:0 24px 24px">© 2026 Void Possum. All rights reserved.</p></body></html>', 'text/html');
  };

  // Highlight the section you are reading in the sidebar.
  window.addEventListener('scroll', function () {
    var top = null;
    document.querySelectorAll('#main section').forEach(function (s) { if (s.getBoundingClientRect().top < 120) top = s.id; });
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + top); });
  });

  // Start: read the data files' text (for their comments), then draw. Opened as a file, fetch fails: draw without them.
  $('ver').textContent = 'version ' + DATA.version;
  Promise.all(FILES.map(function (f) {
    return fetch('../js/data/' + f, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(f); return r.text(); }).then(function (t) { src[f] = t; });
  })).catch(function () { src = {}; }).then(function () {
    render();
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
  });
})();
