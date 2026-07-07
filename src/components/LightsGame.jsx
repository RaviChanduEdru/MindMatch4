import React, { useEffect, useRef, useState, useCallback } from "react";
import { SND } from "../utils/gameHelpers.js";
import {
  LEVELS,
  scramble,
  pressAt,
  isSolved,
  litCount,
  scoreFor,
  starsFor,
  loadBest,
  saveBest,
} from "../utils/lightsHelpers.js";
import { recordGame } from "../utils/progress.js";

export default function LightsGame({ level = "Medium", onBack, kidsMode = false }) {
  const cfg = LEVELS[level] || LEVELS.Medium;

  const [puzzle, setPuzzle] = useState(() => scramble(cfg.size, cfg.scramble));
  const [grid, setGrid] = useState(() => puzzle.grid);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState(() => loadBest(level));
  const recordedRef = useRef(false);

  const startPuzzle = useCallback(() => {
    const p = scramble(cfg.size, cfg.scramble);
    setPuzzle(p);
    setGrid(p.grid);
    setMoves(0);
    setWon(false);
    recordedRef.current = false;
    SND.select();
  }, [cfg.size, cfg.scramble]);

  // Start a fresh puzzle whenever the difficulty changes.
  useEffect(() => {
    const p = scramble(cfg.size, cfg.scramble);
    setPuzzle(p);
    setGrid(p.grid);
    setMoves(0);
    setWon(false);
    recordedRef.current = false;
  }, [cfg.size, cfg.scramble]);

  const press = useCallback(
    (r, c) => {
      if (won) return;
      setGrid((g) => {
        const next = pressAt(g, r, c);
        if (isSolved(next)) setWon(true);
        return next;
      });
      setMoves((m) => m + 1);
      SND.click();
    },
    [won]
  );

  // Record the win exactly once.
  useEffect(() => {
    if (!won || recordedRef.current) return;
    recordedRef.current = true;
    const totalMoves = moves;
    if (best == null || totalMoves < best) {
      setBest(totalMoves);
      saveBest(level, totalMoves);
    }
    const score = scoreFor(cfg.size, puzzle.par, totalMoves);
    recordGame("lights", { won: true, score, durationSec: totalMoves * 2, difficulty: level });
    SND.win();
  }, [won, moves, best, level, cfg.size, puzzle.par]);

  const lit = litCount(grid);
  const stars = won ? starsFor(puzzle.par, moves) : 0;

  return (
    <div className={`lights-page${kidsMode ? " kids-mode" : ""}`}>
      <div className="math-topbar">
        <button className="back-link" onClick={onBack}>← Back</button>
        <h2 className="math-title">💡 Lights Out</h2>
        <div className="math-score-box">
          <span>Moves <b>{moves}</b></span>
          <span>Lit <b>{lit}</b></span>
          <span>Best <b>{best ?? "—"}</b></span>
        </div>
      </div>

      <p className="lights-hint">
        {kidsMode
          ? "Tap a light to flip it and its neighbours. Turn them ALL off!"
          : "Each tap toggles that light and the ones above, below, left and right. Clear the board."}
      </p>

      <div className="lights-stage">
        <div
          className="lights-grid"
          style={{ "--n": cfg.size }}
          role="grid"
          aria-label={`${cfg.size} by ${cfg.size} lights`}
        >
          {grid.map((row, r) =>
            row.map((on, c) => (
              <button
                key={`${r}-${c}`}
                className={`lights-cell${on ? " lights-cell-on" : ""}`}
                onClick={() => press(r, c)}
                disabled={won}
                aria-label={`Light ${r + 1},${c + 1} ${on ? "on" : "off"}`}
                aria-pressed={on}
              />
            ))
          )}
        </div>
      </div>

      <div className="lights-actions">
        <button className="math-start-btn lights-new-btn" onClick={startPuzzle}>
          ↻ New Puzzle
        </button>
        <span className="lights-par">Target: {puzzle.par} move{puzzle.par === 1 ? "" : "s"}</span>
      </div>

      {won && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="dialog dialog-win">
            <div className="dialog-emoji">{"⭐".repeat(stars)}</div>
            <h2 className="dialog-title">Lights out! 🎉</h2>
            <p className="dialog-talk">
              Solved in {moves} move{moves === 1 ? "" : "s"}
              {moves <= puzzle.par ? " — perfect efficiency!" : `. Target was ${puzzle.par}.`}
            </p>
            <div className="actions">
              <button className="btn-primary" onClick={startPuzzle}>New Puzzle</button>
              <button onClick={onBack}>Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
