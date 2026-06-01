import React, { useEffect, useState } from "react";
import { SND } from "../utils/gameHelpers.js";

export default function WinBanner({ outcome, onFinished }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Play dramatic banner sound
    SND.banner?.();
    
    // Auto-dismiss after 1.8 seconds
    const t = setTimeout(() => {
      setVisible(false);
      onFinished?.();
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  let text = "STALEMATE";
  let subtext = "Board locked. Nobody blinked.";
  let color = "var(--muted)";
  let toneClass = "is-draw";
  
  if (outcome === "player_win" || outcome === "win") {
    text = "VICTORY";
    subtext = "Clean sequence. Keep the pressure up.";
    color = "var(--gold)";
    toneClass = "is-win";
  } else if (outcome === "ai_win" || outcome === "lose") {
    text = "DEFEATED";
    subtext = "Sharp loss. Queue the rematch.";
    color = "var(--pink)";
    toneClass = "is-loss";
  } else if (outcome === "p1_win") {
    text = "P1 WINS";
    subtext = "Player one closed the line first.";
    color = "var(--pink)"; // Player 1 is red/pink
    toneClass = "is-win";
  } else if (outcome === "p2_win") {
    text = "P2 WINS";
    subtext = "Player two took control late.";
    color = "var(--gold)"; // Player 2 is yellow
    toneClass = "is-win";
  }

  return (
    <div className="win-banner-overlay">
      <div className={`win-banner-slash ${toneClass}`}>
        <div className="win-banner-text" style={{ color }}>{text}</div>
        <div className="win-banner-subtext">{subtext}</div>
      </div>
    </div>
  );
}
