import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { cx } from "../utils";
import "./Carousel.css";

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
        ref={ref}
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
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Previous slide"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      className={cx("rap-carousel__nav", "rap-carousel__nav--prev", className)}
      {...rest}
    >
      {children ?? (orientation === "horizontal" ? <ArrowLeft /> : <ArrowUp />)}
    </button>
  );
});

export const CarouselNext = forwardRef<HTMLButtonElement, NavProps>(function CarouselNext({ className, children, ...rest }, ref) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Next slide"
      disabled={!canScrollNext}
      onClick={scrollNext}
      className={cx("rap-carousel__nav", "rap-carousel__nav--next", className)}
      {...rest}
    >
      {children ?? (orientation === "horizontal" ? <ArrowRight /> : <ArrowDown />)}
    </button>
  );
});

/** Dot per snap point; the current one stretches into a pill. */
export const CarouselDots = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CarouselDots({ className, ...rest }, ref) {
  const { snaps, selected, scrollTo, orientation } = useCarousel();
  return (
    <div ref={ref} role="tablist" aria-label="Slides" className={cx("rap-carousel__dots", `rap-carousel__dots--${orientation}`, className)} {...rest}>
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
