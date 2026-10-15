/* ControlModules — a field of separate control tiles in isometric line work,
   drawn with the Anatomy skill to sit big beside a hero's headline: square
   tiles butted together on a grid, each carrying one large control (tall
   knurled knobs, dark round buttons, soft icon buttons, a pill key, a speaker
   grille), with a wire loop and a jack cable lying beside them.

   Frameless by default (transparent, grounded by soft halos). `framed` wraps it
   in the kit's Plate with a title, a hint and a live readout.

   Run API: pass a ref and call `ref.current.run()` (or bump the `runKey`
   number prop) to restart the idle sequence. On the focused figure the arrow
   keys turn the lit knob, 1–6 press the buttons and Enter restarts; the pointer
   drags knobs round and presses buttons. It stops offscreen and holds one
   composed still under prefers-reduced-motion or an ancestor with
   data-rap-motion="still"; data-rap-motion="calm" slows and narrows it. */
import * as React from "react";
import type { CSSProperties } from "react";
import { Plate } from "../iso/react/draw";
import "../iso/iso.css";
import "./modules.css";
import { ModulesLive, type ModulesHandle } from "./live";

export type { ModulesHandle } from "./live";

export interface ControlModulesProps {
  className?: string;
  style?: CSSProperties;
  /** Wrap the figure in a card with a title, a hint and a live readout. */
  framed?: boolean;
  /** Change this number to restart the idle sequence (an alternative to ref.run()). */
  runKey?: number;
}

export const ControlModules = React.forwardRef<ModulesHandle, ControlModulesProps>(function ControlModules({ className, style, framed = false, runKey }, ref) {
  const live = <ModulesLive ref={ref} runKey={runKey} />;
  if (!framed) {
    return (
      <div className={className ? `iso cm ${className}` : "iso cm"} data-theme="light" style={style}>
        {live}
      </div>
    );
  }
  return (
    <div className={className ? `iso cm cm-framed ${className}` : "iso cm cm-framed"} data-theme="light" style={style}>
      <Plate fig="Fig 1" title="Control modules" hint="Drag knobs · 1–6 buttons · ← → lit knob" readout="knob 2 lit · 165°">
        {live}
      </Plate>
    </div>
  );
});
