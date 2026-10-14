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

type Tokens = Partial<Record<`--anatomy-${string}`, string>>;

const v = (name: string) => `var(--rap-${name})`;
/* a tint of a rapui colour over another colour */
const mix = (color: string, pct: number, over = v("surface")) => `color-mix(in oklab, ${v(color)} ${pct}%, ${over})`;

/* lines by strength, all from one ink */
const lines = (ink: string, mid: number, lo: number, faint: number): Tokens => ({
  "--anatomy-hi": v(ink),
  "--anatomy-strong": v(ink),
  "--anatomy-mid": mix(ink, mid),
  "--anatomy-lo": mix(ink, lo),
  "--anatomy-faint": mix(ink, faint),
  "--anatomy-dot": mix(ink, mid),
  "--anatomy-text": v("ink-2"),
  "--anatomy-muted": v("mute"),
});

const FIGURE: Record<RapPreset, { tokens: Tokens; note: string; dark?: boolean }> = {
  // fun: thick round lines, faces shaded in the preset's candy colours, the moving part in flame
  fun: {
    note: "Thick round lines, faces shaded in candy colours by how they face the light, the part to watch in flame.",
    tokens: {
      "--anatomy-card": mix("acid", 30, v("paper")),
      "--anatomy-paper": v("surface"),
      "--anatomy-top": v("surface"),
      "--anatomy-face": v("surface"),
      "--anatomy-shade-3": mix("acid", 45),
      "--anatomy-shade-2": mix("sky", 45),
      "--anatomy-shade-1": mix("sky", 85),
      "--anatomy-shade-0": mix("blue", 45, v("sky")),
      "--anatomy-lit": v("flame"),
      "--anatomy-lit-top": mix("flame", 30),
      "--anatomy-lit-shade": mix("flame", 65),
      ...lines("ink", 85, 65, 30),
      "--anatomy-weight": "1.8px",
      "--anatomy-halo": v("plum"),
      "--anatomy-halo-opacity": "0.22",
      "--anatomy-mono": v("font-sans"),
    },
  },
  // civic: an engraved plate — navy line work on white, faces tinted navy, one part in Old Glory red
  civic: {
    note: "An engraved plate: navy line work on white, faces washed in navy, the one moving part in red.",
    tokens: {
      "--anatomy-card": v("surface"),
      "--anatomy-paper": v("surface"),
      "--anatomy-top": v("surface"),
      "--anatomy-face": v("surface"),
      "--anatomy-shade-3": mix("plum", 7),
      "--anatomy-shade-2": mix("plum", 15),
      "--anatomy-shade-1": mix("plum", 25),
      "--anatomy-shade-0": mix("plum", 38),
      "--anatomy-lit": v("flame"),
      "--anatomy-lit-top": mix("flame", 14),
      "--anatomy-lit-shade": mix("flame", 32),
      ...lines("ink", 78, 58, 28),
      "--anatomy-weight": "0.9px",
      "--anatomy-halo": v("plum"),
      "--anatomy-halo-opacity": "0.18",
      "--anatomy-mono": v("font-sans"),
    },
  },
  // signal: a phosphor screen — green lines on near-black, faces barely lit, the live part in acid
  signal: {
    dark: true,
    note: "A phosphor screen: green line work on near-black, scanlines over it, the live part in acid.",
    tokens: {
      "--anatomy-card": v("paper"),
      "--anatomy-paper": v("paper"),
      "--anatomy-top": mix("flame", 16, v("paper")),
      "--anatomy-face": mix("flame", 12, v("paper")),
      "--anatomy-shade-3": mix("flame", 12, v("paper")),
      "--anatomy-shade-2": mix("flame", 9, v("paper")),
      "--anatomy-shade-1": mix("flame", 6, v("paper")),
      "--anatomy-shade-0": mix("flame", 3, v("paper")),
      "--anatomy-lit": v("acid"),
      "--anatomy-lit-top": mix("acid", 35, v("paper")),
      "--anatomy-lit-shade": mix("acid", 20, v("paper")),
      "--anatomy-hi": v("flame"),
      "--anatomy-strong": v("flame"),
      "--anatomy-mid": mix("flame", 65, v("paper")),
      "--anatomy-lo": mix("flame", 45, v("paper")),
      "--anatomy-faint": mix("flame", 22, v("paper")),
      "--anatomy-dot": mix("flame", 60, v("paper")),
      "--anatomy-text": v("flame"),
      "--anatomy-muted": mix("flame", 60, v("paper")),
      "--anatomy-weight": "0.75px",
      "--anatomy-halo": "#000",
      "--anatomy-halo-opacity": "0.5",
      "--anatomy-mono": v("font-mono"),
    },
  },
  // product: a clean hairline drawing in neutral greys, the part to watch in iris
  product: {
    note: "A clean hairline drawing in neutral greys, the part to watch in the iris accent.",
    tokens: {
      "--anatomy-card": v("surface"),
      "--anatomy-paper": v("surface"),
      "--anatomy-top": v("surface"),
      "--anatomy-face": v("surface"),
      "--anatomy-shade-3": mix("ink", 3),
      "--anatomy-shade-2": mix("ink", 6),
      "--anatomy-shade-1": mix("ink", 10),
      "--anatomy-shade-0": mix("ink", 15),
      "--anatomy-lit": v("plum"),
      "--anatomy-lit-top": mix("plum", 10),
      "--anatomy-lit-shade": mix("plum", 22),
      ...lines("ink", 50, 32, 14),
      "--anatomy-weight": "0.55px",
      "--anatomy-halo": "#000",
      "--anatomy-halo-opacity": "0.12",
      "--anatomy-mono": v("font-mono"),
    },
  },
  // minimal: pure line art — every face white, black lines, no colour, no shadow
  minimal: {
    note: "Pure line art: every face white, black lines, no colour and no shadow.",
    tokens: {
      "--anatomy-card": v("surface"),
      "--anatomy-paper": v("surface"),
      "--anatomy-top": v("surface"),
      "--anatomy-face": v("surface"),
      "--anatomy-shade-3": v("surface"),
      "--anatomy-shade-2": v("surface"),
      "--anatomy-shade-1": v("surface"),
      "--anatomy-shade-0": v("surface"),
      "--anatomy-lit": v("ink"),
      "--anatomy-lit-top": v("surface"),
      "--anatomy-lit-shade": v("surface"),
      ...lines("ink", 80, 60, 25),
      "--anatomy-weight": "0.7px",
      "--anatomy-halo-opacity": "0",
      "--anatomy-mono": v("font-sans"),
    },
  },
};

function Plate({ preset, children }: { preset: RapPreset; children: ReactNode }) {
  const f = FIGURE[preset];
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
          <Watch tokens={FIGURE[p.value].tokens} theme={{ base: dark || FIGURE[p.value].dark ? "dark" : "light" }} />
        </Plate>
      ))}
    </div>
  );
}
