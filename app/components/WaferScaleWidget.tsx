"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, RULE, ACCENT } from "./canvas-util";

const W = 560;
const H = 320;

const SIZES = [50, 75, 100, 125, 150, 200, 300, 450];

/**
 * Wafer scale slider. As diameter grows, chip yield grows linearly with
 * area while heat budget grows quadratically. The visual shows the wafer
 * next to a fixed reference chip; the bar chart shows chips-per-wafer
 * and the heater power needed.
 */
export default function WaferScaleWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [idx, setIdx] = useState(6); // 300 mm
  const d = SIZES[idx];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, d);
  }, [d]);

  return (
    <figure className="widget-surface">
      <canvas ref={ref} className="block mx-auto" style={{ width: W, height: H }} />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="size" className="text-ink-soft">
            wafer diameter
          </label>
          <span className="font-mono text-ink">{d} mm</span>
        </div>
        <input
          id="size"
          type="range"
          min={0}
          max={SIZES.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(parseInt(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>1970s</span>
          <span>never shipped</span>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Slide through forty years of wafer scaling. Yield grows with the
        area; heater power grows roughly with the cube of the diameter.
        450 mm is where the second curve broke the industry&rsquo;s back.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, d: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Left: actual wafer at scale
  const leftCx = 150;
  const cy = H / 2 - 10;
  const maxR = 110; // px when d = 450
  const r = (d / 450) * maxR;
  // Reference outline: 450 mm
  ctx.strokeStyle = "rgba(31,29,26,0.18)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(leftCx, cy, maxR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // The current wafer
  const grad = ctx.createRadialGradient(leftCx, cy, 4, leftCx, cy, r);
  grad.addColorStop(0, "#e6dfd1");
  grad.addColorStop(1, "#c9c0ad");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(leftCx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(31,29,26,0.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Chip grid overlay (chips are 20mm × 20mm — scale accordingly)
  const chipPx = (20 / 450) * maxR * 2; // diameter of 20mm in px
  const usableR = r - chipPx * 0.25;
  let chipCount = 0;
  ctx.fillStyle = "rgba(154,74,31,0.45)";
  ctx.strokeStyle = "rgba(154,74,31,0.7)";
  ctx.lineWidth = 0.6;
  const halfChip = chipPx / 2;
  for (let yi = -10; yi < 11; yi++) {
    for (let xi = -10; xi < 11; xi++) {
      const cxp = leftCx + xi * chipPx;
      const cyp = cy + yi * chipPx;
      // chip fits if all 4 corners inside the wafer
      const cornerOK =
        Math.hypot(cxp - leftCx - halfChip, cyp - cy - halfChip) < usableR &&
        Math.hypot(cxp - leftCx + halfChip, cyp - cy - halfChip) < usableR &&
        Math.hypot(cxp - leftCx - halfChip, cyp - cy + halfChip) < usableR &&
        Math.hypot(cxp - leftCx + halfChip, cyp - cy + halfChip) < usableR;
      if (!cornerOK) continue;
      ctx.fillRect(cxp - halfChip + 0.5, cyp - halfChip + 0.5, chipPx - 1, chipPx - 1);
      ctx.strokeRect(
        cxp - halfChip + 0.5,
        cyp - halfChip + 0.5,
        chipPx - 1,
        chipPx - 1,
      );
      chipCount += 1;
    }
  }

  // Labels
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`(450 mm reference outlined)`, leftCx, cy + maxR + 22);
  ctx.fillStyle = INK;
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`≈ ${chipCount} chips`, leftCx, 28);

  // Right: bar chart for heat power
  const barX = 320;
  const barW = 200;
  const barTop = 70;
  const barH = 200;

  // Heat power scales as d^3 (approx). Normalize to 450 mm = 1.
  const heatNorm = Math.pow(d / 450, 3);
  // Yield scales as d^2.
  const yieldNorm = Math.pow(d / 450, 2);

  drawBar(
    ctx,
    barX,
    barTop,
    barW,
    24,
    yieldNorm,
    "chips per wafer (∝ d²)",
    "rgba(31,107,58,0.6)",
  );
  drawBar(
    ctx,
    barX,
    barTop + 60,
    barW,
    24,
    heatNorm,
    "heater power needed (∝ d³)",
    "rgba(154,74,31,0.7)",
  );
  drawBar(
    ctx,
    barX,
    barTop + 120,
    barW,
    24,
    yieldNorm / heatNorm,
    "chips per kilowatt",
    "rgba(40,90,40,0.6)",
  );

  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    "(bars normalized to 450 mm = full bar)",
    barX,
    barTop + 200,
  );
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  v: number,
  label: string,
  fill: string,
) {
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y - 5);
  ctx.fillStyle = "rgba(31,29,26,0.08)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.min(v, 1), h);
  if (v > 1) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + w, y, 8, h);
  }
  ctx.strokeStyle = RULE;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.fillStyle = INK;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${(v * 100).toFixed(0)}%`, x + w - 4, y + 16);
}
