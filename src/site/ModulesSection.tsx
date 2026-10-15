/* The home page's modules block: a desk of control tiles (the Anatomy figure ControlModules, layout "field",
   held still: no panning) inside a rounded card, with the preset picker on the card. Each preset gets its own
   desk — synth modules in colour (fun), quiet office hardware (civic), a bench of lab instruments (signal),
   hairline synths (product, minimal) — and a small plaque in the corner says what's on it.

   The figure is a big module, so it loads only when the card comes near the view (an intersection-triggered
   React.lazy); until then the card shows its own calm, empty paper. */
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { Accent, Display, RAP_PRESETS, type RapPreset } from "../rapui";
import { cn } from "../rapui/utils";
import { FIGURE_LOOKS } from "./figures/looks";
import { PresetPicker, PresetScope } from "./PresetsShowcase";

const ControlModules = lazy(() => import("./figures/modules").then((m) => ({ default: m.ControlModules })));

const SET: Record<RapPreset, "synth" | "lab" | "office"> = { fun: "synth", product: "synth", minimal: "synth", signal: "lab", civic: "office" };

/* what's on each desk, in that preset's voice */
const PLAQUE: Record<RapPreset, { kicker: string; line: string; hint: string }> = {
  fun: {
    kicker: "Desk of noisy things",
    line: "Knobs, keys and faders in every colour we had. Turn one. Press another. Nobody's stopping you.",
    hint: "Click a speaker grille for sound",
  },
  civic: {
    kicker: "Exhibit M",
    line: "The office equipment of record: a rotary dial, a bell, a stamp and a drawer of cards. The bell is for emergencies.",
    hint: "Click the intercom grille for sound",
  },
  signal: {
    kicker: "Bench inventory",
    line: "Instruments on a bench, every scope live. Tap a scope to change its trace.",
    hint: "The grille opens the audio channel — over",
  },
  product: {
    kicker: "New: modules",
    line: "Every control, shipped as its own block. They work right here: drag a knob, slide a fader, flip a switch.",
    hint: "Sound ships off — the grille is the flag",
  },
  minimal: {
    kicker: "Controls",
    line: "Turn. Press. Slide.",
    hint: "Grille: sound.",
  },
};

/* true once the element has come within a screen of the view */
function useNear<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setNear(true), { rootMargin: "100% 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, [near]);
  return { ref, near };
}

export function ModulesSection({ copyClass }: { copyClass?: string }) {
  const [preset, setPreset] = useState<RapPreset>("fun");
  const { ref, near } = useNear<HTMLDivElement>();
  const label = RAP_PRESETS.find((p) => p.value === preset)?.label;
  const plaque = PLAQUE[preset];
  return (
    <section className="flex flex-col gap-10 px-(--gutter) pb-28" id="modules">
      <div className="flex flex-col gap-6">
        <Display size="xl">
          Same controls, <Accent tone="mute">five desks</Accent>
        </Display>
        {copyClass ? (
          <p className={cn(copyClass, "max-w-[46ch]")}>
            Knobs, keys, faders and switches, each as its own little block. Pick a preset and the whole desk changes what it's made of.
          </p>
        ) : null}
      </div>
      <PresetScope preset={preset}>
        <div className="relative">
          <div
            ref={ref}
            /* the card's height is its own (not its drawing's), so it can be fully contained: the big SVG's
               layout and paint never leak out, and off screen the browser skips it altogether */
            className="relative h-[clamp(28rem,52vw,44rem)] overflow-hidden rounded-lg bg-paper text-ink transition-colors duration-500 shadow-[inset_0_0_0_1px_var(--rap-line)] [contain:strict] [content-visibility:auto]"
          >
            {near ? (
              <Suspense fallback={null}>
                <ControlModules
                  key={preset}
                  layout="field"
                  set={SET[preset]}
                  pan={false}
                  className="absolute inset-0"
                  style={FIGURE_LOOKS[preset].tokens as CSSProperties}
                />
              </Suspense>
            ) : null}
            {/* the picker sits on the card, centred at the top */}
            <div className="pointer-events-none absolute inset-x-0 top-[clamp(0.75rem,2vw,1.5rem)] z-10 flex justify-center px-3">
              {/* an opaque pill with a shadow so it reads over the drawing; it scrolls sideways
                  inside itself when the card is narrower than the five names */}
              <div className="pointer-events-auto max-w-full rounded-pill bg-surface p-1 shadow-pop">
                <PresetPicker value={preset} onChange={setPreset} size="sm" className="max-w-full" />
              </div>
            </div>
          </div>
          {/* the plaque: in the card's corner where it covers least; under the card on phones */}
          <aside
            aria-label={`About the ${label} desk`}
            className="relative z-10 mt-3 rounded-md border border-line bg-surface/95 p-4 text-ink shadow-pop sm:absolute sm:bottom-5 sm:left-5 sm:mt-0 sm:max-w-[19rem]"
          >
            <span className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-2">{plaque.kicker}</span>
            <p className="m-0 mt-1.5 text-[0.9375rem] leading-snug text-ink">{plaque.line}</p>
            <p className="m-0 mt-2 text-[0.8125rem] text-mute">{plaque.hint}</p>
          </aside>
        </div>
      </PresetScope>
    </section>
  );
}
