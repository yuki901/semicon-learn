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
const H = 280;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inResist: boolean; // true = still inside resist, false = escaped into water
};

/**
 * Cross-section of the wafer stack. From bottom to top:
 *
 *   wafer (dark)  →  resist (warm tan)  →  optional topcoat  →  water (blue)
 *
 * Inside the resist, "PAG / acid" particles (red dots) jitter around with
 * Brownian motion. Without a topcoat, they random-walk across the resist/water
 * interface and escape upward into the water; the resist line edge (drawn as
 * a pair of vertical sidewalls) blurs by the same fraction of particles that
 * have left. With a topcoat, the interface is reflective: particles bounce
 * back instead of escaping, and the line edge stays crisp.
 */
export default function LeachingWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [hasTopcoat, setHasTopcoat] = useState(false);
  const particlesRef = useRef<Particle[]>([]);

  // Re-seed on toggle change
  useEffect(() => {
    particlesRef.current = seed();
  }, [hasTopcoat]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    if (particlesRef.current.length === 0) particlesRef.current = seed();

    let raf = 0;
    let last = performance.now();

    const step = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      advance(particlesRef.current, dt, hasTopcoat);
      draw(ctx, particlesRef.current, hasTopcoat);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hasTopcoat]);

  const total = particlesRef.current.length || 1;
  const escaped = particlesRef.current.filter((p) => !p.inResist).length;
  const escapedFrac = escaped / total;

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setHasTopcoat(false)}
            className="px-3 py-1 rounded border font-mono"
            style={{
              borderColor: !hasTopcoat ? ACCENT : RULE,
              background: !hasTopcoat ? ACCENT : "transparent",
              color: !hasTopcoat ? PAPER : INK_SOFT,
            }}
          >
            no topcoat
          </button>
          <button
            type="button"
            onClick={() => setHasTopcoat(true)}
            className="px-3 py-1 rounded border font-mono"
            style={{
              borderColor: hasTopcoat ? ACCENT : RULE,
              background: hasTopcoat ? ACCENT : "transparent",
              color: hasTopcoat ? PAPER : INK_SOFT,
            }}
          >
            topcoat (30 nm)
          </button>
        </div>
        <p className="mt-3 text-center text-sm" style={{ color: escapedFrac > 0.1 ? "#9a3030" : INK_SOFT }}>
          {hasTopcoat
            ? "photoacid stays in the resist — line edges hold"
            : `${(escapedFrac * 100).toFixed(0)}% of photoacid has leached into the water — line edge blurring`}
        </p>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Without a topcoat, photoacid molecules in the resist random-walk
        across the water boundary and leave. The fewer that stay, the more
        the line edges blur. The topcoat is a 30-nm polymer that closes the
        interface.
      </figcaption>
    </figure>
  );
}

const RESIST_TOP = 150;
const RESIST_BOT = 230;
const TOPCOAT_TOP = 130;
const WATER_TOP = 40;
const LEFT = 60;
const RIGHT = 500;
const LINE_HALF_W = 60;

function seed(): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < 110; i++) {
    ps.push({
      x: LEFT + Math.random() * (RIGHT - LEFT),
      y: RESIST_TOP + 4 + Math.random() * (RESIST_BOT - RESIST_TOP - 8),
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      inResist: true,
    });
  }
  return ps;
}

function advance(ps: Particle[], dt: number, hasTopcoat: boolean) {
  for (const p of ps) {
    // Brownian-ish jitter
    p.vx += (Math.random() - 0.5) * 80 * dt;
    p.vy += (Math.random() - 0.5) * 80 * dt;
    p.vx *= 0.9;
    p.vy *= 0.9;
    p.x += p.vx * dt * 10;
    p.y += p.vy * dt * 10;

    // x bounds (line sidewalls)
    if (p.x < LEFT) {
      p.x = LEFT;
      p.vx *= -1;
    }
    if (p.x > RIGHT) {
      p.x = RIGHT;
      p.vx *= -1;
    }

    if (p.inResist) {
      // Bottom: wafer (always reflective)
      if (p.y > RESIST_BOT) {
        p.y = RESIST_BOT;
        p.vy *= -1;
      }
      // Top: depends on topcoat
      const topBoundary = hasTopcoat ? TOPCOAT_TOP + 6 : RESIST_TOP;
      if (p.y < topBoundary) {
        if (hasTopcoat) {
          p.y = topBoundary;
          p.vy *= -1;
        } else {
          // Allow escape upward at small probability per crossing
          if (Math.random() < 0.4) {
            p.inResist = false;
            p.vy = -Math.abs(p.vy) - 10;
          } else {
            p.y = topBoundary;
            p.vy *= -1;
          }
        }
      }
    } else {
      // In water — drifts upward and dissipates
      p.vy -= 20 * dt;
      // Bound by water top
      if (p.y < WATER_TOP) {
        p.y = WATER_TOP;
        p.vy = 0;
      }
    }
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  ps: Particle[],
  hasTopcoat: boolean,
) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // ---- Layers ----
  // Water
  ctx.fillStyle = "rgba(120,170,200,0.25)";
  ctx.fillRect(20, WATER_TOP, W - 40, RESIST_TOP - WATER_TOP);
  ctx.fillStyle = "rgba(60,110,150,0.7)";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("water", 28, WATER_TOP + 14);

  // Topcoat (between water and resist)
  if (hasTopcoat) {
    ctx.fillStyle = "rgba(70,90,110,0.7)";
    ctx.fillRect(LEFT, TOPCOAT_TOP, RIGHT - LEFT, RESIST_TOP - TOPCOAT_TOP);
    ctx.fillStyle = "rgba(220,220,220,0.9)";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("topcoat", LEFT + 6, TOPCOAT_TOP + 12);
  }

  // Resist line (the printed line itself, idealized as a flat-top trapezoid)
  const cxLine = (LEFT + RIGHT) / 2;
  // Edge blurring scales with leaching fraction
  const total = ps.length || 1;
  const escapedFrac = ps.filter((p) => !p.inResist).length / total;
  const blur = hasTopcoat ? 0 : escapedFrac * 50;

  ctx.fillStyle = "#d5b07a";
  ctx.beginPath();
  ctx.moveTo(LEFT, RESIST_BOT);
  ctx.lineTo(RIGHT, RESIST_BOT);
  ctx.lineTo(cxLine + LINE_HALF_W + blur * 0.4, RESIST_TOP + blur * 0.2);
  ctx.bezierCurveTo(
    cxLine + LINE_HALF_W,
    RESIST_TOP,
    cxLine + LINE_HALF_W - blur,
    RESIST_TOP,
    cxLine + LINE_HALF_W - blur,
    RESIST_TOP,
  );
  ctx.lineTo(cxLine - LINE_HALF_W + blur, RESIST_TOP);
  ctx.lineTo(cxLine - LINE_HALF_W - blur * 0.4, RESIST_TOP + blur * 0.2);
  ctx.closePath();
  ctx.fill();

  // Resist label (placed in the empty strip to the left of the trapezoid base)
  ctx.fillStyle = "rgba(80,60,30,0.9)";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("resist line", 24, RESIST_BOT - 6);

  // Wafer base
  ctx.fillStyle = "#2f2a24";
  ctx.fillRect(20, RESIST_BOT, W - 40, H - RESIST_BOT - 20);
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("wafer", 28, RESIST_BOT + 16);

  // Edge ghosts (the blurry penumbra around the line)
  if (!hasTopcoat && blur > 1) {
    const grad = ctx.createLinearGradient(
      cxLine - LINE_HALF_W - blur,
      0,
      cxLine - LINE_HALF_W,
      0,
    );
    grad.addColorStop(0, "rgba(213,176,122,0)");
    grad.addColorStop(1, "rgba(213,176,122,0.6)");
    ctx.fillStyle = grad;
    ctx.fillRect(
      cxLine - LINE_HALF_W - blur,
      RESIST_TOP,
      blur,
      RESIST_BOT - RESIST_TOP,
    );
    const grad2 = ctx.createLinearGradient(
      cxLine + LINE_HALF_W,
      0,
      cxLine + LINE_HALF_W + blur,
      0,
    );
    grad2.addColorStop(0, "rgba(213,176,122,0.6)");
    grad2.addColorStop(1, "rgba(213,176,122,0)");
    ctx.fillStyle = grad2;
    ctx.fillRect(
      cxLine + LINE_HALF_W,
      RESIST_TOP,
      blur,
      RESIST_BOT - RESIST_TOP,
    );
  }

  // Particles
  for (const p of ps) {
    ctx.fillStyle = p.inResist ? ACCENT : "rgba(154,74,31,0.4)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particle legend
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("● photoacid molecule", W - 24, H - 6);

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
