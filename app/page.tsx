import HeroBouleWidget from "./components/HeroBouleWidget";
import LatticeWidget from "./components/LatticeWidget";
import ElectronWidget from "./components/ElectronWidget";
import PullingWidget from "./components/PullingWidget";
import MeltWidget from "./components/MeltWidget";
import DefectMapWidget from "./components/DefectMapWidget";
import SegregationWidget from "./components/SegregationWidget";
import WaferScaleWidget from "./components/WaferScaleWidget";
import SliceWidget from "./components/SliceWidget";

export default function Home() {
  return (
    <main className="prose-essay mx-auto max-w-[42rem] px-6 py-24">
      <header className="mb-12">
        <p className="dateline mb-4">An interactive essay · part 1 of a series</p>
        <h1>Silicon, pulled slowly</h1>
        <p className="byline mt-6 not-italic">
          How the silicon inside almost every chip in the world is grown — one
          atom at a time, from a single seed.
        </p>
      </header>

      <HeroBouleWidget />

      <section>
        <p>
          Pick up any modern electronic device. The silicon inside it did not
          come from a quarry, and it did not come from sand in the sense most of
          us imagine. It came from a furnace, where a small seed crystal was
          dipped into molten silicon and pulled slowly upward, for hours, until
          a single crystal the size of a tree trunk had grown beneath it.
        </p>
        <p>
          The recipe is called the <em>Czochralski process</em>, after the
          Polish chemist who stumbled into it in 1916. A century later, almost
          every microprocessor, image sensor, and memory chip you have ever
          touched began life inside a machine that does what we are about to
          watch.
        </p>
      </section>

      <hr />

      <section>
        <h2>1. The silicon you are touching right now</h2>
        <p>
          Glass is silicon and oxygen, arranged at random. Sand is mostly the
          same. They are amorphous: the atoms know who their immediate
          neighbors are, but past the third or fourth bond the order falls
          apart. If you zoom in on a piece of window glass, you see a tangle.
        </p>
        <p>
          The silicon inside a chip is the opposite. Every atom sits at a
          specific position in a perfect, repeating cube lattice, and that
          arrangement continues, uninterrupted, across a piece of material
          thirty centimeters across. There are no grains, no seams, no random
          jumbles. One crystal, end to end.
        </p>

        <LatticeWidget />

        <p>
          That second kind of silicon does not exist in nature. We have to
          make it. The rest of this essay is about how.
        </p>
      </section>

      <section>
        <h2>2. Why &ldquo;single crystal&rdquo; matters</h2>
        <p>
          Imagine you are an electron, and your job is to walk across a piece
          of silicon carrying a tiny piece of information. In a perfect
          crystal, the lattice is so regular that quantum mechanics lets you
          glide through almost as if the atoms were not there. Your wave
          extends across thousands of unit cells. You move fast, and you do
          not get lost.
        </p>

        <ElectronWidget />

        <p>
          Now put a grain boundary in your way: a place where two crystal
          regions, grown from different seeds, meet at an angle. The lattice
          breaks. There are dangling bonds, stray atoms, distorted geometry.
          You scatter. You slow down. Sometimes you get trapped for a
          microsecond on a defect, then released. The transistor that was
          supposed to switch in a picosecond now switches in a nanosecond, or
          not at all.
        </p>
        <p>
          A modern logic chip has on the order of a hundred billion
          transistors, all of which have to behave the same way for the chip
          to work. Any grain boundary anywhere in the wafer ruins thousands of
          them. The only way to ship is to start with silicon that has no
          grain boundaries at all.
        </p>
      </section>

      <section>
        <h2>3. Melt it, dip it, pull it slowly</h2>
        <p>
          Strip away the engineering and what&rsquo;s left is almost
          child-simple. A crucible holds a pool of molten silicon, just hot
          enough to be a liquid — about <code>1414&nbsp;°C</code>. A tiny piece
          of silicon, the <em>seed</em>, is lowered on a rod until it just
          kisses the surface. As the seed touches the melt, atoms at the
          contact line begin to freeze onto it. Now the trick: the rod is
          pulled upward, slowly, while the seed rotates. Atoms keep freezing
          onto the bottom face, and the seed lengthens into a column. Pull for
          a few hours and you have a single-crystal boule a meter long.
        </p>

        <PullingWidget />

        <p>
          Try the slider. The pull rate above is the only thing being changed,
          and yet the entire shape of the boule reacts. Pull faster than atoms
          can freeze and the column thins to a thread. Pull more slowly and
          the same amount of solidification has to fit into a wider cross
          section, so the boule fattens. In a real puller, the operator nudges
          this knob continuously to hold a target diameter — but the diameter
          is set by the race between freezing and pulling, nothing else.
        </p>
        <p>
          That race is the whole essay, really. Almost everything we will look
          at after this — temperature gradients, rotation, impurities, scaling
          to 300&nbsp;mm wafers — is a refinement of how to control it.
        </p>
      </section>

      <section>
        <h2>4. What&rsquo;s happening inside the melt</h2>
        <p>
          The crucible is not a calm pool. It is closer to a thunderstorm.
          The silicon in contact with the hot crucible wall is several tens
          of degrees above the freezing point. The silicon in contact with
          the cold boule and the cooler gas above is right at the freezing
          point, or below. Hot fluid wants to rise, cold fluid wants to sink,
          and the result is a churning system of convection cells the size
          of fists, looping around the boule, second after second.
        </p>

        <MeltWidget />

        <p>
          On top of that, the boule itself is rotating, and so is the
          crucible — usually in opposite directions. The two rotations stir
          the melt and force the freezing front into a roughly flat shape
          instead of a cone. Without rotation, one side of the boule would
          freeze faster than the other and the crystal would bend.
        </p>
        <p>
          What matters for the crystal is only the last millimeter, the thin
          boundary layer where the melt is actually solidifying. The
          temperature gradient there — how steeply hot turns to cold —
          decides how quickly atoms can lock into the lattice without
          trapping defects. Steeper gradient: faster, neater freezing.
          Gentler gradient: slower, but the crystal grows wider for the same
          pull rate. Most of the &ldquo;recipe&rdquo; of running a CZ puller
          is a recipe for the temperature gradient at the interface.
        </p>
      </section>

      <section>
        <h2>5. Pull rate × rotation: the trade-off</h2>
        <p>
          With two knobs instead of one, the engineering space opens up. Pull
          rate sets how fast the boule moves up. Rotation rate sets how
          aggressively the melt is stirred. Together they determine the
          shape, the diameter, and — most importantly — the kind and number
          of defects that get frozen in.
        </p>

        <DefectMapWidget />

        <p>
          Pull too fast and you starve the freezing front: atoms can&rsquo;t
          attach in time, so the crystal incorporates <em>vacancies</em>
          {" "}— missing atoms where one should have been. Pull too slow and
          you have the opposite problem: the front oversaturates with
          self-interstitials, extra atoms stuck between lattice sites.
          Somewhere between these two regimes is a narrow window where the
          crystal grows nearly perfectly, and almost all production happens
          in that window.
        </p>
        <p>
          Rotation does something more subtle: it controls the boundary
          layer thickness, and therefore how much room oxygen and dopants
          have to diffuse out of the melt and into the crystal. Spin
          faster, the boundary layer thins, and the boule picks up more
          oxygen. Spin slower, and a different impurity profile freezes
          in. It is the same boule, from the same melt, but the
          micro-properties depend on a knob the operator never has to
          announce.
        </p>
      </section>

      <section>
        <h2>6. Impurities: intentional and uninvited</h2>
        <p>
          Pure silicon is a poor semiconductor — too pure, in a way. To make
          it useful, we deliberately drop a tiny amount of another element
          into the melt: boron, to make it <em>p-type</em>; phosphorus or
          arsenic, to make it <em>n-type</em>. We are talking about parts
          per million, sometimes parts per billion. Yet that whisper of
          dopant decides whether a region of the chip is a transistor source
          or a transistor drain, and the entire logic of computing rides on
          it.
        </p>

        <SegregationWidget />

        <p>
          The trouble is that dopants do not freeze into the crystal at
          the same rate they exist in the melt. A coefficient called <em>k</em>
          {" "}— the segregation coefficient — measures the bias. For boron,{" "}
          <code>k ≈ 0.8</code>: the crystal takes up almost as much as the
          melt has. For phosphorus, <code>k ≈ 0.35</code>: the crystal
          accepts it reluctantly, and the dopant piles up in the remaining
          melt as the boule grows. By the time you have pulled 80% of the
          boule, the leftover melt is much more concentrated than when you
          started, and the tail of the boule is doped much more heavily
          than the head.
        </p>
        <p>
          Oxygen is the most famous uninvited guest. The crucible itself,
          made of quartz (SiO₂), slowly dissolves into the melt, and roughly
          a part per million of oxygen ends up frozen into every wafer. A
          little oxygen is useful — it stiffens the lattice and pins
          dislocations. Too much, and it forms tiny precipitates that
          short-circuit devices. The crucible material, the gas flow, and
          the rotation rates are all tuned to land oxygen in a narrow band
          around a few times ten to the seventeenth atoms per cubic
          centimeter.
        </p>
      </section>

      <section>
        <h2>7. From 100&nbsp;mm to 300&nbsp;mm (and why 450&nbsp;mm stalled)</h2>
        <p>
          The economics of chipmaking are dominated by the area of the
          wafer. Every step — lithography, etching, polishing, inspection —
          happens on whole wafers at a time, so making wafers larger lets
          you fit more chips in the same machine-hour. Over four decades
          the industry has scaled the wafer from 50&nbsp;mm to 75 to 100
          to 150 to 200 to 300&nbsp;mm. Each jump roughly doubled the
          usable area and made chips cheaper.
        </p>

        <WaferScaleWidget />

        <p>
          What goes wrong above 300&nbsp;mm is mostly thermal. Heat has to
          come out through the top face of the boule, and the area of that
          face grows as <em>r</em>², while the mass of melt that has to be
          kept liquid grows as <em>r</em>³. To keep the same temperature
          gradient at the interface, you need exponentially more heater
          power, exponentially better insulation, and a crucible that does
          not warp under its own weight. A 450&nbsp;mm boule weighs close
          to a ton, and the magnetic fields used to dampen melt convection
          have to scale with it. A whole consortium of companies tried to
          push to 450&nbsp;mm in the early 2010s, and quietly gave up
          around 2017. 300&nbsp;mm has stayed the ceiling.
        </p>
        <p>
          This is the cost-curve answer to the question, &ldquo;why does
          semiconductor manufacturing always look like it should be easy
          to scale?&rdquo; The chips are small, but the boule they came
          from is enormous, and the puller around the boule is the size
          of a two-story house. The CZ machine is one of the largest
          single-purpose instruments in any factory in the world, and we
          have stopped being able to make it bigger.
        </p>
      </section>

      <section>
        <h2>8. After the boule</h2>
        <p>
          When pulling finishes, the boule is allowed to cool slowly for a
          day or so. It is then ground to a precise diameter on the
          outside, a small flat or notch is cut to mark crystal
          orientation, and the boule is sliced into wafers with a wire saw
          — about three thousand wafers from a meter-long 300&nbsp;mm
          ingot. Each wafer is lapped, etched, polished on one face to a
          mirror finish, and inspected for any remaining defect within an
          atomic layer of the surface.
        </p>

        <SliceWidget />

        <p>
          For the most demanding devices, an additional layer of even
          purer silicon is grown on top of the polished wafer in a
          separate chamber, atom by atom from a silane gas. That is the
          <em> epitaxial layer</em>, and it is where transistors actually
          live. The CZ boule is the foundation underneath it: the slab
          that gives the whole stack mechanical strength, electrical
          ground, and a thermal path to the package.
        </p>
        <p>
          Then the wafer goes into the photolithography line, and that is
          another essay.
        </p>
      </section>

      <hr />

      <footer className="mt-24 text-center">
        <p className="byline">A work in progress. Feedback welcome.</p>
      </footer>
    </main>
  );
}
