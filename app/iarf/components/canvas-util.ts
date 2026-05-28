// Shared canvas helpers for the interactive widgets.

export function setupHiDPI(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);
  return ctx;
}

export const PAPER = "#fbf7ee";
export const PAPER_EDGE = "#ece4d3";
export const RULE = "#d9d0bd";
export const INK = "#1f1d1a";
export const INK_SOFT = "#5b554c";
export const INK_MUTED = "#8a8377";
export const ACCENT = "#9a4a1f";
export const ACCENT_SOFT = "#c97a4b";

/** A 0..1 "ease in-out" for slider visualizations. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Deterministic small hash → [0,1). Useful for stable per-atom jitter. */
export function rand2(i: number, j: number): number {
  const s = Math.sin(i * 374.823 + j * 91.451) * 43758.5453;
  return s - Math.floor(s);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
