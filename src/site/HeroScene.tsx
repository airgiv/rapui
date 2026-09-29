import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "../rapui/utils";
import { isCalm } from "../rapui/hooks/useGlide";
import { useSound } from "../rapui";

/* ── the hero as a table of loose objects ───────────────────
   Every word and every little component in the first screen is a
   Floaty: tilted a few degrees, drifting with the pointer at its own
   depth (parallax), and draggable — let go and it springs back to its
   place on a back-out curve, a touch past and home.

   Parallax is CSS, not React: the scene writes the pointer as two
   custom properties, --mx and --my in −1..1, and each Floaty reads
   them through calc() with its own depth. One style write per pointer
   move for the whole scene, no re-render, and the transitions do the
   easing. Drag IS React state, because only the dragged thing moves.

   A drag never starts on something interactive inside (a button, a
   switch, a slider): the pieces in the hero are real components and
   they should work when you press them. Calm and reduced motion keep
   the tilt (it is composition, not motion) and drop the drift. */

export function HeroScene({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || isCalm(el)) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const leave = () => {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  };
  return (
    <div ref={ref} className={cn("[--mx:0] [--my:0]", className)} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}

const INTERACTIVE = "button, a, input, textarea, select, [role=slider], [role=switch], [role=checkbox], [contenteditable]";

export function Floaty({
  depth = 16,
  rotate = 0,
  className,
  style,
  children,
  as: Tag = "div",
}: {
  /** how far it drifts with the pointer, px at the edge of the scene */
  depth?: number;
  /** its resting tilt, degrees */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  as?: "div" | "span";
}) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const sound = useSound();

  const down = (e: ReactPointerEvent<HTMLElement>) => {
    if ((e.target as Element).closest(INTERACTIVE)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0 });
    sound.play("tap", { strength: 0.5 });
  };
  const moveDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const up = () => {
    if (!start.current) return;
    start.current = null;
    setDrag(null);
    sound.play("release", { strength: 0.5 });
  };

  const dx = drag?.x ?? 0;
  const dy = drag?.y ?? 0;
  return (
    <Tag
      data-slot="hero-floaty"
      onPointerDown={down}
      onPointerMove={moveDrag}
      onPointerUp={up}
      onPointerCancel={up}
      className={cn(
        "relative inline-block select-none touch-none",
        drag ? "cursor-grabbing z-20" : "cursor-grab",
        className,
      )}
      style={{
        // held: follows the finger 1:1 and leans with the pull; free: parallax, eased
        translate: `calc(var(--mx) * ${depth}px + ${dx}px) calc(var(--my) * ${depth * 0.6}px + ${dy}px)`,
        rotate: `${(rotate + dx * 0.04).toFixed(2)}deg`,
        scale: drag ? "1.04" : "1",
        transition: drag ? "scale 160ms var(--rap-ease-out)" : "translate 700ms var(--rap-ease-back), rotate 700ms var(--rap-ease-back), scale 300ms var(--rap-ease-out)",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
