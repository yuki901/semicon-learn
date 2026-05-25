"use client";

import { useEffect, useRef, useState } from "react";
import { setupHiDPI, PAPER, INK, INK_MUTED, RULE, ACCENT, clamp } from "./canvas-util";

const W = 720;
const H = 480;

/**
 * A side view of a finished boule (top half) plus a stack of sliced wafers
 * fanning out below. Drag the saw blade along the boule; the wafer at that
 * position lights up in the stack. The thickness slider visibly changes the
 * number of wafers stacked.
 */
export default function SliceWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [position, setPosition] = useState(0.5);
  const [thicknessUm, setThicknessUm] = useState(775);
  const draggingRef = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, position, thicknessUm);
  }, [position, thicknessUm]);

  const onPointer = (clientX: number) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const padL = 60;
    const padR = 60;
    const plotW = W - padL - padR;
    const x = (clientX - rect.left - padL) / plotW;
    setPosition(clamp(x, 0, 1));
  };

  const kerfUm = 200;
  const lenMm = 1000;
  const wafersPerBoule = Math.floor((lenMm * 1000) / (thicknessUm + kerfUm));
  const yieldRatio = thicknessUm / (thicknessUm + kerfUm);

  return (
    <figure className="widget-surface" style={{ marginInline: "-3rem" }}>
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
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between mb-1">
          <label htmlFor="thk" className="text-ink-soft">
            wafer thickness
          </label>
          <span className="font-mono text-ink">{thicknessUm} µm</span>
        </div>
        <input
          id="thk"
          type="range"
          min={300}
          max={1500}
          step={25}
          value={thicknessUm}
          onChange={(e) => setThicknessUm(parseInt(e.target.value))}
          className="paper-range"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>thinner — more wafers, more breakage</span>
          <span>thicker — safer, fewer wafers</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-sans">
          <div>
            <span className="text-ink-muted">wafers per boule: </span>
            <span className="font-mono text-ink">{wafersPerBoule}</span>
          </div>
          <div>
            <span className="text-ink-muted">silicon yield: </span>
            <span className="font-mono text-ink">{(yieldRatio * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        A meter of single-crystal silicon, sliced. Drag the saw to see which
        wafer it&rsquo;s cutting. The thickness slider visibly changes how
        many wafers come out of one boule — and how much silicon is wasted
        as kerf (saw dust).
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, pos: number, thicknessUm: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // === TOP HALF: the boule side view ===
  const padL = 60;
  const padR = 60;
  const plotW = W - padL - padR;
  const bouleY = 110;
  const bouleR = 70; // much taller than before
  const conel = 50;

  // Boule body
  ctx.fillStyle = "#d9d2c4";
  ctx.beginPath();
  const seedX = padL;
  const tailX = padL + plotW;
  ctx.moveTo(seedX, bouleY);
  ctx.lineTo(seedX + conel, bouleY - bouleR);
  ctx.lineTo(tailX - conel, bouleY - bouleR);
  ctx.lineTo(tailX, bouleY);
  ctx.lineTo(tailX - conel, bouleY + bouleR);
  ctx.lineTo(seedX + conel, bouleY + bouleR);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(31,29,26,0.5)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Doping gradient (Scheil for P, k=0.35) along the cylinder
  const k = 0.35;
  const cylStart = seedX + conel;
  const cylEnd = tailX - conel;
  const cylW = cylEnd - cylStart;
  for (let i = 0; i < cylW; i++) {
    const f = i / cylW;
    if (f >= 0.999) break;
    const C = k * Math.pow(1 - f, k - 1);
    const t = Math.min(C / 4, 1);
    ctx.fillStyle = `rgba(122,62,143,${0.16 + 0.5 * t})`;
    ctx.fillRect(cylStart + i, bouleY - bouleR + 1, 1, bouleR * 2 - 2);
  }

  // Striations
  ctx.strokeStyle = "rgba(31,29,26,0.1)";
  ctx.lineWidth = 0.6;
  for (let i = cylStart + 10; i < cylEnd; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, bouleY - bouleR + 6);
    ctx.lineTo(i, bouleY + bouleR - 6);
    ctx.stroke();
  }

  // Boule labels
  ctx.fillStyle = INK_MUTED;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("seed end", seedX, bouleY + bouleR + 22);
  ctx.textAlign = "right";
  ctx.fillText("tail (heavily doped)", tailX, bouleY + bouleR + 22);
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("the boule, 1 meter of single-crystal Si", W / 2, 26);

  // === Saw blade ===
  const sawX = seedX + pos * plotW;
  const sawRadius = 38;
  const sawY = bouleY - bouleR - sawRadius - 6;
  // Highlight slice band
  const inWafer = sawX > cylStart && sawX < cylEnd;
  if (inWafer) {
    const thkPx = Math.max(3, (thicknessUm / 775) * 5);
    ctx.fillStyle = "rgba(154,74,31,0.28)";
    ctx.fillRect(sawX - thkPx / 2, bouleY - bouleR, thkPx, bouleR * 2);
    // Glow lines
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sawX - thkPx / 2, bouleY - bouleR);
    ctx.lineTo(sawX - thkPx / 2, bouleY + bouleR);
    ctx.moveTo(sawX + thkPx / 2, bouleY - bouleR);
    ctx.lineTo(sawX + thkPx / 2, bouleY + bouleR);
    ctx.stroke();
  }

  drawSawBlade(ctx, sawX, sawY, sawRadius);

  // Vertical guide line
  ctx.strokeStyle = "rgba(154,74,31,0.5)";
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sawX, sawY + sawRadius);
  ctx.lineTo(sawX, bouleY + bouleR + 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // === BOTTOM HALF: the wafer stack ===
  const stackTopY = 240;
  const stackLeftX = padL;
  const stackRightX = tailX;
  const stackW = stackRightX - stackLeftX;

  ctx.fillStyle = INK;
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("…sliced into wafers", W / 2, stackTopY - 18);

  // How many wafers to draw (capped so it stays legible)
  const kerfUm = 200;
  const realCount = Math.floor((1000 * 1000) / (thicknessUm + kerfUm));
  const drawCount = Math.min(realCount, 80);

  // Wafer ellipse dimensions (perspective: tilted, viewing slight angle)
  const waferThk = Math.max(2, (thicknessUm / 775) * 3.5); // px per wafer
  const totalStackH = drawCount * waferThk;
  const stackY = stackTopY + 30;
  const waferRy = 14; // ellipse vertical half-axis
  const waferRx = 56; // ellipse horizontal half-axis

  // Lay out wafers across the strip
  const spacing = stackW / (drawCount + 1);

  // Highlight which wafer is being cut
  const localF = inWafer ? (sawX - cylStart) / cylW : -1;
  const highlightIdx = inWafer
    ? Math.min(drawCount - 1, Math.floor(localF * drawCount))
    : -1;

  for (let i = 0; i < drawCount; i++) {
    const cx = stackLeftX + (i + 1) * spacing;
    const f = i / Math.max(drawCount - 1, 1);
    const C = k * Math.pow(1 - Math.min(f, 0.999), k - 1);
    const tint = Math.min(C / 4, 1);

    const isCone = f < 0.04 || f > 0.96;
    const isHighlighted = i === highlightIdx;

    // Shadow under wafer
    if (isHighlighted) {
      ctx.fillStyle = "rgba(154,74,31,0.25)";
      ctx.beginPath();
      ctx.ellipse(cx, stackY + waferRy + 6, waferRx + 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Side of wafer (tiny cylinder)
    ctx.fillStyle = isCone
      ? "rgba(31,29,26,0.18)"
      : `rgba(122,62,143,${0.25 + 0.5 * tint})`;
    ctx.beginPath();
    ctx.rect(cx - waferRx, stackY - waferRy, waferRx * 2, waferRy * 2 + 4);
    // Top ellipse - the "face" we see
    ctx.fillStyle = isCone
      ? "#d4ccba"
      : `rgba(229,220,203,1)`;
    ctx.beginPath();
    ctx.ellipse(cx, stackY, waferRx, waferRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Doping tint overlay
    if (!isCone) {
      ctx.fillStyle = `rgba(122,62,143,${0.1 + 0.45 * tint})`;
      ctx.beginPath();
      ctx.ellipse(cx, stackY, waferRx, waferRy, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cone-end wafers: cross them out
    if (isCone) {
      ctx.strokeStyle = "rgba(154,74,31,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - waferRx * 0.6, stackY - waferRy * 0.5);
      ctx.lineTo(cx + waferRx * 0.6, stackY + waferRy * 0.5);
      ctx.moveTo(cx + waferRx * 0.6, stackY - waferRy * 0.5);
      ctx.lineTo(cx - waferRx * 0.6, stackY + waferRy * 0.5);
      ctx.stroke();
    }

    // Outline
    ctx.strokeStyle = isHighlighted
      ? ACCENT
      : "rgba(31,29,26,0.45)";
    ctx.lineWidth = isHighlighted ? 2 : 0.9;
    ctx.beginPath();
    ctx.ellipse(cx, stackY, waferRx, waferRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Notch
    if (!isCone) {
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.moveTo(cx, stackY + waferRy);
      ctx.lineTo(cx - 3, stackY + waferRy - 5);
      ctx.lineTo(cx + 3, stackY + waferRy - 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Connector line from saw to highlighted wafer
  if (highlightIdx >= 0) {
    const cx = stackLeftX + (highlightIdx + 1) * spacing;
    ctx.strokeStyle = ACCENT;
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sawX, bouleY + bouleR + 20);
    ctx.lineTo(cx, stackY - waferRy - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label this wafer
    ctx.fillStyle = ACCENT;
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `wafer ${highlightIdx + 1} of ${realCount}`,
      cx,
      stackY + waferRy + 22,
    );
  }

  // Count caption
  ctx.fillStyle = INK_MUTED;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `${realCount} wafers total${
      realCount > drawCount ? `  (showing ${drawCount})` : ""
    }`,
    padL,
    H - 16,
  );
  ctx.textAlign = "right";
  ctx.fillText(
    "purple = phosphorus concentration",
    W - padL,
    H - 16,
  );

  // Outer frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}

function drawSawBlade(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  // Body
  ctx.fillStyle = "#c7c0b3";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(31,29,26,0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hub
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Teeth
  ctx.strokeStyle = "rgba(31,29,26,0.7)";
  ctx.lineWidth = 1;
  const teeth = 28;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(a) * (r + 6);
    const y2 = cy + Math.sin(a) * (r + 6);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  // Inner radial lines
  ctx.strokeStyle = "rgba(31,29,26,0.25)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("wire saw", cx, cy - r - 6);
}
