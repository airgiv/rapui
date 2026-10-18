/* ══ TechMarks ═════════════════════════════════════════════
   Small technical graphics for the signal look — the marks a
   spec sheet or an instrument label carries — to annotate the
   empty cells of a page, sparingly. All thin lines in
   currentColor (1px at any size), flat, no motion except the
   clock's hands.

     <TechClock />          a light disc with thin hands, live
     <CrossGrid />          a grid of ✦ crosses with one ×
     <TickCircle />         a circle with a tick from its centre
     <PlusMark />           ⊕
     <IndexTag>0033</IndexTag>   {0033}, in mono grey
     <SpacedLabel>Diagnose</SpacedLabel>   D I A G N O S E
     <ArrowLine />          ●⊕———→
     <SquareMarks />        ▪▪▪
     <Horizon />            horizontal lines cut by a striped peak
     <OutlineBlob />        an outline blob, like a cell or a drop
     <Asterisk />           ✳, eight thin rays
     <Molecule />           a filled core with three satellites

   The clock reads the time once a second while it is on screen
   (one attribute write per hand), and holds still in still or
   reduced motion. */
import { useEffect, useRef, type HTMLAttributes, type ReactNode, type SVGAttributes } from "react";
import { cn } from "../utils";

type SvgProps = Omit<SVGAttributes<SVGSVGElement>, "children"> & { size?: number | string };

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };

/* ── TechClock ── */
export interface TechClockProps extends SvgProps {
  /** Show this time instead of the live one. */
  time?: Date;
  /** Draw the second hand (in the accent). */
  seconds?: boolean;
}

export function TechClock({ size = 120, time, seconds = true, className, ...rest }: TechClockProps) {
  const ref = useRef<SVGSVGElement>(null);
  const hands = useRef<(SVGLineElement | null)[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (t: Date) => {
      const s = t.getSeconds(), m = t.getMinutes() + s / 60, h = (t.getHours() % 12) + m / 60;
      [h * 30, m * 6, s * 6].forEach((deg, i) => hands.current[i]?.setAttribute("transform", `rotate(${deg} 50 50)`));
    };
    set(time ?? new Date());
    if (time) return;
    const still = () => (el.closest("[data-rap-motion]")?.getAttribute("data-rap-motion") === "still") || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    let on = false;
    const sync = () => {
      const run = on && !document.hidden && !still();
      if (run && !timer) timer = window.setInterval(() => set(new Date()), 1000);
      else if (!run && timer) (window.clearInterval(timer), (timer = 0));
    };
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((e) => ((on = e[e.length - 1].isIntersecting), sync())) : null;
    if (io) io.observe(el);
    else (on = true), sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [time]);
  return (
    <svg ref={ref} data-slot="tech-clock" viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Clock" className={cn("block text-ink", className)} {...rest}>
      <circle cx="50" cy="50" r="49" fill="var(--rap-paper-3, #d8d8d4)" />
      <line ref={(n) => void (hands.current[0] = n)} x1="50" y1="50" x2="50" y2="24" {...line} strokeWidth={1.6} />
      <line ref={(n) => void (hands.current[1] = n)} x1="50" y1="50" x2="50" y2="10" {...line} strokeWidth={1.2} />
      {seconds && <line ref={(n) => void (hands.current[2] = n)} x1="50" y1="58" x2="50" y2="8" {...line} stroke="var(--rap-signal, var(--rap-mute))" />}
      <circle cx="50" cy="50" r="1.6" fill="currentColor" />
    </svg>
  );
}

/* ── CrossGrid ── */
export function CrossGrid({ cols = 4, rows = 3, x = 6, size, className, ...rest }: SvgProps & { cols?: number; rows?: number; /** which cross (0-based) is an × */ x?: number | null }) {
  const p = 24;
  return (
    <svg data-slot="cross-grid" aria-hidden viewBox={`0 0 ${cols * p} ${rows * p}`} width={size ?? cols * p} className={cn("block h-auto", className)} {...rest}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const cx = (i % cols) * p + p / 2, cy = Math.floor(i / cols) * p + p / 2;
        return i === x ? (
          <path key={i} d={`M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}M${cx + 5} ${cy - 5}L${cx - 5} ${cy + 5}`} {...line} />
        ) : (
          <path key={i} d={`M${cx} ${cy - 9}Q${cx} ${cy} ${cx + 9} ${cy}Q${cx} ${cy} ${cx} ${cy + 9}Q${cx} ${cy} ${cx - 9} ${cy}Q${cx} ${cy} ${cx} ${cy - 9}Z`} fill="currentColor" />
        );
      })}
    </svg>
  );
}

/* ── TickCircle ── */
export function TickCircle({ size = 40, className, ...rest }: SvgProps) {
  return (
    <svg data-slot="tick-circle" aria-hidden viewBox="0 0 40 40" width={size} height={size} className={cn("block", className)} {...rest}>
      <circle cx="20" cy="20" r="19" {...line} />
      <path d="M20 8V26" {...line} />
    </svg>
  );
}

/* ── PlusMark ── */
export function PlusMark({ size = 18, className, ...rest }: SvgProps) {
  return (
    <svg data-slot="plus-mark" aria-hidden viewBox="0 0 20 20" width={size} height={size} className={cn("block", className)} {...rest}>
      <circle cx="10" cy="10" r="9" {...line} />
      <path d="M10 5.5V14.5M5.5 10H14.5" {...line} />
    </svg>
  );
}

/* ── IndexTag ── {0033} */
export function IndexTag({ children, className, ...rest }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span data-slot="index-tag" className={cn("font-mono text-[0.75rem] tracking-[0.02em] text-mute tabular-nums", className)} {...rest}>
      {"{"}
      {children}
      {"}"}
    </span>
  );
}

/* ── SpacedLabel ── D I A G N O S E */
export function SpacedLabel({ children, className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span data-slot="spaced-label" className={cn("font-mono text-[0.75rem] font-medium uppercase tracking-[0.6em] text-ink", className)} {...rest}>
      {children}
    </span>
  );
}

/* ── ArrowLine ── ●⊕———→ */
export function ArrowLine({ className, dot = true, ...rest }: SvgProps & { dot?: boolean }) {
  return (
    <svg data-slot="arrow-line" aria-hidden viewBox="0 0 200 20" preserveAspectRatio="xMinYMid meet" className={cn("block h-5 w-full", className)} {...rest}>
      {dot && <circle cx="9" cy="10" r="8" fill="currentColor" />}
      <circle cx={dot ? 29 : 9} cy="10" r="8" {...line} />
      <path d={`M${dot ? 25 : 5} 10H${dot ? 33 : 13}M${dot ? 29 : 9} 6V14`} {...line} />
      <path d={`M${dot ? 37 : 17} 10H198M192 5L198 10L192 15`} {...line} />
    </svg>
  );
}

/* ── SquareMarks ── ▪▪▪ */
export function SquareMarks({ count = 3, className, ...rest }: HTMLAttributes<HTMLSpanElement> & { count?: number }) {
  return (
    <span data-slot="square-marks" aria-hidden className={cn("inline-flex gap-[3px]", className)} {...rest}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="size-[7px] bg-current" />
      ))}
    </span>
  );
}

/* ── Horizon ── horizontal lines, a striped peak cut into them */
export function Horizon({ lines = 10, className, ...rest }: SvgProps & { lines?: number }) {
  const h = lines * 8;
  const peak = "M0 80L18 70L34 60L50 22L66 58L82 66L100 80Z";
  return (
    <svg data-slot="horizon" aria-hidden viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className={cn("block h-auto w-full", className)} {...rest}>
      <defs>
        <clipPath id="rap-horizon-peak">
          <path d={peak} transform={`scale(1 ${h / 80})`} />
        </clipPath>
      </defs>
      {Array.from({ length: lines }, (_, i) => (
        <path key={i} d={`M0 ${i * 8 + 4}H100`} {...line} strokeLinecap="butt" />
      ))}
      <g clipPath="url(#rap-horizon-peak)">
        {Array.from({ length: lines }, (_, i) => (
          <rect key={i} x="0" y={i * 8 + 1.5} width="100" height="5" fill="currentColor" />
        ))}
      </g>
    </svg>
  );
}

/* ── Blob ── an outline drop/cell */
export function OutlineBlob({ size = 120, className, ...rest }: SvgProps) {
  return (
    <svg data-slot="blob" aria-hidden viewBox="0 0 100 140" width={size} className={cn("block h-auto", className)} {...rest}>
      <path
        d="M30 8C44 2 58 12 56 26C55 34 64 38 72 44C86 54 84 74 72 82C62 89 66 100 72 108C80 120 70 136 56 132C46 129 44 118 36 114C26 109 14 116 8 104C2 92 14 84 20 76C26 68 18 60 16 50C14 36 18 13 30 8Z"
        {...line}
      />
      <circle cx="22" cy="124" r="11" {...line} />
    </svg>
  );
}

/* ── Asterisk ── ✳ */
export function Asterisk({ size = 40, className, ...rest }: SvgProps) {
  return (
    <svg data-slot="asterisk" aria-hidden viewBox="0 0 40 40" width={size} height={size} className={cn("block", className)} {...rest}>
      {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((a) => (
        <path key={a} d="M20 2V38" transform={`rotate(${a} 20 20)`} {...line} />
      ))}
    </svg>
  );
}

/* ── Molecule ── a filled core with three satellites */
export function Molecule({ size = 90, className, ...rest }: SvgProps) {
  return (
    <svg data-slot="molecule" aria-hidden viewBox="0 0 100 100" width={size} height={size} className={cn("block", className)} {...rest}>
      <g fill="currentColor">
        <circle cx="52" cy="56" r="24" />
        <circle cx="22" cy="20" r="9" />
        <circle cx="86" cy="74" r="8" />
        <circle cx="34" cy="90" r="6" />
        <path d="M22 20L52 56M86 74L52 56M34 90L52 56" stroke="currentColor" strokeWidth="7" />
      </g>
    </svg>
  );
}

/* ── DotScreen ── a black rounded screen: everything inside reads the dark theme, so
   DotText draws white dots on dim grey ones and mono labels turn pale */
export function DotScreen({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dot-screen"
      data-rap-theme="dark"
      className={cn("relative overflow-hidden rounded-lg bg-[var(--rap-panel,#0c0c0c)] text-ink shadow-[inset_0_0_0_1px_var(--rap-line)]", className)}
      {...rest}
    />
  );
}
