/* #figures — a lab page for Anatomy figures in rapui presets, laid out the way
   they're meant to be used: big, beside a hero's words. The rapui OP (a flat
   pocket instrument drawn for rapui with the anatomy skill, its keys, encoders,
   fader and switch being rapui components made physical) lies on the right of
   a hero; the preset picker restyles the section, words and device together,
   through the per-preset --anatomy-* looks in figures/looks.ts. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Accent, Button, Display, RAP_PRESETS, RapStyle, type RapPreset } from "../rapui";
import "../rapui/fonts/all";
import { FIGURE_LOOKS } from "./figures/looks";
import { RapOP, type OPHandle } from "./figures/op";
import { PresetPicker } from "./PresetsShowcase";

export function FiguresLab({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const [preset, setPreset] = useState<RapPreset>("fun");
  const device = useRef<OPHandle>(null);
  const look = FIGURE_LOOKS[preset];
  const label = RAP_PRESETS.find((p) => p.value === preset)?.label;
  useEffect(() => {
    document.title = "Figures — the rapui OP in rapui presets";
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
        {/* a hero: the words on the left, the device big on the right (stacked when narrow) */}
        <section className="@container mx-auto max-w-(--rap-container) px-(--rap-gutter) py-[clamp(2rem,6vw,5rem)]">
          <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-[clamp(1.5rem,4vw,3rem)] @4xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="flex flex-col gap-6">
              <Display as="h1" size="xl">
                Interfaces you can <Accent>almost touch</Accent>
              </Display>
              <p className="m-0 max-w-[44ch] text-[1.125rem] leading-relaxed text-ink-2">
                Buttons, knobs, sliders and switches from rapui, made into a little instrument you could pick up: the keys press, the encoders
                turn, the fader glides. Here in {label} — pick another preset above and the same device changes character.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" icon onClick={() => device.current?.run()}>
                  Play
                </Button>
                <Button variant="soft">How it's drawn</Button>
              </div>
            </div>
            <div
              className={look.dark ? "relative rounded-[var(--rap-radius-lg,1.25rem)] bg-paper p-[clamp(0.75rem,2vw,1.5rem)]" : "relative"}
              {...(look.dark ? { "data-rap-theme": "dark" } : {})}
            >
              <RapOP ref={device} style={look.tokens as CSSProperties} />
            </div>
          </div>
        </section>
      </div>
    </RapStyle>
  );
}
