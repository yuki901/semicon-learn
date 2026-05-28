"use client";

import { useEffect, useRef, useState } from "react";
import {
  setupHiDPI,
  PAPER,
  INK,
  INK_SOFT,
  INK_MUTED,
  ACCENT,
  RULE,
} from "./canvas-util";

const W = 560;
const H = 320;

/**
 * The puddle-carrying problem. A "showerhead" sits above a wafer that
 * scrolls underneath it. Water is supplied on the leading edge and
 * recovered on the trailing edge; the meniscus pins to the wafer by
 * surface tension. As the scan speed grows, the capillary number
 *
 *   Ca = μ·v / σ
 *
 * exceeds a critical value (~2e-3 for water on a hydrophobic surface)
 * and the trailing meniscus starts entraining air. Each entrained bubble
 * gets dragged through the optical path and prints as a watermark defect
 * on the resist below.
 *
 * Slider controls the scan speed; the meniscus deforms, bubbles detach
 * past a threshold, and defects accumulate on a small wafer-strip readout.
 */
export default function ShowerheadWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // 0..1 mapping to v ∈ [0, 1000] mm/s
  const [scan, setScan] = useState(0.4);

  // Defect history: x positions where bubbles printed
  const defectsRef = useRef<number[]>([]);
  const bubblesRef = useRef<{ x: number; y: number; r: number; v: number }[]>([]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let bubbleAccumulator = 0;

    const step = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      const v = scan * 1000; // mm/s
      // Crude Ca with μ=8.9e-4 Pa·s, σ=0.072 N/m
      const Ca = (8.9e-4 * (v / 1000)) / 0.072;
      const CaCrit = 2e-3;
      const supercrit = Math.max(0, Ca - CaCrit) / CaCrit; // 0..several

      // Spawn bubbles at trailing edge if supercritical
      if (supercrit > 0) {
        bubbleAccumulator += supercrit * dt * 12;
        while (bubbleAccumulator > 1) {
          bubbleAccumulator -= 1;
          bubblesRef.current.push({
            x: 380 + Math.random() * 12, // trailing meniscus area
            y: 140,
            r: 2 + Math.random() * 3,
            v: 60 + scan * 220,
          });
        }
      }

      // Advance bubbles + drop as defects when they hit the wafer
      const remaining: typeof bubblesRef.current = [];
      for (const b of bubblesRef.current) {
        b.y += b.v * dt;
        b.x -= scan * 80 * dt; // bubble lags slightly (relative to wafer)
        if (b.y < 240) {
          remaining.push(b);
        } else {
          // landed
          defectsRef.current.push(40 + Math.random() * (W - 80));
          if (defectsRef.current.length > 80) {
            defectsRef.current.shift();
          }
        }
      }
      bubblesRef.current = remaining;

      // Wafer strip slowly scrolls; trim defects off the left
      defectsRef.current = defectsRef.current.map((x) => x - scan * 40 * dt);
      defectsRef.current = defectsRef.current.filter((x) => x > 20);

      draw(ctx, scan, bubblesRef.current, defectsRef.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scan]);

  const v = scan * 1000;
  const Ca = (8.9e-4 * (v / 1000)) / 0.072;
  const bubbling = Ca > 2e-3;

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="scan" className="text-ink-soft">
            scan speed
          </label>
          <span className="font-mono text-ink">
            v = {v.toFixed(0)} mm/s &nbsp;·&nbsp; Ca = {Ca.toExponential(1)}
          </span>
        </div>
        <input
          id="scan"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={scan}
          onChange={(e) => setScan(parseFloat(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>stationary</span>
          <span>throughput-limit</span>
        </div>
        <p className="mt-3 text-center text-sm" style={{ color: bubbling ? "#9a3030" : INK_SOFT }}>
          {bubbling
            ? "trailing meniscus is entraining air — bubble defects landing on wafer"
            : "meniscus stable"}
        </p>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        The puddle has to follow the wafer. Past Ca ≈ 2×10⁻³ the trailing
        edge of the meniscus breaks and pulls in air; every bubble that
        drifts through the optical path prints as a defect on the resist
        underneath.
      </figcaption>
    </figure>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  scan: number,
  bubbles: { x: number; y: number; r: number; v: number }[],
  defects: number[],
) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // ---- Showerhead / final lens block ----
  const headY = 30;
  const headBot = 110;
  const headL = 180;
  const headR = 380;
  ctx.fillStyle = "#2a2622";
  ctx.fillRect(headL, headY, headR - headL, headBot - headY);
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("showerhead + final lens", (headL + headR) / 2, headY - 8);

  // Supply and recover nozzles
  ctx.fillStyle = "#5b554c";
  ctx.fillRect(headL - 8, headBot - 16, 8, 16); // supply (left)
  ctx.fillRect(headR, headBot - 16, 8, 16); // recover (right)
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("supply →", headL - 12, headBot - 4);
  ctx.textAlign = "left";
  ctx.fillText("← recover", headR + 12, headBot - 4);

  // ---- Wafer (scrolling band) ----
  const waferTop = 240;
  ctx.fillStyle = "#3a342c";
  ctx.fillRect(20, waferTop, W - 40, 30);

  // Wafer arrow (movement direction)
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`wafer →   v = ${(scan * 1000).toFixed(0)} mm/s`, W / 2, waferTop + 47);

  // ---- Meniscus (puddle between head and wafer) ----
  // The trailing edge deforms with speed.
  const trailingDeform = Math.min(40, scan * 80);
  const leadingDeform = Math.min(10, scan * 20);
  ctx.fillStyle = "rgba(120,170,200,0.35)";
  ctx.beginPath();
  ctx.moveTo(headL, headBot);
  ctx.lineTo(headR, headBot);
  // Right meniscus pinned to wafer
  ctx.bezierCurveTo(
    headR + 14,
    headBot + 20,
    headR + 6 - trailingDeform * 0.3,
    waferTop - 20,
    headR - trailingDeform,
    waferTop,
  );
  // Wafer bottom line
  ctx.lineTo(headL + leadingDeform, waferTop);
  // Left meniscus
  ctx.bezierCurveTo(
    headL + leadingDeform - 4,
    waferTop - 18,
    headL - 8,
    headBot + 18,
    headL,
    headBot,
  );
  ctx.closePath();
  ctx.fill();

  // Outline of the meniscus
  ctx.strokeStyle = "rgba(60,110,150,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label
  ctx.fillStyle = "rgba(60,110,150,0.85)";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("water", (headL + headR) / 2, (headBot + waferTop) / 2 + 4);

  // ---- Trailing meniscus instability marker ----
  if (scan > 0.2) {
    ctx.fillStyle = "rgba(154,74,31,0.6)";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("← trailing edge", headR - trailingDeform + 4, waferTop - 6);
  }

  // ---- Bubbles in flight ----
  ctx.fillStyle = "rgba(154,74,31,0.7)";
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Defects on wafer ----
  ctx.fillStyle = ACCENT;
  for (const x of defects) {
    if (x < 20 || x > W - 20) continue;
    ctx.beginPath();
    ctx.arc(x, waferTop + 15, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Defect count
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(`defects on strip: ${defects.length}`, W - 24, waferTop - 6);

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
