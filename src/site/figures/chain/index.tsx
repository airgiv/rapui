/* ChainReaction — a Rube Goldberg marble machine drawn with the Anatomy skill,
   made to sit big beside a hero's headline.

   Frameless by default: the machine stands straight on the page (transparent,
   grounded by the halo under its plinth). `framed` wraps it in the kit's Plate
   with a title, a hint and a live readout.

   Run API: pass a ref and call `ref.current.run()` (or bump the `runKey`
   number prop). The machine then hurries, continuously, to the start of the
   next run and plays it; a click, a tap, Enter or Space on the focused figure
   do the same. It runs by itself (a run takes about 12.8 s), stops offscreen,
   and holds one composed still under prefers-reduced-motion or an ancestor with
   data-rap-motion="still". */
import * as React from "react";
import type { CSSProperties } from "react";
import { Plate } from "../iso/react/draw";
import "../iso/iso.css";
import "./chain.css";
import { ChainLive, type ChainHandle } from "./live";
import { readoutOf, STILL_T } from "./model";
import { K, RAIL_R } from "./view";

export type { ChainHandle } from "./live";

export interface ChainReactionProps {
  className?: string;
  style?: CSSProperties;
  /** Wrap the machine in a card with a title, a hint and a live readout. */
  framed?: boolean;
  /** Change this number to restart the run (an alternative to ref.run()). */
  runKey?: number;
}

const RAIL = `${Math.round(RAIL_R * 1.5 * K * 100) / 100}px`;

export const ChainReaction = React.forwardRef<ChainHandle, ChainReactionProps>(function ChainReaction({ className, style, framed = false, runKey }, ref) {
  const vars = { "--cr-rail": RAIL, ...style } as CSSProperties;
  const live = <ChainLive ref={ref} framed={framed} runKey={runKey} />;
  if (!framed) {
    return (
      <div className={className ? `iso cr ${className}` : "iso cr"} data-theme="light" style={vars}>
        {live}
      </div>
    );
  }
  return (
    <div className={className ? `iso cr cr-framed ${className}` : "iso cr cr-framed"} data-theme="light" style={vars}>
      <Plate fig="Fig 1" title="Chain reaction" hint="Click or press Enter to run" readout={readoutOf(STILL_T)}>
        {live}
      </Plate>
    </div>
  );
});
