import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { useGlide } from "../hooks/useGlide";
import { springOf } from "../hooks/useSpring";
import { useSound } from "../sound";
import { cn, prefersReducedMotion } from "../utils";

/* ── Table ─────────────────────────────────────────────────
   Two physical ideas, one per verb:

   POINTING. There is ONE row highlight, and it travels. Instead
   of each row lighting up on its own, a single rounded slab
   glides to the row under the pointer on the caterpillar glider
   (useGlide, axis y — the edge moving forward is quick, the tail
   catches up), the same highlight the ToggleGroup and menus use.
   Scanning down a table becomes one continuous motion, and you
   can see where you came from. It fades out when the pointer
   leaves and picks up from where it was when it comes back.

   REORDERING. When rows change places (a sort, a filter closing
   a gap) each row is FLIPped: measured before and after, put back
   where it was with `translate`, and let go on the shared spring
   (tune 20: damping ~0.6, an 8% overshoot — rows are heavy, they should
   land, not bounce). The new order is in the DOM immediately;
   only the picture catches up. Rows are tracked by DOM node, so
   React keys are what make a row "the same row". A row that was
   not there before (the next page, a sort pulling one in from
   another page, a filter being cleared) settles in from 10px
   below, 28ms after the one above it, so the new rows arrive as
   a small stack being laid down rather than a flash.

   Calm / reduced motion: the highlight falls back to per-row hover
   and rows jump straight to their places. With a SoundProvider on,
   each row the highlight arrives at is a soft detent (0.3) — the
   ratchet limiter keeps a fast sweep from buzzing. */

const isCalm = (el: Element | null) => prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Plain, hairline-separated table. Wraps in a horizontally scrollable box. */
export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(function Table(
  { className, onPointerMove, onPointerLeave, ...rest },
  ref,
) {
  const wrap = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement | null>(null);
  const [row, setRow] = useState<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  const sound = useSound();
  const glide = useGlide(wrap, row, { axis: "y", lead: 60, trail: 18, delay: 40 });

  // the row this pointer is over, if it is one of OUR body rows
  const track = (target: EventTarget) => {
    const tr = (target as Element).closest?.("tr");
    const body = tr?.parentElement;
    if (!tr || !body || body.tagName !== "TBODY" || body.parentElement !== table.current || isCalm(tr)) {
      setOn(false);
      return;
    }
    if (tr !== row) sound.detent(0.3);
    setRow(tr as HTMLElement);
    setOn(true);
  };

  return (
    <div
      ref={wrap}
      data-slot="table-container"
      className="relative isolate w-full overflow-x-auto"
      onPointerMove={(e) => track(e.target)}
      onPointerLeave={() => setOn(false)}
    >
      {/* delight: ONE highlight glides between rows. Calm / reduced motion: no glider,
          rows light up on their own (see TableBody) */}
      <span
        data-slot="table-glider"
        className={cn(
          "absolute top-0 left-0 -z-1 rounded-row bg-fill pointer-events-none",
          "opacity-0 transition-opacity duration-(--rap-dur-fast) ease-rm data-on:opacity-100",
          "calm:hidden motion-reduce:hidden",
        )}
        style={glide.style}
        data-on={on && glide.ready ? "" : undefined}
        aria-hidden
      />
      <table
        ref={(el) => {
          table.current = el;
          setRef(ref, el);
        }}
        data-slot="table"
        className={cn(
          // separate + 0 spacing so rows can have rounded ends on hover
          "w-full border-separate border-spacing-0 font-sans text-[0.9375rem] tracking-[-0.01em] text-ink tabular-nums",
          "[&_[data-align=end]]:text-right",
          className,
        )}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        {...rest}
      />
    </div>
  );
});

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableHeader(
  { className, ...rest },
  ref,
) {
  return <thead ref={ref} data-slot="table-header" className={className} {...rest} />;
});

/* FLIP bookkeeping, per row node: where it was laid out, and the spring carrying it */
type Flight = { pos: number; vel: number; raf: number };
const flights = new WeakMap<HTMLElement, Flight>();

function fly(el: HTMLElement, from: number) {
  const { k, d } = springOf(20);
  const f = flights.get(el) ?? { pos: 0, vel: 0, raf: 0 };
  cancelAnimationFrame(f.raf);
  f.pos = from;
  flights.set(el, f);
  let prev = 0;
  const tick = (t: number) => {
    const dt = prev ? Math.min(2.5, Math.max(0, (t - prev) / 16.67)) : 1;
    prev = t;
    f.vel += (0 - f.pos) * k * dt;
    f.vel *= Math.pow(d, dt);
    f.pos += f.vel * dt;
    if (Math.abs(f.pos) < 0.3 && Math.abs(f.vel) < 0.3) {
      f.pos = 0;
      f.vel = 0;
      el.style.translate = "";
      el.removeAttribute("data-moving");
      return;
    }
    el.style.translate = `0 ${f.pos}px`;
    f.raf = requestAnimationFrame(tick);
  };
  el.setAttribute("data-moving", "");
  el.style.translate = `0 ${f.pos}px`;
  f.raf = requestAnimationFrame(tick);
}

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableBody(
  { className, ...rest },
  ref,
) {
  const body = useRef<HTMLTableSectionElement | null>(null);
  const tops = useRef(new WeakMap<Element, number>());
  const seen = useRef(false);
  const assign = useCallback(
    (el: HTMLTableSectionElement | null) => {
      body.current = el;
      setRef(ref, el);
    },
    [ref],
  );

  // after every commit: rows that kept their node but changed their place fly from the old one
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const calm = isCalm(el);
    const first = !seen.current;
    seen.current = el.rows.length > 0;
    let arriving = 0;
    for (const tr of Array.from(el.rows)) {
      const top = tr.offsetTop;
      const was = tops.current.get(tr);
      tops.current.set(tr, top);
      if (calm) continue;
      if (was == null) {
        if (!first)
          tr.animate([{ opacity: 0, translate: "0 10px" }, { opacity: 1, translate: "0 0" }], {
            duration: 320,
            delay: arriving++ * 28,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "backwards",
          });
        continue;
      }
      if (was === top) continue;
      const f = flights.get(tr);
      // start from where it is SEEN, so a row caught mid-flight changes course smoothly
      fly(tr, was + (f?.pos ?? 0) - top);
    }
  });

  return (
    <tbody
      ref={assign}
      data-slot="table-body"
      className={cn(
        // a hovered or selected row: round its two ends and hide the hairlines around it.
        // The glider draws the hover fill, so a hovered row's own cells stay clear —
        // except in calm / reduced motion, where there is no glider and the row fills itself
        "[&>tr:is(:hover,[data-state=selected])>td]:border-t-transparent [&>tr:is(:hover,[data-state=selected])+tr>td]:border-t-transparent",
        "[&>tr:is(:hover,[data-state=selected])>td:first-child]:rounded-l-row [&>tr:is(:hover,[data-state=selected])>td:last-child]:rounded-r-row",
        "calm:[&>tr:hover:not([data-state=selected])>td]:bg-fill motion-reduce:[&>tr:hover:not([data-state=selected])>td]:bg-fill",
        "[&>tr[data-state=selected]>td]:bg-[color-mix(in_srgb,var(--rap-select)_9%,transparent)]",
        className,
      )}
      {...rest}
    />
  );
});

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableFooter(
  { className, ...rest },
  ref,
) {
  return <tfoot
      ref={ref}
      data-slot="table-footer"
      className={cn("[&_td]:border-t-fill-strong [&_td]:font-medium", className)}
      {...rest}
    />;
});

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow({ className, ...rest }, ref) {
  return <tr
      ref={ref}
      data-slot="table-row"
      // a row in flight (FLIP) sits above its neighbours
      className={cn("data-moving:relative data-moving:z-1", className)}
      {...rest}
    />;
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TableHead(
  { className, scope = "col", ...rest },
  ref,
) {
  return <th
      ref={ref}
      scope={scope}
      data-slot="table-head"
      className={cn(
        "h-10 px-3.5 first:pl-4 last:pr-4 text-[0.8125rem] font-medium text-mute text-left whitespace-nowrap align-middle",
        className,
      )}
      {...rest}
    />;
});

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(function TableCell(
  { className, ...rest },
  ref,
) {
  return <td
      ref={ref}
      data-slot="table-cell"
      className={cn(
        "h-13 py-2 px-3.5 first:pl-4 last:pr-4 align-middle border-t border-line",
        "transition-[background-color,border-color] duration-(--rap-dur-fast) ease-rm",
        className,
      )}
      {...rest}
    />;
});

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(function TableCaption(
  { className, ...rest },
  ref,
) {
  return <caption
      ref={ref}
      data-slot="table-caption"
      className={cn("caption-bottom pt-4 px-4 pb-0 text-[0.8125rem] text-mute text-left", className)}
      {...rest}
    />;
});
