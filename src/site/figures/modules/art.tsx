/* The static art of ControlModules as JSX, built once from geometry.ts: the
   props on the table, the tiles and everything sunk into their faces. The
   controls standing on the tiles are drawn by live.tsx with the pieces here. */
import * as React from "react";
import { Solid } from "../iso/react/draw";
import type { SolidPaths, Tone } from "../iso/iso-kit";
import {
  CLIP_HALO,
  CLIP_PATH,
  CLIP_W,
  HALO,
  JACK_PARTS,
  TILE_ORDER,
  TILE_PATHS,
  circleRecess,
  grilleGeo,
  type Recess,
} from "./geometry";
import { SOCKET_R, TILES, centreOf, topOf } from "./view";

/* shared paint: a smooth turn of tone across any round body (left lit, right in shade), and the
   same as a darkening veil for coloured caps; both span the body's own box */
export function Paints({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-round`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={{ stopColor: "var(--anatomy-shade-3)" }} />
        <stop offset="0.24" style={{ stopColor: "var(--anatomy-top)" }} />
        <stop offset="0.52" style={{ stopColor: "var(--anatomy-shade-3)" }} />
        <stop offset="0.8" style={{ stopColor: "var(--anatomy-shade-1)" }} />
        <stop offset="1" style={{ stopColor: "var(--anatomy-shade-0)" }} />
      </linearGradient>
      <linearGradient id={`${id}-veil`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={{ stopColor: "var(--anatomy-top)", stopOpacity: 0.28 }} />
        <stop offset="0.3" style={{ stopColor: "var(--anatomy-top)", stopOpacity: 0 }} />
        <stop offset="0.6" style={{ stopColor: "var(--cm-veil)", stopOpacity: 0 }} />
        <stop offset="1" style={{ stopColor: "var(--cm-veil)", stopOpacity: 0.36 }} />
      </linearGradient>
    </defs>
  );
}

/* a recess sunk into a face: its far wall in shade, its floor clipped by the opening, the rim on top */
export function RecessArt({ r, id, wall = 2 }: { r: Recess; id: string; wall?: number }) {
  return (
    <g className="cm-recess">
      <clipPath id={id}>
        <path d={r.rim} />
      </clipPath>
      <path className="cm-recess-wall" data-shade={wall} d={r.rim} />
      <path className="cm-recess-floor" d={r.floor} clipPath={`url(#${id})`} />
      <path className="iso-line" data-tone="lo" d={r.rim} />
    </g>
  );
}

/* the loose props: a wire loop and a short jack cable lying on the table */
export function Props() {
  return (
    <g data-part="props" className="cm-props">
      <path className="iso-halo cm-prop-halo" d={CLIP_HALO} />
      <path className="cm-wire-shadow" d={JACK_PARTS.halo} style={{ strokeWidth: JACK_PARTS.cableW * 1.6 }} />
      <path className="cm-tube-edge" d={CLIP_PATH} style={{ strokeWidth: CLIP_W + 1.1 }} />
      <path className="cm-tube" d={CLIP_PATH} style={{ strokeWidth: Math.max(0.4, CLIP_W - 1.1) }} />
      <path className="cm-tube-edge" d={JACK_PARTS.cable} style={{ strokeWidth: JACK_PARTS.cableW + 1.1 }} />
      <path className="cm-tube" d={JACK_PARTS.cable} style={{ strokeWidth: Math.max(0.4, JACK_PARTS.cableW - 1.1) }} />
      {JACK_PARTS.plugs.map((s, i) => (
        <path key={i} className="cm-plug" data-tone={s.tone} d={s.d} />
      ))}
    </g>
  );
}

/* the tiles, back to front, each with what is sunk into its face */
export function Tiles({ id, hole }: { id: string; hole: (k: number, el: SVGPathElement | null) => void }) {
  return (
    <g data-part="tiles">
      <path className="iso-halo cm-halo" d={HALO} />
      {TILE_ORDER.map((i) => {
        const t = TILES[i]!;
        const [cx, cy] = centreOf(t);
        const z = topOf(t);
        let face: React.ReactNode = null;
        if (t.ctl.kind === "knob" && t.cell[2] === 1) face = <RecessArt r={circleRecess(cx, cy, SOCKET_R, z, 3)} id={`${id}-sock-${t.id}`} wall={0} />;
        if (t.ctl.kind === "grille") face = <Grille i={i} hole={hole} />;
        return (
          <g key={t.id} data-tile={t.id}>
            <Solid paths={TILE_PATHS[i]!} tone="mid" crease="faint" className="cm-tile" />
            {face}
          </g>
        );
      })}
    </g>
  );
}

const GRILLES = new Map<number, ReturnType<typeof grilleGeo>>();
export const grilleOf = (i: number) => {
  if (!GRILLES.has(i)) GRILLES.set(i, grilleGeo(TILES[i]!));
  return GRILLES.get(i)!;
};

/* the speaker grille's holes: one path per ring, so a ripple can darken them ring by ring */
function Grille({ i, hole }: { i: number; hole: (k: number, el: SVGPathElement | null) => void }) {
  const g = grilleOf(i);
  return (
    <g className="cm-grille">
      {g.rings.map((d, k) => (
        <path key={k} ref={(el) => hole(k, el)} className="cm-hole" d={d} />
      ))}
    </g>
  );
}

/* a round body whose tone turns smoothly across it: fill, top, crease, bevel, outline */
export const Round = React.forwardRef<
  SVGGElement,
  { paths: SolidPaths; paint: string; tone?: Tone; crease?: Tone; className?: string; top?: boolean; children?: React.ReactNode }
>(function Round({ paths, paint, tone = "mid", crease = "faint", className, top = true, children }, ref) {
  return (
    <g ref={ref} className={className ? `iso-solid cm-round ${className}` : "iso-solid cm-round"}>
      <path className="iso-fill" d={paths.fill} style={{ fill: `url(#${paint}-round)` }} />
      <path className="iso-top" d={top ? paths.top : ""} />
      <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />
      <path className="iso-line iso-bevel" data-tone={crease} d={paths.bevel ?? ""} />
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
      {children}
    </g>
  );
});

export function writeRound(g: SVGGElement | null, p: SolidPaths) {
  if (!g) return;
  const c = g.children;
  c[0]?.setAttribute("d", p.fill);
  c[1]?.setAttribute("d", p.top);
  c[2]?.setAttribute("d", p.crease);
  c[3]?.setAttribute("d", p.bevel ?? "");
  c[4]?.setAttribute("d", p.outline);
}

/* a solid with the kit's faceted shades whose paths the loop rewrites (the pill key) */
export const LiveSolid = React.forwardRef<SVGGElement, { paths: SolidPaths; tone?: Tone; crease?: Tone; className?: string; children?: React.ReactNode }>(
  function LiveSolid({ paths, tone = "mid", crease = "faint", className, children }, ref) {
    return (
      <g ref={ref} className={className ? `iso-solid ${className}` : "iso-solid"}>
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
  },
);

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

/* the printed icons on the soft buttons, in the cushion's face plane (x along +x, y along +y, units of the world) */
export function IconArt({ icon }: { icon: "loop" | "tape" | "wave" }) {
  if (icon === "loop")
    return (
      <g className="cm-icon">
        <rect x={-6} y={-4.2} width={11} height={8.4} rx={4.2} />
        <path d="M-1.8 4.2 L-3.6 8" data-free="end" />
      </g>
    );
  if (icon === "tape")
    return (
      <g className="cm-icon">
        <circle cx={-4.4} cy={-0.6} r={2.9} />
        <circle cx={4.4} cy={-0.6} r={2.9} />
        <path d="M-4.4 2.3H4.4" />
      </g>
    );
  return (
    <g className="cm-icon">
      <path d="M-8 3.5V-1.5A2 2 0 0 1 -4 -1.5V1.5A2 2 0 0 0 0 1.5V-1.5A2 2 0 0 1 4 -1.5V1.5A2 2 0 0 0 8 1.5V-3.5" data-free="" />
    </g>
  );
}
