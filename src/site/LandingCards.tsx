/* The five example landings as a sideways row of cards on the home page. Each
   card is a small drawn preview — not a screenshot — set in that landing's own
   preset (its paper, ink, display face, shape) through a PresetScope: the brand,
   the hero's headline at card size, two buttons and one motif that says what
   the preset is (fun's stickers, civic's centred column, signal's readout strip,
   product's window, minimal's hairlines). Static: nothing in the row animates.
   A click opens the whole page in that preset. */
import { useRef, type ReactNode } from "react";
import { Accent, Display, RAP_PRESETS, type RapPreset } from "../rapui";
import { cn } from "../rapui/utils";
import { ArrowLeft, ArrowRight } from "../rapui/icons";
import { CONTENT } from "./landing/content";
import { openLanding, PresetScope } from "./PresetsShowcase";

/* one quiet signature per preset, so a card says which character it is without noise */
const SIGNATURE: Record<RapPreset, ReactNode> = {
  fun: <span className="size-3 rounded-full bg-flame" />,
  civic: <span className="font-display text-[1rem] italic text-ink-2">est. this morning</span>,
  signal: <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-flame">● 104.2 MHz</span>,
  product: <span className="rounded-pill px-2 py-0.5 text-[0.6875rem] font-medium text-plum shadow-[inset_0_0_0_1px_var(--rap-edge)]">v2.0</span>,
  minimal: <span className="h-px w-10 bg-ink" />,
};

/* centred presets centre their poster too */
const CENTRED: Partial<Record<RapPreset, boolean>> = { civic: true, product: true };

export function LandingCards({ copyClass }: { copyClass: string }) {
  const row = useRef<HTMLUListElement>(null);
  // the row has no visible scrollbar: two buttons step it one card at a time
  const step = (dir: 1 | -1) => {
    const el = row.current;
    const card = el?.querySelector("li");
    if (el && card) el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 4), behavior: "smooth" });
  };
  const arrow =
    "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-paper-2 text-ink transition-colors hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-5";
  return (
    <section className="flex flex-col gap-10 pt-10 pb-28" id="landings">
      <div className="flex flex-col gap-6 px-(--gutter)">
        <Display size="xl">
          Five whole pages, <Accent tone="mute">one for each</Accent>
        </Display>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <p className={cn(copyClass, "max-w-[46ch]")}>
          The same blocks laid out as five complete landing pages, each in its own preset and each talking about itself. Open one, then switch
          the preset at the bottom and watch the page re-lay.
        </p>
          <div className="flex gap-2">
            <button type="button" className={arrow} aria-label="Previous landing" onClick={() => step(-1)}>
              <ArrowLeft aria-hidden />
            </button>
            <button type="button" className={arrow} aria-label="Next landing" onClick={() => step(1)}>
              <ArrowRight aria-hidden />
            </button>
          </div>
        </div>
      </div>
      {/* one sideways row that snaps card by card; it bleeds to the window edge, padded to the gutter */}
      <ul ref={row} className="m-0 -my-6 flex snap-x snap-mandatory list-none gap-tile overflow-x-auto overscroll-x-contain scroll-px-(--gutter) px-(--gutter) py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RAP_PRESETS.map((p) => {
          const c = CONTENT[p.value];
          return (
            <li key={p.value} className="flex w-[min(78vw,22rem)] shrink-0 snap-start">
              <a
                href="#landing"
                onClick={(e) => {
                  e.preventDefault();
                  openLanding(p.value);
                }}
                className="group flex w-full flex-col gap-4 rounded-lg bg-paper-2 p-3 pb-5 text-ink no-underline transition-[translate,box-shadow] duration-(--rap-dur) ease-spring hover:-translate-y-1 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <PresetScope preset={p.value}>
                  {/* the preview: a poster of the landing — its paper, its display face, its name,
                      one signature — and nothing small or many-coloured */}
                  <div
                    aria-hidden
                    className={cn(
                      "flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[calc(var(--rap-radius-lg)-6px)] bg-paper p-6 text-ink shadow-[inset_0_0_0_1px_var(--rap-line)]",
                      CENTRED[p.value] && "items-center text-center",
                    )}
                  >
                    <span className="flex h-4 items-center">{SIGNATURE[p.value]}</span>
                    <span className="font-display max-w-full text-[clamp(2.75rem,7.5vw,4.25rem)] leading-[0.9] break-words font-[var(--rap-display-weight,500)] tracking-[var(--rap-display-tracking,-0.04em)] [text-transform:var(--rap-display-case,none)]">
                      {c.brand}
                    </span>
                    <span className="max-w-[24ch] text-[0.9375rem] leading-snug text-ink-2">{c.tagline}</span>
                  </div>
                </PresetScope>
                <span className="flex flex-col gap-1.5 px-2">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[1.375rem] font-semibold tracking-[-0.02em]">{c.brand}</span>
                    <span className="text-[0.875rem] text-ink-2">{p.label} preset</span>
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium">
                    Open the page
                    <ArrowRight aria-hidden className="size-4 transition-transform duration-(--rap-dur-fast) group-hover:translate-x-0.5" />
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
