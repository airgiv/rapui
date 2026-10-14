/* ══ SiteHeader ══════════════════════════════════════════
   The top bar of a landing page: the logo, the main links, an
   action or two.

     <SiteHeader logo={<Logo />} links={[{ label: "Pricing", href: "#pricing" }]}
                 actions={<Button size="sm">Start free</Button>} sticky />

   It folds by the room it has, not the viewport: below 48rem of its
   own width (a container query) the links and actions go into a menu
   button that opens a Sheet. A `<nav aria-label>` landmark holds the
   links; `skipTo` adds a "Skip to content" link that shows on focus.

   fun      a floating pill bar in the inverted theme (ink ground,
            paper words), like the rapui landing's own header
   civic    a white bar on a thin rule: sans links, a navy button
   signal   mono uppercase links on a hairline, with a live dot and
            a clock readout at the end
   product  a translucent blurred bar on a hairline, links centred
   minimal  words only, spaced apart; a black underline on hover

   Delight (fun): the link under the pointer gets a soft pill, and
   the menu panel springs in and deals its links. Calm: the panel
   fades in; the signal dot holds steady. */
import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { cn } from "../utils";
import { Menu } from "../icons";
import { Container, useBlockLook, type BlockLook } from "./Layout";
import { Sheet, SheetContent, SheetTitle } from "./Sheet";

export interface SiteHeaderLink {
  label: string;
  href: string;
  /** The page you are on: aria-current="page". */
  current?: boolean;
}

export interface SiteHeaderProps extends HTMLAttributes<HTMLElement> {
  logo: ReactNode;
  links?: SiteHeaderLink[];
  /** Buttons at the end (also shown in the menu when folded). */
  actions?: ReactNode;
  /** Stick to the top of the scrolling page. */
  sticky?: boolean;
  /** Accessible name of the links' nav landmark. Default "Main". */
  navLabel?: string;
  /** "#content": adds a skip link to the page's main content, visible on focus. */
  skipTo?: string;
  /** signal: the readout at the end (default: a live dot and the local time). */
  status?: ReactNode;
  look?: BlockLook;
}

/* the opposite of the theme the header sits in, for fun's inverted bar */
function usePageTheme(ref: RefObject<HTMLElement | null>) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useLayoutEffect(() => {
    const read = () => {
      const t = ref.current?.parentElement?.closest("[data-rap-theme]")?.getAttribute("data-rap-theme");
      setTheme(t === "dark" ? "dark" : "light");
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rap-theme"], subtree: true });
    return () => mo.disconnect();
  }, [ref]);
  return theme;
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const t = now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  return <time dateTime={now?.toISOString()}>{t}</time>;
}

/* per look: the bar, its links, and the menu button */
const BAR: Record<BlockLook, string> = {
  fun: "h-16 @3xl:h-20 pl-6 pr-2.5 @3xl:pl-7 gap-(--rap-space-md) rounded-pill bg-paper text-ink",
  civic: "h-20 gap-(--rap-space-xl)",
  signal: "h-14 gap-(--rap-space-lg)",
  product: "h-16 gap-(--rap-space-md) @3xl:grid @3xl:grid-cols-[1fr_auto_1fr]",
  minimal: "h-20 gap-(--rap-space-xl)",
};

const ROOT: Record<BlockLook, string> = {
  fun: "pt-2.5",
  civic: "bg-surface text-ink border-b border-line",
  signal: "bg-paper text-ink border-b border-line",
  product: "bg-paper/75 text-ink border-b border-line backdrop-blur-md backdrop-saturate-150",
  minimal: "bg-paper text-ink",
};

/* where the nav sits in the bar, and the space between its links */
const NAV_PLACE: Partial<Record<BlockLook, string>> = { product: "justify-self-center", minimal: "ml-auto" };
const NAV_GAP: Record<BlockLook, string> = {
  fun: "gap-1",
  civic: "gap-(--rap-space-lg)",
  signal: "gap-(--rap-space-lg)",
  product: "gap-1",
  minimal: "gap-(--rap-space-lg)",
};

const LINK: Record<BlockLook, string> = {
  fun: "flex items-center h-11 px-4 rounded-pill text-[1.0625rem] font-medium -translate-y-px transition-colors duration-(--rap-dur-fast) hover:bg-fill-hover",
  civic:
    "py-2 text-[0.9375rem] font-medium text-ink-2 decoration-flame decoration-2 underline-offset-[0.6em] transition-colors hover:text-ink hover:underline aria-[current=page]:text-ink aria-[current=page]:underline",
  signal: "py-2 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-flame aria-[current=page]:text-ink",
  product: "flex items-center h-8 px-3 rounded-sm text-[0.875rem] text-ink-2 transition-colors hover:text-ink hover:bg-fill aria-[current=page]:text-ink",
  minimal: "py-1 text-[0.9375rem] text-ink decoration-1 underline-offset-4 hover:underline aria-[current=page]:underline",
};

const MENU_BTN: Record<BlockLook, string> = {
  fun: "size-11 rounded-full bg-ink text-paper fun:active:scale-90",
  civic: "size-11 rounded-full bg-fill text-ink hover:bg-fill-hover",
  signal: "size-9 rounded-xs shadow-[inset_0_0_0_1px_var(--rap-line)] text-ink hover:bg-fill",
  product: "size-9 rounded-sm shadow-[inset_0_0_0_1px_var(--rap-edge)] text-ink hover:bg-fill",
  minimal: "h-9 px-0 text-ink underline-offset-4 hover:underline",
};

const SHEET_LINK: Record<BlockLook, string> = {
  fun: "py-1.5 font-display text-[2.2rem] font-medium tracking-[-0.04em] leading-[1.05] hover:text-flame",
  civic: "py-3 border-b border-line font-display text-[1.75rem] tracking-[-0.02em] hover:text-flame",
  signal: "py-3 border-b border-line font-mono text-[0.875rem] uppercase tracking-[0.08em] hover:text-flame",
  product: "py-2.5 text-[1.125rem] font-medium text-ink-2 hover:text-ink",
  minimal: "py-2 text-[1.5rem] tracking-[-0.02em] hover:underline underline-offset-4 decoration-1",
};

export function SiteHeader({
  logo,
  links = [],
  actions,
  sticky = false,
  navLabel = "Main",
  skipTo,
  status,
  look: lookProp,
  className,
  ...rest
}: SiteHeaderProps) {
  const { ref, look, motion } = useBlockLook<HTMLElement>(lookProp);
  const pageTheme = usePageTheme(ref);
  const [open, setOpen] = useState(false);
  const closeOnWide = useRef<HTMLDivElement>(null);

  // if the bar grows past the fold while the menu is open, close it
  useEffect(() => {
    const el = closeOnWide.current;
    if (!el || !open) return;
    const ro = new ResizeObserver(() => {
      if (getComputedStyle(el).display === "none") setOpen(false);
    });
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [open]);

  const linkList = (cls: string, onClick?: () => void) =>
    links.map((l) => (
      <li key={l.href + l.label} className="flex">
        <a href={l.href} aria-current={l.current ? "page" : undefined} onClick={onClick} className={cn("whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", cls)}>
          {l.label}
        </a>
      </li>
    ));

  return (
    <header
      ref={ref}
      data-slot="site-header"
      data-look={look}
      className={cn("@container relative z-50 w-full font-sans", sticky && "sticky top-0", ROOT[look], className)}
      {...rest}
    >
      {skipTo && (
        <a
          href={skipTo}
          data-slot="site-header-skip"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-10 focus:px-4 focus:py-2 focus:rounded-pill focus:bg-ink focus:text-paper focus:outline-2 focus:outline-ring"
        >
          Skip to content
        </a>
      )}
      <Container size={look === "fun" ? "full" : "default"} className={cn(look === "fun" && "px-2.5")}>
        <div
          data-slot="site-header-bar"
          {...(look === "fun" ? { "data-rap-theme": pageTheme === "dark" ? "light" : "dark" } : {})}
          className={cn("flex items-center justify-between", BAR[look])}
        >
          <div data-slot="site-header-logo" className="flex items-center min-w-0 shrink-0">
            {logo}
          </div>

          {links.length > 0 && (
            <nav aria-label={navLabel} data-slot="site-header-nav" className={cn("hidden @3xl:flex", NAV_PLACE[look])}>
              <ul className={cn("m-0 p-0 list-none flex items-center", NAV_GAP[look])}>{linkList(LINK[look])}</ul>
            </nav>
          )}

          <div className={cn("flex items-center gap-(--rap-space-sm)", look === "product" && "justify-self-end", look === "civic" && "ml-auto")}>
            {look === "signal" && (
              <span data-slot="site-header-status" className="hidden @3xl:inline-flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-mute tabular-nums">
                {status ?? (
                  <>
                    <span aria-hidden className="size-1.5 rounded-full bg-success fun:animate-pulse" />
                    <Clock />
                  </>
                )}
              </span>
            )}
            {actions && <div className="hidden @3xl:flex items-center gap-(--rap-space-xs)">{actions}</div>}
            {(links.length > 0 || actions) && (
              <div ref={closeOnWide} className="@3xl:hidden">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={open}
                  aria-haspopup="dialog"
                  data-slot="site-header-menu"
                  className={cn(
                    "grid place-items-center cursor-pointer border-0 bg-transparent transition-[transform,background-color] duration-(--rap-dur-fast) [&_svg]:size-5",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    MENU_BTN[look],
                  )}
                >
                  {look === "minimal" ? <span className="text-[0.9375rem]">Menu</span> : <Menu />}
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* the panel is portalled out of the page, so it takes the look, motion and theme with it */}
        <SheetContent side="right" className="gap-6 [--sheet-size:380px]" data-rap-preset={look} data-rap-motion={motion} data-rap-theme={pageTheme}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {links.length > 0 && (
            <nav aria-label={navLabel} className="pt-10">
              <ul className="m-0 p-0 list-none flex flex-col">{linkList(cn("block text-ink transition-colors", SHEET_LINK[look]), () => setOpen(false))}</ul>
            </nav>
          )}
          {actions && <div className="mt-auto flex flex-wrap items-center gap-(--rap-space-xs)">{actions}</div>}
        </SheetContent>
      </Sheet>
    </header>
  );
}
