/* #figures — a lab page: one Anatomy figure (the mechanical watch, from the
   anatomy-figures package, MIT) drawn in each rapui preset. A figure reads every
   fill, line and label from --anatomy-* tokens; here each preset maps them onto
   its own --rap-* colours, so the same watch becomes an engraved plate (civic),
   a phosphor screen (signal), a clean hairline drawing (product), pure line art
   (minimal) and a chunky, candy-shaded toy (fun). The tokens are var()s, so a
   figure follows the preset's light and dark palettes by itself. */
import { useEffect, type ReactNode } from "react";
import Watch from "anatomy-figures/watch";
import { Accent, Button, Display, RAP_PRESETS, RapStyle, type RapPreset } from "../rapui";
import "../rapui/fonts/all";
import "./figures-lab.css";
import { FIGURE_LOOKS } from "./figures/looks";

function Plate({ preset, children }: { preset: RapPreset; children: ReactNode }) {
  const f = FIGURE_LOOKS[preset];
  const label = RAP_PRESETS.find((p) => p.value === preset)?.label;
  return (
    <RapStyle scope="local" preset={preset}>
      <section className="flex flex-col gap-5 bg-paper px-(--rap-gutter) py-12 text-ink" data-figure-look={preset}>
        <div className="mx-auto flex w-full max-w-(--rap-container) flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <Display as="h2" size="lg">
            {label}
          </Display>
          <p className="m-0 max-w-[52ch] text-ink-2">{f.note}</p>
        </div>
        <div
          className="figures-lab-plate mx-auto w-full max-w-(--rap-container) overflow-hidden rounded-lg"
          {...(f.dark ? { "data-rap-theme": "dark" } : {})}
        >
          {children}
        </div>
      </section>
    </RapStyle>
  );
}

export function FiguresLab({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  useEffect(() => {
    document.title = "Figures — Anatomy in rapui presets";
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="rap-root min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-(--rap-container) flex-col gap-5 px-(--rap-gutter) pt-14 pb-6">
        <a href="#" className="text-[0.875rem] font-medium text-ink-2 hover:text-ink">
          ← rapui
        </a>
        <Display as="h1" size="xl">
          One watch, <Accent>five characters</Accent>
        </Display>
        <p className="m-0 max-w-[60ch] text-[1.125rem] leading-relaxed text-ink-2">
          A mechanical watch movement from{" "}
          <a className="underline underline-offset-4" href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">
            Anatomy
          </a>{" "}
          (anatomy-figures, MIT), redrawn in each preset. Nothing in the figure changes but its tokens: every fill and line reads a{" "}
          <code>--anatomy-*</code> variable, and each preset points them at its own colours, line weight and type. Drag the crown up to wind it,
          press S to slow time, E to lift the bridges apart.
        </p>
        <div>
          <Button variant="soft" size="sm" onClick={() => setDark(!dark)}>
            {dark ? "Light" : "Dark"} theme
          </Button>
        </div>
      </header>
      {RAP_PRESETS.map((p) => (
        <Plate key={p.value} preset={p.value}>
          <Watch tokens={FIGURE_LOOKS[p.value].tokens} theme={{ base: dark || FIGURE_LOOKS[p.value].dark ? "dark" : "light" }} />
        </Plate>
      ))}
    </div>
  );
}
