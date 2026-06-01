import React, { useEffect, useMemo, useRef } from "react";

function fitCanvasToDpr(canvas) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}

export default function HeroCanvas3D({ caps, kidsMode = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  const particleCount = useMemo(() => {
    if (!caps || caps.tier === "fallback") return 0;
    return caps.tier === "full" ? 32 : 14;
  }, [caps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !caps || caps.tier === "fallback") return undefined;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return undefined;

    const particles = Array.from({ length: particleCount }, (_, i) => ({
      seed: (i + 1) * 0.1337,
      speed: 0.22 + (i % 5) * 0.06,
      depth: 0.25 + ((i * 13) % 100) / 100,
      radius: 2 + (i % 4),
    }));

    const cards = [
      { label: "C4", x: 0.2, y: 0.32, hue: 188 },
      { label: "RVS", x: 0.72, y: 0.28, hue: 32 },
      { label: "2048", x: 0.38, y: 0.74, hue: 14 },
      { label: "WORD", x: 0.78, y: 0.68, hue: 168 },
    ];

    let running = true;
    let start = performance.now();

    const drawCard = (w, h, t, card, index) => {
      const bob = Math.sin(t * 0.0012 + index) * 10;
      const tilt = Math.sin(t * 0.0009 + index * 0.8) * 0.18;
      const px = card.x * w;
      const py = card.y * h + bob;
      const cw = Math.max(84, w * 0.18);
      const ch = Math.max(44, h * 0.12);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(tilt);

      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, cw);
      glow.addColorStop(0, `hsla(${card.hue}, 90%, 64%, 0.35)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-cw * 0.8, -ch * 1.2, cw * 1.6, ch * 2.4);

      ctx.fillStyle = kidsMode ? "rgba(244, 245, 214, 0.94)" : "rgba(14, 24, 32, 0.94)";
      ctx.strokeStyle = `hsla(${card.hue}, 95%, 65%, 0.95)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = kidsMode ? "#102433" : "#fef6e3";
      ctx.font = `700 ${Math.max(14, Math.floor(cw * 0.22))}px ui-monospace, Menlo, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.label, 0, 1);
      ctx.restore();
    };

    const loop = () => {
      if (!running) return;
      const now = performance.now();
      const elapsed = now - start;
      const { w, h } = fitCanvasToDpr(canvas);

      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      if (kidsMode) {
        bg.addColorStop(0, "#d5f6ff");
        bg.addColorStop(0.52, "#f8ffdf");
        bg.addColorStop(1, "#ffe9c9");
      } else {
        bg.addColorStop(0, "#071421");
        bg.addColorStop(0.55, "#142739");
        bg.addColorStop(1, "#2f180b");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = kidsMode ? "#3d8ca0" : "#98f0ff";
      ctx.lineWidth = 1;
      const gap = Math.max(24, Math.floor(w / 12));
      for (let x = 0; x <= w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      particles.forEach((p, i) => {
        const tx = (Math.sin(elapsed * 0.00035 * p.speed + p.seed) * 0.42 + 0.5) * w;
        const ty = (Math.cos(elapsed * 0.00028 * p.speed + p.seed * 1.8) * 0.42 + 0.5) * h;
        const alpha = 0.2 + ((Math.sin(elapsed * 0.001 + i) + 1) * 0.24);
        ctx.fillStyle = `hsla(${180 + i * 4}, 95%, 68%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(tx, ty, p.radius + p.depth * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      cards.forEach((card, i) => drawCard(w, h, elapsed, card, i));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    const onResize = () => fitCanvasToDpr(canvas);
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [caps, kidsMode, particleCount]);

  if (!caps || caps.tier === "fallback") {
    return (
      <div className="home-hero-canvas home-hero-canvas-fallback" aria-hidden="true">
        <div className="home-hero-fallback-glow" />
      </div>
    );
  }

  return (
    <div className="home-hero-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="home-hero-canvas"
        aria-label="Animated game showcase"
        role="img"
      />
      <div className="home-hero-chip-row" aria-hidden="true">
        <span className="home-hero-chip">{caps.tier === "full" ? "HIC READY" : "WEBGL MODE"}</span>
        <span className="home-hero-chip">CHROME FIRST</span>
      </div>
    </div>
  );
}
