/* RapOP — the rapui OP, a flat pocket instrument in the manner of Teenage
   Engineering, drawn with the Anatomy skill to sit big beside a hero's
   headline: rapui's Button, Knob, Slider, Switch, Dots and a small screen made
   physical, lying on the table and playing a six-step pattern by itself.

   Frameless by default (transparent, grounded by the halo under the slab).
   `framed` wraps it in the kit's Plate with a title, a hint and a live readout.

   Run API: pass a ref and call `ref.current.run()` (or bump the `runKey`
   number prop) to restart the pattern from its first step. On the focused
   figure, 1–6 press the keys, ←/→ turn the tempo encoder, Space flips the
   switch and Enter restarts; the pointer presses keys, drags the encoders and
   the fader and flips the switch. It stops offscreen and holds one composed
   still (a key half way down) under prefers-reduced-motion or an ancestor with
   data-rap-motion="still"; data-rap-motion="calm" slows and narrows its sweeps. */
import * as React from "react";
import type { CSSProperties } from "react";
import { Plate } from "../iso/react/draw";
import "../iso/iso.css";
import "./op.css";
import { OPLive, type OPHandle } from "./live";

export type { OPHandle } from "./live";

export interface RapOPProps {
  className?: string;
  style?: CSSProperties;
  /** Wrap the device in a card with a title, a hint and a live readout. */
  framed?: boolean;
  /** Change this number to restart the pattern (an alternative to ref.run()). */
  runKey?: number;
}

export const RapOP = React.forwardRef<OPHandle, RapOPProps>(function RapOP({ className, style, framed = false, runKey }, ref) {
  const live = <OPLive ref={ref} runKey={runKey} />;
  if (!framed) {
    return (
      <div className={className ? `iso op ${className}` : "iso op"} data-theme="light" style={style}>
        {live}
      </div>
    );
  }
  return (
    <div className={className ? `iso op op-framed ${className}` : "iso op op-framed"} data-theme="light" style={style}>
      <Plate fig="Fig 1" title="rapui OP" hint="Keys 1–6 · ← → tempo · Space switch" readout="step 3 · 120 bpm · wet">
        {live}
      </Plate>
    </div>
  );
});
