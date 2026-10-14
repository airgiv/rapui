/* #figures — a lab page for Anatomy figures in rapui presets, laid out the way
   they're meant to be used: big, beside a hero's words. The chain reaction (a
   marble machine drawn for rapui with the anatomy skill) sits on the right of
   a hero; the preset picker restyles the section, words and machine together,
   through the per-preset --anatomy-* looks in figures/looks.ts. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Accent, Button, Display, RAP_PRESETS, RapStyle, type RapPreset } from "../rapui";
import "../rapui/fonts/all";
import { FIGURE_LOOKS } from "./figures/looks";
import { ChainReaction, type ChainHandle } from "./figures/chain";
import { PresetPicker } from "./PresetsShowcase";

export function FiguresLab({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const [preset, setPreset] = useState<RapPreset>("fun");
  const machine = useRef<ChainHandle>(null);
  const look = FIGURE_LOOKS[preset];
  const label = RAP_PRESETS.find((p) => p.value === preset)?.label;
  useEffect(() => {
    document.title = "Figures — a chain reaction in rapui presets";
    window.scrollTo(0, 0);
  }, []);
  return (
    <RapStyle scope="local" preset={preset}>
      <div className="rap-root min-h-screen bg-paper text-ink transition-colors duration-500" data-figure-look={preset}>
        <div className="mx-auto flex max-w-(--rap-container) flex-wrap items-center justify-between gap-4 px-(--rap-gutter) pt-6">
          <a href="#" className="text-[0.875rem] font-medium text-ink-2 hover:text-ink">
            ← rapui
          </a>
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
            <PresetPicker value={preset} onChange={setPreset} size="sm" />
            <Button variant="soft" size="sm" onClick={() => setDark(!dark)}>
              {dark ? "Light" : "Dark"}
            </Button>
          </div>
        </div>
        {/* a hero: the words on the left, the machine big on the right (stacked when narrow) */}
        <section className="@container mx-auto max-w-(--rap-container) px-(--rap-gutter) py-[clamp(2rem,6vw,5rem)]">
          <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-[clamp(1.5rem,4vw,3rem)] @4xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="flex flex-col gap-6">
              <Display as="h1" size="xl">
                One thing leads <Accent>to another</Accent>
              </Display>
              <p className="m-0 max-w-[44ch] text-[1.125rem] leading-relaxed text-ink-2">
                A marble drops, rolls down the steps, knocks the dominoes, trips the lever and sets the next ball going — a chain reaction drawn
                with the Anatomy skill, here in {label}. Pick another preset above and the same machine changes character.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" icon onClick={() => machine.current?.run()}>
                  Start the run
                </Button>
                <Button variant="soft">How it's drawn</Button>
              </div>
            </div>
            <div
              className={look.dark ? "relative rounded-[var(--rap-radius-lg,1.25rem)] bg-paper p-[clamp(0.75rem,2vw,1.5rem)]" : "relative"}
              {...(look.dark ? { "data-rap-theme": "dark" } : {})}
            >
              <ChainReaction ref={machine} style={look.tokens as CSSProperties} />
            </div>
          </div>
        </section>
      </div>
    </RapStyle>
  );
}
