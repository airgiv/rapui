/* Component factory — an Anatomy figure for rapui's one idea: the same
   components, five characters. Blank plates ride an indexing belt from a
   hopper through a style press; the press's five-position dial is the
   page's preset, its die stamps that preset's corner into every blank, and
   the belt carries the finished parts to a crate. */
import type * as React from "react";
import type { RapPreset } from "../../../rapui";
import "../iso/iso.css";
import "./factory.css";
import { Plate } from "../iso/react/draw";
import { FactoryLive, type Layers } from "./live";
import {
  ARM_ART,
  BELT_ART,
  CRATE_BACK_ART,
  CRATE_FRONT_ART,
  DIAL_ART,
  DRUM_ART,
  FRONT,
  FRONT_RAIL,
  HALOS,
  HOPPER_BACK,
  HOPPER_FRONT,
  PRESS_BACK,
  RAM_ART,
  STACK_ART,
  UNDER,
} from "./geometry";
import { PILE } from "./frame";
import { readoutOf, STOCK } from "./model";

const LAYERS: Layers = {
  halos: HALOS,
  pressBack: PRESS_BACK,
  under: UNDER,
  crateBack: CRATE_BACK_ART,
  belt: BELT_ART,
  drum: DRUM_ART,
  hopperBack: HOPPER_BACK,
  ram: RAM_ART,
  stack: STACK_ART,
  hopperFront: HOPPER_FRONT,
  arm: ARM_ART,
  dial: DIAL_ART,
  frontRail: FRONT_RAIL,
  front: FRONT,
  crateFront: CRATE_FRONT_ART,
  pile: PILE,
};

const LABEL =
  "A component factory: a conveyor belt on legs runs from a hopper of blank plates, under a style press, to a crate. " +
  "The press has a five-position selector dial — fun, civic, signal, product, minimal — and its die stamps the chosen character's corner radius into every blank: " +
  "very round pills for fun and civic, small corners for signal and product, square for minimal. " +
  "The blanks come out as a button, a radio button, a switch, a text field and a checkbox, and the belt carries them to the crate.";

export function ComponentFactory({
  preset,
  onPreset,
  className,
  style,
}: {
  preset: RapPreset;
  onPreset?: (p: RapPreset) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className ? `iso fac ${className}` : "iso fac"} data-theme="light" style={style}>
      <Plate fig="Fig 1" title="Component factory" hint="Turn the dial · 1–5 · Space pauses" readout={readoutOf(preset, STOCK)}>
        <FactoryLive preset={preset} onPreset={onPreset} label={LABEL} layers={LAYERS} />
      </Plate>
    </div>
  );
}
