/* ══ Pattern ══════════════════════════════════════════════
   Background patterns as a layer: drop <Pattern /> inside any
   positioned box (relative, a card, a section) and it fills it,
   under the content, never catching the pointer.

   HOW IT IS DRAWN. Every pattern is a MASK over a block of
   currentColor, not a coloured image — so the colour is a text-*
   class (text-ink/15, text-flame/40…), it follows the theme, and
   dots, lines, crosses and waves are all tinted the same way. The
   fade is a second mask layer, intersected with the first.

   DELIGHT — A SPOTLIGHT AND A DRIFT.
   `spotlight`: a second copy of the pattern, at full strength,
   shows only in a soft circle around the pointer — move over the
   box and the grid lights up under your hand, like a torch on
   graph paper. The layer listens on its parent, so the box keeps
   its own clicks. `drift`: the pattern slides slowly on a diagonal,
   one cell per few seconds, forever — a stage that feels alive.
   Calm / reduced motion: no drift (the spotlight stays; it only
   moves when you do).

   `patternStyle()` gives the same mask as a style object, for when
   you would rather paint a pattern straight onto an element. */
import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "../utils";
import "./Pattern.css";

export type PatternVariant = "dots" | "grid" | "lines" | "cross" | "checker" | "stripes" | "waves";
export type PatternFade = "none" | "radial" | "edges" | "top" | "bottom";

export interface PatternOptions {
  variant?: PatternVariant;
  /** One cell of the pattern, px. */
  size?: number;
  /** Dot radius / line thickness, px. Defaults suit each variant. */
  weight?: number;
  /** Fade the pattern out: toward the edges from the middle, at all four edges, or toward one side. */
  fade?: PatternFade;
}

export interface PatternProps extends PatternOptions, HTMLAttributes<HTMLDivElement> {
  /** Light the pattern up in a circle around the pointer (listens on the parent). */
  spotlight?: boolean;
  /** Slide the pattern slowly on a diagonal. Off in calm / reduced motion. */
  drift?: boolean;
  /** Colour of the lit pattern under the spotlight (any CSS colour). Default: ink. */
  spotColor?: string;
}

const WEIGHT: Record<PatternVariant, number> = { dots: 1.4, grid: 1, lines: 1, cross: 1.5, checker: 0, stripes: 0, waves: 1.5 };

const svg = (body: string, s: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'>${body}</svg>`)}")`;

/** The mask image for one cell of a pattern (black = paint). One layer each. */
function cellMask(variant: PatternVariant, s: number, w: number): string {
  switch (variant) {
    case "dots":
      return `radial-gradient(circle at center, #000 ${w}px, transparent ${w + 0.6}px)`;
    case "grid":
      return svg(`<path d='M0 ${w / 2}H${s}M${w / 2} 0V${s}' stroke='black' stroke-width='${w}'/>`, s);
    case "lines":
      return `linear-gradient(#000 ${w}px, transparent ${w}px)`;
    case "checker":
      return "conic-gradient(#000 25%, transparent 0 50%, #000 0 75%, transparent 0)";
    case "stripes": {
      // one diagonal per cell plus the two corner pieces, so the stripes tile seamlessly
      const t = s * 0.3;
      return svg(`<path d='M0 ${s}L${s} 0M${-s / 2} ${s / 2}L${s / 2} ${-s / 2}M${s / 2} ${s * 1.5}L${s * 1.5} ${s / 2}' stroke='black' stroke-width='${t}'/>`, s);
    }
    case "cross": {
      const c = s / 2;
      const a = Math.max(3, s * 0.16);
      return svg(`<path d='M${c - a} ${c}H${c + a}M${c} ${c - a}V${c + a}' stroke='black' stroke-width='${w}' stroke-linecap='round'/>`, s);
    }
    case "waves": {
      const h = s / 2;
      const amp = s * 0.14;
      return svg(`<path d='M0 ${h} Q${s / 4} ${h - amp} ${s / 2} ${h} T${s} ${h}' fill='none' stroke='black' stroke-width='${w}'/>`, s);
    }
  }
}

const FADE: Record<Exclude<PatternFade, "none">, string> = {
  radial: "radial-gradient(ellipse at center, #000 15%, transparent 70%)",
  edges: "radial-gradient(closest-side, #000 72%, transparent)",
  top: "linear-gradient(to bottom, transparent, #000 70%)",
  bottom: "linear-gradient(to top, transparent, #000 70%)",
};

/** A style object that paints `variant` in currentColor over the element's box. */
export function patternStyle({ variant = "dots", size = 22, weight, fade = "none" }: PatternOptions = {}): CSSProperties {
  const cell = cellMask(variant, size, weight ?? WEIGHT[variant]);
  const f = fade !== "none";
  const image = f ? `${cell}, ${FADE[fade]}` : cell;
  const msize = f ? `${size}px ${size}px, 100% 100%` : `${size}px ${size}px`;
  const pos = variant === "dots" || variant === "cross" ? "center" : "0 0";
  const mpos = f ? `${pos}, center` : pos;
  const rep = f ? "repeat, no-repeat" : "repeat";
  return {
    backgroundColor: "currentColor",
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: msize,
    WebkitMaskSize: msize,
    maskPosition: mpos,
    WebkitMaskPosition: mpos,
    maskRepeat: rep,
    WebkitMaskRepeat: rep,
    // the cell layer is kept only where the fade layer is
    maskComposite: f ? "intersect" : undefined,
    WebkitMaskComposite: f ? "source-in" : undefined,
    ["--rap-pattern-size" as string]: `${size}px`,
  };
}

export function Pattern({
  variant = "dots",
  size = 22,
  weight,
  fade = "none",
  spotlight = false,
  drift = false,
  spotColor,
  className,
  style,
  ...rest
}: PatternProps) {
  const ref = useRef<HTMLDivElement>(null);

  // the spotlight follows the pointer over the PARENT (the layer itself ignores the pointer)
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!spotlight || !el || !host) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--rap-px", `${e.clientX - r.left}px`);
      el.style.setProperty("--rap-py", `${e.clientY - r.top}px`);
      el.style.setProperty("--rap-pon", "1");
    };
    const leave = () => el.style.setProperty("--rap-pon", "0");
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [spotlight]);

  const base = patternStyle({ variant, size, weight, fade });
  const lit = patternStyle({ variant, size, weight });
  return (
    <div
      ref={ref}
      data-slot="pattern"
      data-variant={variant}
      aria-hidden
      className={cn("rap-pattern pointer-events-none absolute inset-0 overflow-hidden text-ink/15", className)}
      style={spotColor ? { ["--rap-pattern-spot" as string]: spotColor, ...style } : style}
      {...rest}
    >
      <div className={cn("absolute inset-0", drift && "rap-pattern-drift")} style={base} />
      {spotlight && (
        /* the torch: the same pattern, full strength, inside a soft circle at the pointer */
        <div className="rap-pattern-spot absolute inset-0">
          <div className={cn("absolute inset-0", drift && "rap-pattern-drift")} style={lit} />
        </div>
      )}
    </div>
  );
}
