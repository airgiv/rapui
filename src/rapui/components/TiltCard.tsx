import { useRef, type HTMLAttributes, type PointerEvent } from "react";
import { cva } from "class-variance-authority";
import { cn, prefersReducedMotion } from "../utils";

export interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Max tilt, degrees. */
  max?: number;
  tone?: "paper" | "ink" | "flame" | "acid" | "blue" | "plum" | "bubble" | "sky";
  /** Show the cursor-following glow. */
  spotlight?: boolean;
}

/* --rx/--ry (tilt) and --mx/--my (glow centre) are written by the pointer
   handlers below; the card eases back to flat over --rap-dur on leave but
   follows the hand in 150ms while hovered, so it tracks without lagging. */
const tiltVariants = cva(
  [
    "[--rx:0deg] [--ry:0deg] [--mx:50%] [--my:50%]",
    "relative overflow-hidden p-[clamp(1.5rem,3vw,2.5rem)] rounded-lg bg-(--tc-bg) text-(--tc-fg)",
    "[transform:rotateX(var(--rx))_rotateY(var(--ry))] transform-3d will-change-transform",
    "transition-transform duration-(--rap-dur) ease-rm hover:duration-150",
  ],
  {
    variants: {
      tone: {
        paper: "[--tc-bg:var(--rap-paper-2)] [--tc-fg:var(--rap-ink)]",
        ink: "[--tc-bg:var(--rap-ink)] [--tc-fg:var(--rap-paper)]",
        flame: "[--tc-bg:var(--rap-flame)] [--tc-fg:#fff]",
        plum: "[--tc-bg:var(--rap-plum)] [--tc-fg:#fff]",
        acid: "[--tc-bg:var(--rap-acid)] [--tc-fg:#282828]",
        blue: "[--tc-bg:var(--rap-blue)] [--tc-fg:#fff]",
        bubble: "[--tc-bg:var(--rap-bubble)] [--tc-fg:#282828]",
        sky: "[--tc-bg:var(--rap-sky)] [--tc-fg:#282828]",
      },
      /* the spotlight: a soft white disc at the pointer, soft-light blended so
         it brightens whatever colour the card is instead of greying it */
      spotlight: {
        true: [
          "after:pointer-events-none after:absolute after:inset-0 after:content-['']",
          "after:bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgb(255_255_255/0.45),transparent_45%)] after:mix-blend-soft-light",
          "after:opacity-0 after:transition-opacity after:duration-(--rap-dur) after:ease-soft hover:after:opacity-100",
        ],
        false: "",
      },
    },
    defaultVariants: { tone: "paper", spotlight: true },
  },
);

/** 3D-tilting card with a spotlight glow that follows the pointer. */
export function TiltCard({ max = 10, tone = "paper", spotlight = true, className, children, onPointerMove, onPointerLeave, ...rest }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div data-slot="tilt-card-wrap" className="perspective-[1000px]">
      <div
        ref={ref}
        data-slot="tilt-card"
        data-tone={tone}
        className={cn(tiltVariants({ tone, spotlight }), className)}
        onPointerMove={move}
        onPointerLeave={leave}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
