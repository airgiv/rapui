/* ControlModules — a field of separate control tiles in isometric line work,
   drawn with the Anatomy skill: square tiles butted together on a grid, each
   carrying one large control (tall knurled knobs, dark round buttons, soft icon
   buttons, pill keys, faders, sliding switches, speaker grilles).

   layout="hero" (default) is the 15-tile composition to sit beside a headline.
   layout="field" is a wide 16:7 band of 26 scattered tiles that leaves the left
   FIELD_TEXT (40%) of the picture as empty floor for a block's headline; below
   896 px wide (56rem, where a block stacks) it frames the tiles alone, for text stacked above it.

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
export { FIELD_TEXT } from "./world";

export interface ControlModulesProps {
  className?: string;
  style?: CSSProperties;
  /** Wrap the figure in a card with a title, a hint and a live readout. */
  framed?: boolean;
  /** Change this number to restart the idle sequence (an alternative to ref.run()). */
  runKey?: number;
  /** "hero" (default): beside a headline. "field": a wide band with empty floor on its left for text. */
  layout?: Layout;
}

export const ControlModules = React.forwardRef<ModulesHandle, ControlModulesProps>(function ControlModules(
  { className, style, framed = false, runKey, layout = "hero" },
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
      <ModulesLive key={layout} ref={ref} runKey={runKey} layout={layout} soundOn={enabled} onSound={onSound} />
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
