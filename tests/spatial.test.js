import {
  PUZZLES,
  getPieceCells,
  normalizeShape,
  canPlacePiece,
  isSolved,
} from "../src/utils/spatialHelpers.js";

test("Shape Fit helper computes normalized placement cells", () => {
  const puzzle = PUZZLES[0];
  const piece = puzzle.pieces.find((item) => item.id === "line");
  const cells = getPieceCells(piece, 1, { x: 1, y: 1 });
  expect(cells).toEqual(
    expect.arrayContaining([
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ])
  );
  expect(cells).toHaveLength(4);
});

test("canPlacePiece returns false when placement is outside the target shape", () => {
  const puzzle = PUZZLES[0];
  const piece = puzzle.pieces.find((item) => item.id === "line");
  const valid = canPlacePiece(puzzle, {}, piece, { x: 1, y: 0 }, 0);
  expect(valid).toBe(false);
});

test("isSolved returns true for a complete valid placement", () => {
  const puzzle = PUZZLES[0];
  const placements = {
    square: { origin: { x: 0, y: 0 }, rotation: 0 },
    line: { origin: { x: 0, y: 3 }, rotation: 0 },
    corner: { origin: { x: 2, y: 0 }, rotation: 0 },
    hook: { origin: { x: 2, y: 1 }, rotation: 3 },
    pair: { origin: { x: 0, y: 2 }, rotation: 0 },
  };
  expect(isSolved(puzzle, placements)).toBe(true);
});

test("All normalized piece shapes fit within the 4x4 preview grid", () => {
  const puzzle = PUZZLES[0];
  for (const piece of puzzle.pieces) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const cells = normalizeShape(piece.shape, rotation);
      expect(cells.every(([x, y]) => x >= 0 && x < 4 && y >= 0 && y < 4)).toBe(true);
    }
  }
});
