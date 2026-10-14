/* ══ AppStats ═════════════════════════════════════════════
   The strip under an app's title on a store page: short columns
   of label / value / sub, divided by hairlines —

     12K RATINGS · AGE · CHART · AWARD · DEVELOPER · LANGUAGE
        4.8          4+     #2   (laurel)    Fernhill        EN
      ★★★★★        Years  Productivity  Editors' Choice   +12 more

     <AppStats items={[
       { label: "12K Ratings", value: "4.8", sub: <Stars value={4.8} /> },
       { label: "Age", value: "4+", sub: "Years" },
       { label: "Award", value: <LaurelWreath />, sub: "Editors' Choice" },
     ]} />

   `value` and `sub` take any node: a <Stars> row, a <LaurelWreath>,
   an icon. An `icon` sits in place of the value when there is no
   value (as the store does for the developer). On narrow widths
   the strip scrolls sideways and snaps column by column; it is a
   focusable region, so the arrow keys scroll it too.

   Looks — each preset picks its own, or pass `look`:
     civic    small-caps labels, serif values, even columns
     fun      big chunky values, the label a bold kicker; a column
              lifts and tilts a hair under the pointer
     signal   mono throughout, labels in brackets, ruled cells
     product  the store's own: grey small caps, a semibold grey
              value, a small grey sub
     minimal  plain labels, light values, hairlines only

   Delight (fun): the column under the pointer hops up and tilts.
   Calm: no hop. */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";
import { useBlockLook, type BlockLook } from "./Layout";

export interface AppStatItem {
  label: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  /** Shown in place of the value when there is none, or before it. */
  icon?: ReactNode;
  /** Accessible text for the whole column, when the visible parts are glyphs. */
  description?: string;
}

export interface AppStatsProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: AppStatItem[];
  look?: BlockLook;
  /** Names the scrolling region. */
  label?: string;
}

const LABEL: Record<BlockLook, string> = {
  civic: "font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-2",
  fun: "font-sans text-[0.75rem] font-bold uppercase tracking-[0.04em] text-flame",
  signal: "font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-2",
  product: "font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-mute",
  minimal: "font-sans text-[0.75rem] text-mute",
};
const VALUE: Record<BlockLook, string> = {
  civic: "font-display text-[1.375rem] font-normal text-ink",
  fun: "font-display text-[1.75rem] font-black tracking-[-0.03em] text-ink",
  signal: "font-mono text-[1.25rem] font-medium text-ink",
  product: "font-sans text-[1.25rem] font-semibold tracking-[-0.02em] text-ink-2",
  minimal: "font-sans text-[1.25rem] font-light text-ink",
};
const SUB: Record<BlockLook, string> = {
  civic: "font-sans text-[0.75rem] text-ink-2",
  fun: "font-sans text-[0.8125rem] font-semibold text-ink-2",
  signal: "font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-mute",
  product: "font-sans text-[0.75rem] text-mute",
  minimal: "font-sans text-[0.75rem] text-mute",
};

export function AppStats({ items, look: lookProp, label = "App information", className, ...rest }: AppStatsProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  return (
    <section
      ref={ref}
      aria-label={label}
      tabIndex={0}
      data-slot="app-stats"
      data-look={look}
      className={cn(
        "w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xs outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden",
        look === "signal" && "border-y border-line",
        className,
      )}
      {...rest}
    >
      <ul className="m-0 flex w-max min-w-full list-none p-0">
        {items.map((it, i) => (
          <li
            key={i}
            data-slot="app-stat"
            className={cn(
              "flex min-w-[7.5rem] flex-1 snap-start flex-col items-center justify-start gap-1 px-4 text-center",
              look === "signal" ? "py-3" : "py-1",
              i > 0 && "border-l border-line",
              look === "fun" && "transition-[translate,rotate] duration-300 ease-spring fun:hover:-translate-y-1 fun:hover:rotate-[-1.5deg]",
            )}
          >
            {it.description && <span className="sr-only">{it.description}</span>}
            <span data-slot="app-stat-label" aria-hidden={it.description ? true : undefined} className={cn("whitespace-nowrap", LABEL[look])}>
              {look === "signal" ? <>[{it.label}]</> : it.label}
            </span>
            <span data-slot="app-stat-value" aria-hidden={it.description ? true : undefined} className={cn("flex min-h-[1.75rem] items-center gap-1.5 whitespace-nowrap leading-none tabular-nums", VALUE[look])}>
              {it.icon && <span className="inline-flex size-[1.4rem] items-center justify-center text-ink-2 [&_svg]:size-full">{it.icon}</span>}
              {it.value}
            </span>
            {it.sub != null && (
              <span data-slot="app-stat-sub" aria-hidden={it.description ? true : undefined} className={cn("whitespace-nowrap", SUB[look])}>
                {it.sub}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
