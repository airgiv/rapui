/* The landing's answer to "but I don't want it this loud": the same parts in the
   other presets, switched in place. A preset picker, a scope that restyles only
   what is inside it, and the section that leads with a Statement — big words with
   live parts set in among them — re-laid by each preset as you switch. */
import { useState, type ReactNode } from "react";
import {
  Accent,
  Button,
  Display,
  RapStyle,
  Rating,
  Slider,
  Statement,
  StatementSlot,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  type RapPreset,
} from "../rapui";
import { cn } from "../rapui/utils";
import { SITE_PRESETS } from "./presets";

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
      {SITE_PRESETS.map((p) => (
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
export function openLanding(p: RapPreset) {
  try {
    localStorage.setItem("rapui-preset", p);
  } catch {
    /* storage blocked: the landing opens in its last preset */
  }
  window.location.hash = "landing";
}

/* clicks on the stage's own parts stay theirs; a click anywhere else on the stage moves on to the next preset */
const OWN = "button, a, input, label, [role=slider], [role=switch], [role=radio], [role=radiogroup], [data-slot=rating]";

export function PresetsSection({ copyClass }: { copyClass: string }) {
  const [preset, setPreset] = useState<RapPreset>("fun");
  const note = SITE_PRESETS.find((p) => p.value === preset)?.note;
  const label = SITE_PRESETS.find((p) => p.value === preset)?.label;
  const next = () => {
    const order = SITE_PRESETS.map((p) => p.value);
    setPreset((p) => order[(order.indexOf(p) + 1) % order.length]);
  };

  return (
    <section className="px-(--gutter) pt-10 pb-24 flex flex-col gap-10" id="presets">
      <div className="flex flex-col gap-6">
        <Display size="xl">
          Two characters, <Accent tone="mute">one code</Accent>
        </Display>
        <p className={cn(copyClass, "max-w-[46ch]")}>
          Not every product wants to be this loud. Flip to civic and the same components change their type, colour, shape, spacing and how
          much they move — and the blocks re-lay the page: flush left and huge here, centred and serif for a public service.
        </p>
      </div>

      <PresetScope preset={preset}>
        {/* the picker sits on the stage itself, centred at the top; it only changes when someone
            picks — or clicks the stage anywhere that isn't one of its controls */}
        <div
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest(OWN)) next();
          }}
          title="Click to try the other preset"
          className="relative flex min-h-[clamp(30rem,42vw,38rem)] cursor-pointer flex-col items-center overflow-hidden rounded-lg bg-paper pt-[clamp(1.75rem,4vw,3.5rem)] text-ink transition-colors duration-500 shadow-[inset_0_0_0_1px_var(--rap-line)] [&>[data-slot=statement]]:my-auto [&>[data-slot=statement]]:w-full"
        >
          <div className="flex max-w-full justify-center px-3">
            <PresetPicker value={preset} onChange={setPreset} />
          </div>
          <Statement
            eyebrow={note}
            size="md"
            footer={
              <Button variant="soft" size="sm" icon onClick={() => openLanding(preset)}>
                See a whole page in {label}
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
              <Rating defaultValue={4} size={28} aria-label="A rating" />
            </StatementSlot>{" "}
            score — <Accent tone="mute">in whatever style you pick.</Accent>
          </Statement>
        </div>
      </PresetScope>
    </section>
  );
}
