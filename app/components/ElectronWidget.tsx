"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, ACCENT, RULE, rand2 } from "./canvas-util";

const W = 560;
const H = 240;

/**
 * Electrons drift left → right across a lattice. The "boundaries" slider
 * inserts vertical grain boundaries that scatter electrons. With many
 * boundaries, almost nothing reaches the right edge in time.
 */
export default function ElectronWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [boundaries, setBoundaries] = useState(0);
  const boundariesRef = useRef(boundaries);
  boundariesRef.current = boundaries;
  const [mobility, setMobility] = useState(1);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;

    type E = { x: number; y: number; vx: number; vy: number };
    const N = 60;
    const electrons: E[] = Array.from({ length: N }, (_, i) => ({
      x: rand2(i, 0) * W,
      y: 20 + rand2(i, 1) * (H - 40),
      vx: 60 + rand2(i, 2) * 20,
      vy: 0,
    }));

    let raf = 0;
    let last = performance.now();
    let mobAccum = 0;
    let mobN = 0;

    const step = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const nb = boundariesRef.current;
      const barriers = barrierXs(nb);

      // Draw background lattice
      draw(ctx, barriers);

      // Update + draw electrons
      for (const e of electrons) {
        const prevX = e.x;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vy *= 0.92; // damp transverse drift

        // Scatter when crossing a barrier
        for (const bx of barriers) {
          if ((prevX < bx && e.x >= bx) || (prevX > bx && e.x <= bx)) {
            // Reflect a fraction of momentum and gain large transverse kick.
            e.vx = (60 + Math.random() * 20) * (Math.random() < 0.5 ? -1 : 1);
            e.vy = (Math.random() - 0.5) * 220;
          }
        }

        // Recycle off the left/right edges
        if (e.x > W + 5) {
          e.x = -5;
          e.y = 20 + Math.random() * (H - 40);
          e.vx = 60 + Math.random() * 20;
          e.vy = 0;
          mobAccum += 1;
        }
        if (e.x < -10) {
          e.x = -5;
          e.y = 20 + Math.random() * (H - 40);
          e.vx = 60 + Math.random() * 20;
          e.vy = 0;
        }
        e.y = Math.max(8, Math.min(H - 8, e.y));

        // Draw
        ctx.beginPath();
        ctx.arc(e.x, e.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();
        // Tail
        ctx.strokeStyle = "rgba(154,74,31,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(e.x - e.vx * 0.04, e.y - e.vy * 0.04);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      }

      mobN += dt;
      if (mobN > 1) {
        setMobility(mobAccum / mobN);
        mobAccum = 0;
        mobN = 0;
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
          <label htmlFor="bnd" className="text-ink-soft">
            grain boundaries
          </label>
          <span className="font-mono text-ink">{boundaries}</span>
        </div>
        <input
          id="bnd"
          type="range"
          min={0}
          max={8}
          step={1}
          value={boundaries}
          onChange={(e) => setBoundaries(parseInt(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>perfect lattice</span>
          <span>polycrystal</span>
        </div>
        <div className="mt-3 text-xs text-ink-soft font-sans">
          electrons crossing per second:{" "}
          <span className="text-ink font-mono">{mobility.toFixed(1)}</span>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Each dot is an electron drifting left to right. Add grain boundaries
        and watch how many actually make it across. The counter below is the
        effective mobility of this slab.
      </figcaption>
    </figure>
  );
}

function barrierXs(n: number): number[] {
  if (n <= 0) return [];
  const xs: number[] = [];
  for (let i = 0; i < n; i++) {
    xs.push(((i + 1) / (n + 1)) * W);
  }
  return xs;
}

function draw(ctx: CanvasRenderingContext2D, barriers: number[]) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Lattice background — very faint
  const sp = 16;
  ctx.fillStyle = "rgba(31,29,26,0.18)";
  for (let y = 12; y < H; y += sp) {
    for (let x = 12; x < W; x += sp) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Barriers
  ctx.fillStyle = "rgba(154,74,31,0.18)";
  for (const bx of barriers) {
    ctx.fillRect(bx - 3, 4, 6, H - 8);
  }
  ctx.strokeStyle = "rgba(154,74,31,0.55)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  for (const bx of barriers) {
    ctx.beginPath();
    ctx.moveTo(bx, 4);
    ctx.lineTo(bx, H - 4);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // Axis labels
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("source", 6, 14);
  ctx.textAlign = "right";
  ctx.fillText("drain", W - 6, 14);
}
