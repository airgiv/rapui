/* ── the glider ────────────────────────────────────────────
   One highlight that travels between items instead of each item
   lighting up on its own: tabs, segmented controls, pagination,
   sidebar rows, menu rows.

   It moves like a caterpillar. The edge in the direction of
   travel runs on a quick spring and the trailing edge on a slower
   one, so on the way the pill stretches toward its new home and
   then pulls its tail in. Same spring maths as everything else
   (useSpring); both edges settle on their own and nothing runs at
   rest.

   Usage:
     const g = useGlide(containerRef, activeElement);
     <span className="…" style={g.style} data-ready={g.ready} />  // position: absolute
   Measures with offsetLeft/Top, so it works under transforms. */
import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { useSpring } from "./useSpring";

export interface GlideBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useGlide(
  container: RefObject<HTMLElement | null>,
  target: HTMLElement | null | undefined,
  options: { axis?: "x" | "y"; lead?: number; trail?: number; /** ms the tail waits before following */ delay?: number } = {},
) {
  const { axis = "x", lead = 55, trail = 10, delay = 70 } = options;
  const [box, setBox] = useState<GlideBox | null>(null);
  const [first, setFirst] = useState(true);

  useLayoutEffect(() => {
    const c = container.current;
    if (!c || !target) {
      setBox(null);
      return;
    }
    const measure = () => {
      // offset relative to the container, even through nested offset parents
      let x = 0;
      let y = 0;
      let el: HTMLElement | null = target;
      while (el && el !== c) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
        if (el && !c.contains(el) && el !== c) break;
      }
      setBox({ x, y, w: target.offsetWidth, h: target.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    ro.observe(target);
    return () => ro.disconnect();
  }, [container, target]);

  // two edges per axis; the one moving forward gets the quick spring
  const start = box ? (axis === "x" ? box.x : box.y) : 0;
  const end = box ? (axis === "x" ? box.x + box.w : box.y + box.h) : 0;
  const [dir, setDir] = useState(1);
  const [lastStart, setLastStart] = useState(start);
  if (start !== lastStart) {
    setDir(start > lastStart ? 1 : -1);
    setLastStart(start);
  }
  // the tail holds its old position for `delay` ms, then follows on the heavy spring
  const tailTarget = useDelayed(dir > 0 ? start : end, first ? 0 : delay);
  const s = useSpring(dir > 0 ? tailTarget : start, dir > 0 ? trail : lead, first);
  const e = useSpring(dir > 0 ? end : tailTarget, dir > 0 ? lead : trail, first);
  const cross = useSpring(box ? (axis === "x" ? box.y : box.x) : 0, 50, first);
  const crossSize = box ? (axis === "x" ? box.h : box.w) : 0;

  useLayoutEffect(() => {
    if (box && first) {
      const id = requestAnimationFrame(() => setFirst(false));
      return () => cancelAnimationFrame(id);
    }
  }, [box, first]);

  const style: CSSProperties = box
    ? axis === "x"
      ? { transform: `translate(${s}px, ${cross}px)`, width: Math.max(0, e - s), height: crossSize }
      : { transform: `translate(${cross}px, ${s}px)`, height: Math.max(0, e - s), width: crossSize }
    : { opacity: 0 };

  return { style, ready: !!box, box };
}

/** The value, `ms` late. 0 = immediate. */
function useDelayed<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    if (!ms) {
      setV(value);
      return;
    }
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return ms ? v : value;
}
