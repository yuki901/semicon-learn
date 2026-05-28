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
const H = 280;

type Gen = {
  key: string;
  label: string;
  lambda: number; // nm
  stalled?: boolean;
  note: string;
};

const GENS: Gen[] = [
  { key: "g", label: "g-line", lambda: 436, note: "Hg lamp, the 1980s." },
  { key: "i", label: "i-line", lambda: 365, note: "Hg lamp, still in use for old nodes." },
  { key: "krf", label: "KrF", lambda: 248, note: "Excimer. New resist chemistry (CAR)." },
  { key: "arf", label: "ArF", lambda: 193, note: "Excimer. The last dry generation." },
  {
    key: "f2",
    label: "F₂",
    lambda: 157,
    stalled: true,
    note: "Stalled: CaF₂ lens birefringence, resist absorption, no pellicle.",
  },
];

/**
 * Bar chart of optical-lithography generations. Each bar's length is the
 * minimum printable half-pitch (CD = k1 · λ / NA, with k1=0.4 and dry NA=0.75
 * held constant). Selecting a generation highlights its bar and shows the
 * reason it ended or stalled.
 *
 * F2 is drawn in gray to mark "the generation that didn't happen".
 */
export default function WavelengthLadderWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState<string>("arf");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, selected);
  }, [selected]);

  const sel = GENS.find((g) => g.key === selected)!;
  const k1 = 0.4;
  const NA = 0.75;
  const CD = (k1 * sel.lambda) / NA;

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex gap-1 justify-center text-xs flex-wrap">
          {GENS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setSelected(g.key)}
              className="px-3 py-1 rounded border font-mono"
              style={{
                borderColor: selected === g.key ? ACCENT : RULE,
                background: selected === g.key ? ACCENT : "transparent",
                color: selected === g.key ? PAPER : g.stalled ? INK_MUTED : INK_SOFT,
                fontStyle: g.stalled ? "italic" : "normal",
              }}
            >
              {g.label} · {g.lambda} nm
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-ink-soft">{sel.note}</p>
        <p className="mt-1 text-center text-sm font-mono text-ink">
          CD = k<sub>1</sub>·λ/NA = 0.4 × {sel.lambda} / 0.75 ={" "}
          {CD.toFixed(0)} nm
        </p>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Each rung of the ladder halved the printable pitch — until 157 nm,
        where three material problems came due at once and the rung was
        never installed.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, selectedKey: string) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const padL = 90;
  const padR = 60;
  const padT = 30;
  const padB = 30;
  const rowH = (H - padT - padB) / GENS.length;
  const maxLambda = 500; // px scale fits 436 nm
  const scale = (W - padL - padR) / maxLambda;

  // Axis
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT - 4);
  ctx.lineTo(padL, H - padB + 4);
  ctx.stroke();

  // x ticks (nm)
  ctx.fillStyle = INK_MUTED;
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const x of [0, 100, 200, 300, 400]) {
    const px = padL + x * scale;
    ctx.beginPath();
    ctx.moveTo(px, H - padB);
    ctx.lineTo(px, H - padB + 4);
    ctx.strokeStyle = RULE;
    ctx.stroke();
    ctx.fillText(x === 0 ? "0" : `${x}`, px, H - padB + 16);
  }
  ctx.fillText("wavelength (nm) →", padL + (W - padL - padR) / 2, H - 6);

  // Bars
  GENS.forEach((g, idx) => {
    const y = padT + idx * rowH + rowH / 2;
    const w = g.lambda * scale;

    // Bar
    const isSel = g.key === selectedKey;
    const fill = g.stalled
      ? "rgba(138,131,119,0.35)"
      : isSel
        ? ACCENT
        : ACCENT_SOFT;
    ctx.fillStyle = fill;
    ctx.fillRect(padL, y - 11, w, 22);
    if (g.stalled) {
      // diagonal hatch
      ctx.strokeStyle = "rgba(138,131,119,0.55)";
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 6) {
        ctx.beginPath();
        ctx.moveTo(padL + i, y - 11);
        ctx.lineTo(padL + i - 11, y + 11);
        ctx.stroke();
      }
    }

    // Label on the left
    ctx.fillStyle = isSel ? INK : g.stalled ? INK_MUTED : INK_SOFT;
    ctx.font = isSel
      ? "13px ui-sans-serif, system-ui, sans-serif"
      : "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(g.label, padL - 10, y + 4);

    // Lambda at right end of bar
    ctx.fillStyle = g.stalled ? INK_MUTED : INK;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${g.lambda} nm`, padL + w + 6, y + 4);
  });

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
