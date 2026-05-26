# Silicon, pulled slowly

An interactive essay on the **Czochralski process** — how single-crystal
silicon is grown, one atom at a time, from a single seed. The visual style
is borrowed shamelessly from [Bartosz Ciechanowski](https://ciechanow.ski):
serif headlines, cream-colored paper, restrained motion, diagrams that do
the heavy lifting.

🌐 **Live**: <https://semicon-learn.vercel.app>

## Chapters

The essay is one long scroll with an interactive widget in (almost) every
chapter.

| #   | Chapter                                              | Widget                                       |
| --- | ---------------------------------------------------- | -------------------------------------------- |
| —   | Hero                                                 | Auto-playing mini boule animation            |
| 1   | The silicon you are touching right now               | Amorphous ↔ single-crystal lattice slider    |
| 2   | Why "single crystal" matters                         | Electrons crossing grain boundaries          |
| 3   | Melt it, dip it, pull it slowly                      | Pull-rate slider drives boule diameter       |
| 4   | What's happening inside the melt                     | Convection tracers in the crucible           |
| 5   | Pull rate × rotation: the trade-off                  | Draggable 2-D Voronkov defect map            |
| 6   | Impurities: intentional and uninvited                | Scheil curve painted onto a 3-D-ish boule    |
| 7   | From 100 mm to 300 mm (and why 450 mm stalled)       | Wafer-diameter slider with heat-budget bars  |
| 8   | After the boule                                      | Drag-a-wire-saw slice picker                 |

## Tech

- **Next.js 16** (App Router) statically prerendered
- **Tailwind v4** for layout, custom CSS for the paper aesthetic
- All widgets are **Canvas 2D + plain JS** — no React-Three-Fiber, no
  WebGL, no animation libraries. Same constraint Ciechanowski works under.
- Deployed on Vercel (preview + production from the same repo)

## Local development

```bash
bun install   # or npm install
bun run dev   # http://localhost:3000
```

Requires Node ≥ 22.

## Future roadmap

Things that are written down so they don't get lost — not committed to.

### Chapter 0 — Photolithography (the next essay)

Same format, same paper aesthetic, different process. Walks from the
basics of optical resolution (Rayleigh's criterion as a slider) through
phase-shift masks to EUV, with the same "drag a parameter, see the
physics react" rhythm.

### A video version of the essay (PoC done, on hold)

A separate project at `~/semicon-learn-video` uses
[HyperFrames](https://hyperframes.heygen.com) to render the essay as a
quiet 3–5 minute explainer video. Chapter 3 has a working 30-second
prototype (`renders/chapter3-draft.mp4`). It was good enough to validate
the toolchain but not good enough to ship — the typography fidelity, the
boule scale, and the motion rhythm all need another pass. Future work:

- Capture Source Serif / Inter as local `.woff2` so the renderer doesn't
  depend on Google Fonts at render time.
- Split each chapter into its own sub-composition under
  `compositions/`, then concat into a single long-form video.
- Re-design the breathing animation programs so the visuals support the
  narration timing, not the other way around.
- Optionally add a TTS narration track via `hyperframes-media`.

### A discussion / chat layer on the essay

Make the page bidirectional — let a reader ask "what if I doubled the
pull rate?" and get a custom widget back. The original concept for the
project leaned this direction (CopilotKit / ag-ui experiments are still
in the git history of the initial planning). On hold until the read-only
essay is solid first.

### More chapters in the silicon series

- Float-zone growth (the *other* way to grow a boule)
- Defects in detail — dislocations, OISFs, BMDs
- Doping the modern way: ion implantation, not melt segregation
- A short post on why polysilicon is a different kind of expensive

### Translation

`design.md`-style content sheets per language. Japanese first.
