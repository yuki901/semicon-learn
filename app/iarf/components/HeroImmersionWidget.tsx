"use client";

import { useEffect, useRef } from "react";
import { setupHiDPI, PAPER, INK_MUTED } from "./canvas-util";

const W = 560;
const H = 220;

/**
 * Hero: light enters water from above. v = c/n, the frequency is set by
 * the source, so the wavelength shortens by a factor of n the moment it
 * crosses the surface. Drawn as three transverse waves that visibly
 * compress at the interface and keep propagating downward.
 */
export default function HeroImmersionWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      draw(ctx, (t - t0) / 1000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <figure className="mb-12">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
        aria-hidden
      />
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const surfaceY = 80;
  const n = 1.44;
  const lambdaAir = 52;
  const lambdaWater = lambdaAir / n;
  const amp = 7;
  const omegaT = t * 0.7 * 2 * Math.PI;

  // Water region
  ctx.fillStyle = "rgba(120, 170, 200, 0.22)";
  ctx.fillRect(0, surfaceY, W, H - surfaceY);

  // Water surface line
  ctx.strokeStyle = "rgba(60, 110, 150, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, surfaceY);
  ctx.lineTo(W, surfaceY);
  ctx.stroke();

  // Three transverse waves propagating downward. Phase is continuous
  // across the surface; only the spatial period changes (k_air → k_water).
  const beamXs = [W * 0.28, W * 0.5, W * 0.72];
  const yTop = 8;
  const yBot = H - 8;

  for (const x of beamXs) {
    ctx.strokeStyle = "rgba(154, 74, 31, 0.78)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();

    for (let y = yTop; y <= yBot; y += 1) {
      let phase: number;
      if (y < surfaceY) {
        phase = (y / lambdaAir) * 2 * Math.PI - omegaT;
      } else {
        const phaseAtSurface =
          (surfaceY / lambdaAir) * 2 * Math.PI - omegaT;
        phase =
          phaseAtSurface + ((y - surfaceY) / lambdaWater) * 2 * Math.PI;
      }
      const dx = Math.sin(phase) * amp;
      if (y === yTop) ctx.moveTo(x + dx, y);
      else ctx.lineTo(x + dx, y);
    }
    ctx.stroke();
  }

  // Labels
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";

  ctx.fillStyle = INK_MUTED;
  ctx.fillText("air", 16, 22);
  ctx.fillText("λ = 193 nm", 16, 38);

  ctx.fillStyle = "rgba(60, 110, 150, 0.85)";
  ctx.fillText("water  (n = 1.44)", 16, surfaceY + 18);
  ctx.fillText("λ = 193 / n = 134 nm", 16, surfaceY + 34);
}
