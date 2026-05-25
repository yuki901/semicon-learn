"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, RULE, rand2 } from "./canvas-util";

const W = 560;
const H = 320;

/**
 * Cross-section of the crucible. Tracer particles loop in convection cells.
 * "Wall heat" controls how vigorously they circulate. The freezing front
 * under the boule curves as a function of the gradient.
 */
export default function MeltWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [heat, setHeat] = useState(0.55);
  const heatRef = useRef(heat);
  heatRef.current = heat;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;

    type P = { x: number; y: number; age: number };
    const N = 90;
    const particles: P[] = Array.from({ length: N }, (_, i) => ({
      x: 80 + rand2(i, 0) * (W - 160),
      y: 80 + rand2(i, 1) * (H - 160),
      age: rand2(i, 2),
    }));

    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const heat = heatRef.current;
      const speed = 30 + heat * 110;

      draw(ctx, heat);

      // Velocity field: two counter-rotating cells.
      for (const p of particles) {
        const { vx, vy } = field(p.x, p.y, speed);
        p.x += vx * dt;
        p.y += vy * dt;
        p.age += dt;
        if (p.age > 6 || p.x < 70 || p.x > W - 70 || p.y < 70 || p.y > H - 70) {
          p.x = 90 + Math.random() * (W - 180);
          p.y = 90 + Math.random() * (H - 180);
          p.age = 0;
        }

        // Color by temperature (warmer near walls)
        const r = tempField(p.x, p.y);
        ctx.fillStyle = blendWarm(r);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Short tail
        const tailLen = 0.06;
        ctx.strokeStyle = `rgba(154,74,31,${0.2 + 0.35 * r})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - vx * tailLen, p.y - vy * tailLen);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <figure className="widget-surface">
      <canvas ref={ref} className="block mx-auto" style={{ width: W, height: H }} />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="heat" className="text-ink-soft">
            crucible wall heat
          </label>
          <span className="font-mono text-ink">{(heat * 100).toFixed(0)}%</span>
        </div>
        <input
          id="heat"
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={heat}
          onChange={(e) => setHeat(parseFloat(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>gentle convection</span>
          <span>storm</span>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        A cross-section of the crucible. The tracers loop because hot fluid
        rises along the walls and falls under the boule. Crank the heat and
        the storm intensifies. The freezing front under the boule curves
        accordingly.
      </figcaption>
    </figure>
  );
}

function field(x: number, y: number, speed: number): { vx: number; vy: number } {
  const cx = W / 2;
  // Two counter-rotating cells: left half rotates CCW, right half CW.
  const localX = x - cx;
  const cellCx = localX > 0 ? cx + W * 0.18 : cx - W * 0.18;
  const cellCy = H * 0.55;
  const dx = x - cellCx;
  const dy = y - cellCy;
  const sign = localX > 0 ? -1 : 1;
  const norm = Math.hypot(dx, dy) + 0.001;
  const tangX = (-dy / norm) * sign;
  const tangY = (dx / norm) * sign;
  return { vx: tangX * speed, vy: tangY * speed };
}

function tempField(x: number, y: number): number {
  // 0 = cold (center & top), 1 = hot (near walls)
  const cx = W / 2;
  const cy = H * 0.55;
  const distFromCenter = Math.hypot((x - cx) / 200, (y - cy) / 110);
  return Math.min(1, distFromCenter);
}

function blendWarm(t: number): string {
  // cream → orange → red
  const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
  const r = Math.round(lerp(245, 195, t));
  const g = Math.round(lerp(195, 80, t));
  const b = Math.round(lerp(120, 30, t));
  return `rgb(${r},${g},${b})`;
}

function draw(ctx: CanvasRenderingContext2D, heat: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Crucible bowl shape
  const cx = W / 2;
  const top = 70;
  const bot = H - 50;
  const halfW = W * 0.36;

  // Outer wall
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.moveTo(cx - halfW - 14, top);
  ctx.lineTo(cx - halfW - 14, bot - 20);
  ctx.quadraticCurveTo(cx, bot + 22, cx + halfW + 14, bot - 20);
  ctx.lineTo(cx + halfW + 14, top);
  ctx.lineTo(cx + halfW, top);
  ctx.lineTo(cx + halfW, bot - 28);
  ctx.quadraticCurveTo(cx, bot + 8, cx - halfW, bot - 28);
  ctx.lineTo(cx - halfW, top);
  ctx.closePath();
  ctx.fill();

  // Melt with a heat-tinted gradient
  const grad = ctx.createRadialGradient(cx, bot - 20, 20, cx, bot - 20, halfW + 20);
  const hot = blendWarm(0.7 + heat * 0.3);
  const warm = blendWarm(0.4 + heat * 0.3);
  grad.addColorStop(0, warm);
  grad.addColorStop(1, hot);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, top);
  ctx.lineTo(cx - halfW, bot - 28);
  ctx.quadraticCurveTo(cx, bot + 8, cx + halfW, bot - 28);
  ctx.lineTo(cx + halfW, top);
  ctx.closePath();
  ctx.fill();

  // Boule cross-section (a stub above the melt) and curved freezing front
  const bouleR = 50;
  ctx.fillStyle = "#d9d2c4";
  ctx.beginPath();
  ctx.rect(cx - bouleR, 10, bouleR * 2, top - 10);
  ctx.fill();

  // Freezing front: more curved when heat is high
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - bouleR, top);
  ctx.quadraticCurveTo(cx, top + 10 + heat * 22, cx + bouleR, top);
  ctx.stroke();

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // Labels
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("boule (cold)", cx + bouleR + 8, 26);
  ctx.fillText("crucible wall (hot)", cx - halfW - 14, bot + 18);
  ctx.fillText("freezing front", cx + bouleR + 8, top + 10);
}
