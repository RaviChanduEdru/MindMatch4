export const PUZZLES = [
  {
    id: "square-puzzle",
    title: "Window Frame",
    description: "Fill the square with all the pieces.",
    rows: 4,
    cols: 4,
    target: [
      [0, 0], [1, 0], [2, 0], [3, 0],
      [0, 1], [1, 1], [2, 1], [3, 1],
      [0, 2], [1, 2], [2, 2], [3, 2],
      [0, 3], [1, 3], [2, 3], [3, 3],
    ],
    pieces: [
      {
        id: "square",
        name: "Square",
        color: "#8b5cf6",
        shape: [[0, 0], [1, 0], [0, 1], [1, 1]],
      },
      {
        id: "line",
        name: "Line",
        color: "#22d3ee",
        shape: [[0, 0], [1, 0], [2, 0], [3, 0]],
      },
      {
        id: "corner",
        name: "Corner",
        color: "#fb923c",
        shape: [[0, 0], [0, 1], [1, 0]],
      },
      {
        id: "hook",
        name: "Hook",
        color: "#10b981",
        shape: [[0, 0], [1, 0], [1, 1]],
      },
      {
        id: "pair",
        name: "Pair",
        color: "#f43f5e",
        shape: [[0, 0], [1, 0]],
      },
    ],
  },
];

const rotateCell = ([x, y], rotation) => {
  if (rotation === 0) return [x, y];
  if (rotation === 1) return [y, -x];
  if (rotation === 2) return [-x, -y];
  return [-y, x];
};

export function normalizeShape(shape, rotation = 0) {
  const rotated = shape.map((cell) => rotateCell(cell, rotation));
  const minX = Math.min(...rotated.map(([x]) => x));
  const minY = Math.min(...rotated.map(([_, y]) => y));
  return rotated.map(([x, y]) => [x - minX, y - minY]);
}

export function getPieceCells(piece, rotation = 0, origin = { x: 0, y: 0 }) {
  return normalizeShape(piece.shape, rotation).map(([x, y]) => [origin.x + x, origin.y + y]);
}

export function getTargetSet(puzzle) {
  return new Set(puzzle.target.map(([x, y]) => `${x},${y}`));
}

export function buildOccupancy(puzzle, placements) {
  const map = {};
  for (const [pieceId, placement] of Object.entries(placements)) {
    const piece = puzzle.pieces.find((p) => p.id === pieceId);
    if (!piece) continue;
    const cells = getPieceCells(piece, placement.rotation, placement.origin);
    cells.forEach(([x, y]) => {
      map[`${x},${y}`] = pieceId;
    });
  }
  return map;
}

export function canPlacePiece(puzzle, placements, piece, origin, rotation) {
  const targetSet = getTargetSet(puzzle);
  const occupancy = buildOccupancy(puzzle, placements);
  const cells = getPieceCells(piece, rotation, origin);
  return cells.every(([x, y]) => {
    const key = `${x},${y}`;
    if (x < 0 || x >= puzzle.cols || y < 0 || y >= puzzle.rows) return false;
    if (!targetSet.has(key)) return false;
    return !occupancy[key] || occupancy[key] === piece.id;
  });
}

export function isSolved(puzzle, placements) {
  const targetSet = getTargetSet(puzzle);
  const occupancy = buildOccupancy(puzzle, placements);
  const occupiedKeys = Object.keys(occupancy);
  if (occupiedKeys.length !== targetSet.size) return false;
  return occupiedKeys.every((key) => targetSet.has(key));
}
