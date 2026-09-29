/* ── shared bits for the gallery family ───────────────────
   The item shape every gallery takes, how an item is drawn,
   and the one piece of physics they all run on: Bencho's
   spring (hooks/useSpring) as a plain object you step by hand,
   so a gallery can drive dozens of values from ONE rAF loop
   that parks itself when everything has settled — instead of a
   hook (and a loop, and a render) per value. */
import { type ReactNode } from "react";
import { springOf } from "../hooks/useSpring";
import { clamp, cn } from "../utils";

export interface GalleryItem {
  /** Image URL. Leave out and pass `node` to draw anything else (SVG, video, a component). */
  src?: string;
  /** Required: what the picture shows, for screen readers. */
  alt: string;
  title?: ReactNode;
  caption?: ReactNode;
  /** Custom content instead of an <img>; it should fill its box. */
  node?: ReactNode;
  /** Natural width / height. Layouts that respect the picture's shape use it (default 4/5). */
  ratio?: number;
  /** Stable key; falls back to src, then the index. */
  id?: string;
}

/** `(index, element)` — pass the element on, so a Lightbox can fly out of it. */
export type GalleryOpen = (index: number, from?: HTMLElement | null) => void;

export const galleryItemKey = (item: GalleryItem, i: number) => item.id ?? (item.src ? `${item.src}#${i}` : `i${i}`);

/** The picture itself, filling its box (cover by default). */
export function GalleryMedia({ item, fit = "cover", className }: { item: GalleryItem; fit?: "cover" | "contain"; className?: string }) {
  if (item.node)
    return (
      <span data-slot="gallery-media" className={cn("absolute inset-0 block [&>svg]:block [&>svg]:size-full", className)} aria-hidden>
        {item.node}
      </span>
    );
  return (
    <img
      data-slot="gallery-media"
      src={item.src}
      alt=""
      draggable={false}
      className={cn("absolute inset-0 block size-full select-none", fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}

/* ── hand-stepped spring ─────────────────────────────────── */
export type Spring = { x: number; v: number; to: number };
export const spring = (x = 0): Spring => ({ x, v: 0, to: x });

/** One frame of Bencho's spring (dt in 60ths of a second). Returns true while still moving.
    Same snap rule as useSpring, so drive it in px, degrees or 0..100 — never 0..1. */
export function stepSpring(s: Spring, tune: number, dt: number): boolean {
  const { k, d } = springOf(tune);
  s.v += (s.to - s.x) * k * dt;
  s.v *= Math.pow(d, dt);
  s.x += s.v * dt;
  if (Math.abs(s.to - s.x) < 0.02 && Math.abs(s.v) < 0.02) {
    s.x = s.to;
    s.v = 0;
    return false;
  }
  return true;
}

/** Jump a spring to a value with no motion. */
export const setSpring = (s: Spring, x: number) => {
  s.x = s.to = x;
  s.v = 0;
};

/** A rAF loop that runs `tick(dt)` until it returns false, then parks. `kick()` wakes it. */
export function createLoop(tick: (dt: number) => boolean) {
  let raf = 0;
  let prev = 0;
  const frame = (t: number) => {
    const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
    prev = t;
    if (tick(dt)) raf = requestAnimationFrame(frame);
    else {
      raf = 0;
      prev = 0;
    }
  };
  return {
    kick() {
      if (!raf && typeof window !== "undefined") raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      prev = 0;
    },
    get running() {
      return raf !== 0;
    },
  };
}

/** Deterministic pseudo-random in [-1, 1] for index i — the same messy pile on every render. */
export const wobble = (i: number, salt = 1) => {
  const x = Math.sin((i + 1) * 12.9898 * salt + salt * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

/** Rubber band: the further you pull past an end, the less it gives (iOS-style). */
export const rubber = (over: number, size: number, c = 0.55) => {
  const s = Math.sign(over);
  const a = Math.abs(over);
  return s * (1 - 1 / ((a * c) / size + 1)) * size;
};

/** A CSS `linear()` easing sampled from the spring at `tune`, plus the time it takes to settle.
    For the pieces that are plain CSS transitions but should still move like the rest. */
export function springEasing(tune: number): { easing: string; ms: number } {
  const { k, d } = springOf(tune);
  let x = 0;
  let v = 0;
  const pts: number[] = [];
  for (let f = 0; f < 240; f++) {
    v += (100 - x) * k;
    v *= d;
    x += v;
    pts.push(x / 100);
    if (Math.abs(100 - x) < 0.1 && Math.abs(v) < 0.1) break;
  }
  pts[pts.length - 1] = 1;
  return { easing: `linear(0, ${pts.map((p) => +p.toFixed(3)).join(", ")})`, ms: Math.round(pts.length * 16.67) };
}

/** The round prev/next button the galleries share: filled, never outlined. */
export const galleryNavClass = cn(
  "grid place-items-center size-control shrink-0 p-0 border-0 rounded-full bg-fill text-ink cursor-pointer",
  "transition-[background-color,scale] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover active:scale-95",
  "outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40 disabled:cursor-default [&_svg]:size-5",
);
