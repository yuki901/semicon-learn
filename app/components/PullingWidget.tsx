"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Chapter 2 — Melt it, dip it, pull it slowly.
 *
 * A side-view animation of a Czochralski puller:
 *   - heated graphite crucible holding molten silicon,
 *   - a seed crystal touching the surface,
 *   - a single-crystal boule growing upward.
 *
 * One slider controls the pull rate v_p (mm/min).
 * Mass conservation across the meniscus gives, very roughly,
 *   r_crystal ≈ r_seed * sqrt(v_solidify / v_pull),
 * where v_solidify is set by the thermal field (treated here as constant).
 * Pull faster → the column has to be thinner. Pull slower → it widens.
 */

const W = 560;
const H = 360;

const CRUCIBLE_TOP_Y = 220;
const CRUCIBLE_BOTTOM_Y = 320;
const CRUCIBLE_HALF_W = 130;
const CRUCIBLE_WALL = 10;

const SEED_HALF_W = 8;
const V_SOLIDIFY = 1.4; // arbitrary units; the "fast enough" growth speed
const MAX_BOULE_LEN = 170; // visible boule length before reset
// Visual gain so the boule reads as substantial, not a thread.
const RADIUS_GAIN = 2.6;

function crystalRadius(vPull: number): number {
  // r ~ sqrt(v_solidify / v_pull), clamped so the visuals stay sane.
  const ratio = V_SOLIDIFY / Math.max(vPull, 0.05);
  const r = SEED_HALF_W * RADIUS_GAIN * Math.sqrt(ratio);
  return Math.max(SEED_HALF_W * 1.2, Math.min(r, CRUCIBLE_HALF_W * 0.88));
}

export default function PullingWidget() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [vPull, setVPull] = useState(1.0); // mm/min, normalized
  const [paused, setPaused] = useState(false);

  // Refs that the animation loop reads without re-subscribing.
  const vPullRef = useRef(vPull);
  const pausedRef = useRef(paused);
  vPullRef.current = vPull;
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle HiDPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Profile of the growing boule: array of {y_relative_to_top, radius}.
    // y = 0 is the meniscus surface; y grows downward in pixels (but we draw upward).
    // Initialized with a small "shoulder" so the first frames look sensible.
    let profile: { age: number; r: number }[] = [
      { age: 0, r: SEED_HALF_W },
    ];

    let rafId = 0;
    let last = performance.now();

    const step = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05); // seconds, clamped
      last = t;

      if (!pausedRef.current) {
        const vp = vPullRef.current; // mm/min (just a relative unit here)
        // Pixels per second the boule moves up:
        const pxPerSec = vp * 14;
        // Age every existing segment.
        for (const seg of profile) {
          seg.age += pxPerSec * dt;
        }
        // Add a fresh segment at the meniscus with the current radius.
        const r = crystalRadius(vp);
        profile.unshift({ age: 0, r });
        // Drop segments that have moved off the visible region.
        profile = profile.filter((seg) => seg.age <= MAX_BOULE_LEN);
      }

      draw(ctx, profile);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <figure className="widget-surface">
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          aria-label="Czochralski puller: a seed crystal pulled slowly upward from a crucible of molten silicon, growing into a single-crystal boule."
          className="block"
          style={{ width: W, height: H }}
        />
        <div className="controls w-full max-w-md mt-4">
          <div className="flex items-baseline justify-between mb-1">
            <label htmlFor="pull-rate" className="text-ink-soft">
              pull rate
            </label>
            <span className="font-mono text-ink">
              {vPull.toFixed(2)} <span className="text-ink-muted">mm/min</span>
            </span>
          </div>
          <input
            id="pull-rate"
            type="range"
            min={0.2}
            max={4.0}
            step={0.05}
            value={vPull}
            onChange={(e) => setVPull(parseFloat(e.target.value))}
            className="paper-range"
          />
          <div className="flex justify-between text-xs text-ink-muted mt-1">
            <span>slower → fatter boule</span>
            <span>faster → thinner boule</span>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="mt-3 text-xs font-sans text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            {paused ? "resume" : "pause"}
          </button>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        A simplified side view. The molten silicon stays in the crucible; the
        boule grows by atoms freezing onto its bottom face as it is pulled up.
        With faster pulling, less time is available for atoms to attach, so the
        crystal narrows.
      </figcaption>
    </figure>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  profile: { age: number; r: number }[],
) {
  // Background paper
  ctx.fillStyle = "#fbf7ee";
  ctx.fillRect(0, 0, W, H);

  drawCrucibleAndMelt(ctx);
  drawBoule(ctx, profile);
  drawSeedRod(ctx, profile);
  drawAnnotations(ctx, profile);
}

function drawCrucibleAndMelt(ctx: CanvasRenderingContext2D) {
  const cx = W / 2;
  const top = CRUCIBLE_TOP_Y;
  const bot = CRUCIBLE_BOTTOM_Y;
  const halfW = CRUCIBLE_HALF_W;
  const wall = CRUCIBLE_WALL;

  // Crucible body (graphite + quartz liner, shown as one dark wall).
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.moveTo(cx - halfW - wall, top);
  ctx.lineTo(cx - halfW - wall, bot);
  ctx.quadraticCurveTo(cx, bot + 30, cx + halfW + wall, bot);
  ctx.lineTo(cx + halfW + wall, top);
  ctx.lineTo(cx + halfW, top);
  ctx.lineTo(cx + halfW, bot - 4);
  ctx.quadraticCurveTo(cx, bot + 20, cx - halfW, bot - 4);
  ctx.lineTo(cx - halfW, top);
  ctx.closePath();
  ctx.fill();

  // Molten silicon — a warm, slightly glowing surface.
  const grad = ctx.createLinearGradient(0, top, 0, bot);
  grad.addColorStop(0, "#f0b46a");
  grad.addColorStop(0.5, "#d6802f");
  grad.addColorStop(1, "#7a3a14");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, top);
  ctx.lineTo(cx - halfW, bot - 6);
  ctx.quadraticCurveTo(cx, bot + 16, cx + halfW, bot - 6);
  ctx.lineTo(cx + halfW, top);
  ctx.closePath();
  ctx.fill();

  // Meniscus highlight at the surface
  ctx.strokeStyle = "rgba(255,230,180,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - halfW + 2, top + 0.5);
  ctx.lineTo(cx + halfW - 2, top + 0.5);
  ctx.stroke();
}

function drawBoule(
  ctx: CanvasRenderingContext2D,
  profile: { age: number; r: number }[],
) {
  const cx = W / 2;
  const meniscusY = CRUCIBLE_TOP_Y;

  // The boule is the swept region from age=0 (at meniscus) upward.
  if (profile.length < 2) return;

  // Left side (going up), then right side (coming down).
  ctx.beginPath();
  ctx.moveTo(cx - profile[0].r, meniscusY);
  for (let i = 0; i < profile.length; i++) {
    const seg = profile[i];
    const y = meniscusY - seg.age;
    ctx.lineTo(cx - seg.r, y);
  }
  for (let i = profile.length - 1; i >= 0; i--) {
    const seg = profile[i];
    const y = meniscusY - seg.age;
    ctx.lineTo(cx + seg.r, y);
  }
  ctx.closePath();

  // Silvery silicon column
  const grad = ctx.createLinearGradient(cx - CRUCIBLE_HALF_W, 0, cx + CRUCIBLE_HALF_W, 0);
  grad.addColorStop(0, "#5a5651");
  grad.addColorStop(0.45, "#cfc8be");
  grad.addColorStop(0.55, "#e7e0d3");
  grad.addColorStop(1, "#5a5651");
  ctx.fillStyle = grad;
  ctx.fill();

  // Faint outline
  ctx.strokeStyle = "rgba(31,29,26,0.5)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // A small glow at the freezing front
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(
    cx,
    meniscusY,
    2,
    cx,
    meniscusY,
    profile[0].r + 14,
  );
  glow.addColorStop(0, "rgba(255,170,90,0.55)");
  glow.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 40, meniscusY - 14, 80, 28);
  ctx.restore();
}

function drawSeedRod(
  ctx: CanvasRenderingContext2D,
  profile: { age: number; r: number }[],
) {
  const cx = W / 2;
  const meniscusY = CRUCIBLE_TOP_Y;

  // The seed rod is the thin stem above the topmost segment.
  const topSeg = profile[profile.length - 1] ?? { age: 0, r: SEED_HALF_W };
  const topY = meniscusY - topSeg.age;

  // Rod
  ctx.fillStyle = "#3a3631";
  ctx.fillRect(cx - 3, 20, 6, topY - 20);
  // Chuck
  ctx.fillStyle = "#1f1d1a";
  ctx.fillRect(cx - 16, 14, 32, 12);
  // Up arrow above chuck
  ctx.strokeStyle = "#1f1d1a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, 10);
  ctx.lineTo(cx, 0);
  ctx.moveTo(cx - 4, 4);
  ctx.lineTo(cx, 0);
  ctx.lineTo(cx + 4, 4);
  ctx.stroke();
}

function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  profile: { age: number; r: number }[],
) {
  const cx = W / 2;
  ctx.fillStyle = "#8a8377";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";

  // Crucible label
  ctx.fillText("crucible", cx - CRUCIBLE_HALF_W - 80, CRUCIBLE_BOTTOM_Y + 6);
  // Melt label
  ctx.fillText("molten Si (~1414 °C)", cx + CRUCIBLE_HALF_W + 18, CRUCIBLE_TOP_Y + 60);
  // Boule label
  ctx.fillText("single-crystal boule", cx + CRUCIBLE_HALF_W + 18, CRUCIBLE_TOP_Y - 40);

  // Current diameter readout near the meniscus.
  const r0 = profile[0]?.r ?? SEED_HALF_W;
  ctx.fillStyle = "#1f1d1a";
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(
    `2r ≈ ${(r0 * 2).toFixed(0)} px`,
    cx - CRUCIBLE_HALF_W - 12,
    CRUCIBLE_TOP_Y - 10,
  );
}
