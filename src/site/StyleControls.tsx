import { useState } from "react";
import { SITE_PRESETS, sitePreset } from "./presets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ToggleGroup, ToggleGroupItem, type RapMotion, type RapPreset } from "../rapui";

/* the previewed preset (remembered per browser, shared by the docs and the
   landing preview) and a motion override — null means the preset's own */
export function useStylePreset() {
  const [preset, setPresetState] = useState<RapPreset>(() => {
    try {
      return sitePreset(localStorage.getItem("rapui-preset"));
    } catch {
      return "fun";
    }
  });
  const [motion, setMotion] = useState<RapMotion | null>(null);
  const setPreset = (p: RapPreset) => {
    setPresetState(p);
    setMotion(null);
    try {
      localStorage.setItem("rapui-preset", p);
    } catch {
      /* storage blocked */
    }
  };
  return { preset, setPreset, motion, setMotion };
}

/* the preset picker and the motion level, for the header and the phone menu */
export function StyleControls({
  preset,
  setPreset,
  motion,
  setMotion,
}: {
  preset: RapPreset;
  setPreset: (p: RapPreset) => void;
  motion: RapMotion;
  setMotion: (m: RapMotion) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 mr-3">
      <Select value={preset} onValueChange={(v) => setPreset(v as RapPreset)}>
        <SelectTrigger size="sm" aria-label="Style preset" className="w-[8.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SITE_PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToggleGroup
        type="single"
        size="sm"
        value={motion}
        onValueChange={(v) => v && setMotion(v as RapMotion)}
        aria-label="Motion"
        className="[&_[data-slot=toggle-group-item]]:px-3 [&_[data-slot=toggle-group-item]]:text-[0.8125rem]"
      >
        <ToggleGroupItem value="fun">Fun</ToggleGroupItem>
        <ToggleGroupItem value="calm">Calm</ToggleGroupItem>
        <ToggleGroupItem value="still">Still</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
