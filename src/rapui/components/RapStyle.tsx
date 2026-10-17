/* ══ RapStyle ═════════════════════════════════════════════
   Picks the library's character: a preset (palette, type, shape,
   density), a motion level and a theme, plus your own colours on
   top.

     <RapStyle preset="civic" palette={{ accent: "#7a1f2b" }} />

   By default it sets the attributes on <html>, so dialogs, menus
   and toasts — which render at the end of <body> — follow too.
   With scope="local" it wraps its children instead: for previews
   and side-by-side demos (portals then keep the page's style).

   Motion: each preset has a default (civic and signal move
   calmly; minimal stays still; fun and product move like rapui). Pass `motion`
   to override. Fonts are opt-in imports per preset, e.g.
   import "@rapui/react/fonts/civic". */
import { useLayoutEffect, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export type RapPreset = "fun" | "civic" | "signal" | "product" | "minimal";
export type RapMotion = "fun" | "calm" | "still";
export type RapTheme = "light" | "dark";

export const RAP_PRESETS: { value: RapPreset; label: string; note: string }[] = [
  { value: "fun", label: "Fun", note: "Loud, round, playful" },
  { value: "civic", label: "Civic", note: "Serif headlines, navy, soft cards" },
  { value: "signal", label: "Signal", note: "A pocket radio: LCD segments, sage and black, dot matrices" },
  { value: "product", label: "Product", note: "A product page with rapui's moves: Geist, ink, an editor's canvas" },
  { value: "minimal", label: "Minimal", note: "Black on white, hairlines, square" },
];

/** How much each preset moves when you do not say. */
export const PRESET_MOTION: Record<RapPreset, RapMotion> = {
  fun: "fun",
  civic: "calm",
  signal: "calm",
  product: "fun",
  minimal: "still",
};

/** Your own colours over a preset. Any CSS colour. */
export interface RapPalette {
  accent?: string;
  accentInk?: string;
  paper?: string;
  surface?: string;
  ink?: string;
  mute?: string;
  flame?: string;
  blue?: string;
  acid?: string;
  bubble?: string;
  sky?: string;
  plum?: string;
}

const VAR: Record<keyof RapPalette, string> = {
  accent: "--rap-accent",
  accentInk: "--rap-accent-ink",
  paper: "--rap-paper",
  surface: "--rap-surface",
  ink: "--rap-ink",
  mute: "--rap-mute",
  flame: "--rap-flame",
  blue: "--rap-blue",
  acid: "--rap-acid",
  bubble: "--rap-bubble",
  sky: "--rap-sky",
  plum: "--rap-plum",
};

/** The palette as CSS custom properties, for a style prop. */
export function paletteStyle(palette?: RapPalette): CSSProperties {
  const out: Record<string, string> = {};
  if (palette) for (const k of Object.keys(palette) as (keyof RapPalette)[]) if (palette[k]) out[VAR[k]] = palette[k]!;
  return out as CSSProperties;
}

/** The data attributes for a preset — to put on an element yourself. */
export function rapStyleAttributes({ preset = "fun", motion, theme }: { preset?: RapPreset; motion?: RapMotion; theme?: RapTheme }) {
  return {
    "data-rap-preset": preset,
    "data-rap-motion": motion ?? PRESET_MOTION[preset],
    ...(theme ? { "data-rap-theme": theme } : {}),
  };
}

export interface RapStyleProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  preset?: RapPreset;
  /** Defaults to the preset's own motion level. */
  motion?: RapMotion;
  theme?: RapTheme;
  palette?: RapPalette;
  /** "document" (default) styles the whole page, portals included; "local" wraps the children. */
  scope?: "document" | "local";
  children?: ReactNode;
}

export function RapStyle({ preset = "fun", motion, theme, palette, scope = "document", className, style, children, ...rest }: RapStyleProps) {
  const attrs = rapStyleAttributes({ preset, motion, theme });
  const vars = paletteStyle(palette);
  const key = JSON.stringify([attrs, vars]);

  useLayoutEffect(() => {
    if (scope !== "document") return;
    const html = document.documentElement;
    const prev = new Map<string, string | null>();
    for (const [k, v] of Object.entries(attrs)) {
      prev.set(k, html.getAttribute(k));
      html.setAttribute(k, v);
    }
    for (const [k, v] of Object.entries(vars)) html.style.setProperty(k, String(v));
    return () => {
      for (const [k, v] of prev) v === null ? html.removeAttribute(k) : html.setAttribute(k, v);
      for (const k of Object.keys(vars)) html.style.removeProperty(k);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, key]);

  if (scope === "document") return <>{children}</>;
  return (
    <div data-slot="rap-style" {...attrs} className={cn("contents", className)} style={{ ...vars, ...style }} {...rest}>
      {children}
    </div>
  );
}
