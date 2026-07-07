import { winner, bestMoveTimeboxed, findWinLine } from '../ai/engine.js';

describe('winner', () => {
  test('detects horizontal win for player 1', () => {
    const board = [[1], [1], [1], [1], [], [], []];
    expect(winner(board)).toBe(1);
  });
});

describe('findWinLine', () => {
  test('identifies vertical win line for player -1', () => {
    const board = [[-1, -1, -1, -1], [], [], [], [], [], []];
    const line = findWinLine(board);
    expect(line).toEqual([
      { r: 2, c: 0 },
      { r: 3, c: 0 },
      { r: 4, c: 0 },
      { r: 5, c: 0 },
    ]);
  });
});

describe('bestMoveTimeboxed', () => {
  test('chooses winning move within time limit', () => {
    const board = [[1], [1], [1], [], [], [], []];
    const result = bestMoveTimeboxed(board, 1, 100);
    expect(result.best).toBe(3);
  });

  test('AI takes its own immediate win', () => {
    // AI (-1) has three across the bottom in columns 0,1,2 -> play col 3.
    const board = [[-1], [-1], [-1], [], [], [], []];
    expect(bestMoveTimeboxed(board, -1, 200, 8).best).toBe(3);
  });

  test('AI blocks an opponent win-in-1 (regression: hard AI must not lose in 1)', () => {
    // Player (1) threatens to complete four at column 3; AI (-1) has no win of
    // its own, so a correct search must block at column 3.
    const board = [[1], [1], [1], [], [], [], []];
    expect(bestMoveTimeboxed(board, -1, 200, 8).best).toBe(3);
  });

  test('AI finds a blocking move over a shallow distraction', () => {
    // Player has a vertical three in column 0 (threatens col 0). AI must block
    // at column 0 rather than build elsewhere.
    const board = [[1, 1, 1], [-1], [-1], [], [], [], []];
    expect(bestMoveTimeboxed(board, -1, 200, 8).best).toBe(0);
  });
});
