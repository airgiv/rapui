/* How an Anatomy figure (anatomy-figures, or one drawn with the anatomy skill)
   looks in each rapui preset: its --anatomy-* tokens pointed at the preset's own
   --rap-* colours, line weight and type. The values are var()s, so a figure
   follows the preset's light and dark palettes by itself. Spread a look's
   tokens onto the figure (the package's `tokens` prop, or a style on the
   wrapper of a skill-built figure); signal's phosphor screen wants a dark
   island around it (`dark`). */
import type { RapPreset } from "../../rapui";

export type FigureTokens = Partial<Record<`--anatomy-${string}`, string>>;

const v = (name: string) => `var(--rap-${name})`;
/* a tint of a rapui colour over another colour */
const mix = (color: string, pct: number, over = v("surface")) => `color-mix(in oklab, ${v(color)} ${pct}%, ${over})`;

/* lines by strength, all from one ink */
const lines = (ink: string, mid: number, lo: number, faint: number): FigureTokens => ({
  "--anatomy-hi": v(ink),
  "--anatomy-strong": v(ink),
  "--anatomy-mid": mix(ink, mid),
  "--anatomy-lo": mix(ink, lo),
  "--anatomy-faint": mix(ink, faint),
  "--anatomy-dot": mix(ink, mid),
  "--anatomy-text": v("ink-2"),
  "--anatomy-muted": v("mute"),
});

export const FIGURE_LOOKS: Record<RapPreset, { tokens: FigureTokens; note: string; dark?: boolean }> = {
  // fun: line work like the rest, a touch heavier than the others — round lines, faces kept white
  // with a whisper of shade, and the one moving part in flame
  fun: {
    note: "Round line work on white, a touch heavier than the others, a whisper of shade, the moving part in flame.",
    tokens: {
      "--anatomy-card": v("surface"),
      "--anatomy-paper": v("surface"),
      "--anatomy-top": v("surface"),
      "--anatomy-face": v("surface"),
      "--anatomy-shade-3": mix("ink", 3),
      "--anatomy-shade-2": mix("ink", 6),
      "--anatomy-shade-1": mix("ink", 9),
      "--anatomy-shade-0": mix("ink", 13),
      "--anatomy-lit": v("flame"),
      "--anatomy-lit-top": mix("flame", 14),
      "--anatomy-lit-shade": mix("flame", 30),
      ...lines("ink", 85, 62, 26),
      "--anatomy-weight": "1px",
      "--anatomy-halo": v("ink"),
      "--anatomy-halo-opacity": "0.12",
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
      "--anatomy-weight": "0.8px",
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

