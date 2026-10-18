/* ══ ModGrid ═══════════════════════════════════════════════
   The signal look's page grid: the full width divided into equal
   columns — 4 on a phone, 8 on a tablet, 12 on a desk — and rows
   as tall as a column is wide, so the page is a field of square
   cells. Content snaps to cells and spans them; most cells stay
   empty. Optional marks: faint crosshairs (+) at every
   intersection (`marks`), a tiny "( 01 )" index in every cell's
   corner (`numbered` — an editorial index grid; content cells push
   their content below it), or hairline rules round each cell that
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
import { forwardRef, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "../utils";
import "./ModGrid.css";

type Place = string | null | undefined;
type Responsive = Place | [Place, Place?, Place?];

export interface ModGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Faint crosshairs at every cell intersection. */
  marks?: boolean;
  /** A small "( 01 )" index in the corner of every cell, very faint — an editorial index
      grid. Cells under content hide theirs, except the content's own first cell. */
  numbered?: boolean;
  /** The first cell's number (default 1), to carry an index on from a grid above. */
  numberFrom?: number;
  /** Rows exactly one cell tall (content clips) instead of at least one cell. */
  fixed?: boolean;
}

type Numbers = { cols: number; rows: string; n: number; hidden: string };

/* measure the grid's tracks and which cells content covers, so the index overlay can draw a
   number in every cell and hide the ones under content */
function useNumbers(on: boolean) {
  const grid = useRef<HTMLDivElement>(null);
  const [nums, setNums] = useState<Numbers | null>(null);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!on || !el || typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const cs = getComputedStyle(el);
      const colsW = cs.gridTemplateColumns.split(" ").map(parseFloat).filter((x) => !Number.isNaN(x));
      const rowsH = cs.gridTemplateRows.split(" ").map(parseFloat).filter((x) => !Number.isNaN(x));
      const cols = colsW.length;
      if (!cols || !rowsH.length) return;
      const cw = colsW[0];
      const tops: number[] = [];
      rowsH.reduce((y, h) => (tops.push(y), y + h), 0);
      const rowAt = (y: number) => {
        let k = 0;
        for (let i = 0; i < tops.length; i++) if (tops[i] <= y + 1) k = i;
        return k;
      };
      const hide = new Set<number>();
      for (const child of Array.from(el.children) as HTMLElement[]) {
        if (!child.classList.contains("rap-mod-cell") || !child.offsetParent) continue;
        const c0 = Math.round(child.offsetLeft / cw), c1 = Math.max(c0 + 1, Math.round((child.offsetLeft + child.offsetWidth) / cw));
        const r0 = rowAt(child.offsetTop), r1 = rowAt(child.offsetTop + child.offsetHeight - 2) + 1;
        for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) if (r !== r0 || c !== c0) hide.add(r * cols + c);
      }
      const next: Numbers = { cols, rows: rowsH.map((h) => `${h}px`).join(" "), n: cols * rowsH.length, hidden: [...hide].sort((x, y) => x - y).join(",") };
      setNums((prev) => (prev && prev.cols === next.cols && prev.rows === next.rows && prev.hidden === next.hidden ? prev : next));
    };
    const ro = new ResizeObserver(() => (raf ||= requestAnimationFrame(measure)));
    ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    measure();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [on]);
  return { grid, nums };
}

export const ModGrid = forwardRef<HTMLDivElement, ModGridProps>(function ModGrid({ marks, numbered = false, numberFrom = 1, fixed, className, children, ...rest }, ref) {
  const { grid, nums } = useNumbers(numbered);
  const hidden = useMemo(() => new Set((nums?.hidden ?? "").split(",").filter(Boolean).map(Number)), [nums?.hidden]);
  const setRef = (node: HTMLDivElement | null) => {
    grid.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  // the wrapper is the query container, so a cell is the grid's own width / columns
  return (
    <div className="rap-mod-wrap">
      <div ref={setRef} data-slot="mod-grid" data-marks={marks || undefined} data-numbered={numbered || undefined} data-fixed={fixed || undefined} className={cn("rap-mod", className)} {...rest}>
        {numbered && nums && (
          <div aria-hidden className="rap-mod-index" style={{ gridTemplateColumns: `repeat(${nums.cols}, minmax(0, 1fr))`, gridTemplateRows: nums.rows }}>
            {Array.from({ length: nums.n }, (_, i) => (
              <span key={i} className="rap-mod-num" data-off={hidden.has(i) || undefined}>
                {`( ${String(i + numberFrom).padStart(2, "0")} )`}
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
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
