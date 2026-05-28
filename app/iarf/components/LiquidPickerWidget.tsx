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
const H = 320;

type Verdict = "ok" | "warn" | "fail";
type Liquid = {
  key: string;
  label: string;
  n: string;
  scores: Record<string, Verdict>;
  note: string;
};

const CRITERIA: { key: string; label: string }[] = [
  { key: "transparent", label: "transparent at 193 nm" },
  { key: "index", label: "n > 1.4" },
  { key: "clean", label: "leaves no residue" },
  { key: "flow", label: "flows at scan speed" },
  { key: "resist", label: "doesn't attack the resist" },
  { key: "cost", label: "affordable in volume" },
];

const LIQUIDS: Liquid[] = [
  {
    key: "water",
    label: "ultrapure water",
    n: "1.44",
    scores: {
      transparent: "ok",
      index: "ok",
      clean: "ok",
      flow: "ok",
      resist: "ok",
      cost: "ok",
    },
    note: "The only liquid that cleared every constraint.",
  },
  {
    key: "glycerin",
    label: "glycerin",
    n: "1.47",
    scores: {
      transparent: "fail",
      index: "ok",
      clean: "warn",
      flow: "fail",
      resist: "warn",
      cost: "ok",
    },
    note: "Absorbs at 193 nm and far too viscous to flow under a scanning wafer.",
  },
  {
    key: "perfluoro",
    label: "fluorinated organic",
    n: "1.64",
    scores: {
      transparent: "warn",
      index: "ok",
      clean: "fail",
      flow: "warn",
      resist: "fail",
      cost: "fail",
    },
    note: "The famous “2nd-gen” candidates. Wafer contamination and cost killed the program in the late 2000s.",
  },
  {
    key: "sapphire",
    label: "sapphire flat (solid)",
    n: "1.92",
    scores: {
      transparent: "ok",
      index: "ok",
      clean: "ok",
      flow: "fail",
      resist: "warn",
      cost: "fail",
    },
    note: "A solid can't conform to a moving wafer. Tried, abandoned.",
  },
];

const COLOR: Record<Verdict, string> = {
  ok: "#3f7a3f",
  warn: "#9a7a1f",
  fail: "#9a3030",
};

const GLYPH: Record<Verdict, string> = {
  ok: "✓",
  warn: "·",
  fail: "✗",
};

export default function LiquidPickerWidget() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState<string>("water");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupHiDPI(canvas, W, H);
    if (!ctx) return;
    draw(ctx, selected);
  }, [selected]);

  const sel = LIQUIDS.find((l) => l.key === selected)!;

  return (
    <figure className="widget-surface">
      <canvas
        ref={ref}
        className="block mx-auto"
        style={{ width: W, height: H }}
      />
      <div className="controls mx-auto mt-4 max-w-md">
        <div className="flex gap-1 justify-center flex-wrap text-xs">
          {LIQUIDS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setSelected(l.key)}
              className="px-3 py-1 rounded border font-mono"
              style={{
                borderColor: selected === l.key ? ACCENT : RULE,
                background: selected === l.key ? ACCENT : "transparent",
                color: selected === l.key ? PAPER : INK_SOFT,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-ink-soft">{sel.note}</p>
      </div>
      <figcaption className="mt-3 max-w-md mx-auto">
        Six requirements, four candidates. Click through them — the
        constraint matrix collapses to one answer.
      </figcaption>
    </figure>
  );
}

function draw(ctx: CanvasRenderingContext2D, selectedKey: string) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const colX = [180, 280, 360, 440, 520];
  // Actually we have 4 liquid columns; lay them out evenly.
  const liquidColX: number[] = [];
  const liquidColW = 90;
  const leftPad = 220;
  for (let i = 0; i < LIQUIDS.length; i++) {
    liquidColX.push(leftPad + i * liquidColW);
  }

  // Header row: liquid labels + n
  ctx.fillStyle = INK_SOFT;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < LIQUIDS.length; i++) {
    const l = LIQUIDS[i];
    const isSel = l.key === selectedKey;
    ctx.fillStyle = isSel ? INK : INK_MUTED;
    ctx.font = isSel
      ? "12px ui-sans-serif, system-ui, sans-serif"
      : "11px ui-sans-serif, system-ui, sans-serif";
    // Two-line label
    const words = l.label.split(" ");
    if (words.length > 1) {
      ctx.fillText(words[0], liquidColX[i], 22);
      ctx.fillText(words.slice(1).join(" "), liquidColX[i], 36);
    } else {
      ctx.fillText(l.label, liquidColX[i], 30);
    }
    ctx.fillStyle = INK_MUTED;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`n=${l.n}`, liquidColX[i], 50);
  }

  // Divider
  ctx.strokeStyle = RULE;
  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(W - 20, 60);
  ctx.stroke();

  // Criteria rows
  const rowTop = 76;
  const rowH = (H - rowTop - 20) / CRITERIA.length;
  CRITERIA.forEach((c, idx) => {
    const y = rowTop + idx * rowH + rowH / 2;

    // Criterion label (left)
    ctx.fillStyle = INK_SOFT;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(c.label, 24, y + 4);

    for (let i = 0; i < LIQUIDS.length; i++) {
      const l = LIQUIDS[i];
      const v = l.scores[c.key];
      const isSel = l.key === selectedKey;
      const cellX = liquidColX[i];

      // Cell background — highlight only the selected column
      if (isSel) {
        ctx.fillStyle = "rgba(154,74,31,0.06)";
        ctx.fillRect(cellX - 30, y - rowH / 2 + 3, 60, rowH - 6);
      }

      // Verdict glyph
      ctx.fillStyle = isSel ? COLOR[v] : `${COLOR[v]}88`;
      ctx.font = isSel
        ? "18px ui-sans-serif, system-ui, sans-serif"
        : "14px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(GLYPH[v], cellX, y + 6);
    }

    // row divider
    if (idx < CRITERIA.length - 1) {
      ctx.strokeStyle = "rgba(217,208,189,0.5)";
      ctx.beginPath();
      ctx.moveTo(20, y + rowH / 2);
      ctx.lineTo(W - 20, y + rowH / 2);
      ctx.stroke();
    }
  });

  // Frame
  ctx.strokeStyle = RULE;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
