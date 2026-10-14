import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import { ArrowUpRight } from "../icons";
import { cn } from "../utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./HoverCard";
import "./Sources.css";

/* ── Sources ───────────────────────────────────────────────
   Answers that show their work. <Citation index={1} /> is the little
   numbered chip inside the answer text; <Sources /> is the row of
   source cards underneath. Wrap both in <SourcesProvider sources={…}>
   and they find each other: point at [2] in the text and card 2 lights
   up, point at card 2 and every [2] in the text lights up.

     <SourcesProvider sources={sources}>
       <p>Tailwind v4 reads config from CSS<Citation index={1} />.</p>
       <Sources />
     </SourcesProvider>

   Citation: a link, so a click opens the source in a new tab; hover or
   focus opens a HoverCard (the library's, with its swing and pointer
   tilt) with the favicon, site, title, a two-line snippet and the URL.
   No images are fetched: the favicon is a letter avatar tinted from
   the domain, unless you pass your own `icon` node.

   Delight: the chip LIFTS a couple of pixels as you reach for it, like
   a key under your finger, and the card swings out of it with its
   arrow popping out of the card's edge a beat later — so the card
   visibly points back at the [1] it belongs to. Cards in the row lift
   and take an accent ring while their citation is pointed at, and
   "+N more" deals the rest in one after another.
   Calm: no lift, no pop — chip and card change colour, the hover card
   fades in, and expanded cards fade in place. */

/* ── data ────────────────────────────────────────────────── */

export interface CitationSource {
  /** Full URL — opened in a new tab. */
  url: string;
  title: string;
  /** Site name, e.g. "MDN Web Docs". Defaults to the domain. */
  site?: string;
  /** A sentence or two from the page; clamped to two lines. */
  snippet?: string;
  /** Your own favicon node (an <img>, an icon). Defaults to a letter avatar. */
  icon?: ReactNode;
}

/** "https://www.developer.mozilla.org/x" → "developer.mozilla.org" */
export function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^[a-z]+:\/\//i, "").replace(/^www\./, "").split(/[/?#]/)[0];
  }
}

/* ── shared state: which source is pointed at ────────────── */

interface SourcesCtx {
  sources: CitationSource[];
  /** 1-based index of the source being pointed at, or null. */
  active: number | null;
  setActive: (i: number | null) => void;
}

const Ctx = createContext<SourcesCtx | null>(null);

/** The shared state, or null outside a SourcesProvider. */
export function useSources() {
  return useContext(Ctx);
}

export interface SourcesProviderProps {
  /** The answer's sources, in citation order: <Citation index={1}> is sources[0]. */
  sources?: CitationSource[];
  /** Controlled active index (1-based). */
  active?: number | null;
  onActiveChange?: (i: number | null) => void;
  children?: ReactNode;
}

export function SourcesProvider({ sources = [], active: activeProp, onActiveChange, children }: SourcesProviderProps) {
  const [own, setOwn] = useState<number | null>(null);
  const active = activeProp !== undefined ? activeProp : own;
  const value = useMemo<SourcesCtx>(
    () => ({
      sources,
      active,
      setActive: (i) => {
        setOwn(i);
        onActiveChange?.(i);
      },
    }),
    [sources, active, onActiveChange],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* pointer + keyboard handlers that mark source `i` as active while held */
function useActivate(i: number) {
  const ctx = useSources();
  const on = () => ctx?.setActive(i);
  const off = () => {
    if (ctx && ctx.active === i) ctx.setActive(null);
  };
  return { isActive: ctx?.active === i, handlers: { onPointerEnter: on, onPointerLeave: off, onFocus: on, onBlur: off } };
}

function chain<E>(a: ((e: E) => void) | undefined, b: () => void) {
  return (e: E) => {
    a?.(e);
    b();
  };
}

/* ── favicon: your icon, or a tinted letter ──────────────── */

const TINTS = [
  "bg-flame/20",
  "bg-blue/20",
  "bg-plum/20",
  "bg-acid/30",
  "bg-bubble/25",
  "bg-sky/30",
];

export interface SourceIconProps extends HTMLAttributes<HTMLSpanElement> {
  source: CitationSource;
  /** Edge length, px. */
  size?: number;
}

export function SourceIcon({ source, size = 20, className, style, ...rest }: SourceIconProps) {
  const domain = sourceDomain(source.url);
  const letter = (source.site ?? domain).replace(/[^a-z0-9]/gi, "").charAt(0).toUpperCase() || "?";
  let h = 0;
  for (const ch of domain) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      data-slot="source-icon"
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-xs font-sans font-bold leading-none text-ink",
        "[&>img]:size-full [&>img]:object-cover [&>svg]:size-[70%]",
        !source.icon && TINTS[h % TINTS.length],
        source.icon && "bg-fill",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.52, ...style }}
      {...rest}
    >
      {source.icon ?? letter}
    </span>
  );
}

/* ── Citation: the [1] chip in the answer ────────────────── */

export interface CitationProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** 1-based; looks the source up in SourcesProvider unless `source` is given. */
  index: number;
  source?: CitationSource;
  /** Hover card side. */
  side?: "top" | "bottom";
}

export const Citation = forwardRef<HTMLAnchorElement, CitationProps>(function Citation(
  { index, source: sourceProp, side = "top", className, onPointerEnter, onPointerLeave, onFocus, onBlur, ...rest },
  ref,
) {
  const ctx = useSources();
  const source = sourceProp ?? ctx?.sources[index - 1];
  const { isActive, handlers } = useActivate(index);

  const chip = cn(
    "relative -top-[0.32em] mx-[0.12em] inline-flex h-[1.5em] min-w-[1.5em] items-center justify-center px-[0.4em] align-baseline",
    "rounded-pill bg-fill font-sans text-[0.68em] font-semibold leading-none tabular-nums text-ink-2 no-underline",
    "transition-[background-color,color,transform,box-shadow] duration-150 ease-soft",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    // lit: pointed at here, or its card is pointed at, or its hover card is open
    "hover:bg-accent hover:text-accent-ink data-[active]:bg-accent data-[active]:text-accent-ink data-[state=open]:bg-accent data-[state=open]:text-accent-ink",
    // fun: lifts like a key under the finger
    "fun:duration-200 fun:ease-spring fun:hover:-translate-y-[2px] fun:data-[active]:-translate-y-[2px] fun:data-[state=open]:-translate-y-[2px]",
    "fun:hover:shadow-[0_3px_0_-1px_var(--rap-line)] fun:data-[state=open]:shadow-[0_3px_0_-1px_var(--rap-line)]",
    className,
  );

  if (!source) {
    return (
      <span data-slot="citation" className={chip}>
        {index}
      </span>
    );
  }

  const domain = sourceDomain(source.url);
  return (
    <HoverCard openDelay={150} closeDelay={120}>
      <HoverCardTrigger asChild>
        <a
          ref={ref}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          data-slot="citation"
          data-active={isActive || undefined}
          aria-label={`Source ${index}: ${source.title}, ${source.site ?? domain} (opens in a new tab)`}
          className={chip}
          onPointerEnter={chain(onPointerEnter, handlers.onPointerEnter)}
          onPointerLeave={chain(onPointerLeave, handlers.onPointerLeave)}
          onFocus={chain(onFocus, handlers.onFocus)}
          onBlur={chain(onBlur, handlers.onBlur)}
          {...rest}
        >
          {index}
        </a>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        data-slot="citation-card"
        className="group/cite overflow-visible! w-[min(320px,calc(100vw-24px))] p-4"
        onPointerEnter={handlers.onPointerEnter}
        onPointerLeave={handlers.onPointerLeave}
      >
        <div className="flex items-center gap-2.5">
          <SourceIcon source={source} size={24} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[0.8125rem] font-semibold text-ink">{source.site ?? domain}</div>
            <div className="truncate text-[0.75rem] text-mute">{domain}</div>
          </div>
          <span className="shrink-0 rounded-pill bg-fill px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-ink-2">{index}</span>
        </div>
        <div data-slot="citation-title" className="mt-3 line-clamp-2 font-semibold leading-snug text-ink">
          {source.title}
        </div>
        {source.snippet && (
          <p data-slot="citation-snippet" className="mt-1 line-clamp-2 text-[0.875rem] leading-snug text-ink-2">
            {source.snippet}
          </p>
        )}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          data-slot="citation-url"
          className="mt-3 flex items-center gap-1 rounded-xs font-mono text-[0.75rem] text-mute outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="truncate">{source.url.replace(/^https?:\/\//, "")}</span>
          <ArrowUpRight size={12} className="shrink-0" aria-hidden />
        </a>
        <HoverCardPrimitive.Arrow
          data-slot="citation-arrow"
          width={14}
          height={7}
          className={cn(
            "fill-surface [filter:drop-shadow(0_1px_0_var(--rap-line))] origin-[50%_0]",
            // pops out of the card's edge once the card has nearly arrived
            "fun:animate-[rap-cite-arrow-pop_420ms_var(--rap-ease-out)_140ms_both]",
          )}
        />
      </HoverCardContent>
    </HoverCard>
  );
});

/* ── SourceCard: one compact card ────────────────────────── */

export interface SourceCardProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  source: CitationSource;
  /** 1-based number shown on the card and shared with its Citation. */
  index: number;
}

const cardBase = cn(
  "group/source relative flex min-h-[92px] flex-col gap-2 rounded-card bg-paper-2 p-3 text-left no-underline",
  "shadow-[inset_0_0_0_1px_var(--rap-edge)] outline-none",
  "transition-[background-color,box-shadow,transform] duration-150 ease-soft",
  "hover:bg-fill focus-visible:ring-2 focus-visible:ring-ring",
);
const cardLit = cn(
  "data-[active]:bg-fill data-[active]:shadow-[inset_0_0_0_1.5px_var(--rap-accent)]",
  "fun:duration-200 fun:ease-spring fun:hover:-translate-y-[3px] fun:data-[active]:-translate-y-[3px]",
);

export const SourceCard = forwardRef<HTMLAnchorElement, SourceCardProps>(function SourceCard(
  { source, index, className, onPointerEnter, onPointerLeave, onFocus, onBlur, ...rest },
  ref,
) {
  const { isActive, handlers } = useActivate(index);
  const domain = sourceDomain(source.url);
  return (
    <a
      ref={ref}
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      data-slot="source-card"
      data-active={isActive || undefined}
      aria-label={`Source ${index}: ${source.title}, ${source.site ?? domain} (opens in a new tab)`}
      className={cn(cardBase, cardLit, className)}
      onPointerEnter={chain(onPointerEnter, handlers.onPointerEnter)}
      onPointerLeave={chain(onPointerLeave, handlers.onPointerLeave)}
      onFocus={chain(onFocus, handlers.onFocus)}
      onBlur={chain(onBlur, handlers.onBlur)}
      {...rest}
    >
      <span className="flex items-center gap-2">
        <SourceIcon source={source} size={18} />
        <span className="min-w-0 flex-1 truncate text-[0.75rem] text-mute">{domain}</span>
        <span
          data-slot="source-card-index"
          className={cn(
            "grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-fill px-1 text-[0.6875rem] font-semibold tabular-nums text-ink-2",
            "transition-colors duration-150 group-data-[active]/source:bg-accent group-data-[active]/source:text-accent-ink",
          )}
        >
          {index}
        </span>
      </span>
      <span data-slot="source-card-title" className="line-clamp-2 text-[0.8125rem] font-medium leading-snug text-ink">
        {source.title}
      </span>
    </a>
  );
});

/* ── Sources: the row (or grid) of cards ─────────────────── */

export interface SourcesProps extends HTMLAttributes<HTMLDivElement> {
  /** Defaults to the SourcesProvider's. */
  sources?: CitationSource[];
  /** "row": one horizontal, scrollable line. "grid": two columns. */
  layout?: "row" | "grid";
  /** Cards shown before "+N more". */
  max?: number;
  /** Small heading above the cards; pass null to hide. */
  label?: ReactNode;
}

export const Sources = forwardRef<HTMLDivElement, SourcesProps>(function Sources(
  { sources: sourcesProp, layout = "row", max = 4, label = "Sources", className, ...rest },
  ref,
) {
  const ctx = useSources();
  const sources = sourcesProp ?? ctx?.sources ?? [];
  const [open, setOpen] = useState(false);
  const cut = open || sources.length <= max + 1 ? sources.length : max; // never hide just one
  const hidden = sources.slice(cut);
  const hiddenActive = ctx?.active != null && ctx.active > cut;

  const cell = layout === "row" ? "w-[188px] shrink-0 snap-start" : "min-w-0";

  return (
    <div ref={ref} data-slot="sources" className={cn("flex flex-col gap-2", className)} {...rest}>
      {label !== null && (
        <div data-slot="sources-label" className="flex items-baseline gap-2 text-[0.8125rem] font-semibold text-ink-2">
          {label}
          <span className="font-normal tabular-nums text-mute">{sources.length}</span>
        </div>
      )}
      <ul
        role="list"
        data-slot="sources-list"
        data-layout={layout}
        className={cn(
          layout === "row"
            ? "-mx-1 -my-1 flex snap-x scroll-px-1 gap-tight overflow-x-auto px-1 py-1 pt-[6px] [scrollbar-width:thin]"
            : "grid grid-cols-2 gap-tight max-[420px]:grid-cols-1",
        )}
      >
        {sources.slice(0, cut).map((s, i) => (
          <li
            key={s.url + i}
            className={cn(
              cell,
              open &&
                i >= max &&
                "fun:animate-[rap-cite-deal_380ms_var(--rap-ease-spring)_both] calm:animate-fade-in",
            )}
            style={open && i >= max ? ({ animationDelay: `${(i - max) * 60}ms` } as CSSProperties) : undefined}
          >
            <SourceCard source={s} index={i + 1} className="h-full" />
          </li>
        ))}
        {hidden.length > 0 && (
          <li className={cell}>
            <button
              type="button"
              data-slot="sources-more"
              data-active={hiddenActive || undefined}
              aria-expanded={false}
              aria-label={`Show ${hidden.length} more sources`}
              onClick={() => setOpen(true)}
              className={cn(cardBase, cardLit, "h-full w-full cursor-pointer justify-between")}
            >
              <span className="flex -space-x-1.5">
                {hidden.slice(0, 4).map((s, i) => (
                  <SourceIcon key={i} source={s} size={20} className="ring-2 ring-paper-2" />
                ))}
              </span>
              <span className="text-[0.8125rem] font-semibold text-ink">+{hidden.length} more</span>
            </button>
          </li>
        )}
        {open && sources.length > max + 1 && (
          <li className={cn(cell, layout === "grid" && "col-span-full")}>
            <button
              type="button"
              data-slot="sources-less"
              aria-expanded
              onClick={() => setOpen(false)}
              className={cn(
                "h-full w-full cursor-pointer rounded-card px-3 py-2 text-[0.8125rem] font-medium text-mute outline-none",
                "hover:bg-fill hover:text-ink focus-visible:ring-2 focus-visible:ring-ring",
                layout === "row" && "min-h-[92px]",
              )}
            >
              Show fewer
            </button>
          </li>
        )}
      </ul>
    </div>
  );
});
