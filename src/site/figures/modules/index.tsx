/* ControlModules — a field of separate control tiles in isometric line work,
   drawn with the Anatomy skill: square tiles butted together on a grid, each
   carrying one large control (tall knurled knobs, dark round buttons, soft icon
   buttons, pill keys, faders, sliding switches, speaker grilles).

   layout="hero" (default) is the 15-tile composition to sit beside a headline.
   layout="field" is a full-bleed band: about 50 tiles in clusters round the hero
   composition, more control kinds (rockers, tiny keys, pad grids, LCDs, joystick
   nubs, LED strips, jog wheels, vertical faders), drawn "slice" so the band
   fills its box (height: --cm-field-h) and bleeds off the sides. Pass `marks`
   ({ id, n } with tile ids, e.g. FIELD_MARKS) to put numbered footnote marks
   over controls; they follow the drawing as it scales, hide when cropped out,
   and report hover/focus through `onActive` (and light up with `active`).

   Frameless by default (transparent, grounded by soft halos, none in a dark
   theme). `framed` wraps it in the kit's Plate with a title, a hint and a live
   readout.

   Sound: only the user's own touches make sound (taps, releases, notches,
   toggles), never the idle loop. The speaker grille is the figure's own sound
   switch (or M on the focused figure): it turns a local <SoundProvider> on, with
   the page's volume and fun, and the first sound plays inside that click so the
   AudioContext starts from a user gesture. A page-wide enabled SoundProvider
   turns it on as well.

   Run API: pass a ref and call `ref.current.run()` (or bump `runKey`) to restart
   the idle sequence. On the focused figure the arrow keys turn the lit knob,
   1–9 press the buttons, S / Shift+S flip the switches, F / Shift+F move the
   fader, M toggles sound and Enter restarts; the pointer drags knobs and faders
   and presses or flips the rest. It stops offscreen and holds one composed
   still under prefers-reduced-motion or data-rap-motion="still";
   data-rap-motion="calm" slows and narrows it. */
import * as React from "react";
import type { CSSProperties } from "react";
import { SoundProvider, synth, useSound } from "../../../rapui";
import { Plate } from "../iso/react/draw";
import "../iso/iso.css";
import "./modules.css";
import { ModulesLive, type ModulesHandle } from "./live";
import type { Layout } from "./view";

export type { ModulesHandle } from "./live";
export { FIELD_BOX } from "./world";
export { FIELD_MARKS } from "./view";

export interface ControlModulesProps {
  className?: string;
  style?: CSSProperties;
  /** Wrap the figure in a card with a title, a hint and a live readout. */
  framed?: boolean;
  /** Change this number to restart the idle sequence (an alternative to ref.run()). */
  runKey?: number;
  /** "hero" (default): beside a headline. "field": a full-bleed band of many tiles. */
  layout?: Layout;
  /** Numbered footnote marks over controls (tile ids). */
  marks?: { id: string; n: number }[];
  /** The mark to highlight (a footnote under hover or focus). */
  active?: number | null;
  /** Hover or focus on a mark. */
  onActive?: (n: number | null) => void;
}

export const ControlModules = React.forwardRef<ModulesHandle, ControlModulesProps>(function ControlModules(
  { className, style, framed = false, runKey, layout = "hero", marks, active, onActive },
  ref,
) {
  const outer = useSound();
  const [local, setLocal] = React.useState(false);
  const enabled = local || outer.enabled;
  const onSound = React.useCallback(() => {
    const fun = outer.fun || 25;
    const volume = outer.volume || 0.6;
    if (!local) synth("toggleOn", fun, volume); // inside the click: this is what starts the AudioContext
    else synth("toggleOff", fun, volume);
    setLocal(!local);
  }, [local, outer.fun, outer.volume]);
  const live = (
    <SoundProvider enabled={enabled} volume={outer.volume || 0.6} fun={outer.fun || 25} haptics={outer.haptics}>
      <ModulesLive
        key={layout}
        ref={ref}
        runKey={runKey}
        layout={layout}
        soundOn={enabled}
        onSound={onSound}
        marks={marks}
        active={active}
        onActive={onActive}
      />
    </SoundProvider>
  );
  const cls = ["iso", "cm", `cm-${layout}`, framed ? "cm-framed" : "", className ?? ""].filter(Boolean).join(" ");
  if (!framed) {
    return (
      <div className={cls} data-theme="light" style={style}>
        {live}
      </div>
    );
  }
  return (
    <div className={cls} data-theme="light" style={style}>
      <Plate fig="Fig 1" title="Control modules" hint="Drag knobs · 1–9 buttons · M sound" readout="knob 2 lit · 165°">
        {live}
      </Plate>
    </div>
  );
});
