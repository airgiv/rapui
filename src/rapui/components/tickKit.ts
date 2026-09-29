/* ══ tickKit ══════════════════════════════════════════════
   The small shared engine behind the second family of tick
   scrubbers (DateScrubber, TempoDial, HueRing, LensRuler,
   SplitSlider). Not part of the public barrel.

   ── ONE SPRING FOR THE THROW AND THE SNAP ───────────────
   The TimeScrubber's motion, lifted out as it was written there:
   on release the landing is decided at once (where the thing
   would coast to at the speed it was let go, rounded to a step)
   and one spring carries it there, starting with part of the
   hand's own speed. A flick coasts, a slow release just settles,
   and there is no seam between "gliding" and "snapping" because
   they are the same motion.

     v += ((to − x)·0.022 − v·0.26)·dt

   0.022 / 0.26 is near-critical: it glides in and lands with a
   hint of give, no swing back and no slow creep at the end. The
   loop parks itself once the value is within 0.01 of its target
   with less than 0.01 of speed — so drive it in UNITS OF THE
   VALUE that are about one step each (days, bpm, degrees), never
   in fractions of a range. */
import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "../utils";

const PULL = 0.022;
const DRAG = 0.26;

export function useCarry(initial: number, hear: (x: number) => void) {
  const [pos, setPos] = useState(initial);
  const s = useRef({ x: initial, v: 0, to: initial, raf: 0 });
  const heard = useRef(hear);
  heard.current = hear;

  const set = useCallback((x: number) => {
    s.current.x = x;
    heard.current(x);
    setPos(x);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(s.current.raf);
    s.current.raf = 0;
  }, []);

  const run = useCallback(() => {
    const c = s.current;
    if (c.raf) return;
    let prev = 0;
    const tick = (t: number) => {
      /* frames, not ms: a dropped frame decays the same energy as
         the two it replaced */
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      c.v += ((c.to - c.x) * PULL - c.v * DRAG) * dt;
      const x = c.x + c.v * dt;
      if (Math.abs(c.to - x) < 0.01 && Math.abs(c.v) < 0.01) {
        c.v = 0;
        c.raf = 0;
        set(c.to);
        return;
      }
      set(x);
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
  }, [set]);

  /** Travel to `to` on the spring, starting at speed `v`; `instant` (calm) jumps. */
  const goTo = useCallback(
    (to: number, v = 0, instant = false) => {
      const c = s.current;
      c.to = to;
      c.v = v;
      if (instant) {
        stop();
        c.v = 0;
        set(to);
        return;
      }
      run();
    },
    [run, set, stop],
  );

  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);

  return { pos, state: s, set, goTo, stop };
}

/* ── the hand's speed, smoothed ───────────────────────────
   Half the old reading and half the new, per event, in units per
   frame. A hand that stopped for more than 80ms before letting go
   threw nothing — the speed it had then is history, not intent. */
export function useThrow() {
  const g = useRef({ t: 0, v: 0 });
  return {
    reset() {
      g.current = { t: performance.now(), v: 0 };
    },
    feed(delta: number) {
      const now = performance.now();
      const dt = Math.max(1, now - g.current.t) / 16.67;
      g.current.v = g.current.v * 0.5 + (delta / dt) * 0.5;
      g.current.t = now;
    },
    release(cap: number) {
      return performance.now() - g.current.t > 80 ? 0 : clamp(g.current.v, -cap, cap);
    },
  };
}

/** Rubber past an end: a third of the overshoot, so the wall is felt, not hit. */
export const rubber = (x: number, lo: number, hi: number) =>
  x < lo ? lo - (lo - x) * 0.33 : x > hi ? hi + (x - hi) * 0.33 : x;

/** Shortest signed angle from a to b, degrees. */
export const turn = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;
