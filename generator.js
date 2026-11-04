/* 워드서치 퍼즐 생성기 */
(function (g) {
  const DIRS = {
    R: [0, 1], D: [1, 0], DR: [1, 1], UR: [-1, 1],
    L: [0, -1], U: [-1, 0], UL: [-1, -1], DL: [1, -1],
  };
  const SETS = [
    ['R', 'D'],
    ['R', 'D', 'DR'],
    ['R', 'D', 'DR', 'UR'],
    ['R', 'D', 'DR', 'UR', 'L', 'U', 'UL', 'DL'],
  ];

  const rand = (n) => Math.floor(Math.random() * n);
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function build(size, words, dirNames) {
    const grid = new Array(size * size).fill('');
    const placements = {};
    const order = shuffle(words.slice()).sort((a, b) => b.length - a.length);
    for (const w of order) {
      const opts = [];
      let best = 0;
      for (const dn of dirNames) {
        const [dr, dc] = DIRS[dn];
        const L = w.length;
        for (let r = 0; r < size; r++) {
          const er = r + dr * (L - 1);
          if (er < 0 || er >= size) continue;
          for (let c = 0; c < size; c++) {
            const ec = c + dc * (L - 1);
            if (ec < 0 || ec >= size) continue;
            let ov = 0, ok = true;
            for (let i = 0; i < L; i++) {
              const ch = grid[(r + dr * i) * size + c + dc * i];
              if (ch === '') continue;
              if (ch === w[i]) ov++; else { ok = false; break; }
            }
            if (!ok || ov === L) continue;
            opts.push([r, c, dn, ov]);
            if (ov > best) best = ov;
          }
        }
      }
      if (!opts.length) return { fail: w };
      let pool = opts;
      if (best > 0 && Math.random() < 0.6) pool = opts.filter((o) => o[3] >= Math.max(1, best - 1));
      const [r, c, dn] = pool[rand(pool.length)];
      const [dr, dc] = DIRS[dn];
      for (let i = 0; i < w.length; i++) grid[(r + dr * i) * size + c + dc * i] = w[i];
      placements[w] = { r, c, dn, len: w.length };
    }
    return { grid, placements };
  }

  function generate(size, words, dirSet) {
    const dirNames = SETS[dirSet];
    let list = words.slice();
    for (;;) {
      let failed = null;
      for (let t = 0; t < 25; t++) {
        const res = build(size, list, dirNames);
        if (!res.fail) {
          const letters = list.join('');
          for (let i = 0; i < res.grid.length; i++) {
            if (res.grid[i] === '') {
              res.grid[i] = Math.random() < 0.7
                ? letters[rand(letters.length)]
                : String.fromCharCode(65 + rand(26));
            }
          }
          return { size, grid: res.grid, placements: res.placements, words: list.slice() };
        }
        failed = res.fail;
      }
      list = list.filter((w) => w !== failed); // 끝내 못 넣은 단어는 제외
    }
  }

  g.WordSearch = { generate, DIRS };
})(globalThis);
