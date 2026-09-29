import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import { Glider, createSpring, isCalm, useActiveElement } from "./ProductTabs";
import "./Carousel.css";

/*
 * Delight, one idea: the slides have weight.
 *  - They LEAN with the strip's velocity: move fast and each slide skews (up to 6°) so
 *    its top trails its base, like a stack of cards carried quickly; stop, and they
 *    swing upright on a spring (tune 60: one soft overshoot). Velocity is read off the
 *    track's position on Embla's `scroll` event, so drags, flings, arrows and dots all
 *    lean alike, and it is written as a CSS variable — nothing re-renders per frame.
 *    Loop-mode wrap jumps are ignored. The skew goes on the slide's child (like the round
 *    corners) and only while moving (data-leaning), so at rest slides are untouched.
 *  - The dots follow the same weight: the active dot is one ink pill that crawls to the
 *    next dot like a caterpillar (useGlide) rather than a dot that swells in place.
 * Selection stays immediate. Calm / reduced motion: no lean, the pill just slides.
 * Sound (opt-in via SoundProvider): a detent for each slide passed while dragging or
 * flinging, a tap on the arrows.
 */
const LEAN_MAX = 6; // degrees
const LEAN_PER_PX_MS = 1.6; // degrees per (px/ms) of strip velocity

export type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];
type CarouselPlugin = Parameters<typeof useEmblaCarousel>[1];

interface CarouselContextValue {
  viewportRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  orientation: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (i: number) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selected: number;
  snaps: number[];
}

const CarouselCtx = createContext<CarouselContextValue | null>(null);

export function useCarousel() {
  const ctx = useContext(CarouselCtx);
  if (!ctx) throw new Error("useCarousel must be used within <Carousel>");
  return ctx;
}

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  /** Embla options (loop, align, dragFree…). `axis` comes from `orientation`. */
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  /** Receive the Embla API, e.g. to drive the carousel from outside. */
  setApi?: (api: CarouselApi) => void;
}

/**
 * Swipeable slides (embla-carousel-react).
 * <Carousel><CarouselContent><CarouselItem/>…</CarouselContent><CarouselPrevious/><CarouselNext/><CarouselDots/></Carousel>
 */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  { orientation = "horizontal", opts, plugins, setApi, className, children, onKeyDownCapture, ...rest },
  ref,
) {
  const [viewportRef, api] = useEmblaCarousel({ ...opts, axis: orientation === "horizontal" ? "x" : "y" }, plugins);
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [state, setState] = useState({ prev: false, next: false, selected: 0, snaps: [] as number[] });

  const sync = useCallback((a: CarouselApi) => {
    if (!a) return;
    setState({ prev: a.canScrollPrev(), next: a.canScrollNext(), selected: a.selectedScrollSnap(), snaps: a.scrollSnapList() });
  }, []);

  useEffect(() => {
    if (!api) return;
    setApi?.(api);
    sync(api);
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api, setApi, sync]);

  // the lean: strip velocity → skew on a spring; plus a detent per slide passed in a drag
  useEffect(() => {
    const r = root.current;
    if (!api || !r) return;
    const vertical = orientation === "vertical";
    const spring = createSpring((v) => {
      if (Math.abs(v) < 0.05) {
        r.removeAttribute("data-leaning");
        r.style.removeProperty("--car-lean");
      } else {
        r.setAttribute("data-leaning", "");
        r.style.setProperty("--car-lean", `${v.toFixed(3)}deg`);
      }
    }, 60);
    let last: { p: number; t: number } | null = null;
    let rest = 0;
    let dragging = false;
    const onScroll = () => {
      if (isCalm(r)) return;
      const box = api.containerNode().getBoundingClientRect();
      const p = vertical ? box.top : box.left;
      const t = performance.now();
      const span = vertical ? api.rootNode().clientHeight : api.rootNode().clientWidth;
      if (last && t > last.t) {
        const dp = p - last.p;
        if (Math.abs(dp) < span / 2) {
          const v = dp / Math.max(8, t - last.t); // px per ms, signed
          spring.to(Math.max(-LEAN_MAX, Math.min(LEAN_MAX, v * LEAN_PER_PX_MS)));
        }
      }
      last = { p, t };
      window.clearTimeout(rest);
      rest = window.setTimeout(() => {
        last = null;
        spring.to(0);
      }, 80);
    };
    const onSettle = () => {
      dragging = false;
      last = null;
      spring.to(0);
    };
    const onDown = () => {
      dragging = true;
    };
    const onSelect = () => {
      if (dragging) soundRef.current.detent(0.7);
    };
    api.on("scroll", onScroll).on("settle", onSettle).on("pointerDown", onDown).on("select", onSelect);
    return () => {
      api.off("scroll", onScroll).off("settle", onSettle).off("pointerDown", onDown).off("select", onSelect);
      window.clearTimeout(rest);
      spring.set(0);
    };
  }, [api, orientation]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((i: number) => api?.scrollTo(i), [api]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(e);
    const back = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const fwd = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    if (e.key === back) {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === fwd) {
      e.preventDefault();
      scrollNext();
    }
  };

  return (
    <CarouselCtx.Provider
      value={{
        viewportRef,
        api,
        orientation,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev: state.prev,
        canScrollNext: state.next,
        selected: state.selected,
        snaps: state.snaps,
      }}
    >
      <div
        ref={root}
        role="region"
        aria-roledescription="carousel"
        onKeyDownCapture={onKey}
        className={cx("rap-carousel", `rap-carousel--${orientation}`, className)}
        {...rest}
      >
        {children}
      </div>
    </CarouselCtx.Provider>
  );
});

export const CarouselContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CarouselContent(
  { className, ...rest },
  ref,
) {
  const { viewportRef } = useCarousel();
  return (
    <div ref={viewportRef} className="rap-carousel__viewport">
      <div ref={ref} className={cx("rap-carousel__track", className)} {...rest} />
    </div>
  );
});

/** One slide. Set its size with `basis` (e.g. "50%", "18rem"); default is full width. */
export const CarouselItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { basis?: string }>(function CarouselItem(
  { className, basis, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cx("rap-carousel__item", className)}
      style={basis ? { flexBasis: basis, ...style } : style}
      {...rest}
    />
  );
});

type NavProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const CarouselPrevious = forwardRef<HTMLButtonElement, NavProps>(function CarouselPrevious({ className, children, ...rest }, ref) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  const sound = useSound();
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Previous slide"
      disabled={!canScrollPrev}
      onClick={() => {
        sound.play("tap");
        scrollPrev();
      }}
      className={cx("rap-carousel__nav", "rap-carousel__nav--prev", className)}
      {...rest}
    >
      {children ?? (orientation === "horizontal" ? <ArrowLeft /> : <ArrowUp />)}
    </button>
  );
});

export const CarouselNext = forwardRef<HTMLButtonElement, NavProps>(function CarouselNext({ className, children, ...rest }, ref) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  const sound = useSound();
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Next slide"
      disabled={!canScrollNext}
      onClick={() => {
        sound.play("tap");
        scrollNext();
      }}
      className={cx("rap-carousel__nav", "rap-carousel__nav--next", className)}
      {...rest}
    >
      {children ?? (orientation === "horizontal" ? <ArrowRight /> : <ArrowDown />)}
    </button>
  );
});

/** Dot per snap point; the current one stretches into a pill that crawls between dots. */
export const CarouselDots = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CarouselDots({ className, ...rest }, ref) {
  const { snaps, selected, scrollTo, orientation } = useCarousel();
  const box = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => box.current as HTMLDivElement);
  const active = useActiveElement(box, ".rap-carousel__dot[data-active]", ["data-active"]);
  return (
    <div
      ref={box}
      role="tablist"
      aria-label="Slides"
      className={cx("rap-carousel__dots", `rap-carousel__dots--${orientation}`, className)}
      data-glide={active ? "" : undefined}
      {...rest}
    >
      <Glider container={box} target={active} axis={orientation === "vertical" ? "y" : "x"} className="rap-carousel__glider" />
      {snaps.map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === selected}
          aria-label={`Go to slide ${i + 1}`}
          data-active={i === selected || undefined}
          className="rap-carousel__dot"
          onClick={() => scrollTo(i)}
        />
      ))}
    </div>
  );
});
