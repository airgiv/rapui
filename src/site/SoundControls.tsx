import { Slider, Switch } from "../rapui";
import type { SoundSettings } from "../rapui";
import { cn } from "../rapui/utils";

const label = "inline-flex items-center gap-2 text-[0.875rem] font-medium text-mute";

/** The compact switch used in the site headers and the docs settings panel. */
export const SMALL_SWITCH = "[--sw-h:1.75rem] [--sw-w:3rem] [--sw-pad:3px]";

/** Header controls for the site-wide opt-in sound: on/off, and how playful. */
export function SoundControls({
  value,
  onChange,
  tight = false,
}: {
  value: SoundSettings;
  onChange: (v: SoundSettings) => void;
  /** Phone-tight header (the landing): the word "Sound" steps aside (still read out) under 480px. */
  tight?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-[0.9rem] mr-3", tight && "max-[480px]:mr-0")}>
      <label className={label}>
        <span className={cn(tight && "max-[480px]:sr-only")}>Sound</span>
        <Switch checked={value.enabled} onCheckedChange={(enabled) => onChange({ ...value, enabled })} onText="" offText="" className={SMALL_SWITCH} />
      </label>
      {value.enabled && (
        // the fun slider is a desktop nicety: phones keep just the on/off switch
        <label className={`${label} max-[760px]:hidden`} title="How playful the sounds are: dull clicks → toy bloops">
          <span>Fun</span>
          <Slider value={[value.fun]} min={0} max={100} step={5} onValueChange={([fun]) => onChange({ ...value, fun })} aria-label="Sound fun" className="w-[90px]" />
        </label>
      )}
    </div>
  );
}
