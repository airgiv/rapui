/* ══ Layout ═══════════════════════════════════════════════
   The page grid: what a landing page stands on. Five parts, all
   reading the preset's layout tokens, so switching the preset
   re-lays the page — not just recolours it:

     <Section tone="surface">            vertical rhythm + a tone
       <SectionHeader eyebrow title lead />
       <Grid cols={3}>…</Grid>           equal columns, 1 → 2 → 3
       <Grid>                            or the 12-track grid:
         <GridItem span={7}>…</GridItem>
         <GridItem span={5}>…</GridItem>
       </Grid>
     </Section>

   Container   the content column: --rap-container wide, with
               --rap-gutter at the sides (narrow / default / full)
   Section     --rap-section-y above and below. A toned section
               (surface, muted, dark) is an object of its own: a big
               rounded card inset from the page in fun and civic,
               flush and square in signal, product and minimal.
               Plain sections in a row get the preset's rule
               between them (a hairline in signal and minimal).
   Grid        --rap-column-gap between columns ("tile" packs them
               at --rap-gap-tile: 4px cards in fun, 1px hairline
               cells in minimal)
   Stack       a flex row or column on the --rap-space-* steps,
               which scale with the preset's --rap-density
   GridOverlay the columns drawn over the page, like a design
               tool's layout grid — Shift+G toggles it

   Responsive by container queries, not the viewport: a grid
   collapses for the room it actually has, in a page or a preview.

   Delight (fun): the overlay's columns drop in left to right.
   Calm: they fade in together. */
import { createElement, forwardRef, useEffect, useRef, useState, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { usePreset } from "../hooks/usePreset";
import { cn } from "../utils";
import type { RapPreset } from "./RapStyle";
import { Display, Eyebrow } from "./Typography";
import "./Layout.css";

/* ── Container ── */

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** narrow: --rap-container-narrow (reading width); full: no max width. */
  size?: "narrow" | "default" | "full";
  as?: ElementType;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ size = "default", as = "div", className, ...rest }, ref) {
  return createElement(as, { ref, "data-slot": "container", "data-size": size, className: cn("rap-container", className), ...rest });
});

/* ── Section ── */

export type SectionTone = "plain" | "surface" | "muted" | "dark";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  /** Vertical padding: a share of --rap-section-y. */
  size?: "none" | "sm" | "md" | "lg";
  /** Container width inside; `bleed` puts the children edge to edge with no container. */
  width?: "narrow" | "default" | "full" | "bleed";
  as?: ElementType;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { tone = "plain", size = "md", width = "default", as = "section", className, children, ...rest },
  ref,
) {
  return createElement(
    as,
    {
      ref,
      "data-slot": "section",
      "data-tone": tone,
      "data-size": size,
      // the dark tone is a dark island: every token inside flips to the preset's dark palette
      ...(tone === "dark" ? { "data-rap-theme": "dark" } : {}),
      className: cn("rap-section", className),
      ...rest,
    },
    width === "bleed" ? children : <Container size={width}>{children}</Container>,
  );
});

/* ── Grid ── */

export type Space = "none" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
const space = (s: Space) => (s === "none" ? "0px" : `var(--rap-space-${s})`);

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Equal columns at full width (they collapse to 2, then 1, as room runs out),
      or [narrow, medium, wide] to set each step. Leave out for the 12-track grid
      and place <GridItem span> children. */
  cols?: number | [number, number, number];
  /** column: --rap-column-gap; tile: --rap-gap-tile (packed cards); or a space step. */
  gap?: "column" | "tile" | Space;
  /** Between rows, when it should differ from `gap`. */
  rowGap?: "column" | "tile" | Space;
}

const gapVar = (g: GridProps["gap"]) => (g === "column" ? "var(--rap-column-gap)" : g === "tile" ? "var(--rap-gap-tile)" : space(g ?? "none"));

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid({ cols, gap = "column", rowGap, className, style, ...rest }, ref) {
  const [sm, md, lg] = cols == null ? [12, 12, 12] : Array.isArray(cols) ? cols : [1, Math.min(cols, 2), cols];
  return (
    <div className="rap-grid-wrap">
      <div
        ref={ref}
        data-slot="grid"
        className={cn("rap-grid", className)}
        style={
          {
            "--grid-sm": sm,
            "--grid-md": md,
            "--grid-lg": lg,
            "--grid-gap": gapVar(gap),
            ...(rowGap ? { "--grid-row-gap": gapVar(rowGap) } : {}),
            ...style,
          } as CSSProperties
        }
        {...rest}
      />
    </div>
  );
});

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Tracks of the 12 to span (full width when the grid is narrow). */
  span?: number;
  /** Track to start on, 1-based. */
  start?: number;
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem({ span = 12, start, className, style, ...rest }, ref) {
  return (
    <div
      ref={ref}
      data-slot="grid-item"
      className={cn("rap-grid-item", className)}
      style={{ "--item-span": span, ...(start ? { "--item-start": start } : {}), ...style } as CSSProperties}
      {...rest}
    />
  );
});

/* ── Stack ── */

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "column" | "row";
  gap?: Space;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  as?: ElementType;
}

const ALIGN = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" };
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" };

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = "column", gap = "md", align, justify, wrap, as = "div", className, style, ...rest },
  ref,
) {
  return createElement(as, {
    ref,
    "data-slot": "stack",
    className: cn("flex min-w-0", direction === "row" ? "flex-row" : "flex-col", align && ALIGN[align], justify && JUSTIFY[justify], wrap && "flex-wrap", className),
    style: { gap: space(gap), ...style },
    ...rest,
  });
});

/* ── SectionHeader ── */

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** A short kicker above the title. */
  eyebrow?: ReactNode;
  /** "01" — shown where the preset numbers its sections (signal, minimal). */
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  /** Display size of the title. */
  size?: "xl" | "lg" | "md";
  /** Heading level. */
  as?: "h1" | "h2" | "h3";
  /** Buttons or links under the lead. */
  actions?: ReactNode;
}

export function SectionHeader({ eyebrow, index, title, lead, align = "start", size = "lg", as = "h2", actions, className, ...rest }: SectionHeaderProps) {
  return (
    <header data-slot="section-header" data-align={align} className={cn("rap-section-header", className)} {...rest}>
      {(eyebrow || index) && (
        <Eyebrow data-slot="section-eyebrow" dot={!!eyebrow} className="rap-section-kicker">
          {index && (
            <span aria-hidden className="rap-section-index">
              {index}
            </span>
          )}
          {eyebrow}
        </Eyebrow>
      )}
      <Display as={as} size={size}>
        {title}
      </Display>
      {lead && <p className="rap-section-lead">{lead}</p>}
      {actions && <div className={cn("flex flex-wrap gap-3 pt-(--rap-space-xs)", align === "center" && "justify-center")}>{actions}</div>}
    </header>
  );
}

/* ── GridOverlay ── */

export interface GridOverlayProps {
  /** Controlled. Leave out to toggle with the hotkey. */
  visible?: boolean;
  defaultVisible?: boolean;
  /** A key that toggles it together with Shift; false to turn the hotkey off. */
  hotkey?: string | false;
  /** fixed: over the viewport; absolute: over the nearest positioned parent (previews). */
  position?: "fixed" | "absolute";
  /** Column count; the preset's --rap-columns (12) by default. */
  columns?: number;
  size?: ContainerProps["size"];
}

export function GridOverlay({ visible, defaultVisible = false, hotkey = "g", position = "fixed", columns = 12, size }: GridOverlayProps) {
  const [own, setOwn] = useState(defaultVisible);
  const on = visible ?? own;
  useEffect(() => {
    if (!hotkey || visible != null) return;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === hotkey.toLowerCase()) setOwn((v) => !v);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [hotkey, visible]);
  if (!on) return null;
  return (
    <div data-slot="grid-overlay" aria-hidden className="rap-grid-overlay" style={{ position }}>
      <Container size={size}>
        <Grid cols={[4, 8, columns]}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="rap-grid-overlay-col" style={{ "--i": i } as CSSProperties} />
          ))}
        </Grid>
      </Container>
    </div>
  );
}

/* ── block looks ──
   A landing block is arranged differently in each preset (a stacked giant
   headline in fun, a split with a soft image card in civic, ruled cells in
   signal…). `look` names the preset whose arrangement to use; by default
   the one in effect. Mix freely: look="signal" in product colours is fine. */
export type BlockLook = RapPreset;

/** The block's arrangement: `look` if given, else the preset in effect. Put the ref on the block's root. */
export function useBlockLook<T extends Element = HTMLElement>(look?: BlockLook) {
  const ref = useRef<T>(null);
  const { preset, motion } = usePreset(ref);
  return { ref, look: look ?? preset, motion };
}
