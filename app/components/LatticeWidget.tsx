"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, ACCENT, RULE, rand2 } from "./canvas-util";

const W = 560;
const H = 280;

/**
 * A grid of silicon atoms interpolated between amorphous (random jitter)
 * and perfect-crystal arrangements. The "order" slider drives the
 * interpolation: 0 = glass, 1 = single crystal.
 */
export default function LatticeWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [order, setOrder] = useState(0.5);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, order);
  }, [order]);

  const label =
    order < 0.15
      ? "amorphous (like glass)"
      : order < 0.5
        ? "polycrystalline"
        : order < 0.92
          ? "almost single crystal"
          : "single crystal";

  return (
    <figure className="widget-surface">
      <canvas ref={ref} className="block mx-auto" style={{ width: W, height: H }} />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="order" className="text-ink-soft">
            order
          </label>
          <span className="font-mono text-ink">{label}</span>
        </div>
        <input
          id="order"
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={order}
          onChange={(e) => setOrder(parseFloat(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>random</span>
          <span>perfect lattice</span>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Each dot is a silicon atom. Drag the slider from a random tangle into
        a perfect cubic lattice. The kind of silicon a chip is built on is
        all the way to the right.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, order: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const cols = 22;
  const rows = 11;
  const spacing = 22;
  const ox = (W - (cols - 1) * spacing) / 2;
  const oy = (H - (rows - 1) * spacing) / 2;
  const jitter = (1 - order) * spacing * 0.55;

  // Draw bonds first (only when fairly ordered)
  if (order > 0.35) {
    const bondAlpha = Math.min(1, (order - 0.35) / 0.4);
    ctx.strokeStyle = `rgba(154,74,31,${0.35 * bondAlpha})`;
    ctx.lineWidth = 1;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = atomPos(i, j, ox, oy, spacing, jitter);
        if (i < cols - 1) {
          const b = atomPos(i + 1, j, ox, oy, spacing, jitter);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        if (j < rows - 1) {
          const b = atomPos(i, j + 1, ox, oy, spacing, jitter);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  // Atoms
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = atomPos(i, j, ox, oy, spacing, jitter);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
    }
  }

  // Grain boundary hint at mid-order
  if (order > 0.2 && order < 0.85) {
    const t = 1 - Math.abs(order - 0.5) * 2; // peaks at 0.5
    ctx.strokeStyle = `rgba(154,74,31,${0.35 * t})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(W * 0.38, 24);
    ctx.bezierCurveTo(W * 0.5, H * 0.45, W * 0.55, H * 0.6, W * 0.62, H - 24);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(154,74,31,${0.7 * t})`;
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("grain boundary", W * 0.62 + 6, H - 18);
  }

  // Bottom-corner stats
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(`order = ${order.toFixed(2)}`, 12, H - 12);
  ctx.textAlign = "right";
  ctx.fillText(`${cols * rows} atoms`, W - 12, H - 12);
  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}

function atomPos(
  i: number,
  j: number,
  ox: number,
  oy: number,
  spacing: number,
  jitter: number,
) {
  const dx = (rand2(i, j) - 0.5) * jitter;
  const dy = (rand2(i + 999, j + 17) - 0.5) * jitter;
  return { x: ox + i * spacing + dx, y: oy + j * spacing + dy };
}
