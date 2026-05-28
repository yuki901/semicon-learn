import type { Metadata } from "next";
import HeroImmersionWidget from "./components/HeroImmersionWidget";
import WavelengthLadderWidget from "./components/WavelengthLadderWidget";
import NAImmersionWidget from "./components/NAImmersionWidget";
import LiquidPickerWidget from "./components/LiquidPickerWidget";
import ShowerheadWidget from "./components/ShowerheadWidget";
import PolarizationWidget from "./components/PolarizationWidget";
import LeachingWidget from "./components/LeachingWidget";
import K1Widget from "./components/K1Widget";
import TableOfContents from "../components/TableOfContents";

export const metadata: Metadata = {
  title: "Lithography, through water — iArF",
  description:
    "How chipmakers kept Rayleigh's resolution limit shrinking for fifteen years without ever shortening the wavelength.",
};

const tocEntries = [
  { id: "ch-1", label: "1. The one equation" },
  { id: "ch-2", label: "2. Wavelength stalled at 193 nm" },
  { id: "ch-3", label: "3. Water under the lens" },
  { id: "ch-4", label: "4. Why water, only water" },
  { id: "ch-5", label: "5. A puddle at 700 mm/s" },
  { id: "ch-6", label: "6. The polarization problem" },
  { id: "ch-7", label: "7. Chemistry of the puddle" },
  { id: "ch-8", label: "8. k₁ toward 0.25" },
  { id: "ch-9", label: "9. Handoff to EUV" },
];

export default function IArFEssay() {
  return (
    <>
      <TableOfContents entries={tocEntries} />
      <main className="prose-essay mx-auto max-w-[42rem] px-6 py-24">
      <header className="mb-12">
        <p className="dateline mb-4">An interactive essay · part 2 of a series</p>
        <h1>Lithography, through water</h1>
        <p className="byline mt-6 not-italic">
          How chipmakers kept the resolution of optical lithography shrinking
          for fifteen years after they ran out of wavelength to shorten.
        </p>
      </header>

      <HeroImmersionWidget />

      <section>
        <p>
          Every line on every modern chip was drawn by light. A pattern on a
          quartz mask, the size of a postage stamp, is projected through a
          column of lenses onto a thin film of light-sensitive polymer on a
          silicon wafer. Wherever the light lands, the polymer changes its
          solubility; whatever survives the developer becomes the stencil for
          the next layer of the chip.
        </p>
        <p>
          The whole machine is in service of one number: how fine a line it
          can resolve. And the limit on that number is not the precision of
          the optics, or the steadiness of the wafer stage, or the cleverness
          of the chemistry. It is the wavelength of the light itself, set
          against the geometry of the lens that focuses it. A century-old
          formula, due to Lord Rayleigh, says exactly how the two trade off.
          The story of <em>immersion ArF</em> lithography — iArF — is the
          story of an industry refusing to accept what that formula seemed to
          be telling them.
        </p>
      </section>

      <hr />

      <section id="ch-1">
        <h2>1. The one equation that governs everything</h2>
        <p>
          A projection lithography tool can resolve lines down to about
        </p>
        <p className="text-center font-mono text-ink">
          CD = k<sub>1</sub> · λ / NA
        </p>
        <p>
          and no finer. <code>CD</code> is the minimum half-pitch — the
          smallest line-and-space the tool can print cleanly. <code>λ</code>
          is the wavelength of the exposing light. <code>NA</code> is the
          numerical aperture of the projection lens, a measure of how steeply
          it can focus light. And <code>k<sub>1</sub></code> is a fudge factor
          for how much cleverness you have wrapped around the rest of the
          system — clever masks, clever illumination, clever resists — with a
          hard theoretical floor of <code>0.25</code>.
        </p>
        <p>
          Almost every story about advanced lithography is a story about
          attacking one of those three variables. Shrink <code>λ</code>.
          Stretch <code>NA</code>. Drive <code>k<sub>1</sub></code> toward its
          floor. The iArF era is what you get when the industry tried, in
          order, all three.
        </p>
      </section>

      <section id="ch-2">
        <h2>2. Why shortening the wavelength stalled at 193 nm</h2>
        <p>
          For thirty years the industry attacked <code>λ</code>. Mercury g-line
          at 436&nbsp;nm gave way to i-line at 365, then to KrF excimer at 248,
          then to ArF excimer at 193. Each jump roughly halved the printable
          pitch. Each jump required a new light source, a new resist
          chemistry, and a new lens material that was still transparent at
          the shorter wavelength.
        </p>
        <p>
          The next planned step was F<sub>2</sub> at 157&nbsp;nm — and it
          quietly died. Fused-silica lenses absorb at 157. Calcium fluoride
          can replace them, but it has a stress-induced birefringence that
          ruined the uniformity of the projected image. The acrylic backbones
          of ArF resist absorbed too strongly at 157 to expose evenly through
          their thickness. Even the thin film that protects the photomask
          from dust — the pellicle — had no transparent material. Three
          materials problems came due at the same time, and the industry
          could not solve all three on a single roadmap. The wavelength
          column of the equation was, for practical purposes, closed.
        </p>
        <WavelengthLadderWidget />
      </section>

      <section id="ch-3">
        <h2>3. Putting water under the lens</h2>
        <p>
          Numerical aperture is defined as
        </p>
        <p className="text-center font-mono text-ink">
          NA = n · sin θ
        </p>
        <p>
          where <code>θ</code> is the half-angle of the cone of light
          converging from the lens onto the wafer, and <code>n</code> is the
          refractive index of whatever fills the gap between them. In air,
          <code>n = 1</code>, and so the largest NA you can ever build, in
          principle, is 1. In practice the geometry runs out around 0.93. By
          the early 2000s, dry ArF tools were sitting at NA = 0.93 and going
          no further.
        </p>
        <p>
          And then somebody pointed out that <code>n</code> was a variable too.
          If you put a liquid between the final lens and the wafer — ultrapure
          water has <code>n = 1.44</code> at 193&nbsp;nm — the same converging
          cone of light suddenly counts as a numerical aperture of <code>1.44
          × sin 68° ≈ 1.35</code>. NA above 1, in a regime that everyone had
          treated as physically forbidden, became routine.
        </p>
        <p>
          The other way to describe the trick is in the wavelength: inside
          water, light travels slower (<code>v = c/n</code>), and since its
          frequency is set by the source, its wavelength shortens to{" "}
          <code>λ/n = 193 / 1.44 ≈ 134 nm</code>. The tool is still an ArF
          machine; the resist still sees what is, for all optical purposes,
          a 134&nbsp;nm exposure.
        </p>
        <NAImmersionWidget />
      </section>

      <section id="ch-4">
        <h2>4. Why water, and only water</h2>
        <p>
          The idea of immersion was old — microscopists had been dripping
          cedar oil under their objectives for a century. Bringing it into
          193&nbsp;nm lithography meant finding a liquid that was transparent
          at that wavelength, had the right index, did not leave a residue on
          the wafer, did not attack the resist, flowed cleanly at scan
          speeds, and was cheap enough to use in industrial volumes. Out of
          everything that was tried — glycerin, fluorinated organics, even
          sapphire flats — only ultrapure water cleared every constraint. A
          later push for so-called second-generation immersion fluids with
          <code>n ≈ 1.65</code> ran for years and was eventually abandoned in
          the late 2000s. Water was where physics had left the industry, and
          water was where it stayed.
        </p>
        <LiquidPickerWidget />
      </section>

      <section id="ch-5">
        <h2>5. Carrying a puddle at 700&nbsp;mm/s</h2>
        <p>
          A scanner does not sit still while it exposes. The wafer moves under
          the projection slit at several hundred millimeters per second, and
          the water has to move with it — a thin film a millimeter thick, held
          between the final lens and the wafer, supplied by a ring of nozzles
          on one side of the lens and recovered by another on the other side.
          If the meniscus at the trailing edge breaks, air gets sucked in;
          air bubbles in the optical path scatter the exposing light and
          print as defects on the wafer underneath. Most of the engineering
          of iArF — the part that took twenty years between the first
          proposals and the first production tools — was learning how to drag
          a puddle across a wafer cleanly enough that not a single bubble
          formed in the path of the beam.
        </p>
        <ShowerheadWidget />
      </section>

      <section id="ch-6">
        <h2>6. The polarization problem nobody warned us about</h2>
        <p>
          The hardest thing to internalize about NA{" "}
          <span className="whitespace-nowrap">{">"} 1</span> is what happens
          to the light at the resist. Up until then, light at a litho tool
          came in nearly straight down. The electric field — the part of the
          wave that actually exposes the resist — wiggled in a plane
          perpendicular to the beam, and you never had to think about which
          way inside that plane. By the time you are pulling NA = 1.35 out of
          water, two beams are converging on the resist from <em>±68°</em>{" "}
          off vertical, and the answer to &ldquo;which way is the electric
          field pointing&rdquo; suddenly matters more than anything else.
        </p>
        <p>
          The image on the resist is built by interference. In the simplest
          case — printing a dense grating — two of the diffracted orders
          from the mask converge from symmetric angles +θ and −θ and beat
          against each other on the wafer. Bright bands form where the two
          waves arrive in phase, dark bands where they cancel. The contrast
          of those bands — how dark the dark bands actually get, on a scale
          from a perfect zero to a washed-out gray — is what decides whether
          the resist sees a usable image at all.
        </p>
        <p>
          And here is the catch: the two waves do not interfere with their
          full strength. They interfere with the strength of the{" "}
          <em>component of their electric fields that points in the same
          direction</em>. If the fields are parallel, you get the full
          contrast. If they are tilted away from each other, you get a dot
          product, and the contrast falls off accordingly.
        </p>
        <p>
          Decompose each beam&rsquo;s polarization into two pieces. The first
          piece, called <em>s</em>, has its electric field perpendicular to
          the plane that contains both beams — perpendicular to the page, if
          you draw the system in side view. For both beams the{" "}
          <em>s</em>-fields point in <em>exactly the same direction</em>,
          regardless of how steep θ gets. Two parallel arrows. They add with
          full visibility, and the contrast of the fringe they make is{" "}
          <code>1</code>. The geometry of the converging beams has done
          nothing to them.
        </p>
        <p>
          The second piece, called <em>p</em>, has its electric field lying
          in the plane of incidence — in the page, perpendicular to its own
          beam. For the left beam the <em>p</em>-field tilts off vertical by{" "}
          <code>−θ</code>; for the right beam it tilts by <code>+θ</code>.
          The two arrows open up by a full <code>2θ</code> between them, and
          their dot product collapses as <code>cos 2θ</code>. At θ = 45° the
          two <em>p</em>-fields are perpendicular and contribute{" "}
          <em>zero</em> contrast to the fringe — the bright bands and the
          dark bands are equally bright. At θ = 68° you are well past that;
          the <em>p</em>-component is actively working against the image.
        </p>

        <PolarizationWidget />

        <p>
          Drag θ in the widget above with the toggle on <em>unpolarized</em>{" "}
          — the regime every litho tool was in before any of this mattered.
          The visibility of the fringe falls off the cliff somewhere past
          30°, and by the time you reach the iArF maximum at 68° you have
          lost roughly half your contrast for nothing. Switch the toggle to{" "}
          <em>s</em> and the cliff disappears: the fringe stays as crisp at
          68° as it was at 0°. Switch it to <em>p</em> and you see the
          worst case head-on — the bands wash out completely at 45°, then
          come back inverted past it.
        </p>
        <p>
          That is why iArF illumination is polarized. Above NA ≈ 0.85 or so,
          the unpolarized image is so weak in its <em>p</em>-component that
          there is no point exposing it: you would be paying for the dose,
          collecting the heat in the resist, and getting half the contrast.
          The fix is to filter the illumination before it ever reaches the
          mask. You only let through the polarization whose field will land
          on the wafer as <em>s</em>, and you throw the rest away.
        </p>
        <p>
          The complication is that &ldquo;which polarization counts as{" "}
          <em>s</em>&rdquo; depends on the direction of the lines you are
          printing. For horizontal lines, the plane of incidence is vertical,
          and you want horizontal electric fields. For vertical lines, you
          want vertical electric fields. A real iArF illuminator does this
          with off-axis sources — typically a dipole or a quadrupole arranged
          around the pupil — and a programmable polarization rotator that
          aligns each pole&rsquo;s field tangent to the pupil. Each pole
          fires light that hits the wafer as <em>s</em>-polarized relative to
          the lines it is helping to print. The pattern of light leaving the
          illuminator is no longer just a shape; it is a vector field.
        </p>
        <p>
          When you read that a modern scanner has an &ldquo;XY-polarized
          quadrupole&rdquo; illumination mode, this is what it means. Four
          patches of light in the pupil, each one with its electric field
          oriented so that by the time it has converged through the lens and
          arrived at the resist at 68° off vertical, it is pointing in the
          one direction where two beams can still interfere with full
          visibility. The geometry of the converging cone — the same
          geometry that lets you get NA above 1 in the first place — would
          have destroyed the image otherwise. Polarization control is the
          quiet bookkeeping that makes the whole immersion era possible.
        </p>
      </section>

      <section id="ch-7">
        <h2>7. The chemistry on both sides of the puddle</h2>
        <p>
          Water touches the resist on top and the final lens on the bottom,
          and both surfaces fought back. The photoacid generators in the
          resist leached into the water, blunting the image. Water leached
          into the resist, letting the acid diffuse and washing out the line
          edges. A new layer of <em>topcoat</em> — thirty nanometers of a
          polymer that is transparent at 193&nbsp;nm, immiscible with both
          resist and water, and removable by the developer — was added on
          top of every wafer to keep the two phases apart. On the other side,
          the bottom surface of the final lens slowly pitted under 193&nbsp;nm
          exposure in water, and a new generation of lens-bottom materials
          had to be qualified before tools could run for years without
          drifting.
        </p>
        <LeachingWidget />
      </section>

      <section id="ch-8">
        <h2>8. k<sub>1</sub>, and the long descent toward 0.25</h2>
        <p>
          With <code>λ</code> stuck at 193 and NA stuck at 1.35, the last
          variable in Rayleigh&rsquo;s formula is k<sub>1</sub>. Phase-shift
          masks subtract pi from adjacent openings so their diffraction
          orders cancel constructively. Off-axis illumination — the dipoles
          and quadrupoles from the polarization chapter, in a different
          guise — shifts the pupil so that the relevant diffraction orders
          land inside the lens instead of outside it. Source-mask
          optimization computes the illumination shape and the mask topology
          jointly, treating both as free variables in a single nonconvex
          optimization. Each of these moved k<sub>1</sub> a little lower.
        </p>
        <p>
          And when k<sub>1</sub> bottomed out around 0.28, the industry
          stopped attacking the equation and started attacking the count of
          exposures. Litho-etch-litho-etch printed every other line on one
          pass and the rest on a second pass, halving the effective pitch.
          Self-aligned double patterning used a sidewall spacer to do the
          same thing without the alignment penalty. Self-aligned{" "}
          <em>quadruple</em> patterning ran the spacer trick twice, putting
          four lines down per one mask feature, at four times the cost. The
          limit had migrated out of physics and into economics.
        </p>
        <K1Widget />
      </section>

      <section id="ch-9">
        <h2>9. Handing off to EUV</h2>
        <p>
          Somewhere around the 7&nbsp;nm node, four-pass iArF crossed the
          cost curve of a single-pass exposure at 13.5&nbsp;nm — extreme
          ultraviolet. EUV finally moved the <code>λ</code> column of
          Rayleigh&rsquo;s equation again, fourteen years and one ocean of
          ultrapure water after the last time it had budged. iArF did not
          retire; it just stepped down a layer or two, and is still running
          in every advanced fab in the world for everything except the
          critical patterns.
        </p>
        <p>
          The story it leaves behind is a particular one. For fifteen years,
          the industry kept Rayleigh&rsquo;s formula shrinking without
          touching the wavelength once. It went through the index of the
          gap, through the geometry of the converging cone, through the
          polarization of the field at the focus, through the topology of
          the mask, and finally through the number of times each wafer had
          to be exposed. Each step was a refusal to accept that the limit
          said what it seemed to say. That is what immersion lithography
          was, in the end — a long argument with one equation.
        </p>
      </section>

      <hr />

      <footer className="mt-24 text-center">
        <p className="byline">Part 2 of a series. Part 1 — Silicon, pulled
        slowly — is <a href="/">here</a>.</p>
      </footer>
      </main>
    </>
  );
}
