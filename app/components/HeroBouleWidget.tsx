"use client";

import { useEffect, useRef } from "react";
import { setupHiDPI, PAPER, INK_MUTED } from "./canvas-util";

const W = 560;
const H = 220;

/**
 * A quiet, auto-playing mini-puller for the article header. No controls.
 * The pull rate breathes very slowly so the boule shape changes over many
 * seconds — the eye is meant to drift to it, not lock onto it.
 */
export default function HeroBouleWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;

    const meniscusY = 140;
    const SEED_HALF_W = 6;
    let profile: { age: number; r: number }[] = [{ age: 0, r: SEED_HALF_W }];
    let raf = 0;
    let last = performance.now();
    let t0 = performance.now();

    const step = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const phase = ((t - t0) / 1000) * 0.18; // very slow breathing
      const vPull = 1.0 + Math.sin(phase) * 0.6;
      const r = Math.max(
        SEED_HALF_W * 2.2,
        Math.min(60, SEED_HALF_W * 3 * Math.sqrt(1.4 / Math.max(vPull, 0.05))),
      );

      for (const seg of profile) seg.age += vPull * 14 * dt;
      profile.unshift({ age: 0, r });
      profile = profile.filter((seg) => seg.age <= 130);

      draw(ctx, profile, meniscusY);
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

function draw(
  ctx: CanvasRenderingContext2D,
  profile: { age: number; r: number }[],
  meniscusY: number,
) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;

  // Crucible (small, framed)
  const halfW = 90;
  const top = meniscusY;
  const bot = H - 24;
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.moveTo(cx - halfW - 8, top);
  ctx.lineTo(cx - halfW - 8, bot - 10);
  ctx.quadraticCurveTo(cx, bot + 12, cx + halfW + 8, bot - 10);
  ctx.lineTo(cx + halfW + 8, top);
  ctx.lineTo(cx + halfW, top);
  ctx.lineTo(cx + halfW, bot - 16);
  ctx.quadraticCurveTo(cx, bot + 2, cx - halfW, bot - 16);
  ctx.lineTo(cx - halfW, top);
  ctx.closePath();
  ctx.fill();

  // Melt
  const grad = ctx.createLinearGradient(0, top, 0, bot);
  grad.addColorStop(0, "#f0b46a");
  grad.addColorStop(0.5, "#d6802f");
  grad.addColorStop(1, "#7a3a14");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, top);
  ctx.lineTo(cx - halfW, bot - 16);
  ctx.quadraticCurveTo(cx, bot + 2, cx + halfW, bot - 16);
  ctx.lineTo(cx + halfW, top);
  ctx.closePath();
  ctx.fill();

  // Boule
  if (profile.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(cx - profile[0].r, meniscusY);
    for (let i = 0; i < profile.length; i++) {
      ctx.lineTo(cx - profile[i].r, meniscusY - profile[i].age);
    }
    for (let i = profile.length - 1; i >= 0; i--) {
      ctx.lineTo(cx + profile[i].r, meniscusY - profile[i].age);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(cx - 90, 0, cx + 90, 0);
    g.addColorStop(0, "#5a5651");
    g.addColorStop(0.45, "#cfc8be");
    g.addColorStop(0.55, "#e7e0d3");
    g.addColorStop(1, "#5a5651");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(31,29,26,0.5)";
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Seed rod up to top
    const topSeg = profile[profile.length - 1];
    const topY = meniscusY - topSeg.age;
    ctx.fillStyle = "#3a3631";
    ctx.fillRect(cx - 2, 10, 4, topY - 10);
    ctx.fillStyle = "#1f1d1a";
    ctx.fillRect(cx - 12, 4, 24, 10);
  }

  // Subtitle band, very faint
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("(pulling…)", cx, H - 6);
}
