/* ════════════════════════════════════════════════════
   2048 game logic — pure functions, no React.
   Board is a 4x4 grid of numbers (0 = empty).
   ════════════════════════════════════════════════════ */

export const SIZE = 4;
export const WIN_TILE = 2048;

export const BEST_KEY = "mm4_2048_best";

let _id = 1;
export const nextId = () => ++_id;

/** Create a fresh board with two starter tiles. */
export function newBoard() {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  return spawnTile(spawnTile({ grid, tiles: [], score: 0, won: false, over: false, moves: 0 }, true), true);
}

function emptyCells(grid) {
  const out = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) out.push([r, c]);
  return out;
}

/** Place a 2 (90%) or 4 (10%) on a random empty cell. */
export function spawnTile(state, fromInit = false) {
  const cells = emptyCells(state.grid);
  if (!cells.length) return state;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const grid = state.grid.map(row => row.slice());
  grid[r][c] = value;
  const id = nextId();
  const tiles = state.tiles.concat([{ id, r, c, value, isNew: !fromInit, merged: false }]);
  return { ...state, grid, tiles };
}

/* ── Move logic ──
   Tiles are tracked by identity so the UI can animate slides and merges.
   For each line (row or column) in the direction of travel we walk the tiles
   front-first, merging equal neighbours. Surviving and merged tiles keep a
   stable id (a merge keeps the front tile's id and flags `merged`), so React
   reuses the DOM node and the CSS position transition animates. Rebuilding the
   tile list with fresh ids every move — as before — remounted every tile and
   killed the animation. */

/** The four lines for a direction, each as [r,c] cells in travel order (the
 *  destination edge first). */
function linePositions(dir) {
  const lines = [];
  for (let i = 0; i < SIZE; i++) {
    const line = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === "left") line.push([i, j]);
      else if (dir === "right") line.push([i, SIZE - 1 - j]);
      else if (dir === "up") line.push([j, i]);
      else line.push([SIZE - 1 - j, i]); // down
    }
    lines.push(line);
  }
  return lines;
}

function gridsEqual(a, b) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

/**
 * Slide direction: "left" | "right" | "up" | "down".
 * Returns the next state, preserving tile identity. Does not spawn a new tile
 * if nothing moved.
 */
export function slide(state, dir) {
  if (state.over) return state;

  const tileAt = new Map();
  for (const t of state.tiles) tileAt.set(t.r * SIZE + t.c, t);

  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  const tiles = [];
  let gained = 0, merges = 0, won = state.won;

  for (const line of linePositions(dir)) {
    const present = [];
    for (const [r, c] of line) {
      const t = tileAt.get(r * SIZE + c);
      if (t) present.push(t);
    }
    const out = [];
    for (let i = 0; i < present.length; i++) {
      if (i + 1 < present.length && present[i].value === present[i + 1].value) {
        const value = present[i].value * 2;
        out.push({ id: present[i].id, value, merged: true });
        gained += value;
        merges++;
        i++; // consume the tile that merged in
      } else {
        out.push({ id: present[i].id, value: present[i].value, merged: false });
      }
    }
    for (let k = 0; k < out.length; k++) {
      const [r, c] = line[k];
      grid[r][c] = out[k].value;
      tiles.push({ id: out[k].id, r, c, value: out[k].value, isNew: false, merged: out[k].merged });
      if (out[k].value >= WIN_TILE) won = true;
    }
  }

  if (gridsEqual(grid, state.grid)) return state;

  let after = {
    ...state,
    grid,
    tiles,
    score: state.score + gained,
    moves: state.moves + 1,
    won,
    lastGain: gained,
    lastMerges: merges,
  };
  after = spawnTile(after);
  after.over = !canMove(after.grid);
  return after;
}

export function canMove(grid) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!grid[r][c]) return true;
    if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
    if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
  }
  return false;
}

export function maxTile(grid) {
  let m = 0;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] > m) m = grid[r][c];
  return m;
}

export function loadBest() {
  try { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0; } catch { return 0; }
}
export function saveBest(score) {
  try { localStorage.setItem(BEST_KEY, String(score)); } catch {}
}
