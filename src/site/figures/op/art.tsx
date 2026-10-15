/* The static art of the rapui OP as JSX, built once from geometry.ts: the
   body, the panel and everything printed on it. The raised controls are live
   (live.tsx) and drawn by LiveSolid, whose paths the loop rewrites. */
import * as React from "react";
import { Dots, FaceText, Line, Solid } from "../iso/react/draw";
import type { SolidPaths, Tone } from "../iso/iso-kit";
import {
  BEZEL,
  BODY_PATHS,
  BODY_SEAM,
  BRAND_AT,
  FADER_LABEL_AT,
  FADER_SLOT,
  FADER_TICKS,
  GLASS,
  GRILLE_DOTS,
  GRILLE_LABEL_AT,
  HALO,
  KNOB_LABEL_AT,
  KNOB_SCALE,
  KNOB_WORDS,
  MODEL_AT,
  PANEL_PATHS,
  SWITCH_OFF_AT,
  SWITCH_ON_AT,
  SWITCH_SLOT,
  WELLS,
} from "./geometry";

/* the slab, its top plate and the maker's mark on the front face */
export function Body() {
  return (
    <g data-part="body">
      <path className="iso-halo op-halo" d={HALO} />
      <Solid paths={BODY_PATHS} tone="hi" crease="lo" className="op-body" inner={<path className="iso-line" data-tone="faint" d={BODY_SEAM} />} />
      <FaceText transform={BRAND_AT} size={5.4} tone="mid">
        <tspan className="op-brand">rapui</tspan> OP
      </FaceText>
      <FaceText transform={MODEL_AT} size={4.2} tone="lo" anchor="end">
        six-step · 01
      </FaceText>
      <Solid paths={PANEL_PATHS} tone="mid" crease="faint" className="op-panel" />
    </g>
  );
}

/* everything printed or sunk into the panel's face, under the raised controls */
export function Prints() {
  return (
    <g data-part="prints">
      {/* the speaker grille and its word */}
      <Dots points={GRILLE_DOTS} size={1.45} tone="hi" />
      <FaceText transform={GRILLE_LABEL_AT} size={4.2} tone="lo" anchor="end">
        speaker
      </FaceText>
      {/* the switch slot */}
      <path className="op-slot" d={SWITCH_SLOT} />
      <FaceText transform={SWITCH_OFF_AT} size={4.2} tone="lo">
        dry
      </FaceText>
      <FaceText transform={SWITCH_ON_AT} size={4.2} tone="lo" anchor="end">
        wet
      </FaceText>
      {/* the fader slot and its scale */}
      <Line d={FADER_TICKS.minor} tone="lo" />
      <Line d={FADER_TICKS.major} tone="mid" />
      <path className="op-slot" d={FADER_SLOT} />
      <FaceText transform={FADER_LABEL_AT} size={4.2} tone="lo" anchor="end">
        vol
      </FaceText>
      {/* the encoders' dot scales and words */}
      {KNOB_SCALE.map((pts, i) => (
        <React.Fragment key={`scale-${i}`}>
          <Dots points={pts} size={0.95} tone="hi" />
          <FaceText transform={KNOB_LABEL_AT[i]!} size={4.4} tone="mid" anchor="middle">
            {KNOB_WORDS[i]}
          </FaceText>
        </React.Fragment>
      ))}
      {/* the key wells */}
      {WELLS.map((d, i) => (
        <path key={`well-${i}`} className="op-well" d={d} />
      ))}
    </g>
  );
}

/* the screen's bezel and glass; the live part draws the picture inside */
export function ScreenFrame() {
  return (
    <g data-part="screen">
      <path className="op-bezel" d={BEZEL} />
      <path className="op-glass" d={GLASS} />
    </g>
  );
}

/* a solid whose paths the loop rewrites: fill, four shades, top, crease, bevel, edge */
export const LiveSolid = React.forwardRef<
  SVGGElement,
  { paths: SolidPaths; tone?: Tone; crease?: Tone; lit?: boolean; className?: string; children?: React.ReactNode }
>(function LiveSolid({ paths, tone = "hi", crease = "faint", lit = false, className, children }, ref) {
  return (
    <g ref={ref} className={className ? `iso-solid ${className}` : "iso-solid"} data-lit={lit ? "" : undefined}>
      <path className="iso-fill" d={paths.fill} />
      {[0, 1, 2, 3].map((s) => (
        <path key={s} className="iso-shade" data-shade={s} d={paths.shades[s] ?? ""} />
      ))}
      <path className="iso-top" d={paths.top} />
      <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />
      <path className="iso-line iso-bevel" data-tone={crease} d={paths.bevel ?? ""} />
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
      {children}
    </g>
  );
});

export function writeSolid(g: SVGGElement | null, p: SolidPaths) {
  if (!g) return;
  const c = g.children;
  c[0]?.setAttribute("d", p.fill);
  for (let s = 0; s < 4; s++) c[1 + s]?.setAttribute("d", p.shades[s] ?? "");
  c[5]?.setAttribute("d", p.top);
  c[6]?.setAttribute("d", p.crease);
  c[7]?.setAttribute("d", p.bevel ?? "");
  c[8]?.setAttribute("d", p.outline);
}
