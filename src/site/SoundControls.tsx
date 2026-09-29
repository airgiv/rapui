import { Slider, Switch } from "../rapui";
import type { SoundSettings } from "../rapui";

/** Header controls for the site-wide opt-in sound: on/off, and how playful. */
export function SoundControls({ value, onChange }: { value: SoundSettings; onChange: (v: SoundSettings) => void }) {
  return (
    <div className="site-sound">
      <label className="site-sound__toggle">
        <span>Sound</span>
        <Switch checked={value.enabled} onCheckedChange={(enabled) => onChange({ ...value, enabled })} onText="" offText="" />
      </label>
      {value.enabled && (
        <label className="site-sound__fun" title="How playful the sounds are: dull clicks → toy bloops">
          <span>Fun</span>
          <Slider value={[value.fun]} min={0} max={100} step={5} onValueChange={([fun]) => onChange({ ...value, fun })} aria-label="Sound fun" />
        </label>
      )}
    </div>
  );
}
