export const GOMOKU_SIZE = 15;
export const BLACK = 1;
export const WHITE = -1;

const DIRECTIONS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal ↘
  [1, -1],  // diagonal ↙
];

export function createGomokuBoard() {
  return Array.from({ length: GOMOKU_SIZE }, () =>
    Array(GOMOKU_SIZE).fill(0)
  );
}

export function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function inBounds(r, c) {
  return r >= 0 && r < GOMOKU_SIZE && c >= 0 && c < GOMOKU_SIZE;
}

export function moveLabel(row, col) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

/** Returns array of 5 {row,col} positions forming the winning line, or null. */
export function findWinningStones(board) {
  for (let r = 0; r < GOMOKU_SIZE; r++) {
    for (let c = 0; c < GOMOKU_SIZE; c++) {
      const player = board[r][c];
      if (!player) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const line = [];
        for (let i = 0; i < 5; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (!inBounds(nr, nc) || board[nr][nc] !== player) break;
          line.push({ row: nr, col: nc });
        }
        if (line.length === 5) return line;
      }
    }
  }
  return null;
}

export function getWinner(board) {
  const line = findWinningStones(board);
  return line ? board[line[0].row][line[0].col] : 0;
}

export function isBoardFull(board) {
  return board.every((row) => row.every((c) => c !== 0));
}

export function isGameOver(board) {
  return !!findWinningStones(board) || isBoardFull(board);
}

export function countStones(board) {
  let black = 0, white = 0, empty = 0;
  board.forEach((row) =>
    row.forEach((c) => {
      if (c === BLACK) black++;
      else if (c === WHITE) white++;
      else empty++;
    })
  );
  return { black, white, empty };
}

/* ── AI move selection ── */

/**
 * Strength of a run of `count` friendly stones with `openEnds` empty ends.
 * Open-ended patterns are far more dangerous than blocked ones — an open four
 * (both ends free) is an unstoppable win, a blocked four is a single threat,
 * and an open three converts into an open four. The old window-sum heuristic
 * could not tell these apart, so the AI ignored open threes.
 */
function patternScore(count, openEnds) {
  if (count >= 5) return 10000000; // five in a row (win)
  if (count === 4) return openEnds >= 2 ? 1000000 : openEnds === 1 ? 100000 : 0;
  if (count === 3) return openEnds >= 2 ? 10000 : openEnds === 1 ? 1000 : 0;
  if (count === 2) return openEnds >= 2 ? 500 : openEnds === 1 ? 100 : 0;
  if (count === 1) return openEnds >= 2 ? 20 : 10;
  return 0;
}

/**
 * Best line strength obtainable by placing `player` at (r,c). The target cell
 * is treated as occupied by `player` (it is empty on the real board); the four
 * directions through it are measured for consecutive run length and open ends.
 */
function lineStrength(board, r, c, player) {
  let best = 0;
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let fr = r + dr, fc = c + dc;
    while (inBounds(fr, fc) && board[fr][fc] === player) { count++; fr += dr; fc += dc; }
    const forwardOpen = inBounds(fr, fc) && board[fr][fc] === 0;
    let br = r - dr, bc = c - dc;
    while (inBounds(br, bc) && board[br][bc] === player) { count++; br -= dr; bc -= dc; }
    const backOpen = inBounds(br, bc) && board[br][bc] === 0;
    best = Math.max(best, patternScore(count, (forwardOpen ? 1 : 0) + (backOpen ? 1 : 0)));
  }
  return best;
}

/** Collect empty cells adjacent (within distance 2) to any existing stone. */
function getCandidateMoves(board) {
  const candidates = new Set();
  const size = GOMOKU_SIZE;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc) && board[nr][nc] === 0) {
            candidates.add(nr * size + nc);
          }
        }
      }
    }
  }

  // If no stones yet, return center
  if (candidates.size === 0) {
    const mid = Math.floor(size / 2);
    candidates.add(mid * size + mid);
  }

  return Array.from(candidates).map((k) => ({
    row: Math.floor(k / size),
    col: k % size,
  }));
}

function generateNote(board, move, player) {
  // Check if this move creates a winning line
  const testBoard = cloneBoard(board);
  testBoard[move.row][move.col] = player;
  if (findWinningStones(testBoard)) return "Winning move!";

  // Check if this blocks opponent's winning threat
  const oppBoard = cloneBoard(board);
  oppBoard[move.row][move.col] = -player;
  if (findWinningStones(oppBoard)) return "Blocks a critical threat";

  const mid = Math.floor(GOMOKU_SIZE / 2);
  const dist = Math.max(Math.abs(move.row - mid), Math.abs(move.col - mid));
  if (dist <= 2) return "Strong center position";
  return "Extends influence on the board";
}

export function pickBestGomokuMove(board, player, difficulty = "Hard") {
  const candidates = getCandidateMoves(board);
  if (!candidates.length) return null;

  // Easy: random move
  if (difficulty === "Easy") {
    const move = candidates[Math.floor(Math.random() * candidates.length)];
    return { ...move, score: 0, note: generateNote(board, move, player) };
  }

  const opp = -player;
  const mid = Math.floor(GOMOKU_SIZE / 2);

  // Score each candidate by the best of (our own threat created here) and
  // (the opponent threat we deny by taking this cell). Completing five and
  // blocking the opponent's five both fall out of this naturally, as do
  // making/blocking open fours and open threes. Offense is nudged above an
  // equal defense so we press a win rather than defend when both exist.
  const scored = candidates.map((move) => {
    const offense = lineStrength(board, move.row, move.col, player);
    const defense = lineStrength(board, move.row, move.col, opp);
    let score = Math.max(offense * 1.05, defense);
    // Small positional tie-breaker toward the center.
    score += Math.max(0, 4 - Math.max(Math.abs(move.row - mid), Math.abs(move.col - mid)));
    return { ...move, offense, defense, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Hard/Expert: shallow one-ply search over the strongest candidates —
  // penalise moves that hand the opponent a bigger threat on their reply.
  if (difficulty === "Hard" || difficulty === "Expert") {
    const topN = scored.slice(0, Math.min(6, scored.length));
    const weight = difficulty === "Expert" ? 0.9 : 0.5;
    for (const cand of topN) {
      const next = cloneBoard(board);
      next[cand.row][cand.col] = player;
      let oppBest = 0;
      for (const om of getCandidateMoves(next)) {
        oppBest = Math.max(oppBest, lineStrength(next, om.row, om.col, opp));
      }
      cand.score -= oppBest * weight;
    }
    topN.sort((a, b) => b.score - a.score);
    const best = topN[0];
    return { ...best, note: generateNote(board, best, player) };
  }

  // Auto: add a little opening randomness so games don't feel scripted.
  if (difficulty === "Auto") {
    const { empty } = countStones(board);
    const movesPlayed = GOMOKU_SIZE * GOMOKU_SIZE - empty;
    if (movesPlayed < 6 && Math.random() < 0.4) {
      const top = scored.slice(0, Math.min(5, scored.length));
      const pick = top[Math.floor(Math.random() * top.length)];
      return { ...pick, note: "Warming up" };
    }
  }

  const best = scored[0];
  return { ...best, note: generateNote(board, best, player) };
}
