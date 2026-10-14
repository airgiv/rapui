/* ══ Laurel ═══════════════════════════════════════════════
   An award line: one or two lines of text framed by a pair of
   laurel branches, mirrored left and right — the film-festival /
   App Store "Editors' Choice" mark.

     <Laurel eyebrow="Editors' Choice" caption="App Store · 2026">
       Every federal agency, working together
     </Laurel>

   The branches are drawn, not shipped: a stem curves out from
   beside the text's foot, round its side and back in over its
   top. Pairs of leaves sit along it, set off the stem's own
   tangent — the outer leaf of each pair a touch lower than the
   inner one, so they alternate slightly as real laurel does —
   shrinking toward the tip, where one last leaf points straight
   on. Leaves are lanceolate (widest a little below the middle)
   and their tips curl back toward the way the stem grows. The
   right branch is the same drawing flipped. The branches are as
   tall as the text block (about 1.6× a single line), measured.

   Looks — each preset picks its own, or pass `look`:
     civic    classic slender silhouettes in ink (navy in civic),
              a tapering stem, serif text, centred
     fun      chunky rounded leaves in flame (or `tone`), the
              branches leaning out a little, bold display text
     signal   the branch spelled in phosphor dots — every leaf a
              string of dots, the stem a dotted line; mono caps
     product  hairline outline leaves with their midribs, sans text
     minimal  straight single-stroke leaves on a hairline stem,
              black on white

   The text stays real text; the branches are aria-hidden.

   Delight (fun): on mount the leaves pop on one by one from the
   foot of each branch to its tip, both sides together; hover and
   the branches sway gently from their foot. Signal powers its
   dots up from base to tip. Calm: everything is simply there. */
import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type SVGAttributes } from "react";
import { cn } from "../utils";
import { useBlockLook, type BlockLook } from "./Layout";
import "./Laurel.css";

export type LaurelSize = "sm" | "md" | "lg";
export type LaurelTone = "ink" | "accent" | "flame" | "blue" | "plum" | "acid" | "mute";

/* ── geometry ──────────────────────────────────────────────
   One LEFT branch in its own units (a ~45 × 100 box); everything
   is computed once per look × leaf count and cached. */

type Pt = [number, number];

interface LeafShape {
  /** half-width as a share of the length */
  width: number;
  /** how far the outer / inner leaves lean off the stem, degrees */
  out: number;
  inn: number;
  /** midrib curl, as a share of the length */
  curl: number;
  /** leaf length as a multiple of the gap between pairs (over 1: they overlap like real laurel) */
  reach: number;
  /** where the widest point sits, 0..1 from the base */
  belly: number;
  /** how much smaller the tip pair is than the base pair */
  taper: number;
}

interface Leaf {
  x: number;
  y: number;
  /** direction, degrees clockwise from +x */
  a: number;
  len: number;
  hw: number;
  curl: number;
  belly: number;
  /** 0..1 along the stem — the stagger order */
  t: number;
}

interface Branch {
  stem: Pt[];
  leaves: Leaf[];
  box: { x: number; y: number; w: number; h: number };
  /** the stem's foot, as a share of the box (the sway and tilt pivot) */
  foot: Pt;
}

// the stem: a cubic from the foot (bottom, beside the text) out round the side and
// back in over the top. Sampled, then walked by arc length so leaves space evenly.
const STEM: Pt[] = [
  [44, 100],
  [10, 92],
  [2, 36],
  [34, 4],
];
const SAMPLES = 160;

function bezier(t: number): Pt {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * STEM[0][0] + b * STEM[1][0] + c * STEM[2][0] + d * STEM[3][0], a * STEM[0][1] + b * STEM[1][1] + c * STEM[2][1] + d * STEM[3][1]];
}

/** a point in a leaf's own frame (base at 0,0, pointing along +x) → branch units */
function place(l: Leaf, [px, py]: Pt): Pt {
  const r = (l.a * Math.PI) / 180;
  const c = Math.cos(r), s = Math.sin(r);
  return [l.x + px * c - py * s, l.y + px * s + py * c];
}

/** the leaf's outline in its own frame: a parabolic midrib, edges off it by a profile
    that is 0 at both ends and widest at `belly` — laurel is widest below the middle */
function outline(len: number, hw: number, curl: number, belly: number, steps = 14): Pt[] {
  const k = Math.log(0.5) / Math.log(belly);
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const mid = curl * len * u * u;
    const w = hw * Math.pow(Math.sin(Math.PI * Math.pow(u, k)), 0.85);
    top.push([u * len, mid - w]);
    bot.push([u * len, mid + w]);
  }
  return [...top, ...bot.reverse().slice(1, -1)];
}

const SHAPES: Record<BlockLook, LeafShape> = {
  civic: { width: 0.16, out: 44, inn: 46, curl: 0.1, reach: 1.6, belly: 0.42, taper: 0.55 },
  fun: { width: 0.3, out: 50, inn: 50, curl: 0, reach: 1.3, belly: 0.45, taper: 0.5 },
  signal: { width: 0.2, out: 46, inn: 46, curl: 0.06, reach: 1.5, belly: 0.45, taper: 0.5 },
  product: { width: 0.17, out: 44, inn: 46, curl: 0.1, reach: 1.55, belly: 0.42, taper: 0.55 },
  minimal: { width: 0.04, out: 38, inn: 38, curl: 0, reach: 1.0, belly: 0.5, taper: 0.5 },
};
const COUNT: Record<BlockLook, number> = { civic: 8, fun: 6, signal: 7, product: 7, minimal: 7 };

const cache = new Map<string, Branch>();

function build(count: number, shape: LeafShape): Branch {
  // the stem, sampled with running arc length
  const pts: Pt[] = [];
  const acc: number[] = [0];
  for (let i = 0; i <= SAMPLES; i++) pts.push(bezier(i / SAMPLES));
  for (let i = 1; i <= SAMPLES; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const S = acc[SAMPLES];
  const along = (s: number): { p: Pt; a: number } => {
    const target = Math.max(0, Math.min(1, s)) * S;
    let i = 1;
    while (i < SAMPLES && acc[i] < target) i++;
    const f = (target - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    const p0 = pts[i - 1], p1 = pts[i];
    return { p: [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f], a: (Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180) / Math.PI };
  };

  // pairs sit closer as they shrink toward the tip: place them by cumulative size,
  // from a bare bit of stalk at the foot to just short of the tip
  const start = 0.1, end = 0.86;
  const size = (u: number) => 1 - shape.taper * u;
  const raw = [0];
  for (let i = 1; i < count; i++) raw.push(raw[i - 1] + size((i - 0.5) / count));
  const span = raw[count - 1] || 1;
  const gap = ((end - start) * S) / span;

  const leaves: Leaf[] = [];
  raw.forEach((r, i) => {
    const u = count === 1 ? start : start + ((end - start) * r) / span;
    const sz = size(u);
    const len = gap * shape.reach * sz;
    const o = along(u);
    leaves.push({ x: o.p[0], y: o.p[1], a: o.a - shape.out, len, hw: len * shape.width, curl: shape.curl, belly: shape.belly, t: u });
    // the inner leaf a little further up: the pair alternates slightly. None on the lowest
    // pair — down there the stem turns hard and it would cross the next one.
    if (i > 0 || count < 3) {
      const iu = u + (0.32 * gap * sz) / S;
      const n = along(iu);
      const il = len * 0.9;
      leaves.push({ x: n.p[0], y: n.p[1], a: n.a + shape.inn, len: il, hw: il * shape.width, curl: -shape.curl, belly: shape.belly, t: iu });
    }
  });
  // the tip: one leaf straight on, the size of the last pair
  const tip = along(0.985);
  const tl = gap * shape.reach * size(1) * 0.95;
  leaves.push({ x: tip.p[0], y: tip.p[1], a: tip.a, len: tl, hw: tl * Math.max(shape.width, 0.04), curl: 0.04, belly: shape.belly, t: 1 });

  // bounds of everything drawn, so the svg hugs the branch
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = ([x, y]: Pt) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  pts.forEach(take);
  for (const l of leaves) outline(l.len, l.hw, l.curl, l.belly, 8).forEach((p) => take(place(l, p)));
  const pad = 1.5;
  const box = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
  return { stem: pts, leaves: leaves.sort((a, b) => a.t - b.t), box, foot: [(STEM[0][0] - box.x) / box.w, (STEM[0][1] - box.y) / box.h] };
}

function branchFor(look: BlockLook, count: number): Branch {
  const key = `${look}:${count}`;
  let b = cache.get(key);
  if (!b) cache.set(key, (b = build(count, SHAPES[look])));
  return b;
}

const n2 = (n: number) => +n.toFixed(2);
const poly = (pts: Pt[], close = true) => "M" + pts.map(([x, y]) => `${n2(x)} ${n2(y)}`).join("L") + (close ? "Z" : "");

/** the stem as a filled ribbon that tapers from foot to tip */
function ribbon(stem: Pt[], w0: number, w1: number): string {
  const L: Pt[] = [], R: Pt[] = [];
  stem.forEach((p, i) => {
    const q = stem[Math.min(i + 1, stem.length - 1)], o = stem[Math.max(i - 1, 0)];
    const dx = q[0] - o[0], dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1;
    const w = w0 + (w1 - w0) * (i / (stem.length - 1));
    L.push([p[0] - (dy / d) * w, p[1] + (dx / d) * w]);
    R.push([p[0] + (dy / d) * w, p[1] - (dx / d) * w]);
  });
  return poly([...L, ...R.reverse()]);
}

/** a leaf's midrib, from its base most of the way to its tip */
function midrib(l: Leaf): string {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const u = (i / 6) * 0.86;
    pts.push(place(l, [u * l.len, l.curl * l.len * u * u]));
  }
  return poly(pts, false);
}

/* ── LaurelBranch ── one branch as an svg; `side="right"` mirrors it */

export interface LaurelBranchProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  side?: "left" | "right";
  /** Leaf pairs along the stem. Defaults to the look's. */
  leaves?: number;
  look: BlockLook;
}

export function LaurelBranch({ side = "left", leaves, look, className, style, ...rest }: LaurelBranchProps) {
  const count = Math.max(2, Math.min(12, Math.round(leaves ?? COUNT[look])));
  const b = branchFor(look, count);
  const { x, y, w, h } = b.box;
  const flip = side === "right" ? `translate(${n2(2 * x + w)} 0) scale(-1 1)` : undefined;
  const fx = side === "right" ? 1 - b.foot[0] : b.foot[0];
  const last = b.leaves.length - 1 || 1;

  let body: ReactNode;
  if (look === "signal") {
    /* every leaf a string of dots along its midrib, fattest at its belly; the stem dotted */
    const pitch = 3;
    const out: ReactNode[] = [];
    let run = 0;
    for (let i = 1; i < b.stem.length; i++) {
      run += Math.hypot(b.stem[i][0] - b.stem[i - 1][0], b.stem[i][1] - b.stem[i - 1][1]);
      if (run < pitch) continue;
      run = 0;
      const t = i / (b.stem.length - 1);
      out.push(<circle key={`s${i}`} className="rap-laurel-dot" cx={n2(b.stem[i][0])} cy={n2(b.stem[i][1])} r={0.75} style={{ "--t": t } as CSSProperties} />);
    }
    b.leaves.forEach((l, li) => {
      const n = l.len > 9 ? 4 : 3;
      const step = l.len / (n + 0.2);
      for (let k = 1; k <= n; k++) {
        const u = (k * step) / l.len;
        const [cx, cy] = place(l, [u * l.len, l.curl * l.len * u * u]);
        const r = step * 0.4 * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, u * 1.15)));
        out.push(<circle key={`${li}.${k}`} className="rap-laurel-dot" cx={n2(cx)} cy={n2(cy)} r={n2(r)} style={{ "--t": l.t } as CSSProperties} />);
      }
    });
    body = <g fill="currentColor">{out}</g>;
  } else if (look === "minimal") {
    /* a hairline stem, each leaf one straight stroke */
    body = (
      <g fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round">
        <path d={poly(b.stem, false)} vectorEffect="non-scaling-stroke" />
        {b.leaves.map((l, i) => {
          const [tx, ty] = place(l, [l.len, 0]);
          return <path key={i} d={`M${n2(l.x)} ${n2(l.y)}L${n2(tx)} ${n2(ty)}`} vectorEffect="non-scaling-stroke" />;
        })}
      </g>
    );
  } else if (look === "product") {
    /* hairline outlines with their midribs */
    body = (
      <g fill="none" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round">
        <path d={poly(b.stem, false)} vectorEffect="non-scaling-stroke" />
        {b.leaves.map((l, i) => (
          <g key={i}>
            <path d={poly(outline(l.len, l.hw, l.curl, l.belly).map((p) => place(l, p)))} vectorEffect="non-scaling-stroke" />
            <path d={midrib(l)} vectorEffect="non-scaling-stroke" strokeOpacity={0.55} />
          </g>
        ))}
      </g>
    );
  } else {
    /* silhouettes: civic slender, fun chunky with a same-colour stroke that rounds every point.
       Each leaf in its own frame (translate + rotate) so it can pop from its base. */
    const fun = look === "fun";
    body = (
      <g fill="currentColor" stroke={fun ? "currentColor" : undefined} strokeWidth={fun ? 1.6 : undefined} strokeLinejoin="round">
        <path className="rap-laurel-stem" d={fun ? ribbon(b.stem, 1.35, 0.55) : ribbon(b.stem, 1.05, 0.3)} />
        {b.leaves.map((l, i) => {
          const pts = outline(l.len, l.hw, l.curl, l.belly);
          const top = -Math.min(...pts.map((p) => p[1]));
          return (
            <g key={i} transform={`translate(${n2(l.x)} ${n2(l.y)}) rotate(${n2(l.a)})`}>
              <path className="rap-laurel-leaf" d={poly(pts)} style={{ "--i": i, "--n": last, transformOrigin: `0px ${n2(top)}px` } as CSSProperties} />
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)}`}
      data-slot="laurel-branch"
      data-side={side}
      className={cn("rap-laurel-branch block shrink-0 overflow-visible", className)}
      style={{ aspectRatio: `${n2(w)} / ${n2(h)}`, transformOrigin: `${n2(fx * 100)}% ${n2(b.foot[1] * 100)}%`, "--dir": side === "right" ? 1 : -1, ...style } as CSSProperties}
      {...rest}
    >
      <g transform={flip}>{body}</g>
    </svg>
  );
}

/* ── LaurelWreath ── the pair as a small icon, with something in the middle (a rank, a glyph) */

export interface LaurelWreathProps extends HTMLAttributes<HTMLSpanElement> {
  /** Height, px or any CSS length. */
  size?: number | string;
  look?: BlockLook;
  tone?: LaurelTone;
  leaves?: number;
}

export function LaurelWreath({ size = 28, look: lookProp, tone, leaves, className, style, children, ...rest }: LaurelWreathProps) {
  const { ref, look } = useBlockLook<HTMLSpanElement>(lookProp);
  const h = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      ref={ref}
      data-slot="laurel-wreath"
      data-look={look}
      className={cn("rap-laurel inline-flex shrink-0 items-center justify-center", TONE[tone ?? DEFAULT_TONE[look]], className)}
      style={{ height: h, ...style }}
      {...rest}
    >
      <LaurelBranch look={look} side="left" leaves={leaves ?? 5} className="h-full w-auto" />
      {children != null && (
        <span data-slot="laurel-wreath-center" className="-mx-[0.1em] px-[0.05em] text-[length:calc(var(--h)*0.42)] font-semibold leading-none tabular-nums text-ink" style={{ "--h": h } as CSSProperties}>
          {children}
        </span>
      )}
      <LaurelBranch look={look} side="right" leaves={leaves ?? 5} className={cn("h-full w-auto", children == null && "-ml-[8%]")} />
    </span>
  );
}

/* ── Laurel ── */

export interface LaurelProps extends HTMLAttributes<HTMLDivElement> {
  /** The line (or lines) the branches frame. */
  children?: ReactNode;
  /** A small line above, e.g. "Editors' Choice". */
  eyebrow?: ReactNode;
  /** A small line below, e.g. "App Store · 2026". */
  caption?: ReactNode;
  size?: LaurelSize;
  /** Leaf pairs per branch (2–12). Defaults to the look's. */
  leaves?: number;
  /** The branches' colour. Defaults to the look's: flame in fun, phosphor in signal, ink elsewhere. */
  tone?: LaurelTone;
  look?: BlockLook;
}

const TONE: Record<LaurelTone, string> = {
  ink: "text-ink",
  accent: "text-accent",
  flame: "text-flame",
  blue: "text-blue",
  plum: "text-plum",
  acid: "text-acid",
  mute: "text-mute",
};
const DEFAULT_TONE: Record<BlockLook, LaurelTone> = { civic: "ink", fun: "flame", signal: "accent", product: "ink", minimal: "ink" };

const SIZE: Record<LaurelSize, string> = {
  sm: "text-[0.9375rem]",
  md: "text-[1.25rem]",
  lg: "text-[clamp(1.5rem,1rem+2vw,2.25rem)]",
};

const TITLE: Record<BlockLook, string> = {
  civic: "font-display font-normal tracking-[-0.005em]",
  fun: "font-display font-bold tracking-[-0.02em]",
  signal: "font-mono font-medium uppercase tracking-[0.06em] text-[0.82em]",
  product: "font-sans font-semibold tracking-[-0.015em]",
  minimal: "font-sans font-normal tracking-[-0.01em]",
};
const SMALL: Record<BlockLook, string> = {
  civic: "font-sans font-medium uppercase tracking-[0.1em] text-ink-2",
  fun: "font-sans font-bold uppercase tracking-[0.06em] text-flame",
  signal: "font-mono uppercase tracking-[0.1em] text-accent",
  product: "font-sans font-medium text-plum",
  minimal: "font-sans text-ink-2",
};

export function Laurel({ children, eyebrow, caption, size = "md", leaves, tone, look: lookProp, className, style, ...rest }: LaurelProps) {
  const { ref, look } = useBlockLook<HTMLDivElement>(lookProp);
  const text = useRef<HTMLDivElement>(null);

  /* the branches are as tall as the text block, and at least 1.6 lines of the title */
  useLayoutEffect(() => {
    const root = ref.current;
    const block = text.current;
    if (!root || !block || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const title = block.querySelector<HTMLElement>("[data-slot=laurel-title]");
      const lh = title ? parseFloat(getComputedStyle(title).lineHeight) || title.offsetHeight : block.offsetHeight;
      const h = Math.max(block.offsetHeight * 1.12, lh * 1.6);
      root.style.setProperty("--laurel-h", `${Math.round(h)}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(block);
    return () => ro.disconnect();
  }, [ref, look, size]);

  const branch = cn("h-[var(--laurel-h,2.4em)] w-auto", TONE[tone ?? DEFAULT_TONE[look]]);
  return (
    <div
      ref={ref}
      data-slot="laurel"
      data-look={look}
      className={cn("rap-laurel inline-flex max-w-full items-center justify-center text-ink", look === "minimal" ? "gap-[0.5em]" : "gap-[0.3em]", SIZE[size], className)}
      style={style}
      {...rest}
    >
      <LaurelBranch look={look} side="left" leaves={leaves} className={branch} />
      <div ref={text} data-slot="laurel-text" className="flex min-w-0 flex-col items-center text-center">
        {eyebrow && (
          <span data-slot="laurel-eyebrow" className={cn("mb-[0.3em] text-[max(0.6875rem,0.56em)] leading-tight", SMALL[look])}>
            {look === "signal" ? <>[ {eyebrow} ]</> : eyebrow}
          </span>
        )}
        <span data-slot="laurel-title" className={cn("block text-balance leading-[1.2]", TITLE[look])}>
          {children}
        </span>
        {caption && (
          <span data-slot="laurel-caption" className={cn("mt-[0.35em] text-[max(0.6875rem,0.56em)] leading-tight text-mute", look === "signal" ? "font-mono uppercase tracking-[0.08em]" : "font-sans")}>
            {caption}
          </span>
        )}
      </div>
      <LaurelBranch look={look} side="right" leaves={leaves} className={branch} />
    </div>
  );
}
