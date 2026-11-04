(() => {
  'use strict';
  const { LEVELS, POOLS } = WS_DATA;
  const { generate } = WordSearch;
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'wordsearch.v1';
  const HUES = [200, 340, 140, 30, 270, 170, 50, 310, 100, 220];
  const COMPASS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

  const el = {
    grid: $('#grid'), scroll: $('#grid-scroll'), list: $('#word-list'), levels: $('#levels'),
    foundStat: $('#found-stat'), hintStat: $('#hint-stat'), bar: $('#progress-bar'),
    badge: $('#level-badge'), title: $('#level-title'), count: $('#words-count'), toast: $('#toast'),
    dialog: $('#result'),
  };

  /* ---------- 저장 ---------- */
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && Number.isInteger(s.unlocked)) {
        return { unlocked: Math.min(Math.max(s.unlocked, 1), LEVELS.length), best: s.best || {}, level: s.level || 1 };
      }
    } catch (_) { /* 저장소를 쓸 수 없어도 게임은 동작 */ }
    return { unlocked: 1, best: {}, level: 1 };
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {}
  }
  const save = load();

  /* ---------- 유틸 ---------- */
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 1300);
  }

  /* ---------- 게임 상태 ---------- */
  let S = null;
  let cells = [];
  let selNodes = [];
  let anchorNode = null;
  let drag = null;

  function startLevel(n) {
    const cfg = LEVELS[n - 1];
    const pool = [...new Set(cfg.pools.flatMap((p) => POOLS[p]))]
      .map((w) => w.toUpperCase())
      .filter((w) => w.length >= 3 && w.length <= cfg.size);
    const picked = shuffle(pool).slice(0, cfg.count);
    const puzzle = generate(cfg.size, picked, cfg.dirs);

    S = {
      level: n, cfg, size: cfg.size, grid: puzzle.grid, placements: puzzle.placements,
      words: puzzle.words.slice().sort(), found: new Set(), hints: 0,
      done: false, zoom: 1, cell: 24,
    };
    save.level = n; persist();

    el.badge.textContent = `LEVEL ${n}`;
    el.title.textContent = `${cfg.title} · ${cfg.ko}`;
    el.grid.innerHTML = S.grid.map((ch, i) => `<div class="cell" data-i="${i}">${ch}</div>`).join('');
    cells = [...el.grid.children];
    selNodes = []; anchorNode = null; drag = null;
    el.list.innerHTML = S.words.map((w) => `<li data-w="${w}">${w}</li>`).join('');
    el.scroll.scrollTo(0, 0);
    renderLevels();
    updateStats();
    layout();
  }

  function layout() {
    if (!S) return;
    const avail = el.scroll.clientWidth - 14;
    const base = Math.max(10, Math.min(44, Math.floor(avail / S.size)));
    S.cell = Math.max(10, Math.round(base * S.zoom));
    el.grid.style.setProperty('--cell', S.cell + 'px');
    el.grid.style.gridTemplateColumns = `repeat(${S.size}, ${S.cell}px)`;
    applyPan();
  }
  // 기본: 터치로 바로 드래그 선택. 확대했을 때만 '이동' 모드로 스크롤.
  function applyPan() {
    const overflow = S.cell * S.size > el.scroll.clientWidth - 14;
    const btn = $('#pan');
    btn.hidden = !overflow;
    if (!overflow) S.pan = false;
    btn.setAttribute('aria-pressed', !!S.pan);
    btn.classList.toggle('primary', !!S.pan);
    el.grid.style.touchAction = S.pan ? 'pan-x pan-y' : 'none';
  }

  function updateStats() {
    const total = S.words.length;
    el.foundStat.textContent = `${S.found.size}/${total}`;
    el.hintStat.textContent = S.hints;
    el.count.textContent = `${S.found.size} / ${total}`;
    el.bar.style.width = (S.found.size / total) * 100 + '%';
  }

  function renderLevels() {
    el.levels.innerHTML = LEVELS.map((_, i) => {
      const n = i + 1;
      const cls = ['chip', n === S.level ? 'active' : '', save.best[n] != null && n !== S.level ? 'done' : ''].join(' ');
      return `<button class="${cls}" data-level="${n}" type="button" ${n > save.unlocked ? 'disabled' : ''} aria-label="${n}단계${n > save.unlocked ? ' (잠김)' : ''}">${n > save.unlocked ? '🔒' : n}</button>`;
    }).join('');
  }

  /* ---------- 선택 로직 ---------- */
  function cellAt(e) {
    const rect = el.grid.getBoundingClientRect();
    const c = Math.min(S.size - 1, Math.max(0, Math.floor((e.clientX - rect.left) / S.cell)));
    const r = Math.min(S.size - 1, Math.max(0, Math.floor((e.clientY - rect.top) / S.cell)));
    return [r, c];
  }

  function lineBetween(a, b) {
    const [r0, c0] = a, [r1, c1] = b;
    const dr = r1 - r0, dc = c1 - c0;
    if (!dr && !dc) return [a];
    const k = ((Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) % 8) + 8) % 8;
    const [sr, sc] = COMPASS[k];
    const len = sr && sc ? Math.round((Math.abs(dr) + Math.abs(dc)) / 2) : Math.max(Math.abs(dr), Math.abs(dc));
    const out = [];
    for (let i = 0; i <= len; i++) {
      const r = r0 + sr * i, c = c0 + sc * i;
      if (r < 0 || c < 0 || r >= S.size || c >= S.size) break;
      out.push([r, c]);
    }
    return out;
  }

  const node = ([r, c]) => cells[r * S.size + c];
  function preview(line) {
    selNodes.forEach((n) => n.classList.remove('sel'));
    selNodes = line.map(node);
    selNodes.forEach((n) => n.classList.add('sel'));
  }
  function clearPreview() { preview([]); }
  function setAnchor(cell) {
    if (anchorNode) anchorNode.classList.remove('anchor');
    anchorNode = cell ? node(cell) : null;
    if (anchorNode) anchorNode.classList.add('anchor');
  }

  function evaluate(line) {
    if (line.length < 2) return;
    const str = line.map(([r, c]) => S.grid[r * S.size + c]).join('');
    const rev = [...str].reverse().join('');
    const hit = S.words.find((w) => !S.found.has(w) && (w === str || w === rev));
    if (hit) return markFound(hit, line);
    const nodes = line.map(node);
    nodes.forEach((n) => n.classList.add('wrong'));
    setTimeout(() => nodes.forEach((n) => n.classList.remove('wrong')), 350);
  }

  function markFound(word, line) {
    const idx = S.found.size;
    S.found.add(word);
    const hue = HUES[idx % HUES.length];
    line.map(node).forEach((n) => { n.classList.add('found'); n.style.setProperty('--h', hue); });
    el.list.querySelector(`[data-w="${word}"]`).classList.add('found');
    toast(`✓ ${word}`);
    updateStats();
    if (S.found.size === S.words.length) finish();
  }

  el.grid.addEventListener('pointerdown', (e) => {
    if (!S || S.done || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const start = cellAt(e);
    drag = { start, moved: false };
    if (e.pointerType !== 'mouse') e.preventDefault();
    try { el.grid.setPointerCapture(e.pointerId); } catch (_) {}
    preview([start]);
  });
  el.grid.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const cur = cellAt(e);
    if (cur[0] !== drag.start[0] || cur[1] !== drag.start[1]) drag.moved = true;
    if (drag.moved) preview(lineBetween(drag.start, cur));
  });
  el.grid.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const end = cellAt(e);
    const d = drag; drag = null;
    clearPreview();
    if (d.moved) {
      setAnchor(null);
      evaluate(lineBetween(d.start, end));
    } else if (!anchorNode) {
      setAnchor(d.start);
    } else if (anchorNode === node(d.start)) {
      setAnchor(null);
    } else {
      const a = [Math.floor(+anchorNode.dataset.i / S.size), +anchorNode.dataset.i % S.size];
      setAnchor(null);
      evaluate(lineBetween(a, d.start));
    }
  });
  el.grid.addEventListener('pointercancel', () => { drag = null; clearPreview(); });

  /* ---------- 힌트 / 줌 / 버튼 ---------- */
  $('#hint').addEventListener('click', () => {
    if (!S || S.done) return;
    const left = S.words.filter((w) => !S.found.has(w));
    if (!left.length) return;
    const w = left[Math.floor(Math.random() * left.length)];
    const p = S.placements[w];
    const n = cells[p.r * S.size + p.c];
    S.hints++; updateStats();
    n.classList.remove('hint'); void n.offsetWidth; n.classList.add('hint');
    n.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    setTimeout(() => n.classList.remove('hint'), 2200);
    toast(`💡 "${w[0]}"로 시작하는 ${w.length}글자`);
  });
  const zoom = (d) => { S.zoom = Math.min(2, Math.max(0.6, +(S.zoom + d).toFixed(2))); layout(); };
  $('#zoom-in').addEventListener('click', () => zoom(0.2));
  $('#zoom-out').addEventListener('click', () => zoom(-0.2));
  $('#pan').addEventListener('click', () => { S.pan = !S.pan; applyPan(); toast(S.pan ? '✋ 이동 모드: 밀어서 스크롤' : '✏️ 선택 모드: 드래그로 단어 찾기'); });
  $('#restart').addEventListener('click', () => startLevel(S.level));
  el.levels.addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (b && !b.disabled) startLevel(+b.dataset.level);
  });
  new ResizeObserver(layout).observe(el.scroll);

  /* ---------- 클리어 ---------- */
  function finish() {
    S.done = true;
    save.best[S.level] = true;
    const last = S.level === LEVELS.length;
    if (!last) save.unlocked = Math.max(save.unlocked, S.level + 1);
    persist();
    renderLevels();

    $('#result-emoji').textContent = last ? '🏆' : '🎉';
    $('#result-title').textContent = last ? '모든 단계 클리어!' : `Level ${S.level} 클리어!`;
    $('#result-sub').textContent = last ? '당신은 진정한 워드서치 마스터예요.' : `${S.words.length}개 단어를 모두 찾았어요.`;
    $('#r-words').textContent = S.words.length;
    $('#r-hints').textContent = S.hints;
    $('#r-next').textContent = last ? '처음부터 →' : '다음 단계 →';
    setTimeout(() => el.dialog.showModal(), 700);
  }
  $('#r-next').addEventListener('click', () => {
    const next = S.level === LEVELS.length ? 1 : S.level + 1;
    el.dialog.close();
    startLevel(next);
  });
  $('#r-retry').addEventListener('click', () => { el.dialog.close(); startLevel(S.level); });

  startLevel(Math.min(save.level, save.unlocked));
})();
