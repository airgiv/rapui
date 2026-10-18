/* ══ ModGrid ═══════════════════════════════════════════════
   The signal look's page grid: the full width divided into equal
   columns — 4 on a phone, 8 on a tablet, 12 on a desk — and rows
   as tall as a column is wide, so the page is a field of square
   cells. Content snaps to cells and spans them; most cells stay
   empty. Optional marks: faint crosshairs (+) at every
   intersection (`marks`), or hairline rules round each cell that
   holds something (`ruled` on a ModCell).

     <ModGrid marks>
       <ModCell c={["1 / -1", "1 / span 6", "1 / span 7"]} r="span 3">…</ModCell>
       <ModCell c={[null, "7 / span 2", "11 / span 2"]}><TechClock /></ModCell>
     </ModGrid>

   `c` and `r` are grid-column / grid-row values, one per width
   (phone, tablet, desk; a later one falls back to the one
   before; null hides the cell at that width). Responsive by
   container queries on its own width: it lays out for the room
   it has, in a page, a card or a docs stage. */
import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "../utils";
import "./ModGrid.css";

type Place = string | null | undefined;
type Responsive = Place | [Place, Place?, Place?];

export interface ModGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Faint crosshairs at every cell intersection. */
  marks?: boolean;
  /** Rows exactly one cell tall (content clips) instead of at least one cell. */
  fixed?: boolean;
}

export const ModGrid = forwardRef<HTMLDivElement, ModGridProps>(function ModGrid({ marks, fixed, className, ...rest }, ref) {
  // the wrapper is the query container, so a cell is the grid's own width / columns
  return (
    <div className="rap-mod-wrap">
      <div ref={ref} data-slot="mod-grid" data-marks={marks || undefined} data-fixed={fixed || undefined} className={cn("rap-mod", className)} {...rest} />
    </div>
  );
});

export interface ModCellProps extends HTMLAttributes<HTMLDivElement> {
  /** grid-column per width: phone, tablet, desk. */
  c?: Responsive;
  /** grid-row per width. */
  r?: Responsive;
  /** Hairline rules round the cell. */
  ruled?: boolean;
  /** Inner padding (default true): a cell's content sits a little in from its lines. */
  inset?: boolean;
}

/* resolve a per-width value (a later width falls back to the one before) into custom
   properties, and the widths it is hidden at (null) */
const resolve = (v: Responsive) => {
  const [a, b, c] = Array.isArray(v) ? v : [v];
  const md = b === undefined ? a : b;
  const lg = c === undefined ? md : c;
  return [a, md, lg] as const;
};
const vars = (prefix: string, v: Responsive) => {
  const out: Record<string, string> = {};
  resolve(v).forEach((x, i) => {
    if (x) out[`--${prefix}${["", "-md", "-lg"][i]}`] = x;
  });
  return out;
};
const hidden = (v: Responsive) =>
  resolve(v)
    .map((x, i) => (x === null ? ["sm", "md", "lg"][i] : ""))
    .filter(Boolean)
    .join(" ") || undefined;

export const ModCell = forwardRef<HTMLDivElement, ModCellProps>(function ModCell({ c, r, ruled, inset = true, className, style, ...rest }, ref) {
  return (
    <div
      ref={ref}
      data-slot="mod-cell"
      data-ruled={ruled || undefined}
      data-inset={inset || undefined}
      data-hide={hidden(c)}
      className={cn("rap-mod-cell", className)}
      style={{ ...vars("c", c), ...vars("r", r), ...style } as CSSProperties}
      {...rest}
    />
  );
});
