/* The five example landings as a sideways row of cards on the home page. Each
   card is a small drawn preview — not a screenshot — set in that landing's own
   preset (its paper, ink, display face, shape) through a PresetScope: the brand,
   the hero's headline at card size, two buttons and one motif that says what
   the preset is (fun's stickers, civic's centred column, signal's readout strip,
   product's window, minimal's hairlines). Static: nothing in the row animates.
   A click opens the whole page in that preset. */
import type { ReactNode } from "react";
import { Accent, Display, RAP_PRESETS, type RapPreset } from "../rapui";
import { cn } from "../rapui/utils";
import { ArrowRight } from "../rapui/icons";
import { CONTENT } from "./landing/content";
import { openLanding, PresetScope } from "./PresetsShowcase";

/* a pill of a button, drawn not live */
const Pill = ({ solid, children }: { solid?: boolean; children: ReactNode }) => (
  <span
    className={cn(
      "inline-flex h-7 items-center rounded-pill px-3 text-[0.6875rem] font-medium whitespace-nowrap",
      solid ? "bg-accent text-accent-ink" : "bg-fill text-ink",
    )}
  >
    {children}
  </span>
);

/* the one thing each preset's page is recognised by, drawn small */
function Motif({ preset }: { preset: RapPreset }) {
  switch (preset) {
    case "fun":
      return (
        <div className="relative mt-auto h-28 shrink-0 rounded-card bg-[radial-gradient(120%_90%_at_20%_0%,var(--rap-sky),transparent_60%),radial-gradient(90%_80%_at_100%_100%,var(--rap-bubble),transparent_55%),var(--rap-paper-3)]">
          <span className="absolute -top-3 right-5 grid size-12 rotate-12 place-items-center rounded-full bg-acid text-[0.625rem] font-bold text-ink">NEW!</span>
          <span className="absolute bottom-3 left-3 h-6 w-16 rounded-pill bg-flame" />
          <span className="absolute bottom-3 left-[5.5rem] size-6 rounded-full bg-blue" />
        </div>
      );
    case "civic":
      return (
        <div className="mt-auto h-28 shrink-0 overflow-hidden rounded-card bg-[linear-gradient(to_bottom,var(--rap-sky),var(--rap-paper-3))]">
          <div className="mx-auto mt-12 h-16 w-32 rounded-t-[999px] bg-surface/80" />
        </div>
      );
    case "signal":
      return (
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex justify-between border-y border-line py-1 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-2">
            <span>[ 00 ] rx</span>
            <span className="text-flame">104.2 MHz</span>
          </div>
          <div className="grid grid-cols-[repeat(24,1fr)] gap-[3px]">
            {Array.from({ length: 72 }, (_, i) => (
              <span key={i} className={cn("aspect-square rounded-full", (i * 7) % 11 < 4 ? "bg-flame" : "bg-line")} />
            ))}
          </div>
        </div>
      );
    case "product":
      return (
        <div className="mt-auto overflow-hidden rounded-sm bg-surface shadow-[inset_0_0_0_1px_var(--rap-edge),0_10px_30px_-12px_var(--rap-plum)]">
          <div className="flex gap-1 border-b border-line px-2 py-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 rounded-full bg-line" />
            ))}
          </div>
          <div className="flex flex-col gap-1.5 p-2.5">
            <span className="h-1.5 w-3/4 rounded-pill bg-plum/70" />
            <span className="h-1.5 w-1/2 rounded-pill bg-line" />
          </div>
        </div>
      );
    default:
      return (
        <div className="mt-auto flex flex-col gap-2 border-t border-ink pt-2">
          {["Headline", "Hairlines", "Colour"].map((r, i) => (
            <div key={r} className="flex justify-between text-[0.625rem] text-ink-2">
              <span>{r}</span>
              <span className="tabular-nums">{i === 2 ? "—" : "$0.00"}</span>
            </div>
          ))}
        </div>
      );
  }
}

/* centred presets centre their preview too */
const CENTRED: Partial<Record<RapPreset, boolean>> = { civic: true, product: true };

export function LandingCards({ copyClass }: { copyClass: string }) {
  return (
    <section className="flex flex-col gap-10 pt-10 pb-28" id="landings">
      <div className="flex flex-col gap-6 px-(--gutter)">
        <Display size="xl">
          Five whole pages, <Accent tone="mute">one for each</Accent>
        </Display>
        <p className={cn(copyClass, "max-w-[46ch]")}>
          The same blocks laid out as five complete landing pages, each in its own preset and each talking about itself. Open one, then switch
          the preset at the bottom and watch the page re-lay.
        </p>
      </div>
      {/* one sideways row that snaps card by card; it bleeds to the window edge, padded to the gutter */}
      <ul className="m-0 flex snap-x snap-mandatory list-none gap-tile overflow-x-auto overscroll-x-contain scroll-px-(--gutter) px-(--gutter) pb-2 [scrollbar-width:thin]">
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
                  {/* the preview: the landing's first screen, drawn small in its own preset */}
                  <div
                    aria-hidden
                    className={cn(
                      "flex min-h-[25rem] flex-col gap-3 overflow-hidden rounded-[calc(var(--rap-radius-lg)-6px)] bg-paper p-4 text-ink shadow-[inset_0_0_0_1px_var(--rap-line)]",
                      CENTRED[p.value] && "items-stretch text-center",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-[0.6875rem]">
                      <span className="font-display text-[0.9375rem] font-[var(--rap-display-weight,500)] tracking-[-0.02em]">{c.brand}</span>
                      <span className="flex gap-2 text-ink-2">
                        <span>Features</span>
                        <span>Pricing</span>
                      </span>
                    </div>
                    <div className="m-0 font-display text-[2.125rem] leading-[0.95] font-[var(--rap-display-weight,500)] tracking-[var(--rap-display-tracking,-0.04em)] text-balance">
                      {c.hero.title}
                    </div>
                    <p className="m-0 line-clamp-3 text-[0.75rem] leading-snug text-ink-2">{c.hero.lead}</p>
                    <div className={cn("flex gap-1.5", CENTRED[p.value] && "justify-center")}>
                      <Pill solid>{c.hero.primary}</Pill>
                      <Pill>{c.hero.secondary}</Pill>
                    </div>
                    <Motif preset={p.value} />
                  </div>
                </PresetScope>
                <span className="flex flex-col gap-1.5 px-2">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[1.375rem] font-semibold tracking-[-0.02em]">{c.brand}</span>
                    <span className="text-[0.875rem] text-ink-2">{p.label} preset</span>
                  </span>
                  <span className="text-ink-2 leading-snug">{c.tagline}</span>
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
