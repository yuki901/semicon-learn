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
const H = 340;

/**
 * The chapter-3 widget. A slider continuously raises the refractive index
 * of the gap between the final lens and the wafer from 1.00 (air) to 1.44
 * (water). The half-angle θ inside the lens is held fixed at ~68° — the
 * lens geometry doesn't change. What changes is what the beams do once
 * they hit the gap:
 *
 *   - in air,  they continue at the same angle to the wafer  → NA = sinθ
 *   - in water, they bend toward normal by Snell's law       → NA = n·sinθ
 *
 * The wafer-side angle stays the same in both cases (Snell on exit), so
 * the converging cone at the wafer looks identical — but the *effective*
 * wavelength in the gap is λ/n, which is the real point.
 */
export default function NAImmersionWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [n, setN] = useState(1.0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, n);
  }, [n]);

  const sinTheta = 0.93; // sin of half-angle inside the lens medium (air)
  const NA = n * sinTheta;
  const lamEff = 193 / n;
  const k1 = 0.3;
  const CD = (k1 * 193) / NA;

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="n" className="text-ink-soft">
            refractive index of the gap
          </label>
          <span className="font-mono text-ink">n = {n.toFixed(2)}</span>
        </div>
        <input
          id="n"
          type="range"
          min={1.0}
          max={1.44}
          step={0.01}
          value={n}
          onChange={(e) => setN(parseFloat(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>air (1.00)</span>
          <span>water (1.44)</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-ink-muted text-xs">NA = n·sinθ</div>
            <div className="font-mono text-ink">{NA.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-ink-muted text-xs">λ in gap</div>
            <div className="font-mono text-ink">{lamEff.toFixed(0)} nm</div>
          </div>
          <div>
            <div className="text-ink-muted text-xs">CD (k₁=0.3)</div>
            <div className="font-mono text-ink">{CD.toFixed(0)} nm</div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Drag the gap from air toward water. The lens geometry stays the
        same; only the index between lens and wafer moves. NA, the
        effective wavelength, and the minimum printable line all react.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, n: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const lensTop = 40;
  const lensBot = 80;
  const waferY = H - 50;

  // ---- Lens ----
  ctx.fillStyle = "#e7d9b6";
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 140, lensTop + 20);
  ctx.quadraticCurveTo(cx, lensTop - 18, cx + 140, lensTop + 20);
  ctx.quadraticCurveTo(cx, lensTop + 50, cx - 140, lensTop + 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("final lens (n_lens = 1.56)", 16, 24);

  // ---- Wafer ----
  ctx.fillStyle = "#2f2a24";
  ctx.fillRect(40, waferY, W - 80, 12);
  ctx.fillStyle = "#5b554c";
  ctx.fillRect(40, waferY, W - 80, 3);
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = "left";
  ctx.fillText("resist on wafer", 16, waferY + 24);

  // ---- Gap fill ----
  const wetness = (n - 1) / 0.44;
  ctx.fillStyle = `rgba(120,170,200,${0.05 + 0.5 * wetness})`;
  ctx.fillRect(60, lensBot, W - 120, waferY - lensBot);

  // Gap label — placed near the bottom of the gap where the converging
  // beams have collapsed back to the optical axis, so the label is clear
  // of the rays at every value of n.
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    wetness < 0.05
      ? "air gap"
      : wetness > 0.95
        ? "water (n=1.44)"
        : `liquid (n=${n.toFixed(2)})`,
    70,
    waferY - 6,
  );

  // ---- Beams ----
  // The projection lens focuses every ray to a single point on the wafer:
  // (cx, waferY). We work backward from that focus point. In the gap, each
  // beam travels at angle θ_gap to the vertical, where
  //
  //   n · sin θ_gap = sin θ_exit       (Snell at the lens/gap interface)
  //
  // and sin θ_exit = 0.93 is the geometric cap of the lens itself (held
  // fixed regardless of what fills the gap). So a higher n shrinks θ_gap,
  // narrows the cone inside the gap, and lands more numerical aperture at
  // the same focus point.
  const sinExit = 0.93;
  const sinGap = sinExit / n;
  const cosGap = Math.sqrt(1 - sinGap * sinGap);
  // Horizontal half-span at the lens exit plane (lensBot):
  const halfSpanGap = (waferY - lensBot) * (sinGap / cosGap);

  // Inside the lens we draw a converging pencil from a small pupil patch
  // down to (cx ± halfSpanGap, lensBot). Above lensBot the geometry is the
  // dry geometry — fixed — so it's identical in dry and wet modes.
  const pupilTop = lensTop + 18;
  const pupilHalfW = halfSpanGap + (lensBot - pupilTop) * 0.18; // slight in-lens taper

  // Outer rays + a central one. All converge to (cx, waferY).
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = ACCENT;
  for (const sign of [-1, 0, 1] as const) {
    const xPupil = cx + sign * pupilHalfW;
    const xExit = cx + sign * halfSpanGap;
    ctx.beginPath();
    ctx.moveTo(xPupil, pupilTop);
    ctx.lineTo(xExit, lensBot);
    ctx.lineTo(cx, waferY); // every ray lands at the focus
    ctx.stroke();
  }

  // Focus marker
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(cx, waferY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Soft cone fill (gap portion)
  ctx.fillStyle = "rgba(154,74,31,0.10)";
  ctx.beginPath();
  ctx.moveTo(cx - halfSpanGap, lensBot);
  ctx.lineTo(cx + halfSpanGap, lensBot);
  ctx.lineTo(cx, waferY);
  ctx.closePath();
  ctx.fill();

  // Angle arc at the focus — shows the half-angle θ_gap of the converging
  // cone hitting the wafer. Higher n shrinks this angle.
  ctx.strokeStyle = `rgba(154,74,31,0.7)`;
  ctx.lineWidth = 1;
  const arcR = 38;
  const angleGap = Math.asin(sinGap);
  ctx.beginPath();
  ctx.arc(cx, waferY, arcR, -Math.PI / 2 - angleGap, -Math.PI / 2 + angleGap);
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `2θ_gap = ${(((2 * angleGap) * 180) / Math.PI).toFixed(0)}°`,
    cx,
    waferY - arcR - 4,
  );

  // sinθ_exit annotation (constant)
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`sin θ_exit = 0.93 (fixed)`, W - 16, 24);

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
