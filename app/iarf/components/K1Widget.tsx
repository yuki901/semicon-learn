"use client";

import { useEffect, useRef, useState } from "react";
import {
  setupHiDPI,
  PAPER,
  INK,
  INK_SOFT,
  INK_MUTED,
  ACCENT,
  ACCENT_SOFT,
  RULE,
} from "./canvas-util";

const W = 560;
const H = 320;

/**
 * Push k1 down by adding patterning passes. λ=193, NA=1.35 held fixed; the
 * slider drives k1 from 0.4 (single exposure) toward 0.25 (theoretical
 * floor). The CD scales linearly. The pass schedule reflects what fabs
 * actually used:
 *
 *   k1 > 0.32  → single exposure
 *   0.28..0.32 → SMO + dipole, still single exposure
 *   0.22..0.28 → LELE (2 exposures, 2 etches)
 *   below 0.22 → SAQP (one exposure, 4 spacer-defined lines = effective k1/4)
 *
 * A small cost meter shows that the resolution gains stop being free
 * around k1≈0.28 and become 2× or 4× the per-layer cost below that.
 */
export default function K1Widget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [k1, setK1] = useState(0.35);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, k1);
  }, [k1]);

  const NA = 1.35;
  const lam = 193;
  const CD = (k1 * lam) / NA;

  let scheme: { label: string; passes: number; cost: number };
  if (k1 >= 0.32) {
    scheme = { label: "single exposure", passes: 1, cost: 1 };
  } else if (k1 >= 0.28) {
    scheme = { label: "SMO + off-axis", passes: 1, cost: 1.3 };
  } else if (k1 >= 0.22) {
    scheme = { label: "LELE (2-pass)", passes: 2, cost: 2.4 };
  } else {
    scheme = { label: "SAQP (4-pass)", passes: 4, cost: 5.0 };
  }

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="k1" className="text-ink-soft">
            k<sub>1</sub>
          </label>
          <span className="font-mono text-ink">
            k₁ = {k1.toFixed(2)} &nbsp;·&nbsp; CD = {CD.toFixed(0)} nm
          </span>
        </div>
        <input
          id="k1"
          type="range"
          min={0.2}
          max={0.4}
          step={0.005}
          value={k1}
          onChange={(e) => setK1(parseFloat(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>0.20 (multipattern floor)</span>
          <span>0.40 (relaxed)</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
          <div>
            <div className="text-ink-muted text-xs">patterning scheme</div>
            <div className="font-mono text-ink">{scheme.label}</div>
          </div>
          <div>
            <div className="text-ink-muted text-xs">per-layer cost</div>
            <div className="font-mono text-ink">{scheme.cost.toFixed(1)}×</div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        With λ and NA both pinned, every further halving of pitch has to come
        from k₁. Below k₁ ≈ 0.28 the only way to keep going is to split each
        layer into two, then four, exposures.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, k1: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const padL = 110;
  const padR = 40;
  const topY = 40;
  const trackH = 28;
  const trackGap = 14;

  // Determine which scheme is active and how many passes it has.
  let activePasses: number;
  let schemeIdx: number;
  if (k1 >= 0.32) {
    activePasses = 1;
    schemeIdx = 0;
  } else if (k1 >= 0.28) {
    activePasses = 1;
    schemeIdx = 1;
  } else if (k1 >= 0.22) {
    activePasses = 2;
    schemeIdx = 2;
  } else {
    activePasses = 4;
    schemeIdx = 3;
  }

  const schemes = [
    { label: "single exposure", passes: 1 },
    { label: "+ SMO / off-axis", passes: 1 },
    { label: "LELE", passes: 2 },
    { label: "SAQP", passes: 4 },
  ];

  // Title
  ctx.fillStyle = INK_SOFT;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("patterning passes per layer", padL, topY - 14);

  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    const y = topY + i * (trackH + trackGap);

    // Track background
    ctx.fillStyle = "#f0e8d4";
    ctx.fillRect(padL, y, W - padL - padR, trackH);

    // Pass bars
    const isActive = i === schemeIdx;
    const cellW = (W - padL - padR) / s.passes;
    for (let p = 0; p < s.passes; p++) {
      ctx.fillStyle = isActive ? ACCENT : "rgba(154,74,31,0.18)";
      ctx.fillRect(padL + p * cellW + 2, y + 3, cellW - 4, trackH - 6);
      ctx.fillStyle = isActive ? PAPER : INK_MUTED;
      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `pass ${p + 1}`,
        padL + p * cellW + cellW / 2,
        y + trackH / 2 + 4,
      );
    }

    // Label
    ctx.fillStyle = isActive ? INK : INK_MUTED;
    ctx.font = isActive
      ? "12px ui-sans-serif, system-ui, sans-serif"
      : "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(s.label, padL - 8, y + trackH / 2 + 4);

    // Frame
    ctx.strokeStyle = RULE;
    ctx.strokeRect(padL + 0.5, y + 0.5, W - padL - padR - 1, trackH - 1);
  }

  // Bottom: cost ramp
  const costY = topY + schemes.length * (trackH + trackGap) + 22;
  ctx.fillStyle = INK_SOFT;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("per-layer cost (relative to single exposure)", padL, costY - 6);
  const costBarW = W - padL - padR;
  ctx.fillStyle = "#f0e8d4";
  ctx.fillRect(padL, costY, costBarW, 16);
  // Interpolate cost smoothly
  let cost: number;
  if (k1 >= 0.32) cost = 1.0;
  else if (k1 >= 0.28) cost = 1.0 + (0.32 - k1) * 7.5; // 1.0..1.3
  else if (k1 >= 0.22) cost = 1.3 + (0.28 - k1) / 0.06 * 1.1; // 1.3..2.4
  else cost = 2.4 + (0.22 - k1) / 0.02 * 2.6; // 2.4..5.0
  const fillW = Math.min(1, cost / 5) * costBarW;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(padL, costY, fillW, 16);
  ctx.strokeStyle = RULE;
  ctx.strokeRect(padL + 0.5, costY + 0.5, costBarW - 1, 15);

  ctx.fillStyle = INK;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${cost.toFixed(1)}×`, padL + fillW + 6, costY + 12);

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
