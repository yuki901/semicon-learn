"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, RULE, ACCENT, clamp } from "./canvas-util";

const W = 560;
const H = 320;
const PAD_L = 60;
const PAD_R = 240;
const PAD_T = 24;
const PAD_B = 50;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

/**
 * 2D process window (pull rate × rotation). Drag the dot to pick an
 * operating point. The wafer preview on the right colors vacancy-rich
 * regions blue and interstitial-rich regions orange. A narrow green
 * "perfect" band runs diagonally through the middle.
 */
export default function DefectMapWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [point, setPoint] = useState({ x: 0.5, y: 0.5 });
  const draggingRef = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, point);
  }, [point]);

  const onPointer = (clientX: number, clientY: number) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp((clientX - rect.left - PAD_L) / PLOT_W, 0, 1);
    const y = clamp(1 - (clientY - rect.top - PAD_T) / PLOT_H, 0, 1);
    setPoint({ x, y });
  };

  const ratio = defectRatio(point.x, point.y); // -1 (interstitial) … +1 (vacancy)
  const regime =
    ratio > 0.55
      ? "vacancy-rich"
      : ratio > 0.15
        ? "mostly vacancies"
        : ratio > -0.15
          ? "perfect crystal"
          : ratio > -0.55
            ? "mostly interstitials"
            : "interstitial-rich";

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H, touchAction: "none", cursor: "grab" }}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) onPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => (draggingRef.current = false)}
      />
      <figcaption className="mt-3 max-w-md mx-auto">
        Drag the dot. The diagonal green strip is the Voronkov window where
        the crystal grows defect-free. Step off it in either direction and
        the boule fills with vacancies or self-interstitials. This is the
        actual map an engineer tunes when commissioning a CZ puller.
      </figcaption>
      <div className="text-center text-xs font-sans text-ink-soft mt-2">
        {regime}
      </div>
    </figure>
  );
}

function defectRatio(x: number, y: number): number {
  // Map (x, y) ∈ [0,1]² to v/G ratio centered on a diagonal.
  // High pull (y) → vacancy. High rotation (x) → slightly shifts the window.
  // Center of the "perfect" band runs from (0.2, 0.4) to (0.8, 0.6).
  const target = 0.4 + 0.2 * x;
  return clamp((y - target) * 3, -1, 1);
}

function draw(ctx: CanvasRenderingContext2D, p: { x: number; y: number }) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Heatmap of defectRatio
  const step = 4;
  for (let py = 0; py < PLOT_H; py += step) {
    for (let px = 0; px < PLOT_W; px += step) {
      const xn = px / PLOT_W;
      const yn = 1 - py / PLOT_H;
      const r = defectRatio(xn, yn);
      ctx.fillStyle = defectColor(r);
      ctx.fillRect(PAD_L + px, PAD_T + py, step, step);
    }
  }

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(PAD_L - 0.5, PAD_T - 0.5, PLOT_W + 1, PLOT_H + 1);

  // Axis labels
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("rotation rate →", PAD_L + PLOT_W / 2, H - 22);
  ctx.save();
  ctx.translate(PAD_L - 36, PAD_T + PLOT_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("pull rate →", 0, 0);
  ctx.restore();

  // The Voronkov diagonal — drawn as the central green band's centerline.
  ctx.strokeStyle = "rgba(40,90,40,0.8)";
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const xn = i / 80;
    const target = 0.4 + 0.2 * xn;
    const px = PAD_L + xn * PLOT_W;
    const py = PAD_T + (1 - target) * PLOT_H;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair + dot
  const dx = PAD_L + p.x * PLOT_W;
  const dy = PAD_T + (1 - p.y) * PLOT_H;
  ctx.strokeStyle = "rgba(31,29,26,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_L, dy);
  ctx.lineTo(PAD_L + PLOT_W, dy);
  ctx.moveTo(dx, PAD_T);
  ctx.lineTo(dx, PAD_T + PLOT_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(dx, dy, 8, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PAPER;
  ctx.stroke();

  // Wafer cross-section preview to the right
  drawWaferPreview(ctx, p);
}

function defectColor(r: number): string {
  // r > 0: vacancy (cool blue). r < 0: interstitial (warm orange).
  if (Math.abs(r) < 0.12) return "rgba(110,150,90,0.85)";
  if (r > 0) {
    const t = Math.min(1, r);
    return `rgba(${Math.round(80 + 60 * (1 - t))},${Math.round(120 + 30 * (1 - t))},${Math.round(190 + 30 * t)},0.85)`;
  } else {
    const t = Math.min(1, -r);
    return `rgba(${Math.round(180 + 50 * t)},${Math.round(110 - 40 * t)},${Math.round(60)},0.85)`;
  }
}

function drawWaferPreview(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number },
) {
  const cx = W - PAD_R / 2;
  const cy = H / 2 - 10;
  const R = 90;

  // Wafer base disk
  ctx.fillStyle = "#e5dccb";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(31,29,26,0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Splotches of vacancy/interstitial proportional to ratio
  const ratio = defectRatio(p.x, p.y);
  const n = 70;
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2 + (p.x + p.y) * 9;
    const rad = R * Math.sqrt((i + 1) / n);
    const px = cx + Math.cos(theta) * rad;
    const py = cy + Math.sin(theta) * rad;

    const localR =
      ratio + (Math.sin(theta * 3 + i) + Math.cos(rad * 0.1)) * 0.15;
    if (Math.abs(localR) < 0.18) continue;
    ctx.fillStyle = defectColor(localR);
    ctx.beginPath();
    ctx.arc(px, py, 2.2 + Math.abs(localR) * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Notch
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(cx, cy + R);
  ctx.lineTo(cx - 6, cy + R - 10);
  ctx.lineTo(cx + 6, cy + R - 10);
  ctx.closePath();
  ctx.fill();

  // Caption
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("wafer cross-section", cx, cy + R + 22);

  // Legend
  const legendY = PAD_T + 6;
  const legend = (label: string, color: string, dy: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(W - PAD_R + 12, legendY + dy, 10, 10);
    ctx.fillStyle = INK_MUTED;
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, W - PAD_R + 28, legendY + dy + 9);
  };
  legend("vacancy", "rgba(80,130,210,0.85)", 0);
  legend("perfect", "rgba(110,150,90,0.85)", 16);
  legend("interstitial", "rgba(220,80,60,0.85)", 32);
}
