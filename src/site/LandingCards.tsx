/* The five example landings as cards on the home page: a picture of each one's
   first screen, its name, the preset it wears and its tagline — one click opens
   the whole page in that preset. The gallery inside the presets stage only hints
   at them; this is the plain way in. The pictures are screenshots of the landings'
   heroes (src/site/media/landings), re-shot when a hero changes. */
import { Display, Accent, RAP_PRESETS, type RapPreset } from "../rapui";
import { cn } from "../rapui/utils";
import { ArrowRight } from "../rapui/icons";
import { CONTENT } from "./landing/content";
import { openLanding } from "./PresetsShowcase";
import fun from "./media/landings/fun.webp";
import civic from "./media/landings/civic.webp";
import signal from "./media/landings/signal.webp";
import product from "./media/landings/product.webp";
import minimal from "./media/landings/minimal.webp";

const SHOT: Record<RapPreset, string> = { fun, civic, signal, product, minimal };

/* three across, then two wider ones, so five cards fill two even rows */
const SPAN = ["@4xl:col-span-2", "@4xl:col-span-2", "@4xl:col-span-2", "@4xl:col-span-3", "@4xl:col-span-3"];

export function LandingCards({ copyClass }: { copyClass: string }) {
  return (
    <section className="@container px-(--gutter) pt-10 pb-28 flex flex-col gap-10" id="landings">
      <div className="flex flex-col gap-6">
        <Display size="xl">
          Five whole pages, <Accent tone="mute">one for each</Accent>
        </Display>
        <p className={cn(copyClass, "max-w-[46ch]")}>
          The same blocks laid out as five complete landing pages, each in its own preset and each talking about itself. Open one, then switch
          the preset at the bottom and watch the page re-lay.
        </p>
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-tile p-0 @2xl:grid-cols-2 @4xl:grid-cols-6">
        {RAP_PRESETS.map((p, i) => {
          const c = CONTENT[p.value];
          return (
            <li key={p.value} className={cn("flex", SPAN[i], i === 4 && "@2xl:col-span-2")}>
              <a
                href="#landing"
                onClick={(e) => {
                  e.preventDefault();
                  openLanding(p.value);
                }}
                className="group flex w-full flex-col gap-4 rounded-lg bg-paper-2 p-3 pb-5 text-ink no-underline transition-[translate,box-shadow] duration-(--rap-dur) ease-spring hover:-translate-y-1 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="block overflow-hidden rounded-[calc(var(--rap-radius-lg)-6px)] shadow-[inset_0_0_0_1px_var(--rap-line)]">
                  <img
                    src={SHOT[p.value]}
                    alt={`The ${c.brand} landing page in the ${p.label} preset`}
                    width={864}
                    height={720}
                    loading="lazy"
                    className="block aspect-[864/720] w-full object-cover object-top transition-transform duration-(--rap-dur-slow) ease-out group-hover:scale-[1.03]"
                  />
                </span>
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
