/* Static parts as JSX, built once at module load from geometry.ts, plus the
   small pieces the live component fills in each frame (moving solids and the
   marbles). */
import * as React from "react";
import { Dots, Line, Solid } from "../iso/react/draw";
import type { SolidPaths, Tone } from "../iso/iso-kit";
import type { Item } from "./geometry";
import { BALL } from "./solids";

export function Items({ items, name }: { items: Item[]; name: string }) {
  return (
    <g data-part={name}>
      {items.map((item, i) => {
        switch (item.k) {
          case "solid":
            return <Solid key={i} paths={item.p} tone={item.tone} crease={item.crease} inner={item.inner ? <path className="iso-line" data-tone="faint" d={item.inner} /> : undefined} />;
          case "line":
            return <Line key={i} d={item.d} tone={item.tone} free={item.free || undefined} />;
          case "dots":
            return <Dots key={i} points={item.pts} size={item.size} tone={item.tone} />;
          case "rail":
            return (
              <g key={i} className="cr-rail" data-tone={item.tone}>
                <path className="cr-rail-o" d={item.d} />
                <path className="cr-rail-i" d={item.d} />
              </g>
            );
          case "halo":
            return <path key={i} className="iso-halo" d={item.d} />;
        }
        return null;
      })}
    </g>
  );
}

/* a solid whose paths the loop rewrites: fill, four shades, top, crease, edge */
export const LiveSolid = React.forwardRef<SVGGElement, { paths: SolidPaths; tone?: Tone; crease?: Tone; lit?: boolean; className?: string }>(function LiveSolid(
  { paths, tone = "hi", crease = "faint", lit = false, className },
  ref,
) {
  return (
    <g ref={ref} className={className ? `iso-solid ${className}` : "iso-solid"} data-lit={lit ? "" : undefined}>
      <path className="iso-fill" d={paths.fill} />
      {[0, 1, 2, 3].map((s) => (
        <path key={s} className="iso-shade" data-shade={s} d={paths.shades[s] ?? ""} />
      ))}
      <path className="iso-top" d={paths.top} />
      <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
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
  c[7]?.setAttribute("d", p.outline);
}

/* one marble, drawn at the origin; the lit copy sits over the plain one and fades in */
export function Marble() {
  return (
    <>
      <g className="cr-ball">
        <circle className="cr-ball-fill" r={BALL.r} />
        <path className="cr-ball-shade" d={BALL.shade} />
        <circle className="cr-ball-glint" cx={BALL.glint[0]} cy={BALL.glint[1]} r={BALL.glintR} />
        <circle className="cr-ball-edge" r={BALL.r} />
      </g>
      <g className="cr-ball" data-lit="">
        <circle className="cr-ball-fill" r={BALL.r} />
        <path className="cr-ball-shade" d={BALL.shade} />
        <circle className="cr-ball-glint" cx={BALL.glint[0]} cy={BALL.glint[1]} r={BALL.glintR} />
        <circle className="cr-ball-edge" r={BALL.r} />
      </g>
    </>
  );
}
