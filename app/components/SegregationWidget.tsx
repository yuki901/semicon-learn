"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, RULE, ACCENT } from "./canvas-util";

const W = 600;
const H = 400;
const PAD_L = 60;
const PAD_R = 30;
const PAD_T = 24;
const BOULE_AREA_H = 130; // bottom region reserved for the 3D-ish boule
const PAD_B_AXIS = 30; // axis label space under plot
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - BOULE_AREA_H - PAD_B_AXIS;

const DOPANTS = [
  { id: "B", name: "boron (p-type)", k: 0.8, color: "#1f6b3a" },
  { id: "P", name: "phosphorus (n-type)", k: 0.35, color: "#7a3e8f" },
  { id: "As", name: "arsenic (n-type)", k: 0.3, color: "#155a8a" },
  { id: "O", name: "oxygen (impurity)", k: 1.25, color: "#9a4a1f" },
] as const;

/**
 * Scheil equation:   C_s(f) = k * C_0 * (1 - f)^(k - 1)
 * f is the solidified fraction — equivalently, the position along the
 * boule from head (pulled first) to tail (pulled last). The bottom of
 * the widget shows the boule in side view; cursor drags along it.
 */
export default function SegregationWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [dopant, setDopant] = useState<string>("P");
  const [cursor, setCursor] = useState(0.4);
  const draggingRef = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    const d = DOPANTS.find((d) => d.id === dopant)!;
    draw(ctx, d, cursor);
  }, [dopant, cursor]);

  const onPointer = (clientX: number) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - PAD_L) / PLOT_W;
    setCursor(Math.max(0, Math.min(1, x)));
  };

  const d = DOPANTS.find((dop) => dop.id === dopant)!;
  const Cs = d.k * Math.pow(1 - Math.min(cursor, 0.999), d.k - 1);

  return (
    <figure className="widget-surface">
      <div className="mx-auto mb-3 flex flex-wrap justify-center gap-2 font-sans text-sm">
        {DOPANTS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setDopant(opt.id)}
            className="px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: dopant === opt.id ? opt.color : "transparent",
              color: dopant === opt.id ? PAPER : INK_MUTED,
              border: `1px solid ${dopant === opt.id ? opt.color : RULE}`,
            }}
          >
            {opt.name} <span className="opacity-70">k={opt.k}</span>
          </button>
        ))}
      </div>
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{
          width: W,
          height: H,
          maxWidth: "100%",
          touchAction: "none",
          cursor: "ew-resize",
        }}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) onPointer(e.clientX);
        }}
        onPointerUp={() => (draggingRef.current = false)}
      />
      <figcaption className="mt-3 max-w-md mx-auto">
        The Scheil equation, plotted above and painted onto the boule below.
        The head of the boule was pulled first; the tail came hours later
        from a melt that had become more concentrated. Drag along the boule
        to read the local doping.
      </figcaption>
      <div className="text-center text-xs font-sans text-ink-soft mt-2">
        at f={(cursor * 100).toFixed(0)}% solidified,{" "}
        C<sub>s</sub>/C<sub>0</sub> ={" "}
        <span className="font-mono text-ink">{Cs.toFixed(3)}</span>
      </div>
    </figure>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  d: typeof DOPANTS[number],
  cursor: number,
) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // y-axis scale (linear up to 4×)
  const yMax = 4;

  // === Plot frame ===
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_L, PAD_T);
  ctx.lineTo(PAD_L, PAD_T + PLOT_H);
  ctx.lineTo(PAD_L + PLOT_W, PAD_T + PLOT_H);
  ctx.stroke();

  // C₀ reference line
  ctx.strokeStyle = "rgba(31,29,26,0.18)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  const y1 = PAD_T + PLOT_H * (1 - 1 / yMax);
  ctx.moveTo(PAD_L, y1);
  ctx.lineTo(PAD_L + PLOT_W, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("C₀ (original melt)", PAD_L + 4, y1 - 4);

  // === Scheil curve ===
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const f = i / 200;
    if (f >= 0.999) continue;
    const C = d.k * Math.pow(1 - f, d.k - 1);
    const x = PAD_L + f * PLOT_W;
    const y = PAD_T + PLOT_H * (1 - Math.min(C, yMax) / yMax);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = d.color;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Filled area under curve
  ctx.lineTo(PAD_L + PLOT_W, PAD_T + PLOT_H);
  ctx.lineTo(PAD_L, PAD_T + PLOT_H);
  ctx.closePath();
  ctx.fillStyle = d.color + "1f";
  ctx.fill();

  // y-axis labels
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= yMax; i++) {
    const y = PAD_T + PLOT_H * (1 - i / yMax);
    ctx.fillText(`${i}×C₀`, PAD_L - 6, y + 3);
  }

  // x-axis label sits between the plot and the boule
  ctx.textAlign = "center";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(
    "fraction solidified, f  =  position along the boule",
    PAD_L + PLOT_W / 2,
    PAD_T + PLOT_H + 18,
  );

  // === 3D-ish boule ===
  drawBoule(ctx, d, cursor);
}

/**
 * Render the boule as a cone–cylinder–cone in side view with elliptical
 * end caps for depth and a top-lit highlight band. Doping concentration
 * paints the surface as a colored stripe along the length.
 */
function drawBoule(
  ctx: CanvasRenderingContext2D,
  d: typeof DOPANTS[number],
  cursor: number,
) {
  const yMax = 4;
  const cyB = PAD_T + PLOT_H + PAD_B_AXIS + BOULE_AREA_H / 2 - 10;
  const rB = 44; // boule cylinder radius (vertical)
  const conel = 50; // length of each cone end
  const leftX = PAD_L;
  const rightX = PAD_L + PLOT_W;
  const cylStartX = leftX + conel;
  const cylEndX = rightX - conel;

  // Shadow under boule
  ctx.fillStyle = "rgba(31,29,26,0.12)";
  ctx.beginPath();
  ctx.ellipse(
    (leftX + rightX) / 2,
    cyB + rB + 12,
    (rightX - leftX) / 2 - 10,
    7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Base silvery silicon — gradient top→bottom so it reads as a cylinder
  const baseGrad = ctx.createLinearGradient(0, cyB - rB, 0, cyB + rB);
  baseGrad.addColorStop(0, "#a39c8e");
  baseGrad.addColorStop(0.45, "#e9e2d3");
  baseGrad.addColorStop(0.55, "#efe9da");
  baseGrad.addColorStop(1, "#7d7669");

  ctx.beginPath();
  // Left cone tip
  ctx.moveTo(leftX, cyB);
  // Top edge of cylinder
  ctx.lineTo(cylStartX, cyB - rB);
  ctx.lineTo(cylEndX, cyB - rB);
  // Right cone tip
  ctx.lineTo(rightX, cyB);
  // Bottom edge back
  ctx.lineTo(cylEndX, cyB + rB);
  ctx.lineTo(cylStartX, cyB + rB);
  ctx.closePath();
  ctx.fillStyle = baseGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(31,29,26,0.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Doping color overlay — a stripe along the central axis with
  // alpha = local concentration. Keeps the silvery cylinder shading
  // visible at the top/bottom edges.
  const stripeTop = cyB - rB * 0.78;
  const stripeBot = cyB + rB * 0.78;
  const stripeH = stripeBot - stripeTop;

  // Doping fill is clipped to the boule silhouette so it follows the cones.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(leftX, cyB);
  ctx.lineTo(cylStartX, cyB - rB);
  ctx.lineTo(cylEndX, cyB - rB);
  ctx.lineTo(rightX, cyB);
  ctx.lineTo(cylEndX, cyB + rB);
  ctx.lineTo(cylStartX, cyB + rB);
  ctx.closePath();
  ctx.clip();

  for (let x = leftX; x < rightX; x++) {
    const f = (x - leftX) / (rightX - leftX);
    if (f >= 0.999) break;
    const C = d.k * Math.pow(1 - f, d.k - 1);
    const t = Math.min(C / yMax, 1);
    // Vertical alpha falloff for a "painted on a cylinder" feel
    for (let y = stripeTop; y < stripeBot; y++) {
      const v = (y - stripeTop) / stripeH; // 0..1
      const verticalAlpha = 1 - Math.abs(v - 0.5) * 1.4;
      const alpha = (0.18 + 0.65 * t) * Math.max(0, verticalAlpha);
      ctx.fillStyle = hexWithAlpha(d.color, alpha);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();

  // Specular highlight band — sells the cylindrical curvature
  const hl = ctx.createLinearGradient(0, cyB - rB * 0.85, 0, cyB - rB * 0.25);
  hl.addColorStop(0, "rgba(255,255,255,0)");
  hl.addColorStop(0.5, "rgba(255,255,255,0.55)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.moveTo(cylStartX, cyB - rB);
  ctx.lineTo(cylEndX, cyB - rB);
  ctx.lineTo(cylEndX, cyB - rB * 0.25);
  ctx.lineTo(cylStartX, cyB - rB * 0.25);
  ctx.closePath();
  ctx.fill();

  // End cap ellipses (for depth)
  // Right end cap (tail) — face we see straight on
  ctx.fillStyle = "rgba(31,29,26,0.15)";
  ctx.beginPath();
  ctx.ellipse(cylEndX, cyB, 4, rB, 0, 0, Math.PI * 2);
  ctx.fill();

  // === Cursor ===
  const cx = leftX + cursor * (rightX - leftX);
  // Connector line from plot down to boule
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, PAD_T);
  ctx.lineTo(cx, cyB - rB);
  ctx.stroke();
  ctx.setLineDash([]);

  // Saw-like marker on the boule surface
  // A thin vertical band that goes around the cylinder
  ctx.strokeStyle = "rgba(31,29,26,0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cyB - rB);
  ctx.lineTo(cx, cyB + rB);
  ctx.stroke();

  // Knob: round, paper-colored, with accent ring
  ctx.beginPath();
  ctx.arc(cx, cyB - rB - 14, 12, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tip / tail labels with explicit "pulled first / pulled last"
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("head", leftX, cyB + rB + 22);
  ctx.fillText("(pulled first, from fresh melt)", leftX, cyB + rB + 38);
  ctx.textAlign = "right";
  ctx.fillText("tail", rightX, cyB + rB + 22);
  ctx.fillText("(pulled last, from concentrated melt)", rightX, cyB + rB + 38);

  // Arrow indicating "pulling direction" running over the top of the boule
  ctx.strokeStyle = "rgba(31,29,26,0.45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(leftX + 14, cyB - rB - 28);
  ctx.lineTo(rightX - 14, cyB - rB - 28);
  ctx.stroke();
  // Arrowhead at right
  ctx.beginPath();
  ctx.moveTo(rightX - 14, cyB - rB - 28);
  ctx.lineTo(rightX - 22, cyB - rB - 33);
  ctx.lineTo(rightX - 22, cyB - rB - 23);
  ctx.closePath();
  ctx.fillStyle = "rgba(31,29,26,0.45)";
  ctx.fill();
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "pulling direction →   (time advances head → tail)",
    (leftX + rightX) / 2,
    cyB - rB - 34,
  );
}

function hexWithAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}
