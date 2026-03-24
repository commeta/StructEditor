/*
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  StructEditor v1.0 — MODX Revolution 2.8                           ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Установка: плагин на событие OnManagerPageBeforeRender              ║
 * ║    $modx->controller->addJavascript('/assets/theme/editor.js');      ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ╚══════════════════════════════════════════════════════════════════════╝
 * https://github.com/commeta/StructEditor
 *
 * Copyright 2026 commeta <dcs-spb@ya.ru>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */

(function (W, D) {
  'use strict';

  /* ════════ ЦВЕТА ════════ */
  var C = {
    panelBg: '#DFE8F6', panelBg2: '#C9D9E8',
    border: '#99BBE8', borderSub: '#D0D8E4',
    workBg: '#f0f4f8', cardBg: '#FFFFFF',
    textMain: '#1a1a1a', textMuted: '#555555', textFaded: '#8a8a8a',
    accent: '#3076be', accentDk: '#265f99',
    accentBg: '#e8f0fb', accentBdr: '#9bbce8',
    btnBg: '#FFFFFF', btnBdr: '#9bbce8', btnHov: '#e8f0fb',
    btnTxt: '#1a1a1a',
    inputBg: '#FFFFFF', inputBdr: '#b0b8c8', inputFoc: '#3076be',
    warnBg: '#FFFBE6', warnBdr: '#f0c040', warnTxt: '#7a5800',
    infoBg: '#E8F0FB', infoBdr: '#9bbce8', infoTxt: '#1a4070',
    srcBg: '#1E1E2E', srcFg: '#CDD6F4',
    changed: '#c05a00',
    fmtBg: '#EBF2FF', fmtSep: '#C9D9E8',
    dangerBg: '#FFF0F0', dangerBdr: '#FFAAAA', dangerTxt: '#CC2222',
    successBg: '#F0FFF4', successBdr: '#88CC88', successTxt: '#226622',
  };

  /* ════════ КОНФИГ ════════ */
  var CFG = {
    TA_SELECTORS: [
      '[id^="modx-resource-content"]',
      'textarea[name="content"]',
      '.x-form-el-ta textarea',
      '.x-form-el textarea[name="content"]',
      '#modx-resource-content',
    ],
    POLL_MS: 250,
    POLL_MAX: 160,
    MARK: 'data-sev8',
    PH_ATTR: 'data-sev8ph',

    /*
     * TEXT_TAGS — содержимое (innerHTML) редактируется через textarea.
     */
    TEXT_TAGS: {
      h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1,
      p: 1, li: 1, dt: 1, dd: 1, figcaption: 1, blockquote: 1,
      th: 1, td: 1, caption: 1, label: 1,
      address: 1, pre: 1, summary: 1,
    },

    /*
     * ATTR_MAP — атрибуты, отображаемые в полях.
     */
    ATTR_MAP: {
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'width', 'height', 'title', 'loading', 'decoding'],
      video: ['src', 'poster', 'width', 'height', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
      audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
      source: ['src', 'type', 'media'],
      track: ['src', 'kind', 'label', 'srclang', 'default'],
      iframe: ['src', 'title', 'width', 'height', 'loading', 'allow'],
      embed: ['src', 'type', 'width', 'height'],
      object: ['data', 'type', 'width', 'height', 'name'],
      form: ['action', 'method', 'enctype', 'name'],
      button: ['type', 'name', 'value', 'form'],
      time: ['datetime'],
      data: ['value'],
    },

    /*
     * Теги, у которых есть и innerHTML-текст, и атрибуты → тип 'both', 'a', 'button'.
     */
    ATTR_HAS_TEXT: { a: 1, button: 1, time: 1, data: 1 },

    /*
     * Атрибуты, показываемые всегда (даже если отсутствуют в DOM).
     * Для <a> href обязателен.
     */
    ATTR_ALWAYS: {
      a: { href: 1, target: 1 },
    },

    /*
     * LEAF_CONTAINERS — div/span/small/big + inline-контейнеры:
     * редактируются как текст если нет вложенных редактируемых потомков.
     */
    LEAF_CONTAINERS: { div: 1, span: 1, small: 1, big: 1 },
    LEAF_MIN_CH: 2,

    /* Теги, пропускаемые при обходе DOM. */
    SKIP: {
      script: 1, style: 1, meta: 1, link: 1, noscript: 1,
      br: 1, hr: 1, wbr: 1, svg: 1, input: 1, select: 1,
      textarea: 1, option: 1, optgroup: 1, template: 1,
      canvas: 1, picture: 1, 'sev8-ph': 1,
    },

    MAX_DEPTH: 40,
    HISTORY_DB: 'sev8history',
    HISTORY_STORE: 'snapshots',
    HISTORY_MAX: 50,
  };

  /* ════════ СОСТОЯНИЕ ════════ */
  var S = {
    aceMode: false, ace: null, aceEl: null,
    nativeTa: null,
    doc: null, map: {}, idx: 0,
    rootEl: null, mounted: false,
    noSync: false, curIframe: null,
    fsMode: false, fsOrigCss: '',
    cardsEl: null, treeMode: false,
    rawHtml: '', tokens: [],
    srcTa: null, activeTab: 'struct',
    fmtBar: null, fmtTarget: null,
    histDb: null, histPos: -1,
    histStack: [], histKey: '', histBusy: false,
    undoBtn: null, redoBtn: null,
  };

  /* ════════ УТИЛИТЫ ════════ */
  var L = W.console ? function (m) { console.log('[SEv15] ' + m); } : function () { };

  function mk(tag, p, kids) {
    var e = D.createElement(tag);
    if (p) for (var k in p) {
      if (k === 'cls') e.className = p[k];
      else if (k === 'css') e.style.cssText = p[k];
      else if (k === 'html') e.innerHTML = p[k];
      else if (k === 'txt') e.textContent = p[k];
      else e.setAttribute(k, p[k]);
    }
    if (kids) kids.forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? D.createTextNode(c) : c);
    });
    return e;
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function simpleHash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  /* ════════ ИСТОРИЯ (IndexedDB) ════════ */
  function histOpen(cb) {
    if (!W.indexedDB) { cb(null); return; }
    var req = W.indexedDB.open(CFG.HISTORY_DB, 1);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(CFG.HISTORY_STORE))
        db.createObjectStore(CFG.HISTORY_STORE, { keyPath: 'key' });
    };
    req.onsuccess = function (e) { cb(e.target.result); };
    req.onerror = function () { cb(null); };
  }

  function histLoad(db, key, currentHtml, cb) {
    if (!db) { cb([], -1); return; }
    var req = db.transaction(CFG.HISTORY_STORE, 'readonly')
      .objectStore(CFG.HISTORY_STORE).get(key);
    req.onsuccess = function (e) {
      var rec = e.target.result;
      if (!rec || !rec.stack || !rec.stack.length) { cb([], -1); return; }
      if (rec.hash && rec.hash !== simpleHash(currentHtml)) {
        L('История инвалидирована: внешнее изменение документа');
        cb([], -1); return;
      }
      cb(rec.stack, rec.pos);
    };
    req.onerror = function () { cb([], -1); };
  }

  function histSave(db, key, stack, pos) {
    if (!db || !stack.length) return;
    db.transaction(CFG.HISTORY_STORE, 'readwrite')
      .objectStore(CFG.HISTORY_STORE)
      .put({
        key: key, stack: stack, pos: pos,
        hash: simpleHash(stack[stack.length - 1])
      });
  }

  function histPush(html) {
    if (S.histBusy) return;
    S.histStack = S.histStack.slice(0, S.histPos + 1);
    if (S.histStack.length && S.histStack[S.histStack.length - 1] === html) return;
    S.histStack.push(html);
    if (S.histStack.length > CFG.HISTORY_MAX)
      S.histStack = S.histStack.slice(S.histStack.length - CFG.HISTORY_MAX);
    S.histPos = S.histStack.length - 1;
    histSave(S.histDb, S.histKey, S.histStack, S.histPos);
    histUpdateBtns();
  }

  function histUndo() {
    if (S.histPos <= 0) return;
    S.histPos--;
    histApply(S.histStack[S.histPos]);
    histSave(S.histDb, S.histKey, S.histStack, S.histPos);
  }

  function histRedo() {
    if (S.histPos >= S.histStack.length - 1) return;
    S.histPos++;
    histApply(S.histStack[S.histPos]);
    histSave(S.histDb, S.histKey, S.histStack, S.histPos);
  }

  function histApply(html) {
    S.histBusy = true;
    S.rawHtml = html;
    writeHTML(html);
    parseAndMark(html);
    if (S.srcTa) S.srcTa.value = html;
    if (S.activeTab === 'visual' && S.curIframe) {
      renderVFrame(S.curIframe);
    } else if (S.activeTab === 'struct' && S.cardsEl) {
      S.cardsEl.innerHTML = '';
      if (S.treeMode) buildTreeView2(S.cardsEl);
      else { S.cardsEl.style.padding = '8px 10px 24px'; fillCards(S.cardsEl); }
    }
    S.histBusy = false;
    histUpdateBtns();
    setStatus('Восстановлено ✓', 1800);
  }

  function histUpdateBtns() {
    if (S.undoBtn) S.undoBtn.disabled = (S.histPos <= 0);
    if (S.redoBtn) S.redoBtn.disabled = (S.histPos >= S.histStack.length - 1);
  }

  function histGetKey() {
    var m = W.location.href.match(/[?&]id=(\d+)/);
    return 'res_' + (m ? m[1] : 'unknown');
  }

  /* ════════ ТОКЕНЫ ════════ */
  var TOKEN_PATTERNS = [
    /<!--[\s\S]*?-->/g,
    /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi,
    /<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi,
    /<noscript(?:\s[^>]*)?>[\s\S]*?<\/noscript>/gi,
    /<template(?:\s[^>]*)?>[\s\S]*?<\/template>/gi,
    /<svg(?:\s[^>]*)?>[\s\S]*?<\/svg>/gi,
    /<math(?:\s[^>]*)?>[\s\S]*?<\/math>/gi,
    /<(?:meta|link|base)(?:\s[^>]*)?\/?>/gi,
    /<\?(?:php|=)?[\s\S]*?\?>/gi,
  ];

  function tokenize(html) {
    S.tokens = [];
    var used = new Uint8Array(html.length);
    var matches = [];
    TOKEN_PATTERNS.forEach(function (re) {
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(html)) !== null) {
        var overlap = false;
        for (var i = m.index; i < m.index + m[0].length; i++)
          if (used[i]) { overlap = true; break; }
        if (!overlap) {
          matches.push({ index: m.index, length: m[0].length, text: m[0] });
          for (var j = m.index; j < m.index + m[0].length; j++) used[j] = 1;
        }
        re.lastIndex = m.index + 1;
      }
    });
    if (!matches.length) return html;
    matches.sort(function (a, b) { return a.index - b.index; });
    var result = html;
    for (var i = matches.length - 1; i >= 0; i--) {
      var match = matches[i];
      result = result.substring(0, match.index) +
        '\x00SEVPH' + i + '\x00' +
        result.substring(match.index + match.length);
    }
    S.tokens = matches.map(function (m) { return m.text; });
    result = result.replace(/\x00SEVPH(\d+)\x00/g, function (_, idx) {
      return '<div ' + CFG.PH_ATTR + '="' + idx + '"></div>';
    });
    return result;
  }

  function detokenize(html) {
    if (!S.tokens.length) return html;
    var pat = '<div[^>]*\\b' + CFG.PH_ATTR + '="(\\d+)"[^>]*>\\s*<\\/div>' +
      '|<div[^>]*\\b' + CFG.PH_ATTR + '="(\\d+)"[^>]*/>';
    return html.replace(new RegExp(pat, 'g'), function (_, a, b) {
      var i = parseInt(a !== undefined ? a : b, 10);
      return (i >= 0 && i < S.tokens.length) ? S.tokens[i] : '';
    });
  }

  /* ════════ ЧТЕНИЕ / ЗАПИСЬ HTML ════════ */
  function writeHTML(html) {
    if (S.ace && S.aceMode) {
      try { S.noSync = true; S.ace.setValue(html, -1); S.noSync = false; }
      catch (e) { S.noSync = false; }
    }
    if (S.nativeTa) {
      S.nativeTa.value = html;
      try {
        S.nativeTa.dispatchEvent(new Event('change', { bubbles: true }));
        S.nativeTa.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (e) { }
    }
  }

  /* ════════ ПАРСИНГ И МАРКИРОВКА ════════ */
  function parseAndMark(html) {
    var safe = tokenize(html);
    S.doc = (new DOMParser()).parseFromString(safe, 'text/html');
    S.map = {}; S.idx = 0;
    walkMark(S.doc.body, 0);
  }

  function loadFromRaw() { parseAndMark(S.rawHtml); }

  function hasEditableDescendant(node) {
    for (var i = 0; i < node.children.length; i++) {
      var c = node.children[i];
      var ct = c.tagName.toLowerCase();
      if (CFG.SKIP[ct] || c.hasAttribute(CFG.PH_ATTR)) continue;
      if (CFG.TEXT_TAGS[ct] || CFG.ATTR_MAP[ct]) return true;
      if (CFG.LEAF_CONTAINERS[ct] &&
        (c.textContent || '').trim().length >= CFG.LEAF_MIN_CH) return true;
      if (hasEditableDescendant(c)) return true;
    }
    return false;
  }

  /*
   * walkMark — рекурсивный обход DOM.
   *
   */
  function walkMark(node, depth) {
    if (depth > CFG.MAX_DEPTH || !node || node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (CFG.SKIP[tag] || node.hasAttribute(CFG.PH_ATTR)) return;

    var isText = !!CFG.TEXT_TAGS[tag];
    var isAttr = !!CFG.ATTR_MAP[tag];
    var isLeaf = !!CFG.LEAF_CONTAINERS[tag];

    if (isText) {
      /* Если внутри есть дочерний text-тег — спускаемся глубже */
      var hasTextKid = false;
      (function chk(n) {
        for (var i = 0; i < n.children.length && !hasTextKid; i++) {
          var c = n.children[i];
          if (CFG.TEXT_TAGS[c.tagName.toLowerCase()]) { hasTextKid = true; return; }
          chk(c);
        }
      })(node);
      if (!hasTextKid) {
        var id = 'n' + (++S.idx);
        node.setAttribute(CFG.MARK, id);
        S.map[id] = {
          node: node, tag: tag,
          type: isAttr ? 'both' : 'text',
          attrs: isAttr ? CFG.ATTR_MAP[tag] : null
        };
        return;
      }
      for (var i = 0; i < node.children.length; i++) walkMark(node.children[i], depth + 1);
      return;
    }

    if (isAttr) {
      if (!hasEditableDescendant(node)) {
        var id2 = 'n' + (++S.idx);
        node.setAttribute(CFG.MARK, id2);

        var hasBody = !!CFG.ATTR_HAS_TEXT[tag] &&
          (node.textContent || '').trim().length > 0;
        S.map[id2] = {
          node: node, tag: tag,
          type: hasBody ? 'both' : 'attrs',
          attrs: CFG.ATTR_MAP[tag]
        };
        return;
      }
      for (var j = 0; j < node.children.length; j++) walkMark(node.children[j], depth + 1);
      return;
    }

    if (isLeaf) {
      var txt = (node.textContent || '').trim();
      if (txt.length >= CFG.LEAF_MIN_CH && !hasEditableDescendant(node)) {
        var id3 = 'n' + (++S.idx);
        node.setAttribute(CFG.MARK, id3);
        S.map[id3] = { node: node, tag: tag, type: 'text', attrs: null };
        return;
      }
    }

    for (var k = 0; k < node.children.length; k++) walkMark(node.children[k], depth + 1);
  }

  function serialize() {
    if (!S.doc) return S.rawHtml || '';
    var clone = S.doc.body.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('[' + CFG.MARK + ']'), function (n) {
      n.removeAttribute(CFG.MARK);
    });
    Array.prototype.forEach.call(clone.querySelectorAll('*'), function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        if (/^data-sev/.test(a.name) && a.name !== CFG.PH_ATTR)
          n.removeAttribute(a.name);
      });
    });
    return detokenize(clone.innerHTML);
  }

  function syncNow() {
    if (!S.doc) return;
    var html = serialize();
    S.rawHtml = html;
    writeHTML(html);
    if (S.srcTa) S.srcTa.value = html;
    histPush(html);
    setStatus('Синхронизировано ✓', 2000);
  }
  var lazySync = debounce(syncNow, 600);

  /* ════════ ПОИСК НАТИВНОГО TEXTAREA ════════ */
  function findNativeTextarea() {
    for (var i = 0; i < CFG.TA_SELECTORS.length; i++) {
      var sel = CFG.TA_SELECTORS[i];
      try {
        var el = D.querySelector(sel);
        if (el && el.tagName === 'TEXTAREA') {
          L('Нативный textarea: selector="' + sel + '" id="' + el.id + '"');
          return el;
        }
        if (el) {
          var ta = el.querySelector('textarea');
          if (ta) { L('Нативный textarea (в контейнере): id="' + ta.id + '"'); return ta; }
        }
      } catch (e) { }
    }
    var all = D.querySelectorAll('textarea');
    for (var j = 0; j < all.length; j++) {
      var t = all[j];
      if (parseInt(t.getAttribute('rows') || '0', 10) >= 10 ||
        t.value.length > 50 ||
        t.classList.contains('x-form-textarea')) {
        L('Нативный textarea (fallback): id="' + t.id + '"');
        return t;
      }
    }
    return null;
  }

  /* ════════ ACE ════════ */
  function resolveAce(div) {
    if (W.ace) { try { return W.ace.edit(div); } catch (e) { } }
    if (div.env && div.env.editor) return div.env.editor;
    if (div.aceEditor) return div.aceEditor;
    if (W.Ext && Ext.ComponentMgr) {
      var found = null;
      Ext.ComponentMgr.all.each(function (c) {
        if (found) return;
        try {
          var ed = c.editor || c.ace || (c.getEditor && c.getEditor());
          if (ed && ed.getValue) found = ed;
        } catch (e) { }
      });
      if (found) return found;
    }
    return null;
  }

  /* ════════ УТИЛИТЫ ДЕРЕВА DOM ════════ */
  function findSections(body) {
    var secs = [];
    (function walk(n) {
      if (!n || n.nodeType !== 1) return;
      if (/^(section|article|header|footer|main|nav|aside)$/
        .test(n.tagName.toLowerCase())) { secs.push(n); return; }
      for (var i = 0; i < n.children.length; i++) walk(n.children[i]);
    })(body);
    return secs.length ? secs : [body];
  }

  function secTitle(n) {
    var h = n.querySelector('h1,h2,h3,h4');
    if (h) return (h.textContent || '').trim().substring(0, 50) ||
      '<' + n.tagName.toLowerCase() + '>';
    var cls = (n.className || '').trim().split(/\s+/)
      .filter(function (c) { return c.length > 1; }).slice(0, 2).join(' ');
    return cls || '<' + n.tagName.toLowerCase() + '>';
  }

  function nodePathStr(node) {
    var parts = [], cur = node.parentElement, lim = 4;
    while (cur && cur !== S.doc.body && lim-- > 0) {
      var t = cur.tagName.toLowerCase();
      var c = (cur.className || '').trim().split(/\s+/).slice(0, 1).join('');
      parts.unshift(c ? t + '.' + c : t);
      cur = cur.parentElement;
    }
    return parts.join(' › ');
  }

  function prevElSib(n) {
    var s = n.previousSibling;
    while (s && s.nodeType !== 1) s = s.previousSibling;
    return s;
  }
  function nextElSib(n) {
    var s = n.nextSibling;
    while (s && s.nodeType !== 1) s = s.nextSibling;
    return s;
  }

  /* ════════ CSS ════════ */
  function injectCSS() {
    if (D.getElementById('sev8-css')) return;
    var s = D.createElement('style');
    s.id = 'sev8-css';
    s.textContent = [
      '#sev8{display:flex;flex-direction:column;border:1px solid ', C.border, ';border-radius:4px;',
      'font-family:"Helvetica Neue",Arial,Tahoma,sans-serif;font-size:12px;',
      'color:', C.textMain, ';background:', C.workBg, ';overflow:hidden;',
      'box-shadow:0 2px 8px rgba(0,0,0,.10);}',
      '#sev8-tb{display:flex;align-items:center;flex-wrap:wrap;',
      'background:linear-gradient(180deg,', C.panelBg, ' 0%,', C.panelBg2, ' 100%);',
      'border-bottom:1px solid ', C.border, ';padding:0;flex-shrink:0;}',
      '.sev8-tb-toprow{display:flex;align-items:center;flex-wrap:nowrap;flex-shrink:0;width:100%;}',
      '.sev8-tb-toprow > .sev8-tb-group:last-child{margin-left:auto;}',
      '.sev8-tb-group{display:flex;align-items:center;gap:1px;padding:4px 6px;border-right:1px solid ', C.fmtSep, ';}',
      '.sev8-tb-group:last-child{border-right:none;}',
      '#sev8-logo{font-size:11px;font-weight:bold;color:', C.accentDk, ';padding:4px 10px;white-space:nowrap;}',
      '.sev8-tab{padding:5px 13px;border:1px solid transparent;border-radius:3px 3px 0 0;',
      'cursor:pointer;font-size:12px;font-family:inherit;background:transparent;color:', C.textMuted, ';',
      'white-space:nowrap;margin-bottom:-1px;border-bottom:none;transition:background .12s,color .12s;}',
      '.sev8-tab:hover{background:', C.btnHov, ';color:', C.textMain, ';}',
      '.sev8-tab.active{background:', C.workBg, ';color:', C.accent, ';',
      'border-color:', C.border, ' ', C.border, ' ', C.workBg, ';font-weight:600;}',
      '#sev8-st{font-size:11px;color:', C.changed, ';opacity:0;transition:opacity .25s;white-space:nowrap;padding:0 8px;}',
      '#sev8-st.on{opacity:1;}',
      '.sev8-btn{padding:3px 10px;border:1px solid ', C.btnBdr, ';border-radius:3px;cursor:pointer;',
      'font-size:12px;font-family:inherit;background:', C.btnBg, ';color:', C.btnTxt, ';white-space:nowrap;',
      'transition:background .1s,border-color .1s;}',
      '.sev8-btn:hover{background:', C.btnHov, ';border-color:', C.accentBdr, ';}',
      '.sev8-btn:disabled{opacity:.45;cursor:default;}',
      '.sev8-btn.primary{background:', C.accent, ';color:#fff;border-color:', C.accentDk, ';}',
      '.sev8-btn.primary:hover{background:', C.accentDk, ';}',
      '.sev8-btn.warn{background:', C.warnBg, ';border-color:', C.warnBdr, ';color:', C.warnTxt, ';}',
      '.sev8-btn.warn:hover{background:#FFE69C;}',
      '.sev8-btn.danger:hover{background:', C.dangerBg, ';border-color:', C.dangerBdr, ';color:', C.dangerTxt, ';}',
      '#sev8-area{flex:1;overflow:hidden;display:flex;flex-direction:column;background:', C.workBg, ';}',
      '.sev8-bar{padding:5px 12px;font-size:11px;flex-shrink:0;display:flex;align-items:center;gap:8px;',
      'border-bottom:1px solid ', C.borderSub, ';}',
      '.sev8-bar.warn{background:', C.warnBg, ';color:', C.warnTxt, ';border-color:', C.warnBdr, ';}',
      '.sev8-bar.info{background:', C.infoBg, ';color:', C.infoTxt, ';border-color:', C.infoBdr, ';}',
      '.sev8-bar-txt{flex:1;}',
      '#sev8-fmtrow{display:flex;align-items:center;flex-wrap:wrap;gap:1px;padding:3px 6px;',
      'border-top:1px solid ', C.fmtSep, ';background:', C.fmtBg, ';flex-shrink:0;',
      'transition:opacity .18s;width:100%;box-sizing:border-box;}',
      '#sev8-fmtrow.dimmed{opacity:.38;pointer-events:none;}',
      '#sev8-fmt-label{font-size:10px;color:', C.textFaded, ';font-weight:600;letter-spacing:.04em;',
      'padding:0 4px;border-right:1px solid ', C.fmtSep, ';margin-right:4px;',
      'text-transform:uppercase;white-space:nowrap;flex-shrink:0;}',
      '.sev8-fbsep{width:1px;height:18px;background:', C.fmtSep, ';margin:0 5px;flex-shrink:0;}',
      '.sev8-fb{min-width:26px;height:24px;padding:0 5px;border:1px solid ', C.btnBdr, ';',
      'border-radius:3px;cursor:pointer;font-size:12px;font-family:inherit;background:', C.btnBg, ';',
      'color:', C.textMain, ';transition:background .08s,border-color .08s;',
      'display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1;}',
      '.sev8-fb:hover{background:', C.btnHov, ';border-color:', C.accentBdr, ';}',
      '.sev8-fb:active{background:', C.accentBg, ';}',
      '.sev8-fb.bold{font-weight:700;}.sev8-fb.ital{font-style:italic;}',
      '.sev8-fbwrap{position:relative;display:inline-flex;}',
      '.sev8-fbdd{position:absolute;top:calc(100% + 3px);left:0;min-width:150px;',
      'background:', C.cardBg, ';border:1px solid ', C.border, ';border-radius:4px;',
      'box-shadow:0 4px 12px rgba(0,0,0,.18);padding:4px 0;z-index:10000;display:none;flex-direction:column;}',
      '.sev8-fbdd.open{display:flex;}',
      '.sev8-fbdd-item{padding:5px 12px;color:', C.textMain, ';font-size:11px;cursor:pointer;',
      'font-family:inherit;background:none;border:none;text-align:left;',
      'transition:background .08s;white-space:nowrap;width:100%;box-sizing:border-box;}',
      '.sev8-fbdd-item:hover{background:', C.accentBg, ';color:', C.accentDk, ';}',
      '.sev8-fbdd-inp{width:100%;box-sizing:border-box;padding:4px 8px;border:1px solid ', C.inputBdr, ';',
      'border-radius:3px;background:', C.inputBg, ';color:', C.textMain, ';font-size:11px;outline:none;font-family:inherit;}',
      '.sev8-fbdd-inp:focus{border-color:', C.inputFoc, ';box-shadow:0 0 0 2px rgba(48,118,190,.15);}',
      '.sev8-fbdd-pad{padding:8px 10px;display:flex;flex-direction:column;gap:6px;}',
      '.sev8-fbdd-apply{padding:4px 0;background:', C.accent, ';color:#fff;border:1px solid ', C.accentDk, ';',
      'border-radius:3px;cursor:pointer;font-size:11px;font-family:inherit;transition:background .08s;}',
      '.sev8-fbdd-apply:hover{background:', C.accentDk, ';}',
      '.sev8-fbdd-row{display:flex;align-items:center;gap:5px;font-size:11px;color:', C.textMuted, ';}',
      '.sev8-fb-color{position:relative;}',
      '.sev8-clr{position:absolute;bottom:2px;left:4px;right:4px;height:3px;border-radius:1px;transition:background .12s;}',
      '#sev8-struct{flex:1;display:flex;flex-direction:column;overflow:hidden;}',
      '.sev8-card{border:1px solid ', C.borderSub, ';border-radius:3px;margin-bottom:8px;background:', C.cardBg, ';overflow:hidden;}',
      '.sev8-ch{display:flex;align-items:center;gap:7px;padding:7px 10px;cursor:pointer;user-select:none;',
      'background:linear-gradient(180deg,', C.panelBg, ',', C.panelBg2, ');border-bottom:1px solid ', C.border, ';}',
      '.sev8-ch:hover{background:linear-gradient(180deg,#ebf2fb,#d8e6f3);}',
      '.sev8-arr{font-size:10px;color:', C.textFaded, ';flex-shrink:0;display:inline-block;transition:transform .18s;}',
      '.sev8-ctag{font-size:10px;padding:1px 4px;background:', C.accentBg, ';border:1px solid ', C.accentBdr, ';',
      'border-radius:2px;color:', C.accentDk, ';flex-shrink:0;font-family:monospace;}',
      '.sev8-ctitle{font-weight:bold;font-size:12px;color:', C.textMain, ';flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.sev8-ccnt{font-size:10px;color:', C.textFaded, ';flex-shrink:0;}',
      '.sev8-cb{padding:10px 12px;}',
      '.sev8-row{margin-bottom:10px;}',
      '.sev8-lbl{display:block;margin-bottom:3px;font-size:11px;}',
      '.sev8-ftag{color:', C.accentDk, ';font-weight:bold;font-family:monospace;}',
      '.sev8-fpath{color:', C.textFaded, ';margin-left:3px;}',
      '.sev8-in{width:100%;box-sizing:border-box;padding:4px 7px;border:1px solid ', C.inputBdr, ';',
      'border-radius:2px;font-size:12px;font-family:inherit;background:', C.inputBg, ';color:', C.textMain, ';',
      'line-height:1.5;outline:none;resize:vertical;}',
      '.sev8-in:focus{border-color:', C.inputFoc, ';box-shadow:0 0 0 2px rgba(48,118,190,.15);}',
      'select.sev8-in{resize:none;cursor:pointer;}',
      /* подпись "Текст ссылки:" / подписи атрибутов */
      '.sev8-sub-lbl{font-size:10px;color:', C.textFaded, ';margin:3px 0 2px;font-weight:600;}',
      '.sev8-arow{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;}',
      '.sev8-ai{display:flex;align-items:center;gap:4px;flex:1;min-width:130px;}',
      '.sev8-al{font-size:11px;color:', C.textMuted, ';font-family:monospace;flex-shrink:0;min-width:38px;}',
      '.sev8-iprev{max-width:90px;max-height:54px;margin-top:5px;display:block;border:1px solid ', C.borderSub, ';border-radius:2px;}',
      '.sev8-row-hdr{display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;}',
      '.sev8-row-lbl{flex:1;min-width:0;}',
      '.sev8-micros{display:flex;gap:2px;flex-shrink:0;margin-top:1px;}',
      '.sev8-mb{width:22px;height:22px;padding:0;border:1px solid ', C.btnBdr, ';border-radius:3px;',
      'cursor:pointer;font-size:11px;line-height:20px;text-align:center;background:', C.btnBg, ';',
      'color:', C.textMuted, ';transition:all .1s;font-family:monospace;}',
      '.sev8-mb:hover{background:', C.btnHov, ';border-color:', C.accentBdr, ';color:', C.textMain, ';}',
      '.sev8-mb.del:hover{background:', C.dangerBg, ';border-color:', C.dangerBdr, ';color:', C.dangerTxt, ';}',
      '.sev8-mb.add:hover{background:', C.successBg, ';border-color:', C.successBdr, ';color:', C.successTxt, ';}',
      '.sev8-view-btn{padding:2px 8px;border:1px solid ', C.btnBdr, ';border-radius:3px;cursor:pointer;',
      'font-size:11px;font-family:inherit;background:', C.btnBg, ';color:', C.textMuted, ';transition:all .12s;}',
      '.sev8-view-btn:hover{background:', C.btnHov, ';color:', C.textMain, ';}',
      '.sev8-view-btn.active{background:', C.accentBg, ';border-color:', C.accentBdr, ';color:', C.accentDk, ';font-weight:bold;}',
      '#sev8-tree{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 6px 24px;}',
      '.sev8-tn{margin:0;padding:0;}',
      '.sev8-nh{display:flex;align-items:center;gap:3px;padding:2px 3px;border-radius:3px;',
      'cursor:default;user-select:none;border:1px solid transparent;transition:background .1s;}',
      '.sev8-nh.container{cursor:pointer;}',
      '.sev8-nh.container:hover{background:', C.accentBg, ';border-color:', C.accentBdr, ';}',
      '.sev8-nh.leaf:hover{background:', C.successBg, ';border-color:', C.successBdr, ';}',
      '.sev8-indent{display:flex;align-items:stretch;flex-shrink:0;}',
      '.sev8-guide{width:10px;border-left:1px solid ', C.borderSub, ';margin-left:4px;flex-shrink:0;}',
      '.sev8-ta{font-size:9px;width:12px;text-align:center;color:', C.textFaded, ';',
      'flex-shrink:0;transition:transform .15s;display:inline-block;}',
      '.sev8-ta.open{transform:rotate(90deg);}',
      '.sev8-ntag{font-size:10px;padding:1px 4px;background:', C.accentBg, ';border:1px solid ', C.accentBdr, ';',
      'border-radius:2px;color:', C.accentDk, ';flex-shrink:0;font-family:monospace;}',
      '.sev8-ntag.grp{background:#eef4ff;border-color:#bbccee;color:#445588;}',
      '.sev8-ntag.leaf{background:', C.successBg, ';border-color:', C.successBdr, ';color:', C.successTxt, ';}',
      '.sev8-ndesc{font-size:11px;color:', C.textMuted, ';flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.sev8-ndesc b{color:', C.textMain, ';font-weight:normal;}',
      '.sev8-gmicros{display:flex;gap:2px;flex-shrink:0;margin-left:2px;}',
      '.sev8-gm{width:18px;height:18px;padding:0;border:1px solid ', C.btnBdr, ';border-radius:3px;cursor:pointer;',
      'font-size:10px;line-height:16px;text-align:center;background:', C.btnBg, ';color:', C.textMuted, ';transition:all .1s;}',
      '.sev8-gm:hover{background:', C.btnHov, ';border-color:', C.accentBdr, ';color:', C.textMain, ';}',
      '.sev8-gm.del:hover{background:', C.dangerBg, ';border-color:', C.dangerBdr, ';color:', C.dangerTxt, ';}',
      '.sev8-gm.add:hover{background:', C.successBg, ';border-color:', C.successBdr, ';color:', C.successTxt, ';}',
      '.sev8-nc{padding-left:0;}',
      '.sev8-leaf-body{padding:3px 3px 5px 16px;}',
      '.sev8-leaf-body .sev8-in{font-size:12px;}',
      '.sev8-leaf-arow{padding:2px 3px 4px 16px;display:flex;flex-wrap:wrap;gap:4px;}',
      '#sev8-vis{flex:1;display:flex;flex-direction:column;}',
      '#sev8-vis iframe{flex:1;border:none;background:#fff;width:100%;}',
      '#sev8-src{flex:1;display:flex;flex-direction:column;overflow:hidden;}',
      '#sev8-src-wrap{flex:1;display:flex;flex-direction:column;position:relative;overflow:hidden;}',
      '#sev8-src-ta{flex:1;width:100%;box-sizing:border-box;padding:12px 14px;',
      'font-family:"SFMono-Regular",Consolas,"Courier New",monospace;font-size:12px;',
      'line-height:1.6;border:none;resize:none;background:', C.srcBg, ';color:', C.srcFg, ';',
      'outline:none;tab-size:2;-moz-tab-size:2;border-top:1px solid #333;}',
      '#sev8-src-ta::selection{background:rgba(99,99,200,.4);}',
      '#sev8-src-status{position:absolute;bottom:8px;right:16px;font-size:10px;',
      'color:rgba(255,255,255,.4);font-family:monospace;pointer-events:none;}',
      '#sev8-ovl{position:fixed;z-index:999999;background:#fff;border:1px solid ', C.border, ';',
      'border-radius:4px;box-shadow:0 4px 20px rgba(0,0,0,.22);padding:12px;min-width:320px;',
      'font-family:"Helvetica Neue",Arial,Tahoma,sans-serif;font-size:12px;}',
      '#sev8-ovl .sev8-in{width:100%;box-sizing:border-box;margin-bottom:6px;',
      'padding:4px 7px;border:1px solid ', C.inputBdr, ';border-radius:2px;font-size:12px;',
      'font-family:inherit;background:', C.inputBg, ';color:', C.textMain, ';outline:none;resize:vertical;line-height:1.5;}',
      '#sev8-ovl select.sev8-in{resize:none;cursor:pointer;}',
      '#sev8-ovl .sev8-in:focus{border-color:', C.inputFoc, ';box-shadow:0 0 0 2px rgba(48,118,190,.15);}',
      '#sev8-ovl-hdr{display:flex;justify-content:space-between;align-items:center;',
      'margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid ', C.borderSub, ';}',
      '#sev8-ovl-title{font-weight:bold;font-size:12px;color:', C.textMain, ';}',
      '#sev8-ovl-btns{display:flex;justify-content:flex-end;gap:6px;margin-top:8px;}',
      '.sev8-ovl-atrow{display:flex;align-items:center;gap:5px;margin-bottom:5px;}',
      '.sev8-ovl-atlbl{font-size:11px;color:', C.textMuted, ';font-family:monospace;flex-shrink:0;min-width:44px;}',
    ].join('');
    D.head.appendChild(s);
  }

  /* ════════ СТАТУС / ПОЛНЫЙ ЭКРАН ════════ */
  function setStatus(msg, ms) {
    var e = D.getElementById('sev8-st'); if (!e) return;
    e.textContent = msg; e.classList.add('on');
    if (ms) setTimeout(function () { e.classList.remove('on'); }, ms);
  }

  function toggleFullscreen(btn) {
    if (!S.fsMode) {
      S.fsOrigCss = S.rootEl.style.cssText;
      S.rootEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;' +
        'width:100vw;height:100vh !important;z-index:99998;margin:0;' +
        'border-radius:0;display:flex;flex-direction:column;';
      D.body.style.overflow = 'hidden';
      S.fsMode = true; btn.textContent = '⊞ Свернуть';
    } else {
      S.rootEl.style.cssText = S.fsOrigCss;
      D.body.style.overflow = '';
      S.fsMode = false; btn.textContent = '⊞ Весь экран';
    }
  }

  /* ════════ FMTBAR ════════ */
  function buildFmtBar() {
    var bar = mk('div', { id: 'sev8-fmtrow' });
    bar.classList.add('dimmed');
    S.fmtBar = bar;
    bar.appendChild(mk('span', { id: 'sev8-fmt-label', txt: 'Формат' }));

    function wrap(open, close, ph) {
      var ta = S.fmtTarget; if (!ta) return;
      var ss = ta.selectionStart, se = ta.selectionEnd, val = ta.value;
      var sel = val.substring(ss, se);
      var inner = sel.length ? sel : (ph || 'текст');
      ta.value = val.substring(0, ss) + open + inner + close + val.substring(se);
      ta.setSelectionRange(ss + open.length, ss + open.length + inner.length);
      ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function insert(html) {
      var ta = S.fmtTarget; if (!ta) return;
      var ss = ta.selectionStart, se = ta.selectionEnd;
      ta.value = ta.value.substring(0, ss) + html + ta.value.substring(se);
      ta.setSelectionRange(ss + html.length, ss + html.length);
      ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function clearFmt() {
      var ta = S.fmtTarget; if (!ta) return;
      var ss = ta.selectionStart, se = ta.selectionEnd, val = ta.value;
      var sel = val.substring(ss, se); if (!sel) return;
      var inl = 'strong|em|u|s|del|ins|mark|code|small|big|sub|sup|q|abbr|' +
        'span|b|i|cite|kbd|samp|var|bdi|bdo|dfn|ruby|rt|rp|output|wbr';
      var cleaned = sel
        .replace(new RegExp('<(?:' + inl + ')(?:\\s[^>]*)?>', 'gi'), '')
        .replace(new RegExp('<\\/(?:' + inl + ')>', 'gi'), '');
      ta.value = val.substring(0, ss) + cleaned + val.substring(se);
      ta.setSelectionRange(ss, ss + cleaned.length);
      ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function sep() { return mk('div', { cls: 'sev8-fbsep' }); }
    function btn(label, title, cls, onClick) {
      var b = mk('button', { type: 'button', cls: 'sev8-fb ' + (cls || ''), title: title, html: label });
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', onClick);
      return b;
    }
    function btnDropdown(label, title, items) {
      var w = mk('div', { cls: 'sev8-fbwrap' });
      var b = mk('button', { type: 'button', cls: 'sev8-fb', title: title, html: label });
      var dd = mk('div', { cls: 'sev8-fbdd' });
      items.forEach(function (it) {
        var item = mk('button', { type: 'button', cls: 'sev8-fbdd-item', html: it.label });
        item.addEventListener('mousedown', function (e) { e.preventDefault(); });
        item.addEventListener('click', function () { dd.classList.remove('open'); it.action(); });
        dd.appendChild(item);
      });
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        Array.prototype.forEach.call(D.querySelectorAll('.sev8-fbdd.open'),
          function (el) { if (el !== dd) el.classList.remove('open'); });
        dd.classList.toggle('open');
      });
      w.appendChild(b); w.appendChild(dd); return w;
    }
    function colorBtn(sym, title, applyFn) {
      var w = mk('div', { cls: 'sev8-fbwrap' });
      var b = mk('button', { type: 'button', cls: 'sev8-fb sev8-fb-color', title: title });
      b.appendChild(mk('span', { txt: sym, css: 'font-weight:700;font-size:13px;' }));
      var clrBar = mk('span', { cls: 'sev8-clr', css: 'background:#e06c75;' });
      b.appendChild(clrBar);
      var picker = mk('input', {
        type: 'color', value: '#e06c75',
        css: 'position:absolute;opacity:0;width:1px;height:1px;top:0;left:0;pointer-events:none;'
      });
      picker.addEventListener('input', function () { clrBar.style.background = picker.value; });
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        var saved = S.fmtTarget;
        picker.onchange = function () {
          clrBar.style.background = picker.value;
          S.fmtTarget = saved;
          applyFn(picker.value);
        };
        picker.click();
      });
      w.appendChild(b); w.appendChild(picker); return w;
    }

    bar.appendChild(btn('<b>B</b>', 'Жирный — &lt;strong&gt;', 'bold', function () { wrap('<strong>', '</strong>'); }));
    bar.appendChild(btn('<i>I</i>', 'Курсив — &lt;em&gt;', 'ital', function () { wrap('<em>', '</em>'); }));
    bar.appendChild(btn('<u>U</u>', 'Подчёркнутый — &lt;u&gt;', '', function () { wrap('<u>', '</u>'); }));
    bar.appendChild(btn('<s>S</s>', 'Зачёркнутый — &lt;s&gt;', '', function () { wrap('<s>', '</s>'); }));
    bar.appendChild(sep());
    bar.appendChild(btn('<span style="background:#fff3cd;color:#333;padding:0 2px;border-radius:2px;font-size:11px">M</span>',
      'Выделение — &lt;mark&gt;', '', function () { wrap('<mark>', '</mark>'); }));
    bar.appendChild(btn('<code style="font-size:10px;background:#f0f0f0;padding:0 2px;border-radius:2px;color:#333">&lt;/&gt;</code>',
      'Код — &lt;code&gt;', '', function () { wrap('<code>', '</code>'); }));
    bar.appendChild(btn('<span style="font-style:italic;font-size:11px">&ldquo;q&rdquo;</span>',
      'Цитата — &lt;q&gt;', '', function () { wrap('<q>', '</q>'); }));
    bar.appendChild(btn('<ins style="font-size:11px">+ins</ins>',
      'Вставка — &lt;ins&gt;', '', function () { wrap('<ins>', '</ins>'); }));
    bar.appendChild(btn('x<sup style="font-size:8px">2</sup>',
      'Надстрочный — &lt;sup&gt;', '', function () { wrap('<sup>', '</sup>'); }));
    bar.appendChild(btn('x<sub style="font-size:8px">2</sub>',
      'Подстрочный — &lt;sub&gt;', '', function () { wrap('<sub>', '</sub>'); }));
    bar.appendChild(btn('<small style="font-size:9px">Aa</small>',
      'Мелкий текст — &lt;small&gt;', '', function () { wrap('<small>', '</small>'); }));
    bar.appendChild(sep());
    bar.appendChild(colorBtn('A', 'Цвет текста', function (c) { wrap('<span style="color:' + c + '">', '</span>'); }));
    bar.appendChild(colorBtn('■', 'Цвет фона', function (c) { wrap('<span style="background-color:' + c + '">', '</span>'); }));
    bar.appendChild(btnDropdown('<span style="font-size:11px;font-weight:600">Размер ▾</span>', 'Размер шрифта', [
      { label: '<span style="font-size:9px">Очень мелкий (0.7em)</span>', action: function () { wrap('<span style="font-size:.7em">', '</span>'); } },
      { label: '<span style="font-size:10px">Мелкий (0.85em)</span>', action: function () { wrap('<span style="font-size:.85em">', '</span>'); } },
      { label: '<span style="font-size:12px">Обычный (1em)</span>', action: function () { wrap('<span style="font-size:1em">', '</span>'); } },
      { label: '<span style="font-size:13px">Крупный (1.2em)</span>', action: function () { wrap('<span style="font-size:1.2em">', '</span>'); } },
      { label: '<span style="font-size:15px">Большой (1.5em)</span>', action: function () { wrap('<span style="font-size:1.5em">', '</span>'); } },
      { label: '<span style="font-size:18px">Очень большой (2em)</span>', action: function () { wrap('<span style="font-size:2em">', '</span>'); } },
    ]));
    bar.appendChild(sep());

    /* Ссылка */
    (function () {
      var w2 = mk('div', { cls: 'sev8-fbwrap' });
      var b = mk('button', {
        type: 'button', cls: 'sev8-fb', title: 'Ссылка — &lt;a href&gt;',
        html: '<span style="text-decoration:underline;color:' + C.accent + '">Ссылка</span>'
      });
      var dd = mk('div', { cls: 'sev8-fbdd' });
      var pad = mk('div', { cls: 'sev8-fbdd-pad' });
      var urlInp = mk('input', { type: 'text', placeholder: 'https://...', cls: 'sev8-fbdd-inp' });
      var tRow = mk('div', { cls: 'sev8-fbdd-row' });
      var chk = mk('input', { type: 'checkbox', id: 'sev8-link-blank' });
      tRow.appendChild(chk);
      tRow.appendChild(mk('label', { 'for': 'sev8-link-blank', txt: 'Новая вкладка (_blank)' }));
      var applyBtn = mk('button', { type: 'button', cls: 'sev8-fbdd-apply', txt: 'Вставить ссылку' });
      applyBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      applyBtn.addEventListener('click', function () {
        var href = urlInp.value.trim(); if (!href) return;
        var tgt = chk.checked ? ' target="_blank" rel="noopener"' : '';
        wrap('<a href="' + href + '"' + tgt + '>', '</a>', 'текст ссылки');
        urlInp.value = ''; dd.classList.remove('open');
      });
      urlInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); applyBtn.click(); }
        if (e.key === 'Escape') dd.classList.remove('open');
      });
      pad.appendChild(urlInp); pad.appendChild(tRow); pad.appendChild(applyBtn);
      dd.appendChild(pad);
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        Array.prototype.forEach.call(D.querySelectorAll('.sev8-fbdd.open'),
          function (el) { if (el !== dd) el.classList.remove('open'); });
        dd.classList.toggle('open');
        if (dd.classList.contains('open')) setTimeout(function () { urlInp.focus(); }, 40);
      });
      w2.appendChild(b); w2.appendChild(dd); bar.appendChild(w2);
    })();

    /* Abbr */
    (function () {
      var w2 = mk('div', { cls: 'sev8-fbwrap' });
      var b = mk('button', {
        type: 'button', cls: 'sev8-fb',
        title: 'Аббревиатура — &lt;abbr title&gt;',
        html: '<span style="border-bottom:1px dotted ' + C.textMuted + ';font-size:10px">ABR</span>'
      });
      var dd = mk('div', { cls: 'sev8-fbdd' });
      var pad = mk('div', { cls: 'sev8-fbdd-pad' });
      var inp = mk('input', { type: 'text', placeholder: 'Расшифровка', cls: 'sev8-fbdd-inp' });
      var applyBtn = mk('button', { type: 'button', cls: 'sev8-fbdd-apply', txt: 'Вставить abbr' });
      applyBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      applyBtn.addEventListener('click', function () {
        var t = inp.value.trim(); if (!t) return;
        wrap('<abbr title="' + t + '">', '</abbr>');
        inp.value = ''; dd.classList.remove('open');
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); applyBtn.click(); }
        if (e.key === 'Escape') dd.classList.remove('open');
      });
      pad.appendChild(inp); pad.appendChild(applyBtn); dd.appendChild(pad);
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        Array.prototype.forEach.call(D.querySelectorAll('.sev8-fbdd.open'),
          function (el) { if (el !== dd) el.classList.remove('open'); });
        dd.classList.toggle('open');
        if (dd.classList.contains('open')) setTimeout(function () { inp.focus(); }, 40);
      });
      w2.appendChild(b); w2.appendChild(dd); bar.appendChild(w2);
    })();

    /* span.class */
    (function () {
      var w2 = mk('div', { cls: 'sev8-fbwrap' });
      var b = mk('button', {
        type: 'button', cls: 'sev8-fb',
        title: 'Обернуть в &lt;span class&gt;',
        html: '<span style="font-family:monospace;font-size:10px">.cls</span>'
      });
      var dd = mk('div', { cls: 'sev8-fbdd' });
      var pad = mk('div', { cls: 'sev8-fbdd-pad' });
      var inp = mk('input', { type: 'text', placeholder: 'имя-класса', cls: 'sev8-fbdd-inp' });
      var applyBtn = mk('button', { type: 'button', cls: 'sev8-fbdd-apply', txt: 'Вставить span' });
      applyBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      applyBtn.addEventListener('click', function () {
        var c = inp.value.trim().replace(/[^a-zA-Z0-9_\- ]/g, '');
        if (!c) return;
        wrap('<span class="' + c + '">', '</span>');
        inp.value = ''; dd.classList.remove('open');
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); applyBtn.click(); }
        if (e.key === 'Escape') dd.classList.remove('open');
      });
      pad.appendChild(inp); pad.appendChild(applyBtn); dd.appendChild(pad);
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        Array.prototype.forEach.call(D.querySelectorAll('.sev8-fbdd.open'),
          function (el) { if (el !== dd) el.classList.remove('open'); });
        dd.classList.toggle('open');
        if (dd.classList.contains('open')) setTimeout(function () { inp.focus(); }, 40);
      });
      w2.appendChild(b); w2.appendChild(dd); bar.appendChild(w2);
    })();

    bar.appendChild(sep());
    bar.appendChild(btn('&shy;', 'Мягкий перенос (&amp;shy;)', '', function () { insert('&shy;'); }));
    bar.appendChild(btn('&nbsp;', 'Неразрывный пробел (&amp;nbsp;)', '', function () { insert('&nbsp;'); }));
    bar.appendChild(btn('—', 'Длинное тире', '', function () { insert('—'); }));
    bar.appendChild(btn('«»', 'Кавычки-ёлочки', '', function () {
      var ta = S.fmtTarget; if (!ta) return;
      var ss = ta.selectionStart, se = ta.selectionEnd;
      if (ta.value.substring(ss, se)) wrap('«', '»'); else insert('«»');
    }));
    bar.appendChild(btn('&lt;br&gt;', 'Перенос строки &lt;br&gt;', '', function () { insert('<br>'); }));
    bar.appendChild(sep());
    bar.appendChild(btn('✕ fmt', 'Убрать форматирование из выделения', '', clearFmt));

    D.addEventListener('click', function () {
      Array.prototype.forEach.call(D.querySelectorAll('.sev8-fbdd.open'),
        function (el) { el.classList.remove('open'); });
    });
    return bar;
  }

  function wireFmtBar(ta) {
    ta.addEventListener('focus', function () {
      S.fmtTarget = ta;
      if (S.fmtBar) S.fmtBar.classList.remove('dimmed');
    });
    ta.addEventListener('blur', function () {
      setTimeout(function () {
        if (S.fmtTarget !== ta) return;
        var ae = D.activeElement;
        if (!ae || !ae.closest || !ae.closest('#sev8-fmtrow')) {
          if (S.fmtBar) S.fmtBar.classList.add('dimmed');
          S.fmtTarget = null;
        }
      }, 180);
    });
  }

  /* ════════ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ АТРИБУТОВ ════════ */

  var TARGET_OPTIONS = [
    ['', '— не задан —'],
    ['_blank', '_blank  (новая вкладка)'],
    ['_self', '_self   (та же вкладка)'],
    ['_parent', '_parent'],
    ['_top', '_top'],
  ];

  function buildAttrInput(attr, curValue) {
    var inp;
    if (attr === 'target') {
      inp = mk('select', {
        cls: 'sev8-in',
        css: 'font-family:monospace;font-size:11px;min-width:0;'
      });
      TARGET_OPTIONS.forEach(function (pair) {
        var o = D.createElement('option');
        o.value = pair[0]; o.textContent = pair[1];
        if (curValue === pair[0]) o.selected = true;
        inp.appendChild(o);
      });
    } else {
      inp = mk('input', {
        type: 'text', cls: 'sev8-in',
        css: 'font-family:monospace;font-size:11px;min-width:0;',
        value: curValue
      });
    }
    inp.setAttribute('data-a', attr);
    return inp;
  }

  /**
   * Строит строку полей атрибутов с авто-сохранением через lazySync.
   * Возвращает DOM-элемент или null если поля не добавлены.
   */
  function buildAttrFields(node, id, tag, attrs) {
    var always = CFG.ATTR_ALWAYS[tag] || {};
    var aWrap = mk('div', { cls: 'sev8-arow' });
    var inpMap = {};

    attrs.forEach(function (attr) {
      if (!node.hasAttribute(attr) && !always[attr]) return;
      var ai = mk('div', { cls: 'sev8-ai' });
      ai.appendChild(mk('span', { cls: 'sev8-al', txt: attr + ':' }));
      var inp = buildAttrInput(attr, node.getAttribute(attr) || '');
      inp.setAttribute('data-id', id);
      inpMap[attr] = inp;
      ai.appendChild(inp);
      aWrap.appendChild(ai);
    });

    /* Подписываем обработчики */
    Object.keys(inpMap).forEach(function (attr) {
      var inp = inpMap[attr];
      var onChg = debounce(function () {
        var r = S.map[inp.getAttribute('data-id')]; if (!r) return;
        var val = inp.tagName === 'SELECT' ? inp.value : inp.value;
        if (val) r.node.setAttribute(attr, val);
        else r.node.removeAttribute(attr);
        /* auto rel=noopener при _blank */
        if (attr === 'target' && val === '_blank' &&
          inpMap['rel'] && !inpMap['rel'].value) {
          inpMap['rel'].value = 'noopener';
          r.node.setAttribute('rel', 'noopener');
        }
        setStatus('● изменено'); lazySync();
      }, 300);
      inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', onChg);
    });

    return aWrap.firstChild ? aWrap : null;
  }

  /* ════════ ТУЛБАР ════════ */
  function buildToolbar(onMode) {
    var tb = mk('div', { id: 'sev8-tb' });
    var topRow = mk('div', { cls: 'sev8-tb-toprow' });

    /* Логотип */
    var logoGroup = mk('div', { cls: 'sev8-tb-group', css: 'border-right:none;' });
    logoGroup.appendChild(mk('span', { id: 'sev8-logo', txt: '⚡ StructEditor' }));
    topRow.appendChild(logoGroup);

    /* Вкладки */
    var tg = mk('div', { cls: 'sev8-tb-group' });
    var tabs = {};
    [{ id: 'struct', lbl: 'Структура', tip: 'Редактирование через поля по секциям' },
    { id: 'visual', lbl: 'Визуальный', tip: 'Клик по элементу — редактирование' },
    { id: 'source', lbl: 'Исходник', tip: 'Сырой HTML — script/style/MODX-теги' },
    ].forEach(function (def) {
      var b = mk('button', { cls: 'sev8-tab', txt: def.lbl, title: def.tip, type: 'button' });
      b.addEventListener('click', function () {
        Object.keys(tabs).forEach(function (k) { tabs[k].classList.remove('active'); });
        b.classList.add('active'); onMode(def.id);
      });
      tabs[def.id] = b; tg.appendChild(b);
    });
    topRow.appendChild(tg);

    /* Undo / Redo */
    var hg = mk('div', { cls: 'sev8-tb-group' });
    var undoBtn = mk('button', {
      cls: 'sev8-btn', type: 'button',
      title: 'Отменить (Ctrl+Z)', html: '↩ Отмена'
    });
    var redoBtn = mk('button', {
      cls: 'sev8-btn', type: 'button',
      title: 'Повторить (Ctrl+Y)', html: '↪ Повтор'
    });
    undoBtn.disabled = true; redoBtn.disabled = true;
    undoBtn.onclick = histUndo; redoBtn.onclick = histRedo;
    S.undoBtn = undoBtn; S.redoBtn = redoBtn;
    hg.appendChild(undoBtn); hg.appendChild(redoBtn);
    topRow.appendChild(hg);

    /* Действия */
    var ag = mk('div', { cls: 'sev8-tb-group' });
    var syncBtn = mk('button', {
      cls: 'sev8-btn primary', type: 'button',
      title: 'Синхронизировать с MODX', html: '💾 Синхр.'
    });
    syncBtn.onclick = function () {
      syncNow();
      var orig = syncBtn.innerHTML; syncBtn.textContent = '✓ OK';
      setTimeout(function () { syncBtn.innerHTML = orig; }, 1800);
    };
    ag.appendChild(syncBtn);

    var fsBtn = mk('button', {
      cls: 'sev8-btn', type: 'button',
      title: 'Весь экран', html: '⊞ Весь экран'
    });
    fsBtn.onclick = function () { toggleFullscreen(fsBtn); };
    ag.appendChild(fsBtn);

    /* Кнопка возврата к нативному редактору */
    if (S.aceMode && S.aceEl) {
      var backBtn = mk('button', {
        cls: 'sev8-btn', type: 'button',
        title: 'Вернуться к ACE-редактору', html: '↩ ACE'
      });
      backBtn.onclick = function () {
        syncNow(); closeOvl();
        if (S.fsMode) toggleFullscreen(fsBtn);
        if (S.rootEl) S.rootEl.style.display = 'none';
        if (S.aceEl) S.aceEl.style.display = '';
      };
      ag.appendChild(backBtn);
    } else if (!S.aceMode && S.nativeTa) {
      var backBtn2 = mk('button', {
        cls: 'sev8-btn', type: 'button',
        title: 'Вернуться к нативному редактору MODX', html: '✎ Textarea'
      });
      backBtn2.onclick = function () {
        syncNow(); closeOvl();
        if (S.fsMode) toggleFullscreen(fsBtn);
        if (S.rootEl) S.rootEl.style.display = 'none';
        if (S.nativeTa) {
          S.nativeTa.style.display = '';
          var cont = S.nativeTa.closest
            ? S.nativeTa.closest('.x-form-el,[class*="x-form-el"]')
            : null;
          if (cont) cont.style.display = '';
        }
      };
      ag.appendChild(backBtn2);
    }

    ag.appendChild(mk('span', { id: 'sev8-st', txt: '' }));
    topRow.appendChild(ag);

    tb.appendChild(topRow);
    tb.appendChild(buildFmtBar());

    return { node: tb, tabs: tabs };
  }

  /* ════════ ДЕРЕВО ════════ */
  var TREE_CONTAINERS = {
    div: 1, section: 1, article: 1, header: 1, footer: 1, main: 1, nav: 1, aside: 1,
    ul: 1, ol: 1, dl: 1, table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1,
    figure: 1, form: 1, fieldset: 1, blockquote: 1, span: 1,
  };
  var TREE_SKIP = {
    script: 1, style: 1, meta: 1, link: 1, noscript: 1,
    br: 1, hr: 1, wbr: 1, template: 1, canvas: 1, picture: 1,
  };

  function renderTreeChildren(node, container, depth) {
    Array.prototype.forEach.call(node.children, function (child) {
      var tag = child.tagName.toLowerCase();
      if (TREE_SKIP[tag] || child.hasAttribute(CFG.PH_ATTR)) return;
      var markId = child.getAttribute(CFG.MARK);
      var isLeaf = !!markId && !!S.map[markId];
      var isContainer = TREE_CONTAINERS[tag] && !isLeaf;
      var hasContent = isLeaf ||
        child.querySelector('[' + CFG.MARK + ']') ||
        !!child.children.length;
      if (!hasContent && !isLeaf) return;

      var tnEl = mk('div', { cls: 'sev8-tn' });
      var nhEl = mk('div', { cls: 'sev8-nh ' + (isLeaf ? 'leaf' : 'container') });
      var indEl = mk('div', { cls: 'sev8-indent' });
      for (var d = 0; d < depth; d++) indEl.appendChild(mk('div', { cls: 'sev8-guide' }));
      nhEl.appendChild(indEl);

      var arrow = mk('span', {
        cls: 'sev8-ta' + (isContainer ? ' open' : ''),
        txt: isContainer ? '▶' : '·'
      });
      nhEl.appendChild(arrow);
      var tagCls = isLeaf ? 'leaf' : (isContainer ? 'grp' : '');
      nhEl.appendChild(mk('code', { cls: 'sev8-ntag ' + tagCls, txt: '<' + tag + '>' }));

      var descEl = mk('span', { cls: 'sev8-ndesc' });
      var cls2 = (child.className || '').trim().split(/\s+/)
        .filter(function (c) { return c.length > 1; }).slice(0, 2).join(' ');
      if (isLeaf) {
        var txt2 = (child.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 50);
        descEl.innerHTML = (cls2 ? '<b>.' + cls2.split(' ')[0] + '</b> ' : '') + (txt2 || '—');
      } else {
        descEl.innerHTML = (cls2 ? '<b>.' + cls2.split(' ')[0] + '</b> ' : '') +
          child.children.length + ' эл.';
      }
      nhEl.appendChild(descEl);

      var gmEl = mk('div', { cls: 'sev8-gmicros' });
      var clBtn = mk('button', { cls: 'sev8-gm', type: 'button', txt: '⎘', title: 'Клонировать' });
      clBtn.onclick = function (e) { e.stopPropagation(); treeGroupClone(child); };
      gmEl.appendChild(clBtn);
      if (/^(li|tr|dt|dd|p|blockquote|option|article|section)$/.test(tag)) {
        var aBtn = mk('button', { cls: 'sev8-gm add', type: 'button', txt: '+', title: 'Добавить после' });
        aBtn.onclick = function (e) { e.stopPropagation(); treeGroupAdd(child, tag); };
        gmEl.appendChild(aBtn);
      }
      var uBtn = mk('button', { cls: 'sev8-gm', type: 'button', txt: '↑', title: 'Вверх' });
      uBtn.onclick = function (e) { e.stopPropagation(); treeGroupMove(child, -1); };
      gmEl.appendChild(uBtn);
      var dBtn = mk('button', { cls: 'sev8-gm', type: 'button', txt: '↓', title: 'Вниз' });
      dBtn.onclick = function (e) { e.stopPropagation(); treeGroupMove(child, 1); };
      gmEl.appendChild(dBtn);
      var delBtn = mk('button', { cls: 'sev8-gm del', type: 'button', txt: '✕', title: 'Удалить' });
      delBtn.onclick = function (e) {
        e.stopPropagation();
        if (!W.confirm('Удалить <' + tag + '>?')) return;
        treeGroupDelete(child);
      };
      gmEl.appendChild(delBtn);
      nhEl.appendChild(gmEl);
      tnEl.appendChild(nhEl);

      var ncEl = mk('div', { cls: 'sev8-nc' });
      if (isLeaf) {
        ncEl.appendChild(buildLeafFields(markId, S.map[markId]));
        ncEl.style.display = 'none';
        nhEl.addEventListener('click', function () {
          ncEl.style.display = ncEl.style.display !== 'none' ? 'none' : '';
        });
      } else if (isContainer) {
        renderTreeChildren(child, ncEl, depth + 1);
        var open = depth < 1;
        ncEl.style.display = open ? '' : 'none';
        if (open) arrow.classList.add('open'); else arrow.classList.remove('open');
        nhEl.addEventListener('click', function (e) {
          if (e.target.closest('.sev8-gmicros')) return;
          var isOpen = ncEl.style.display !== 'none';
          ncEl.style.display = isOpen ? 'none' : '';
          arrow.classList.toggle('open', !isOpen);
        });
      } else {
        renderTreeChildren(child, ncEl, depth + 1);
      }
      tnEl.appendChild(ncEl);
      container.appendChild(tnEl);
    });
  }

  function buildLeafFields(id, info) {
    var outer = mk('div');
    if (info.type === 'text' || info.type === 'both') {
      var body = mk('div', { cls: 'sev8-leaf-body' });
      if (info.tag === 'a')
        body.appendChild(mk('div', { cls: 'sev8-sub-lbl', txt: 'Текст ссылки:' }));
      var ta = mk('textarea', { cls: 'sev8-in' });
      ta.style.minHeight = '40px';
      ta.value = info.node.innerHTML;
      ta.setAttribute('data-id', id); ta.setAttribute('data-t', 'html');
      ta.addEventListener('input', debounce(function () {
        var r = S.map[ta.getAttribute('data-id')]; if (!r) return;
        r.node.innerHTML = ta.value; setStatus('● изменено'); lazySync();
      }, 300));
      ta.addEventListener('change', function () {
        var r = S.map[ta.getAttribute('data-id')]; if (!r) return;
        r.node.innerHTML = ta.value; syncNow();
      });
      wireFmtBar(ta); body.appendChild(ta); outer.appendChild(body);
    }
    if ((info.type === 'attrs' || info.type === 'both') && info.attrs) {
      var aWrap = buildAttrFields(info.node, id, info.tag, info.attrs);
      if (aWrap) { aWrap.className = 'sev8-leaf-arow'; outer.appendChild(aWrap); }
    }
    return outer;
  }

  /* ════════ РЕЖИМ: СТРУКТУРА ════════ */
  function buildStruct() {
    var wrap = mk('div', {
      id: 'sev8-struct',
      css: 'flex:1;display:flex;flex-direction:column;overflow:hidden;'
    });
    var bar = mk('div', { cls: 'sev8-bar info' });
    var vBtns = mk('div', { css: 'display:flex;gap:3px;flex-shrink:0;' });
    var fieldsBtn = mk('button', { cls: 'sev8-view-btn', type: 'button', txt: 'Поля' });
    var treeBtn = mk('button', { cls: 'sev8-view-btn', type: 'button', txt: 'Дерево' });
    function setView(isTree) {
      S.treeMode = isTree;
      fieldsBtn.classList.toggle('active', !isTree);
      treeBtn.classList.toggle('active', isTree);
      if (!S.cardsEl) return;
      S.cardsEl.innerHTML = '';
      if (isTree) buildTreeView2(S.cardsEl);
      else { S.cardsEl.style.padding = '8px 10px 24px'; fillCards(S.cardsEl); }
    }
    fieldsBtn.onclick = function () { setView(false); };
    treeBtn.onclick = function () { setView(true); };
    vBtns.appendChild(fieldsBtn); vBtns.appendChild(treeBtn);
    bar.appendChild(vBtns);
    bar.appendChild(mk('span', { cls: 'sev8-bar-txt', txt: '' }));
    var cleanBtn = mk('button', { cls: 'sev8-btn', type: 'button', txt: '✂ Очистить пробелы' });
    cleanBtn.onclick = cleanSpaces;
    bar.appendChild(cleanBtn); wrap.appendChild(bar);

    var cards = mk('div', { css: 'flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 10px 24px;' });
    S.cardsEl = cards;
    if (S.treeMode) buildTreeView2(cards); else fillCards(cards);
    fieldsBtn.classList.toggle('active', !S.treeMode);
    treeBtn.classList.toggle('active', S.treeMode);
    wrap.appendChild(cards);
    return wrap;
  }

  function fillCards(container) {
    var secs = findSections(S.doc.body);
    var allIds = Object.keys(S.map);

    if (secs.length === 1 && secs[0] === S.doc.body) {
      container.appendChild(
        buildCard(S.doc.body, allIds, 'Всё содержимое', 'body', true));
    } else {
      var usedIds = {};
      secs.forEach(function (sec, idx) {
        var ids = allIds.filter(function (id) {
          if (usedIds[id]) return false;
          if (sec.contains(S.map[id].node)) { usedIds[id] = true; return true; }
          return false;
        });
        if (ids.length > 0)
          container.appendChild(
            buildCard(sec, ids, secTitle(sec), sec.tagName.toLowerCase(), idx === 0));
      });
      var orphans = allIds.filter(function (id) { return !usedIds[id]; });
      if (orphans.length > 0)
        container.appendChild(
          buildCard(S.doc.body, orphans, 'Прочее содержимое', 'div',
            Object.keys(usedIds).length === 0));
    }

    if (!container.firstChild) {
      container.appendChild(mk('p', {
        css: 'color:' + C.textFaded + ';text-align:center;padding:18px;font-size:12px;',
        txt: 'Редактируемых элементов не найдено. Переключитесь на «Исходник».',
      }));
    }
  }

  function cleanSpaces() {
    var inputs = S.rootEl ? S.rootEl.querySelectorAll('[data-t="html"]') : [];
    var changed = 0;
    Array.prototype.forEach.call(inputs, function (inp) {
      var v = inp.value;
      var cl = v.replace(/[ \t]{2,}/g, ' ')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '');
      if (cl !== v) {
        inp.value = cl;
        var id = inp.getAttribute('data-id');
        if (id && S.map[id]) S.map[id].node.innerHTML = cl;
        changed++;
      }
    });
    if (changed > 0) { syncNow(); setStatus('Готово: ' + changed + ' полей ✓', 2500); }
    else setStatus('Нечего чистить', 2000);
  }

  function buildCard(sec, ids, title, tag, open) {
    var card = mk('div', { cls: 'sev8-card' });
    var hdr = mk('div', { cls: 'sev8-ch' });
    var arr = mk('span', { cls: 'sev8-arr', txt: '►' });
    if (open) arr.style.transform = 'rotate(90deg)';
    hdr.appendChild(arr);
    hdr.appendChild(mk('code', { cls: 'sev8-ctag', txt: '<' + tag + '>' }));
    hdr.appendChild(mk('span', { cls: 'sev8-ctitle', txt: title }));
    hdr.appendChild(mk('span', { cls: 'sev8-ccnt', txt: ids.length + ' эл.' }));
    var body = mk('div', { cls: 'sev8-cb' });
    body.style.display = open ? '' : 'none';
    if (ids.length === 0)
      body.appendChild(mk('p', {
        css: 'color:' + C.textFaded + ';margin:0;font-size:11px;',
        txt: 'Нет редактируемых элементов.'
      }));
    else
      ids.forEach(function (id) { body.appendChild(buildRow(S.map[id], id)); });
    hdr.addEventListener('click', function () {
      open = !open;
      body.style.display = open ? '' : 'none';
      arr.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
    });
    card.appendChild(hdr); card.appendChild(body);
    return card;
  }

  function buildRow(info, id) {
    var node = info.node, tag = info.tag;
    var row = mk('div', { cls: 'sev8-row' });
    var rowHdr = mk('div', { cls: 'sev8-row-hdr' });
    var lbl = mk('label', { cls: 'sev8-row-lbl sev8-lbl' });
    lbl.appendChild(mk('code', { cls: 'sev8-ftag', txt: '<' + tag + '>' }));
    var path = nodePathStr(node);
    if (path) lbl.appendChild(mk('span', { cls: 'sev8-fpath', txt: '› ' + path }));
    rowHdr.appendChild(lbl);

    var micros = mk('div', { cls: 'sev8-micros' });
    var clBtn = mk('button', { cls: 'sev8-mb', type: 'button', txt: '⎘', title: 'Клонировать' });
    clBtn.onclick = function () { structClone(id); }; micros.appendChild(clBtn);
    if (/^(li|p|dt|dd|tr|option|blockquote)$/.test(tag)) {
      var aBtn = mk('button', {
        cls: 'sev8-mb add', type: 'button', txt: '+',
        title: 'Добавить ' + tag + ' после'
      });
      aBtn.onclick = function () { structAdd(id); }; micros.appendChild(aBtn);
    }
    var uBtn = mk('button', { cls: 'sev8-mb', type: 'button', txt: '↑', title: 'Вверх' });
    uBtn.onclick = function () { structMove(id, -1); }; micros.appendChild(uBtn);
    var dBtn = mk('button', { cls: 'sev8-mb', type: 'button', txt: '↓', title: 'Вниз' });
    dBtn.onclick = function () { structMove(id, 1); }; micros.appendChild(dBtn);
    var delBtn = mk('button', { cls: 'sev8-mb del', type: 'button', txt: '✕', title: 'Удалить' });
    delBtn.onclick = function () { structDelete(id); }; micros.appendChild(delBtn);
    rowHdr.appendChild(micros); row.appendChild(rowHdr);

    if (info.type === 'text' || info.type === 'both') {
      if (tag === 'a')
        row.appendChild(mk('div', { cls: 'sev8-sub-lbl', txt: 'Текст ссылки:' }));
      var ta = mk('textarea', { cls: 'sev8-in' });
      ta.style.minHeight =
        /^(p|blockquote|li|td|th|dd|dt|div|aside|span|address|pre|small)$/
          .test(tag) ? '54px' : '34px';
      ta.value = node.innerHTML;
      ta.setAttribute('data-id', id); ta.setAttribute('data-t', 'html');
      ta.addEventListener('input', debounce(function () {
        var r = S.map[ta.getAttribute('data-id')]; if (!r) return;
        r.node.innerHTML = ta.value; setStatus('● изменено'); lazySync();
      }, 300));
      ta.addEventListener('change', function () {
        var r = S.map[ta.getAttribute('data-id')]; if (!r) return;
        r.node.innerHTML = ta.value; syncNow();
      });
      wireFmtBar(ta); row.appendChild(ta);
    }

    if ((info.type === 'attrs' || info.type === 'both') && info.attrs) {
      var aWrap = buildAttrFields(node, id, tag, info.attrs);
      if (aWrap) row.appendChild(aWrap);
    }

    if (tag === 'img' && node.getAttribute('src')) {
      var prev = mk('img', { src: node.getAttribute('src'), cls: 'sev8-iprev' });
      var srcInp = row.querySelector('[data-a="src"]');
      if (srcInp) srcInp.addEventListener('input', function () { prev.src = srcInp.value; });
      row.appendChild(prev);
    }
    return row;
  }

  /* ════════ СТРУКТУРНЫЕ ОПЕРАЦИИ ════════ */
  function structClone(id) {
    var info = S.map[id]; if (!info) return;
    var n = info.node, p = n.parentNode; if (!p) return;
    var cl = n.cloneNode(true); cl.removeAttribute(CFG.MARK);
    Array.prototype.forEach.call(cl.querySelectorAll('[' + CFG.MARK + ']'),
      function (x) { x.removeAttribute(CFG.MARK); });
    p.insertBefore(cl, n.nextSibling); rebuildContent();
  }
  function structDelete(id) {
    var info = S.map[id]; if (!info) return;
    var n = info.node, p = n.parentNode; if (!p) return;
    if (!W.confirm('Удалить <' + info.tag + '>?\n' +
      (n.textContent || '').trim().substring(0, 60))) return;
    p.removeChild(n); rebuildContent();
  }
  function structMove(id, dir) {
    var info = S.map[id]; if (!info) return;
    var n = info.node, p = n.parentNode; if (!p) return;
    if (dir === -1) { var s = prevElSib(n); if (s) p.insertBefore(n, s); }
    else { var s2 = nextElSib(n); if (s2) p.insertBefore(s2, n); }
    rebuildContent();
  }
  function structAdd(id) {
    var info = S.map[id]; if (!info) return;
    var n = info.node, p = n.parentNode; if (!p) return;
    var tag = info.tag, newEl;
    var defs = {
      li: 'Новый пункт', p: 'Новый абзац', dt: 'Термин',
      dd: 'Описание', blockquote: 'Цитата', option: 'Вариант'
    };
    if (tag === 'tr') {
      newEl = n.cloneNode(true); newEl.removeAttribute(CFG.MARK);
      Array.prototype.forEach.call(newEl.querySelectorAll('[' + CFG.MARK + ']'),
        function (x) { x.removeAttribute(CFG.MARK); });
      Array.prototype.forEach.call(newEl.querySelectorAll('td,th'),
        function (c) { c.innerHTML = ''; });
    } else {
      newEl = S.doc.createElement(tag); newEl.textContent = defs[tag] || '';
    }
    p.insertBefore(newEl, n.nextSibling); rebuildContent();
  }

  /* ════════ ГРУППОВЫЕ ОПЕРАЦИИ (дерево) ════════ */
  function treeGroupClone(node) {
    var p = node.parentNode; if (!p) return;
    var cl = node.cloneNode(true); cl.removeAttribute(CFG.MARK);
    Array.prototype.forEach.call(cl.querySelectorAll('[' + CFG.MARK + ']'),
      function (x) { x.removeAttribute(CFG.MARK); });
    p.insertBefore(cl, node.nextSibling); rebuildContent();
  }
  function treeGroupDelete(node) {
    var p = node.parentNode; if (!p) return;
    p.removeChild(node); rebuildContent();
  }
  function treeGroupMove(node, dir) {
    var p = node.parentNode; if (!p) return;
    if (dir === -1) { var s = prevElSib(node); if (s) p.insertBefore(node, s); }
    else { var s2 = nextElSib(node); if (s2) p.insertBefore(s2, node); }
    rebuildContent();
  }
  function treeGroupAdd(node, tag) {
    var p = node.parentNode; if (!p) return;
    var defs = {
      li: 'Новый пункт', dt: 'Термин', dd: 'Описание',
      p: 'Новый абзац', blockquote: 'Цитата'
    };
    var newEl;
    if (tag === 'tr') {
      newEl = node.cloneNode(true); newEl.removeAttribute(CFG.MARK);
      Array.prototype.forEach.call(newEl.querySelectorAll('[' + CFG.MARK + ']'),
        function (x) { x.removeAttribute(CFG.MARK); });
      Array.prototype.forEach.call(newEl.querySelectorAll('td,th'),
        function (c) { c.innerHTML = ''; });
    } else if (defs[tag]) {
      newEl = S.doc.createElement(tag); newEl.textContent = defs[tag];
    } else if (tag === 'section' || tag === 'article') {
      newEl = node.cloneNode(true); newEl.removeAttribute(CFG.MARK);
      Array.prototype.forEach.call(newEl.querySelectorAll('[' + CFG.MARK + ']'),
        function (x) { x.removeAttribute(CFG.MARK); });
    } else return;
    p.insertBefore(newEl, node.nextSibling); rebuildContent();
  }

  function rebuildContent() {
    S.rawHtml = serialize(); writeHTML(S.rawHtml);
    if (S.srcTa) S.srcTa.value = S.rawHtml;
    loadFromRaw(); histPush(S.rawHtml);
    if (!S.cardsEl) return;
    S.cardsEl.innerHTML = '';
    if (S.treeMode) buildTreeView2(S.cardsEl);
    else { S.cardsEl.style.padding = '8px 10px 24px'; fillCards(S.cardsEl); }
    setStatus('Структура обновлена', 1500);
  }
  function buildTreeView2(container) {
    container.style.padding = '4px 6px 24px';
    renderTreeChildren(S.doc.body, container, 0);
  }

  /* ════════ РЕЖИМ: ВИЗУАЛЬНЫЙ ════════ */
  var VCSS = [
    '*,*:before,*:after{box-sizing:border-box;}html,body{margin:0;padding:0;}',
    'body{font-family:"Helvetica Neue",Arial,Tahoma,sans-serif;font-size:14px;',
    'line-height:1.65;color:#333;padding:16px 20px;background:#fff;}',
    'h1{font-size:2em;}h2{font-size:1.6em;}h3{font-size:1.35em;}h4{font-size:1.15em;}',
    'h1,h2,h3,h4,h5,h6{font-weight:bold;margin:.8em 0 .4em;line-height:1.25;}',
    'p{margin:0 0 .8em;}ul,ol{padding-left:1.4em;margin:0 0 .8em;}li{margin:.2em 0;}',
    'img{max-width:100%;height:auto;vertical-align:middle;}',
    'a{color:#3076be;text-decoration:underline;}',
    'table{border-collapse:collapse;width:100%;}',
    'th,td{padding:4px 8px;border:1px solid #ddd;text-align:left;}',
    'blockquote{margin:0 0 .8em 1em;padding-left:.8em;border-left:3px solid #ddd;color:#666;}',
    'section,article,main,header,footer,nav,aside{display:block;margin:.6em 0;}',
    'small{font-size:.85em;}address{font-style:italic;}',
    'pre{font-family:monospace;white-space:pre-wrap;background:#f5f5f5;padding:.5em;}',
    '[data-sev8ph]{display:none!important;}',
    '[data-sev8]{outline:2px dashed rgba(48,118,190,.45);outline-offset:1px;',
    'cursor:pointer;border-radius:2px;transition:outline-color .12s,background .12s;}',
    '[data-sev8]:hover{outline-color:#3076be;background:rgba(48,118,190,.06);}',
    '[data-sev8].sev8-active{outline:2px solid #3076be;background:rgba(48,118,190,.09);}',
  ].join('\n');

  function buildVisual() {
    S.curIframe = null;
    var wrap = mk('div', { id: 'sev8-vis' });
    wrap.appendChild(mk('div', {
      cls: 'sev8-bar info',
      html: '<span class="sev8-bar-txt">✏ Кликайте на подсвеченный элемент. <strong>Ссылки заблокированы.</strong></span>'
    }));
    var iframe = D.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.cssText = 'flex:1;border:none;background:#fff;width:100%;';
    wrap.appendChild(iframe); S.curIframe = iframe;
    setTimeout(function () { renderVFrame(iframe); }, 60);
    return wrap;
  }

  function renderVFrame(fr) {
    var iDoc = fr.contentDocument || fr.contentWindow.document; if (!iDoc) return;
    iDoc.open();
    iDoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
      VCSS + '</style></head><body>' +
      (S.doc ? S.doc.body.innerHTML : '') + '</body></html>');
    iDoc.close();
    setTimeout(function () { bindVFrame(fr); }, 120);
  }

  /* Возвращает путь дочерних индексов от ancestor до descendant (или null) */
  function getPathFromAncestor(ancestor, descendant) {
    var path = [], cur = descendant;
    while (cur && cur !== ancestor) {
      var par = cur.parentElement; if (!par) return null;
      path.unshift(Array.prototype.indexOf.call(par.children, cur));
      cur = par;
    }
    return cur === ancestor ? path : null;
  }

  /* Следует по пути дочерних индексов от root */
  function followPath(root, path) {
    var cur = root;
    for (var i = 0; i < path.length; i++) {
      if (!cur || !cur.children[path[i]]) return null;
      cur = cur.children[path[i]];
    }
    return cur;
  }

  function bindVFrame(fr) {
    var iDoc = fr.contentDocument || fr.contentWindow.document; if (!iDoc) return;
    iDoc.addEventListener('click', function (e) { e.preventDefault(); }, true);
    iDoc.addEventListener('click', function (e) {
      /* — найти ближайший помеченный контейнер — */
      var marked = null, cur = e.target;
      while (cur && cur !== iDoc.body) {
        if (cur.getAttribute && cur.getAttribute(CFG.MARK)) { marked = cur; break; }
        cur = cur.parentElement;
      }
      if (!marked) { closeOvl(); return; }

      /* — проверить: клик попал на атомарный элемент (a, img, video, iframe…)
           внутри контейнера, у которого нет собственной маркировки — */
      var atomic = null, cur2 = e.target;
      while (cur2 && cur2 !== marked) {
        var t2 = cur2.tagName && cur2.tagName.toLowerCase();
        if (t2 && CFG.ATTR_MAP[t2] && !cur2.getAttribute(CFG.MARK)) {
          atomic = cur2; break;
        }
        cur2 = cur2.parentElement;
      }
      if (atomic) {
        var id = marked.getAttribute(CFG.MARK);
        var srcContainer = S.map[id] && S.map[id].node;
        if (srcContainer) {
          var path = getPathFromAncestor(marked, atomic);
          var srcAtomic = path ? followPath(srcContainer, path) : null;
          if (srcAtomic) {
            Array.prototype.forEach.call(iDoc.querySelectorAll('.sev8-active'),
              function (el) { el.classList.remove('sev8-active'); });
            atomic.classList.add('sev8-active');
            var tag = atomic.tagName.toLowerCase();
            var hasBody = !!CFG.ATTR_HAS_TEXT[tag] &&
              (srcAtomic.textContent || '').trim().length > 0;
            var synInfo = {
              node: srcAtomic, tag: tag,
              type: hasBody ? 'both' : 'attrs',
              attrs: CFG.ATTR_MAP[tag]
            };
            showOvl(fr, atomic, synInfo, null);
            return;
          }
        }
      }

      openEdit(fr, marked, marked.getAttribute(CFG.MARK));
    }, false);
    iDoc.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  }

  function openEdit(fr, iEl, id) {
    var info = S.map[id]; if (!info) return;
    var iDoc = fr.contentDocument || fr.contentWindow.document;
    Array.prototype.forEach.call(iDoc.querySelectorAll('.sev8-active'),
      function (e) { e.classList.remove('sev8-active'); });
    iEl.classList.add('sev8-active');
    /* Заголовки h1-h6 редактируем inline */
    if (info.type === 'text' && /^h[1-6]$/.test(info.tag) &&
      !iEl.querySelector('[' + CFG.MARK + ']')) {
      var orig = iEl.innerHTML; iEl.contentEditable = 'true'; iEl.focus();
      iEl.onblur = function () {
        iEl.contentEditable = 'false'; iEl.classList.remove('sev8-active');
        info.node.innerHTML = iEl.innerHTML; syncNow();
      };
      iEl.onkeydown = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); iEl.blur(); }
        if (e.key === 'Escape') { iEl.innerHTML = orig; iEl.onblur = null; iEl.blur(); }
      };
      return;
    }
    showOvl(fr, iEl, info, id);
  }

  function showOvl(fr, iEl, info, id) {
    closeOvl();
    var iRect = iEl.getBoundingClientRect(), frRect = fr.getBoundingClientRect();
    var top = frRect.top + iRect.top;
    var left = frRect.left + iRect.left;
    var ovlW = Math.min(Math.max(iRect.width + 24, 360), 580);
    left = Math.max(10, Math.min(left, W.innerWidth - ovlW - 10));
    top = Math.max(10, Math.min(top, W.innerHeight - 380));
    var ovl = mk('div', {
      id: 'sev8-ovl',
      css: 'top:' + top + 'px;left:' + left + 'px;width:' + ovlW + 'px;'
    });
    var hdr = mk('div', { id: 'sev8-ovl-hdr' });
    hdr.appendChild(mk('span', { id: 'sev8-ovl-title', txt: '✏ <' + info.tag + '>' }));
    var xBtn = mk('button', { cls: 'sev8-btn', type: 'button', txt: '✕' });
    xBtn.onclick = closeOvl;
    hdr.appendChild(xBtn); ovl.appendChild(hdr);

    var ta = null;
    if (info.type === 'text' || info.type === 'both') {
      if (info.tag === 'a')
        ovl.appendChild(mk('div', {
          cls: 'sev8-sub-lbl',
          css: 'margin-bottom:4px;', txt: 'Текст ссылки:'
        }));
      ta = mk('textarea', { cls: 'sev8-in' });
      ta.style.minHeight = '72px';
      ta.setAttribute('data-t', 'html');
      ta.value = info.node.innerHTML;
      wireFmtBar(ta); ovl.appendChild(ta);
    }

    /* Атрибуты в оверлее (сохраняются кнопкой «Сохранить») */
    var attrInps = {};
    if ((info.type === 'attrs' || info.type === 'both') && info.attrs) {
      var always = CFG.ATTR_ALWAYS[info.tag] || {};
      info.attrs.forEach(function (attr) {
        if (!info.node.hasAttribute(attr) && !always[attr]) return;
        var row2 = mk('div', { cls: 'sev8-ovl-atrow' });
        row2.appendChild(mk('span', { cls: 'sev8-ovl-atlbl', txt: attr + ':' }));
        var ai = buildAttrInput(attr, info.node.getAttribute(attr) || '');
        ai.style.cssText += 'flex:1;min-width:0;margin-bottom:0;';
        attrInps[attr] = ai; row2.appendChild(ai); ovl.appendChild(row2);
      });
    }

    var btns = mk('div', { id: 'sev8-ovl-btns' });
    var cancelBtn = mk('button', { cls: 'sev8-btn', type: 'button', txt: 'Отмена' });
    cancelBtn.onclick = closeOvl;
    var saveBtn = mk('button', { cls: 'sev8-btn primary', type: 'button', txt: '✓ Сохранить' });
    saveBtn.onclick = function () {
      if (ta) { info.node.innerHTML = ta.value; iEl.innerHTML = ta.value; }
      Object.keys(attrInps).forEach(function (a) {
        var val = attrInps[a].value;
        if (val) { info.node.setAttribute(a, val); iEl.setAttribute(a, val); }
        else { info.node.removeAttribute(a); iEl.removeAttribute(a); }
      });
      /* auto rel=noopener при _blank */
      if (attrInps['target'] && attrInps['target'].value === '_blank' &&
        attrInps['rel'] && !attrInps['rel'].value) {
        attrInps['rel'].value = 'noopener';
        info.node.setAttribute('rel', 'noopener');
        iEl.setAttribute('rel', 'noopener');
      }
      closeOvl(); syncNow();
    };
    ovl.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
    });
    btns.appendChild(cancelBtn); btns.appendChild(saveBtn); ovl.appendChild(btns);
    D.body.appendChild(ovl);
    setTimeout(function () {
      if (ta) { ta.focus(); }
      else { var f = ovl.querySelector('input,select'); if (f) f.focus(); }
    }, 30);
  }

  function closeOvl() {
    var o = D.getElementById('sev8-ovl'); if (o) o.remove();
    if (S.curIframe) {
      try {
        var iDoc = S.curIframe.contentDocument || S.curIframe.contentWindow.document;
        Array.prototype.forEach.call(iDoc.querySelectorAll('.sev8-active'),
          function (e) { e.classList.remove('sev8-active'); });
      } catch (e) { }
    }
  }

  /* ════════ РЕЖИМ: ИСХОДНИК ════════ */
  function buildSource() {
    S.curIframe = null; S.srcTa = null;
    var wrap = mk('div', { id: 'sev8-src' });
    var bar = mk('div', { cls: 'sev8-bar warn' });
    bar.appendChild(mk('span', {
      cls: 'sev8-bar-txt',
      html: '⚠ Исходный HTML. <b>Ctrl+S</b> / <b>Ctrl+Enter</b> — применить.'
    }));
    var fmtBtn = mk('button', { cls: 'sev8-btn', type: 'button', txt: '⚙ Форматировать' });
    var applyBtn = mk('button', { cls: 'sev8-btn primary', type: 'button', txt: '✓ Применить' });
    bar.appendChild(fmtBtn); bar.appendChild(applyBtn); wrap.appendChild(bar);

    var srcStatus = mk('div', { id: 'sev8-src-status', txt: '' });
    var taWrap = mk('div', { id: 'sev8-src-wrap' });
    var ta = mk('textarea', { id: 'sev8-src-ta' });
    ta.value = S.rawHtml; S.srcTa = ta;

    function updateStatus() {
      srcStatus.textContent = ta.value.split('\n').length +
        ' стр. / ' + ta.value.length + ' симв.';
    }
    updateStatus();
    function applySource() {
      var newHtml = ta.value; if (newHtml === S.rawHtml) return;
      S.rawHtml = newHtml; parseAndMark(S.rawHtml); writeHTML(S.rawHtml);
      histPush(S.rawHtml); setStatus('Исходник применён ✓', 2500);
    }
    applyBtn.onclick = applySource;
    fmtBtn.onclick = function () { ta.value = fmtHTML(ta.value); updateStatus(); applySource(); };
    ta.addEventListener('input', function () { updateStatus(); setStatus('● изменено'); });
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
        e.preventDefault(); applySource(); setStatus('Применено ✓', 2000);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        var start = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 2;
      }
    });
    ta.addEventListener('blur', function () { if (ta.value !== S.rawHtml) applySource(); });
    taWrap.appendChild(ta); taWrap.appendChild(srcStatus); wrap.appendChild(taWrap);
    return wrap;
  }

  /* ════════ HTML ФОРМАТТЕР ════════ */
  function fmtHTML(src) {
    var TAB = '  ';
    var BLOCK = /^(div|section|article|header|footer|main|nav|aside|p|ul|ol|li|table|thead|tbody|tfoot|tr|caption|blockquote|figure|figcaption|h[1-6]|form|fieldset|dl|dt|dd|address|details|summary|dialog|picture)$/;
    var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
    var RAW = /^(pre|code|textarea|script|style|noscript|template)$/;
    function serAttrs(el) {
      var s = '';
      Array.prototype.forEach.call(el.attributes, function (a) {
        s += ' ' + a.name + '="' + a.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"';
      });
      return s;
    }
    function hasBlockChild(el) {
      var r = false;
      Array.prototype.forEach.call(el.childNodes, function (c) {
        if (c.nodeType === 1 && BLOCK.test(c.tagName.toLowerCase())) r = true;
      });
      return r;
    }
    function ser(node, depth) {
      var out = '';
      Array.prototype.forEach.call(node.childNodes, function (c) {
        var pad = TAB.repeat(Math.max(0, depth));
        if (c.nodeType === 8) {
          out += pad + '<!--' + c.nodeValue + '-->\n';
        } else if (c.nodeType === 3) {
          var txt = c.nodeValue.replace(/\s+/g, ' ').trim();
          if (txt) out += pad + txt + '\n';
        } else if (c.nodeType === 1) {
          var tag = c.tagName.toLowerCase(), attrs = serAttrs(c);
          if (VOID.test(tag)) {
            out += pad + '<' + tag + attrs + '>\n';
          } else if (RAW.test(tag)) {
            out += pad + '<' + tag + attrs + '>' + c.innerHTML + '</' + tag + '>\n';
          } else if (BLOCK.test(tag)) {
            if (!hasBlockChild(c) && c.innerHTML.trim())
              out += pad + '<' + tag + attrs + '>' +
                c.innerHTML.replace(/\s+/g, ' ').trim() + '</' + tag + '>\n';
            else if (!c.innerHTML.trim())
              out += pad + '<' + tag + attrs + '></' + tag + '>\n';
            else {
              out += pad + '<' + tag + attrs + '>\n';
              out += ser(c, depth + 1);
              out += pad + '</' + tag + '>\n';
            }
          } else {
            out += pad + c.outerHTML + '\n';
          }
        }
      });
      return out;
    }
    var savedTokens = S.tokens.slice();
    var safe = tokenize(src);
    var doc;
    try {
      doc = (new DOMParser()).parseFromString(
        '<!DOCTYPE html><html><head></head><body>' + safe + '</body></html>', 'text/html');
    } catch (e) { S.tokens = savedTokens; return src; }
    var result = ser(doc.body, 0).replace(/\n{3,}/g, '\n\n').trim();
    var restored = detokenize(result);
    S.tokens = savedTokens;
    return restored;
  }

  /* ════════ МОНТИРОВАНИЕ ════════ */
  function mount(rawHtml) {
    injectCSS();
    S.rawHtml = rawHtml;
    S.histKey = histGetKey();
    parseAndMark(rawHtml);

    histOpen(function (db) {
      S.histDb = db;
      histLoad(db, S.histKey, rawHtml, function (stack, pos) {
        if (!stack.length) {
          S.histStack = [rawHtml]; S.histPos = 0;
          histSave(db, S.histKey, S.histStack, S.histPos);
        } else { S.histStack = stack; S.histPos = pos; }
        histUpdateBtns();
      });
    });

    var edH;
    if (S.aceMode && S.aceEl)
      edH = Math.max((parseInt(S.aceEl.style.height) || 400) + 80, 560);
    else if (S.nativeTa)
      edH = Math.max((S.nativeTa.offsetHeight || 300) + 120, 520);
    else
      edH = 560;

    if (S.aceMode && S.aceEl) S.aceEl.style.display = 'none';
    else if (S.nativeTa) S.nativeTa.style.display = 'none';

    var insertTarget = S.aceMode && S.aceEl
      ? S.aceEl.parentElement
      : (S.nativeTa ? S.nativeTa.parentElement : null);
    if (!insertTarget) { L('ERR: не найден контейнер для вставки редактора'); return; }

    S.rootEl = mk('div', { id: 'sev8', css: 'height:' + edH + 'px;' });
    var area = mk('div', { id: 'sev8-area' });

    var tb = buildToolbar(function (mode) {
      closeOvl(); S.curIframe = null; S.srcTa = null; S.activeTab = mode;
      if (S.fmtBar) S.fmtBar.classList.add('dimmed'); S.fmtTarget = null;
      area.innerHTML = '';
      switch (mode) {
        case 'struct': loadFromRaw(); S.cardsEl = null; area.appendChild(buildStruct()); break;
        case 'visual': area.appendChild(buildVisual()); break;
        case 'source': area.appendChild(buildSource()); break;
      }
    });
    S.rootEl.appendChild(tb.node);
    S.rootEl.appendChild(area);

    if (S.aceMode && S.aceEl) insertTarget.insertBefore(S.rootEl, S.aceEl);
    else if (S.nativeTa) insertTarget.insertBefore(S.rootEl, S.nativeTa);

    hookSave();

    D.addEventListener('keydown', function (e) {
      if (!S.rootEl || S.rootEl.style.display === 'none') return;
      var ae = D.activeElement;
      var inEd = !ae || ae === D.body || (S.rootEl && S.rootEl.contains(ae));
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z' && inEd) { e.preventDefault(); histUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z')) && inEd) { e.preventDefault(); histRedo(); }
    }, false);

    tb.tabs['struct'].click();

    var nc = Object.keys(S.map).length;
    var ns = findSections(S.doc.body).length;
    var nt = S.tokens.length;
    L('Секций:' + ns + ' узлов:' + nc + ' токенов:' + nt + ' HTML:' + rawHtml.length + 'б');
    setStatus(nc + ' элем. / ' + ns + ' секц. / ' + nt + ' блоков', 4000);
  }

  /* ════════ ХУКИ СОХРАНЕНИЯ ════════ */
  function hookSave() {
    D.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { syncNow(); clickModxSave(); }
    }, false);
    var form = D.querySelector('form.x-form');
    if (form) form.addEventListener('submit', syncNow, true);
    setTimeout(hookModxButtons, 2000);
    if (W.MutationObserver) {
      var mo = new MutationObserver(debounce(hookModxButtons, 500));
      mo.observe(D.body, { childList: true, subtree: false });
      setTimeout(function () { mo.disconnect(); }, 30000);
    }
    if (W.MODx && MODx.on) { try { MODx.on('beforeSave', syncNow); } catch (e) { } }
  }

  function hookModxButtons() {
    var btns = D.querySelectorAll('.x-btn-text,.x-btn>em>button');
    Array.prototype.forEach.call(btns, function (b) {
      var txt = (b.textContent || '').trim();
      if (/^(сохран|save)/i.test(txt) && !b._sev8h) {
        b._sev8h = true;
        var p = b.closest ? b.closest('.x-btn') : b.parentElement;
        if (p) p.addEventListener('mousedown', syncNow, true);
      }
    });
  }

  function clickModxSave() {
    var btns = D.querySelectorAll('.x-btn-text');
    Array.prototype.forEach.call(btns, function (b) {
      if (/^(сохран|save)/i.test((b.textContent || '').trim())) {
        var p = b.closest ? b.closest('.x-btn') : b.parentElement;
        if (p) setTimeout(function () { p.click(); }, 50);
      }
    });
  }

  /* ════════ POLLING ════════ */
  function tryMountWithAce() {
    var aceDiv = D.querySelector('.ace_editor');
    if (!aceDiv || !aceDiv.offsetHeight) return false;
    var aceInst = resolveAce(aceDiv);
    if (!aceInst) return false;
    var val = '';
    try { val = aceInst.getValue(); } catch (e) { return false; }
    S.aceMode = true; S.aceEl = aceDiv; S.ace = aceInst;
    L('ACE mode. len=' + val.length);
    mount(val); return true;
  }

  function tryMountNative() {
    var formReady = D.querySelector('.x-form-item,.x-form-el,[id*="modx-resource"]');
    if (!formReady) return false;
    var ta = findNativeTextarea();
    if (!ta) return false;
    S.aceMode = false; S.nativeTa = ta;
    var val = ta.value || '';
    L('Native mode. textarea id="' + ta.id + '" len=' + val.length);
    mount(val); return true;
  }

  function startPolling() {
    if (S.mounted) return;
    S.mounted = true;
    L('Polling start...');
    var tries = 0;
    var tim = setInterval(function () {
      if (++tries > CFG.POLL_MAX) {
        clearInterval(tim);
        L('Polling timeout. Финальный native-поиск...');
        if (!tryMountNative()) { L('ERR: редактор не найден.'); S.mounted = false; }
        return;
      }
      if (tryMountWithAce()) { clearInterval(tim); return; }
      if (tryMountNative()) { clearInterval(tim); return; }
    }, CFG.POLL_MS);
  }

  /* ════════ ТОЧКА ВХОДА ════════ */
  function tryMODxReady() {
    if (W.MODx && MODx.on) {
      try {
        MODx.on('ready', function () { setTimeout(startPolling, 200); });
        L('MODx.on(ready) OK'); return true;
      } catch (e) { }
    }
    return false;
  }

  if (W.Ext) {
    Ext.onReady(function () {
      if (!tryMODxReady()) {
        var w = setInterval(function () {
          if (tryMODxReady()) clearInterval(w);
        }, 80);
        setTimeout(function () {
          clearInterval(w);
          if (!S.mounted) startPolling();
        }, 8000);
      }
      setTimeout(function () { if (!S.mounted) startPolling(); }, 1500);
    });
  } else {
    var waitExt = setInterval(function () {
      if (W.Ext) {
        clearInterval(waitExt);
        Ext.onReady(function () {
          tryMODxReady();
          setTimeout(function () { if (!S.mounted) startPolling(); }, 1500);
        });
      }
    }, 150);
    setTimeout(function () {
      if (!S.mounted) { L('ExtJS не обнаружен, прямой запуск...'); startPolling(); }
    }, 15000);
  }

  /* ════════ TEST-MODE EXPORT ════════════════════════════════════════════════
   * Activated ONLY when  window._sev8testMode === true  is set before this
   * script loads (see struct-editor.html test stand).
   * Has ZERO effect in production — never set this flag on a live MODX site.
   * ═══════════════════════════════════════════════════════════════════════ */
  if (W._sev8testMode) {
    W._sev8 = {
      /* ── pure / stateless helpers ────────────────────────────────────── */
      simpleHash: simpleHash,
      tokenize: tokenize,
      detokenize: detokenize,
      fmtHTML: fmtHTML,   // internally saves/restores S.tokens — safe
      /* ── stateful (modify S — use only from integration tests) ─────── */
      parseAndMark: parseAndMark,
      serialize: serialize,
      syncNow: syncNow,
      cleanSpaces: cleanSpaces,
      histPush: histPush,
      histUndo: histUndo,
      histRedo: histRedo,
      histApply: histApply,
      histUpdateBtns: histUpdateBtns,
      buildTreeView2: buildTreeView2,
      /* ── live config & state references ─────────────────────────────── */
      CFG: CFG,
      C: C,
      S: S,
      /* ── unit-safe wrappers: save/restore S so unit tests cannot       ──
         corrupt the mounted editor state.  Use these in Unit: suites.   ── */
      /**
       * Parses html like parseAndMark() but saves and restores S.*
       * Returns { doc, map, tok } — pass the whole object to serializeUnit().
       */
      parseAndMarkUnit: function (html) {
        var sv = { doc: S.doc, map: S.map, idx: S.idx, tok: S.tokens.slice() };
        parseAndMark(html);
        var r = { doc: S.doc, map: S.map, tok: S.tokens.slice() };
        S.doc = sv.doc; S.map = sv.map; S.idx = sv.idx; S.tokens = sv.tok;
        return r;
      },
      /**
       * Serializes the result of parseAndMarkUnit() without touching S.
       * @param {object} r  – return value of parseAndMarkUnit()
       */
      serializeUnit: function (r) {
        if (!r || !r.doc) return '';
        var sv = { doc: S.doc, map: S.map, tok: S.tokens.slice() };
        S.doc = r.doc; S.map = r.map; S.tokens = r.tok || [];
        var html = serialize();
        S.doc = sv.doc; S.map = sv.map; S.tokens = sv.tok;
        return html;
      },
    };
    L('Test-mode: window._sev8 exported');
  }

})(window, document);
