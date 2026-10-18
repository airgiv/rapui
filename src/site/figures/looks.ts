/* How an Anatomy figure (anatomy-figures, or one drawn with the anatomy skill)
   looks in each rapui preset: its --anatomy-* tokens pointed at the preset's own
   --rap-* colours, line weight and type. The values are var()s, so a figure
   follows the preset's light and dark palettes by itself. Spread a look's
   tokens onto the figure (the package's `tokens` prop, or a style on the
   wrapper of a skill-built figure). Every look reads on its preset's own
   paper in both themes; `dark` (a dark island around the figure) is kept in
   the type for figures that need one, and no look sets it now. */
import type { RapPreset } from "../../rapui";

export type FigureTokens = Partial<Record<`--anatomy-${string}` | `--mod-${string}`, string>>;

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
      // a toy set: the brand colours as fills for some tiles and most controls (the modules figure)
      "--mod-fill-1": v("flame"),
      "--mod-fill-2": v("acid"),
      "--mod-fill-3": v("sky"),
      "--mod-fill-4": v("bubble"),
      "--mod-fill-5": v("plum"),
      "--mod-fill-6": v("blue"),
      // lines on coloured parts: "55%" keeps that much of the part's own colour (a darker shade of it); "0%" is plain ink
      "--mod-line-own": "55%",
      "--anatomy-cap-a": v("blue"),
      "--anatomy-cap-b": v("acid"),
    },
  },
  // civic: an engraved plate — navy line work on white, faces in pale grey, one part in Old Glory red
  civic: {
    note: "An engraved plate: navy line work on white, faces in pale grey, the one moving part in red.",
    tokens: {
      "--anatomy-card": v("surface"),
      "--anatomy-paper": v("surface"),
      "--anatomy-top": v("surface"),
      "--anatomy-face": v("surface"),
      "--anatomy-shade-3": mix("plum", 4),
      "--anatomy-shade-2": mix("plum", 8),
      "--anatomy-shade-1": mix("plum", 13),
      "--anatomy-shade-0": mix("plum", 19),
      "--anatomy-lit": v("flame"),
      "--anatomy-lit-top": mix("flame", 14),
      "--anatomy-lit-shade": mix("flame", 32),
      ...lines("ink", 78, 58, 28),
      "--anatomy-weight": "0.8px",
      "--anatomy-halo": v("plum"),
      "--anatomy-halo-opacity": "0.18",
      "--anatomy-mono": v("font-sans"),
      // the office hardware (the modules figure's civic set): aged brass, navy wood, slate, cream card
      // quiet and near-monochrome, drawn in ink: light grey metal, pale grey bodies, white faces
      "--mod-brass": mix("ink", 16),
      "--mod-wood": mix("ink", 5),
      "--mod-slate": mix("ink", 9),
      "--mod-cream": v("surface"),
      "--mod-ink": mix("ink", 45),
    },
  },
  // signal: a technical bench — black and grey line work on light grey paper, faces in paper
  // tints, black caps and keys, the screens white dots on black, the accent green only where a
  // part is live. Every value is a var(), so the dark theme turns it into grey lines on black.
  signal: {
    note: "A technical bench: black and grey line work on light grey paper, black caps and keys, screens in white on black, one green accent where a part is live; grey on black at night.",
    tokens: {
      "--anatomy-card": v("paper"),
      "--anatomy-paper": mix("paper", 40, v("surface")),
      "--anatomy-top": mix("paper", 30, v("surface")),
      "--anatomy-face": mix("paper", 40, v("surface")),
      "--anatomy-shade-3": mix("ink", 4, mix("paper", 40, v("surface"))),
      "--anatomy-shade-2": mix("ink", 8, mix("paper", 40, v("surface"))),
      "--anatomy-shade-1": mix("ink", 13, mix("paper", 40, v("surface"))),
      "--anatomy-shade-0": mix("ink", 19, mix("paper", 40, v("surface"))),
      "--anatomy-lit": v("flame"),
      "--anatomy-lit-top": mix("flame", 70, v("surface")),
      "--anatomy-lit-shade": mix("flame", 85, v("surface")),
      "--anatomy-phosphor": "var(--rap-panel-ink, #f4f4f2)",
      "--anatomy-glass": "#050505",
      "--anatomy-hi": v("ink"),
      "--anatomy-strong": v("ink"),
      "--anatomy-mid": mix("ink", 62, v("paper")),
      "--anatomy-lo": mix("ink", 38, v("paper")),
      "--anatomy-faint": mix("ink", 18, v("paper")),
      "--anatomy-dot": mix("ink", 55, v("paper")),
      "--anatomy-text": v("ink-2"),
      "--anatomy-muted": v("mute"),
      "--anatomy-weight": "0.75px",
      "--anatomy-halo": v("ink"),
      "--anatomy-halo-opacity": "0.1",
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

