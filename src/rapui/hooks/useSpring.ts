/* ── one spring, for everything that settles ────────────────
   The maths is Bencho's (bencho.dev, MIT) — the same spring the
   Checklist runs on — lifted into a shared hook so every playful
   component moves with one physics.

   Frames, not milliseconds: `dt` is in sixtieths of a second and
   the decay is RAISED to it rather than multiplied, so a dropped
   frame loses the same energy as the two frames it replaced.
   The loop parks itself once settled; nothing runs at rest.

   `tune` 0..100 picks a damping ratio: 0 heavy and dead, 50 a
   single friendly overshoot, 100 lively with two rebounds.
   Units matter — the snap threshold is absolute, so drive it in
   pixels or 0..100, never 0..1. */
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../utils";

export const springOf = (tune: number) => ({
  k: 0.08 + (tune / 100) * 0.16,
  d: 0.62 + (tune / 100) * 0.2,
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function useSpring(target: number, tune = 50, instant = false) {
  const [at, setAt] = useState(target);
  const cur = useRef(target);
  const vel = useRef(0);

  useEffect(() => {
    if (instant || prefersReducedMotion()) {
      cur.current = target;
      vel.current = 0;
      setAt(target);
      return;
    }
    const { k, d } = springOf(tune);
    let prev = 0;
    let raf = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      vel.current += (target - cur.current) * k * dt;
      vel.current *= Math.pow(d, dt);
      cur.current += vel.current * dt;
      if (Math.abs(target - cur.current) < 0.02 && Math.abs(vel.current) < 0.02) {
        cur.current = target;
        vel.current = 0;
        setAt(target);
        return;
      }
      setAt(cur.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, tune, instant]);

  return at;
}

/** Current velocity-ish signal: how far the spring is from its target (for squash & tilt). */
export function useSpringLag(target: number, tune = 50) {
  const at = useSpring(target, tune);
  return { at, lag: target - at };
}
