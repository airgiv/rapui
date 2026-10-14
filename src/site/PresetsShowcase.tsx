/* The landing's answer to "but I don't want it this loud": the same parts in the
   other presets, switched in place. A preset picker, a scope that restyles only
   what is inside it, and the section that leads with a Statement — big words with
   live parts set in among them — re-laid by each preset as you switch. */
import { useEffect, useState, type ReactNode } from "react";
import {
  Accent,
  Button,
  Display,
  RAP_PRESETS,
  RapStyle,
  Rating,
  Slider,
  Statement,
  StatementSlot,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  useInView,
  type RapPreset,
} from "../rapui";
import { cn, prefersReducedMotion } from "../rapui/utils";

export function PresetPicker({ value, onChange, size = "md", className }: { value: RapPreset; onChange: (p: RapPreset) => void; size?: "sm" | "md"; className?: string }) {
  return (
    <ToggleGroup
      type="single"
      size={size}
      value={value}
      onValueChange={(v) => v && onChange(v as RapPreset)}
      aria-label="Style preset"
      className={cn("w-fit max-w-full self-start overflow-x-auto", className)}
    >
      {RAP_PRESETS.map((p) => (
        <ToggleGroupItem key={p.value} value={p.value}>
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Restyles only its children: the preset's palette, type, shape and motion. */
export function PresetScope({ preset, children }: { preset: RapPreset; children: ReactNode }) {
  return (
    <RapStyle scope="local" preset={preset}>
      {children}
    </RapStyle>
  );
}

/* open the full Docket landing in this preset (the docs and the landing share the choice) */
function openLanding(p: RapPreset) {
  try {
    localStorage.setItem("rapui-preset", p);
  } catch {
    /* storage blocked: the landing opens in its last preset */
  }
  window.location.hash = "landing";
}

export function PresetsSection({ copyClass }: { copyClass: string }) {
  const [preset, setPreset] = useState<RapPreset>("fun");
  const [touched, setTouched] = useState(false);
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.35, once: false });
  const note = RAP_PRESETS.find((p) => p.value === preset)?.note;

  // until someone picks one, the presets take turns while the section is on screen
  useEffect(() => {
    if (touched || !inView || prefersReducedMotion()) return;
    const order = RAP_PRESETS.map((p) => p.value);
    const id = window.setInterval(() => setPreset((p) => order[(order.indexOf(p) + 1) % order.length]), 3400);
    return () => window.clearInterval(id);
  }, [touched, inView]);

  const pick = (p: RapPreset) => {
    setTouched(true);
    setPreset(p);
  };

  return (
    <section ref={ref} className="px-(--gutter) pt-10 pb-28 flex flex-col gap-10" id="presets">
      {/* the title, then one row under it: the words on the left, the picker on the right,
          sharing a bottom line — so nothing floats above the headline */}
      <div className="flex flex-col gap-6">
        <Display size="xl">
          Five characters, <Accent tone="mute">one code</Accent>
        </Display>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <p className={cn(copyClass, "max-w-[46ch]")}>
            Not every product wants to be this loud. Pick a preset and the same components change their type, colour, shape, spacing and
            how much they move — and the blocks re-lay the page: flush left and huge here, centred and serif for a public service.
          </p>
          <PresetPicker value={preset} onChange={pick} />
        </div>
      </div>

      <PresetScope preset={preset}>
        <div className="relative flex min-h-[clamp(36.5rem,58vw,50rem)] items-center overflow-hidden rounded-lg bg-paper text-ink transition-colors duration-500 shadow-[inset_0_0_0_1px_var(--rap-line)] [&>[data-slot=statement]]:w-full">
          <Statement
            eyebrow={note}
            size="md"
            footer={
              <Button variant="soft" size="sm" icon onClick={() => openLanding(preset)}>
                See a whole page in {RAP_PRESETS.find((p) => p.value === preset)?.label}
              </Button>
            }
          >
            Components that{" "}
            <StatementSlot>
              <Switch defaultChecked aria-label="A switch" />
            </StatementSlot>{" "}
            switch on,{" "}
            <StatementSlot>
              <Button size="sm" icon>
                Press
              </Button>
            </StatementSlot>{" "}
            back,{" "}
            <StatementSlot>
              <Slider defaultValue={[62]} aria-label="A slider" className="w-28" />
            </StatementSlot>{" "}
            slide and{" "}
            <StatementSlot>
              <Rating defaultValue={4} size={18} aria-label="A rating" />
            </StatementSlot>{" "}
            score — <Accent tone="mute">in whatever style you pick.</Accent>
          </Statement>
        </div>
      </PresetScope>
    </section>
  );
}
