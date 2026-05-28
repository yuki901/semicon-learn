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
const H = 360;

type Mode = "s" | "p" | "unpolarized";

/**
 * Two plane waves converge onto the wafer from angle ±θ. Their electric
 * fields are drawn as little arrows on the wavefronts. The contrast of the
 * resulting interference fringe is the dot product of the two field
 * vectors at the wafer plane, integrated over the relevant polarization
 * components.
 *
 *   s-polarized:  E perpendicular to the page  ⇒  always parallel  ⇒  contrast = 1
 *   p-polarized:  E in the page                ⇒  vectors open by 2θ ⇒  contrast = cos(2θ)
 *   unpolarized:  half s + half p              ⇒  contrast = (1 + cos 2θ) / 2
 *
 * The slider drags θ from 0 to ~68° (the iArF regime). The fringe plot at
 * the bottom shows what actually lands on the resist.
 */
export default function PolarizationWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [thetaDeg, setThetaDeg] = useState(45);
  const [mode, setMode] = useState<Mode>("unpolarized");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, (thetaDeg * Math.PI) / 180, mode);
  }, [thetaDeg, mode]);

  const theta = (thetaDeg * Math.PI) / 180;
  const cP = Math.cos(2 * theta);
  const cUnpol = (1 + cP) / 2;
  const contrast = mode === "s" ? 1 : mode === "p" ? cP : cUnpol;

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="theta" className="text-ink-soft">
            half-angle θ
          </label>
          <span className="font-mono text-ink">
            {thetaDeg.toFixed(0)}° &nbsp;·&nbsp; NA(water) ={" "}
            {(1.44 * Math.sin(theta)).toFixed(2)}
          </span>
        </div>
        <input
          id="theta"
          type="range"
          min={0}
          max={68}
          step={1}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>on-axis</span>
          <span>iArF maximum</span>
        </div>

        <div className="mt-4 flex gap-2 justify-center text-xs">
          {(["s", "p", "unpolarized"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded border font-mono"
              style={{
                borderColor: mode === m ? ACCENT : RULE,
                background: mode === m ? ACCENT : "transparent",
                color: mode === m ? PAPER : INK_SOFT,
              }}
            >
              {m === "unpolarized" ? "unpolarized" : `${m}-pol`}
            </button>
          ))}
        </div>

        <div className="mt-3 text-center text-sm">
          <span className="text-ink-muted">image contrast </span>
          <span className="font-mono text-ink">
            {contrast.toFixed(2)}
          </span>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Two beams converge onto the resist at ±θ. The little arrows are the
        electric-field direction on each wavefront. As θ grows, the two
        p-polarized arrows open up by 2θ and stop adding cleanly; the
        s-polarized arrows stay parallel and keep their full strength.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, theta: number, mode: Mode) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // ---- Geometry ----
  const cx = W / 2;
  const waferY = H - 110; // resist plane
  const apertureY = 40;
  const apertureHalfW = 200;

  // The two beam axes meet at (cx, waferY) coming from ±θ above.
  const leftAx = { x: cx - Math.tan(theta) * (waferY - apertureY), y: apertureY };
  const rightAx = { x: cx + Math.tan(theta) * (waferY - apertureY), y: apertureY };
  const focus = { x: cx, y: waferY };

  // ---- Wafer / resist strip ----
  ctx.fillStyle = "#e6dec7";
  ctx.fillRect(20, waferY, W - 40, 18);
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("resist", W - 28, waferY + 13);

  // ---- Final lens hint (curve at top) ----
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - apertureHalfW, apertureY);
  ctx.quadraticCurveTo(cx, apertureY - 22, cx + apertureHalfW, apertureY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - apertureHalfW, apertureY);
  ctx.quadraticCurveTo(cx, apertureY + 12, cx + apertureHalfW, apertureY);
  ctx.stroke();
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = "left";
  ctx.fillText("final lens", 24, apertureY - 6);

  // ---- Water gap shading ----
  ctx.fillStyle = "rgba(120, 170, 200, 0.12)";
  ctx.fillRect(cx - apertureHalfW, apertureY + 8, apertureHalfW * 2, waferY - apertureY - 8);
  ctx.fillStyle = "rgba(60, 110, 150, 0.6)";
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("water (n=1.44)", cx + apertureHalfW - 6, waferY - 6);

  // ---- Draw the two beams ----
  drawBeam(ctx, leftAx, focus, theta, +1, mode);
  drawBeam(ctx, rightAx, focus, theta, -1, mode);

  // ---- Field-vector inset at the wafer (the heart of the diagram) ----
  drawFieldInset(ctx, focus, theta, mode);

  // ---- Bottom: resulting fringe intensity ----
  drawFringe(ctx, theta, mode);

  // ---- Frame ----
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}

/**
 * Draw a single converging beam from `from` to `focus`, with three little
 * wavefronts along it. On each wavefront we draw a short arrow for the
 * electric-field direction in the chosen polarization mode.
 *
 *   side = +1 → left beam, -1 → right beam
 */
function drawBeam(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  focus: { x: number; y: number },
  theta: number,
  side: 1 | -1,
  mode: Mode,
) {
  // Beam ray
  ctx.strokeStyle = ACCENT_SOFT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(focus.x, focus.y);
  ctx.stroke();

  // Unit tangent along the beam (from → focus)
  const dx = focus.x - from.x;
  const dy = focus.y - from.y;
  const L = Math.hypot(dx, dy);
  const tx = dx / L;
  const ty = dy / L;
  // Perpendicular (in-plane), rotated +90°
  const px = -ty;
  const py = tx;

  // Three wavefronts along the beam at fractional distances
  for (const f of [0.3, 0.55, 0.8]) {
    const cx0 = from.x + dx * f;
    const cy0 = from.y + dy * f;
    // Wavefront tick (perpendicular to beam)
    ctx.strokeStyle = INK_SOFT;
    ctx.lineWidth = 1;
    const wfLen = 14;
    ctx.beginPath();
    ctx.moveTo(cx0 - px * wfLen, cy0 - py * wfLen);
    ctx.lineTo(cx0 + px * wfLen, cy0 + py * wfLen);
    ctx.stroke();

    // Electric-field arrow
    drawFieldArrow(ctx, cx0, cy0, px, py, mode, side);
  }
}

/**
 * Draw the electric-field arrow on a wavefront.
 *   - s-polarized: E is perpendicular to the page → drawn as a dot/cross
 *   - p-polarized: E lies in the page, perpendicular to the beam → arrow along (px,py)
 *   - unpolarized: draw both, faded
 */
function drawFieldArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  px: number,
  py: number,
  mode: Mode,
  side: 1 | -1,
) {
  const drawP = (alpha: number) => {
    ctx.strokeStyle = `rgba(154,74,31,${alpha})`;
    ctx.fillStyle = `rgba(154,74,31,${alpha})`;
    ctx.lineWidth = 2;
    const len = 16;
    // Point the p-arrow "up-and-toward-axis" consistently
    const ex = x + px * len * side;
    const ey = y + py * len * side;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // Arrowhead
    const ah = 4;
    const ang = Math.atan2(ey - y, ex - x);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ah * Math.cos(ang - 0.4), ey - ah * Math.sin(ang - 0.4));
    ctx.lineTo(ex - ah * Math.cos(ang + 0.4), ey - ah * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();
  };
  const drawS = (alpha: number) => {
    // Dot with surrounding circle = "arrow tip coming out of page"
    ctx.fillStyle = `rgba(31,29,26,${alpha})`;
    ctx.strokeStyle = `rgba(31,29,26,${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  };

  if (mode === "p") drawP(0.95);
  else if (mode === "s") drawS(0.95);
  else {
    drawP(0.55);
    drawS(0.55);
  }
}

/**
 * Inset at the focus showing the two field vectors superposed, plus the
 * angle 2θ between the p-components.
 */
function drawFieldInset(
  ctx: CanvasRenderingContext2D,
  focus: { x: number; y: number },
  theta: number,
  mode: Mode,
) {
  const ix = 90;
  const iy = focus.y - 24;
  const R = 28;

  // Inset box
  ctx.fillStyle = "rgba(251,247,238,0.95)";
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(ix - R - 8, iy - R - 18, 2 * R + 16, 2 * R + 30);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("at the resist", ix, iy - R - 6);

  // Two p-vectors opening by 2θ. They sit symmetrically about vertical.
  // Left beam contributes a vector tilted by -θ from vertical, right by +θ.
  const drawP = (alpha: number) => {
    ctx.strokeStyle = `rgba(154,74,31,${alpha})`;
    ctx.fillStyle = `rgba(154,74,31,${alpha})`;
    ctx.lineWidth = 2;
    for (const sign of [-1, 1]) {
      const ang = -Math.PI / 2 + sign * theta;
      const ex = ix + Math.cos(ang) * R;
      const ey = iy + Math.sin(ang) * R;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const ah = 5;
      const a2 = ang;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ah * Math.cos(a2 - 0.4), ey - ah * Math.sin(a2 - 0.4));
      ctx.lineTo(ex - ah * Math.cos(a2 + 0.4), ey - ah * Math.sin(a2 + 0.4));
      ctx.closePath();
      ctx.fill();
    }
    // Angle arc + label
    ctx.strokeStyle = `rgba(154,74,31,${alpha * 0.6})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ix, iy, R * 0.55, -Math.PI / 2 - theta, -Math.PI / 2 + theta);
    ctx.stroke();
    ctx.fillStyle = `rgba(154,74,31,${alpha})`;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`2θ`, ix, iy - R * 0.55 - 3);
  };
  const drawS = (alpha: number) => {
    // Two s-vectors are both out-of-page → draw two dots side-by-side
    ctx.strokeStyle = `rgba(31,29,26,${alpha})`;
    ctx.fillStyle = `rgba(31,29,26,${alpha})`;
    ctx.lineWidth = 1.2;
    for (const off of [-8, 8]) {
      ctx.beginPath();
      ctx.arc(ix + off, iy, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ix + off, iy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(31,29,26,${alpha})`;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("both ⊙", ix, iy + R - 4);
  };

  if (mode === "p") drawP(0.95);
  else if (mode === "s") drawS(0.95);
  else {
    drawP(0.6);
    drawS(0.6);
  }
}

/**
 * Bottom fringe plot — the 1-D intensity that actually exposes the resist.
 * Period is fixed (it depends on λ and θ but here we're showing contrast,
 * not absolute pitch). The visibility V = (Imax-Imin)/(Imax+Imin) is set
 * by the polarization-projected dot product of the two field vectors.
 */
function drawFringe(
  ctx: CanvasRenderingContext2D,
  theta: number,
  mode: Mode,
) {
  const y0 = H - 60;
  const y1 = H - 30;
  const xL = 40;
  const xR = W - 40;

  // Visibility
  let V = 1;
  if (mode === "p") V = Math.cos(2 * theta);
  else if (mode === "unpolarized") V = (1 + Math.cos(2 * theta)) / 2;
  V = Math.max(0, V);

  // Track frame
  ctx.fillStyle = "#f0e8d4";
  ctx.fillRect(xL, y0, xR - xL, y1 - y0);

  // Draw fringe as gradient of intensity along x
  const cycles = 8;
  const N = 240;
  const stepX = (xR - xL) / N;
  for (let i = 0; i < N; i++) {
    const u = i / N;
    const phase = u * cycles * 2 * Math.PI;
    const I = 0.5 + 0.5 * V * Math.cos(phase); // 0..1 after V scaling
    const shade = Math.round(20 + (1 - I) * 200);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(xL + i * stepX, y0, stepX + 0.5, y1 - y0);
  }

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(xL + 0.5, y0 + 0.5, xR - xL - 1, y1 - y0 - 1);

  ctx.fillStyle = INK_SOFT;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("intensity at resist", xL, y0 - 6);
  ctx.textAlign = "right";
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(`visibility V = ${V.toFixed(2)}`, xR, y0 - 6);
}
