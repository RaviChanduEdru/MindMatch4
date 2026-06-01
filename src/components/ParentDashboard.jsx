import React, { useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS, getProgress, levelFromXp, resetProgress } from "../utils/progress.js";
import { getFeatureFlags } from "../utils/featureFlags.js";

const SKILL_LABEL = {
  connect4: "Connect Four", reversi: "Reversi", battleship: "Battleship",
  gomoku: "Gomoku", twenty48: "2048", memory: "Memory Match",
  simon: "Simon Says", math: "Math Sprint", word: "Word Scramble", stroop: "Stroop Test",
};

export default function ParentDashboard({ onClose }) {
  const flags = useMemo(() => getFeatureFlags(), []);
  const dashboardV2 = !!flags.dashboardV2;
  const p = getProgress();
  const lvl = levelFromXp(p.xp);
  const totalSec = Object.values(p.perGame).reduce((s, g) => s + (g.totalSec || 0), 0);
  const minutes = Math.round(totalSec / 60);

  const [entered, setEntered] = useState(false);
  const [statView, setStatView] = useState({
    level: dashboardV2 ? 0 : lvl.level,
    streak: dashboardV2 ? 0 : p.streak,
    totalGames: dashboardV2 ? 0 : p.totalGames,
    minutes: dashboardV2 ? 0 : minutes,
    xp: dashboardV2 ? 0 : p.xp,
    longestStreak: dashboardV2 ? 0 : p.longestStreak,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!dashboardV2) return;
    const start = performance.now();
    const duration = 650;
    const target = {
      level: lvl.level,
      streak: p.streak,
      totalGames: p.totalGames,
      minutes,
      xp: p.xp,
      longestStreak: p.longestStreak,
    };

    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setStatView({
        level: Math.round(target.level * eased),
        streak: Math.round(target.streak * eased),
        totalGames: Math.round(target.totalGames * eased),
        minutes: Math.round(target.minutes * eased),
        xp: Math.round(target.xp * eased),
        longestStreak: Math.round(target.longestStreak * eased),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dashboardV2, lvl.level, p.streak, p.totalGames, minutes, p.xp, p.longestStreak]);

  const games = Object.entries(p.perGame).sort((a,b) => b[1].plays - a[1].plays);
  const unlocked = new Set(p.unlocked);

  const reset = () => {
    if (confirm("Reset ALL progress, XP, streak and achievements? This cannot be undone.")) {
      resetProgress();
      dispatchEvent(new Event("mm4:progress"));
      onClose();
    }
  };

  return (
    <div className={`dash-overlay${dashboardV2 ? " dash-overlay-v2" : ""}`} role="dialog" aria-modal="true">
      <div className={`dash-card${dashboardV2 ? " dash-card-v2" : ""}${entered ? " is-entered" : ""}`}>
        <div className="dash-head">
          <h2>📊 Progress Dashboard</h2>
          <button className="dash-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="dash-stats">
          <div className="dash-stat" style={{ "--dash-order": 0 }}><span className="dash-stat-num">Lv {statView.level}</span><span className="dash-stat-lbl">Brain Level</span></div>
          <div className="dash-stat" style={{ "--dash-order": 1 }}><span className="dash-stat-num">🔥 {statView.streak}</span><span className="dash-stat-lbl">Day Streak</span></div>
          <div className="dash-stat" style={{ "--dash-order": 2 }}><span className="dash-stat-num">{statView.totalGames}</span><span className="dash-stat-lbl">Games Played</span></div>
          <div className="dash-stat" style={{ "--dash-order": 3 }}><span className="dash-stat-num">{statView.minutes}m</span><span className="dash-stat-lbl">Time Trained</span></div>
          <div className="dash-stat" style={{ "--dash-order": 4 }}><span className="dash-stat-num">{statView.xp}</span><span className="dash-stat-lbl">Total XP</span></div>
          <div className="dash-stat" style={{ "--dash-order": 5 }}><span className="dash-stat-num">{statView.longestStreak}</span><span className="dash-stat-lbl">Longest Streak</span></div>
        </div>

        <h3 className="dash-h3">Per-Game Progress</h3>
        {games.length === 0 && <p className="dash-empty">No games played yet — go try one!</p>}
        <div className="dash-games">
          {games.map(([id, g]) => (
            <div key={id} className={`dash-game-row${dashboardV2 ? " dash-game-row-v2" : ""}`}>
              <div className="dash-game-name">{SKILL_LABEL[id] || id}</div>
              <div className="dash-game-bars">
                <span>Plays: <b>{g.plays}</b></span>
                <span>Wins: <b>{g.wins || 0}</b></span>
                <span>Best: <b>{g.bestScore || 0}</b></span>
                {dashboardV2 && (
                  <span className="dash-game-meter" title="Win rate">
                    <i style={{ width: `${Math.max(4, Math.round(((g.wins || 0) / Math.max(1, g.plays)) * 100))}%` }} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 className="dash-h3">Achievements ({p.unlocked.length}/{ACHIEVEMENTS.length})</h3>
        <div className="dash-achievements">
          {ACHIEVEMENTS.map(a => {
            const got = unlocked.has(a.id);
            return (
              <div key={a.id} className={`dash-ach${got ? " dash-ach-on" : ""}`} title={a.desc}>
                <span className="dash-ach-emoji">{got ? a.emoji : "🔒"}</span>
                <span className="dash-ach-name">{a.name}</span>
                <span className="dash-ach-desc">{a.desc}</span>
              </div>
            );
          })}
        </div>

        <div className="dash-foot">
          <button className="dash-reset" onClick={reset}>Reset progress</button>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
