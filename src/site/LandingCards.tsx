/* The two example landings as a pair of cards on the home page. Each card is a
   small drawn preview — not a screenshot — set in that landing's own preset (its
   paper, ink, display face, shape) through a PresetScope: the brand, the
   tagline and one quiet signature. Static: nothing animates. A click opens the
   whole page in that preset. */
import { type ReactNode } from "react";
import { Accent, Display, type RapPreset } from "../rapui";
import { cn } from "../rapui/utils";
import { ArrowRight } from "../rapui/icons";
import { CONTENT } from "./landing/content";
import { openLanding, PresetScope } from "./PresetsShowcase";
import { SITE_PRESETS } from "./presets";

/* one quiet signature per preset, so a card says which character it is without noise */
const SIGNATURE: Partial<Record<RapPreset, ReactNode>> = {
  fun: <span className="size-3 rounded-full bg-flame" />,
  civic: <span className="font-display text-[1rem] italic text-ink-2">est. this morning</span>,
};

/* centred presets centre their poster too */
const CENTRED: Partial<Record<RapPreset, boolean>> = { civic: true };

export function LandingCards({ copyClass }: { copyClass: string }) {
  return (
    <section className="flex flex-col gap-10 px-(--gutter) pt-10 pb-24" id="landings">
      <div className="flex flex-col gap-6">
        <Display size="xl">
          Two whole pages, <Accent tone="mute">one for each</Accent>
        </Display>
        <p className={cn(copyClass, "max-w-[46ch]")}>
          The same blocks laid out as two complete landing pages, each in its own preset. Open one, then switch the preset at the bottom and
          watch the page re-lay.
        </p>
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-tile p-0 max-[700px]:grid-cols-1">
        {SITE_PRESETS.map((p) => {
          const c = CONTENT[p.value];
          return (
            <li key={p.value} className="flex">
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
                      "flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-[calc(var(--rap-radius-lg)-6px)] bg-paper p-6 text-ink shadow-[inset_0_0_0_1px_var(--rap-line)]",
                      CENTRED[p.value] && "items-center text-center",
                    )}
                  >
                    <span className="flex h-4 items-center">{SIGNATURE[p.value]}</span>
                    <span className={cn("font-display max-w-full leading-[0.9] whitespace-nowrap", "text-[clamp(2.75rem,7vw,6rem)]", " font-[var(--rap-display-weight,500)] tracking-[var(--rap-display-tracking,-0.04em)] [text-transform:var(--rap-display-case,none)]")}>
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
