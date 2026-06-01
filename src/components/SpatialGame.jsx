import React, { useEffect, useMemo, useState } from "react";
import { SND } from "../utils/gameHelpers.js";
import { recordGame } from "../utils/progress.js";
import {
  PUZZLES,
  buildOccupancy,
  canPlacePiece,
  getTargetSet,
  isSolved,
  normalizeShape,
} from "../utils/spatialHelpers.js";

const DIFFICULTY = "Medium";

export default function SpatialGame({ onBack }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [placements, setPlacements] = useState({});
  const [selectedPieceId, setSelectedPieceId] = useState(PUZZLES[0].pieces[0].id);
  const [rotation, setRotation] = useState(0);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [end, setEnd] = useState(false);

  const puzzle = PUZZLES[puzzleIndex];
  const targetSet = useMemo(() => getTargetSet(puzzle), [puzzle]);
  const occupancy = useMemo(() => buildOccupancy(puzzle, placements), [puzzle, placements]);
  const selectedPiece = puzzle.pieces.find((p) => p.id === selectedPieceId) || puzzle.pieces[0];

  useEffect(() => {
    if (end) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [end]);

  useEffect(() => {
    if (!end && isSolved(puzzle, placements) && Object.keys(placements).length > 0) {
      setEnd(true);
      SND.win();
      recordGame("spatial", {
        won: true,
        score: Math.max(10, 120 - moves),
        durationSec: seconds,
        difficulty: DIFFICULTY,
      });
    }
  }, [end, moves, seconds, puzzle, placements]);

  useEffect(() => {
    setPlacements({});
    setSelectedPieceId(puzzle.pieces[0].id);
    setRotation(0);
    setMoves(0);
    setSeconds(0);
    setEnd(false);
  }, [puzzleIndex]);

  const boardRows = Array.from({ length: puzzle.rows }, (_, y) => y);
  const boardCols = Array.from({ length: puzzle.cols }, (_, x) => x);

  function handlePieceSelect(pieceId) {
    setSelectedPieceId(pieceId);
    setRotation(0);
    SND.hover();
  }

  function handleRotate() {
    setRotation((value) => (value + 1) % 4);
    SND.click();
  }

  function handleCellClick(x, y) {
    if (end) return;
    const key = `${x},${y}`;
    if (occupancy[key]) {
      const next = { ...placements };
      delete next[occupancy[key]];
      setPlacements(next);
      setMoves((m) => m + 1);
      SND.select();
      return;
    }
    const piece = selectedPiece;
    if (!piece) return;
    const origin = { x, y };
    if (!canPlacePiece(puzzle, placements, piece, origin, rotation)) {
      SND.lose();
      return;
    }
    setPlacements((prev) => ({
      ...prev,
      [piece.id]: { origin, rotation },
    }));
    setMoves((m) => m + 1);
    SND.drop();
  }

  function handleReset() {
    setPlacements({});
    setRotation(0);
    setMoves(0);
    setSeconds(0);
    setEnd(false);
    setSelectedPieceId(puzzle.pieces[0].id);
    SND.select();
  }

  function changePuzzle(index) {
    setPuzzleIndex(index);
    SND.select();
  }

  const PREVIEW_GRID_SIZE = 4;

  function shapePreview(piece, rotationValue = 0) {
    const cells = normalizeShape(piece.shape, rotationValue);
    const grid = Array.from({ length: PREVIEW_GRID_SIZE }, () => Array(PREVIEW_GRID_SIZE).fill(false));
    cells.forEach(([x, y]) => {
      grid[y][x] = true;
    });
    return (
      <div className="spatial-piece-preview" style={{ color: piece.color }} aria-hidden="true">
        {grid.flat().map((filled, idx) => (
          <span key={idx} className={filled ? "cell-filled" : ""} />
        ))}
      </div>
    );
  }

  return (
    <div className="spatial-page">
      <header className="mem-topbar">
        <div className="mem-topbar-left">
          <button className="gk-icon-btn" onClick={onBack} title="Back to Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="mem-title">Shape Fit</h1>
          <span className="gk-badge">{DIFFICULTY}</span>
        </div>
        <div className="mem-stats">
          <span className="mem-stat">⏱ {seconds}s</span>
          <span className="mem-stat">Moves: {moves}</span>
          <span className="mem-stat">Pieces: {Object.keys(placements).length}/{puzzle.pieces.length}</span>
        </div>
        <div className="mem-topbar-right">
          <button className="gk-icon-btn" onClick={handleReset} title="Reset puzzle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>
      </header>

      <div className="home-howto">
        <h3 className="section-label">Goal</h3>
        <p>Place every piece inside the target shape. Tap a placed piece to remove it, and rotate the selected piece before placing.</p>
      </div>

      <div className="spatial-grid">
        <section>
          <div className="section-label">Puzzle</div>
          <div className="spatial-puzzles">
            {PUZZLES.map((item, idx) => (
              <button
                key={item.id}
                className={`step-btn${idx === puzzleIndex ? " active" : ""}`}
                onClick={() => changePuzzle(idx)}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div
            className="spatial-board"
            role="grid"
            aria-label="Shape Fit board"
            style={{ "--spatial-cols": puzzle.cols }}
          >
            {boardRows.map((y) =>
              boardCols.map((x) => {
                const key = `${x},${y}`;
                const pieceId = occupancy[key];
                const piece = puzzle.pieces.find((p) => p.id === pieceId);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`spatial-cell${targetSet.has(key) ? " spatial-target" : ""}${pieceId ? " filled" : ""}`}
                    onClick={() => handleCellClick(x, y)}
                    aria-label={pieceId ? `Remove ${piece?.name}` : targetSet.has(key) ? "Place selected piece" : "Unavailable cell"}
                  >
                    {pieceId && (
                      <span className="spatial-piece-chip" style={{ background: piece.color }}>
                        {piece.name[0]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="section-label">Pieces</div>
          <div className="spatial-palette">
            {puzzle.pieces.map((piece) => (
              <button
                key={piece.id}
                type="button"
                className={`spatial-piece-card${selectedPieceId === piece.id ? " active" : ""}${placements[piece.id] ? " placed" : ""}`}
                onClick={() => handlePieceSelect(piece.id)}
              >
                {shapePreview(piece, selectedPieceId === piece.id ? rotation : 0)}
                <div className="spatial-piece-label">{piece.name}</div>
                {placements[piece.id] ? <div className="spatial-piece-status">Placed</div> : <div className="spatial-piece-status">Available</div>}
              </button>
            ))}
          </div>

          <div className="spatial-controls">
            <div className="spatial-selected">
              <span>Selected piece:</span>
              <strong>{selectedPiece?.name}</strong>
            </div>
            <button className="btn-primary" onClick={handleRotate} type="button">Rotate</button>
          </div>
          <div className="home-howto">
            <h3 className="section-label">Hint</h3>
            <p>Pick a piece, rotate it, then tap an empty target cell to place it. If the placement is invalid, try a different cell or orientation.</p>
          </div>
        </section>
      </div>

      {end && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="dialog dialog-win">
            <div className="dialog-emoji">🎉</div>
            <h2 className="dialog-title">Puzzle Complete!</h2>
            <p className="dialog-talk">You solved the puzzle in {moves} moves and {seconds} seconds.</p>
            <div className="actions">
              <button className="btn-primary" onClick={handleReset}>Play Again</button>
              <button onClick={onBack}>Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
