import { slide, newBoard, SIZE } from "../src/utils/twentyHelpers.js";

const base = { score: 0, won: false, over: false, moves: 0 };

function stateFrom(cells) {
  // cells: array of {r,c,value,id}
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  const tiles = cells.map((t) => ({ ...t, isNew: false, merged: false }));
  cells.forEach((t) => { grid[t.r][t.c] = t.value; });
  return { ...base, grid, tiles };
}

test("newBoard starts with exactly two tiles", () => {
  const s = newBoard();
  expect(s.tiles).toHaveLength(2);
  const nonEmpty = s.grid.flat().filter((v) => v !== 0);
  expect(nonEmpty).toHaveLength(2);
});

test("sliding left merges equal neighbours and scores the sum", () => {
  const s = stateFrom([
    { r: 0, c: 0, value: 2, id: 10 },
    { r: 0, c: 1, value: 2, id: 11 },
  ]);
  const after = slide(s, "left");
  expect(after.grid[0][0]).toBe(4);
  expect(after.score).toBe(4);
  expect(after.lastMerges).toBe(1);
  const mergedTile = after.tiles.find((t) => t.r === 0 && t.c === 0);
  expect(mergedTile.value).toBe(4);
  expect(mergedTile.merged).toBe(true);
  // Merge keeps the front tile's id (identity preserved for animation).
  expect(mergedTile.id).toBe(10);
});

test("a sliding tile keeps its id (no remount)", () => {
  const s = stateFrom([{ r: 0, c: 0, value: 2, id: 42 }]);
  const after = slide(s, "right");
  const moved = after.tiles.find((t) => t.id === 42);
  expect(moved).toBeDefined();
  expect(moved.r).toBe(0);
  expect(moved.c).toBe(SIZE - 1);
  expect(moved.value).toBe(2);
});

test("a move that changes nothing returns the same state and does not spawn", () => {
  const s = stateFrom([
    { r: 0, c: 0, value: 2, id: 1 },
    { r: 0, c: 1, value: 4, id: 2 },
    { r: 0, c: 2, value: 8, id: 3 },
    { r: 0, c: 3, value: 16, id: 4 },
    { r: 1, c: 0, value: 32, id: 5 },
    { r: 2, c: 0, value: 64, id: 6 },
    { r: 3, c: 0, value: 128, id: 7 },
  ]);
  const after = slide(s, "left");
  expect(after).toBe(s);
});

test("three equal tiles in a line merge only the front pair", () => {
  const s = stateFrom([
    { r: 0, c: 0, value: 2, id: 1 },
    { r: 0, c: 1, value: 2, id: 2 },
    { r: 0, c: 2, value: 2, id: 3 },
  ]);
  const after = slide(s, "left");
  expect(after.grid[0][0]).toBe(4);
  expect(after.grid[0][1]).toBe(2);
  expect(after.lastMerges).toBe(1);
});
