/* The static art of ControlModules as JSX, built once from geometry.ts: the
   tiles and everything sunk into their faces. The
   controls standing on the tiles are drawn by live.tsx with the pieces here. */
import * as React from "react";
import { Dots, FaceText, Solid } from "../iso/react/draw";
import type { SolidPaths, Tone } from "../iso/iso-kit";
import {
  circleRecess,
  grilleGeo,
  knobScale,
  labelAt,
  type Recess,
} from "./geometry";
import { SOCKET_R, centreOf, labelOf, tileFill, topOf, type Tile } from "./view";
import type { World } from "./world";

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
      <radialGradient id={`${id}-ball`} cx="0.38" cy="0.34" r="0.72">
        <stop offset="0" style={{ stopColor: "var(--anatomy-top)" }} />
        <stop offset="0.45" style={{ stopColor: "var(--anatomy-shade-3)" }} />
        <stop offset="0.8" style={{ stopColor: "var(--anatomy-shade-1)" }} />
        <stop offset="1" style={{ stopColor: "var(--anatomy-shade-0)" }} />
      </radialGradient>
      {/* the same turn of tone over each of a look's fills (--mod-fill-1..6); without fills they equal "round" */}
      {["1", "2", "3", "4", "5", "6", "brass", "wood", "slate", "cream"].map((k) => (
        <linearGradient key={k} id={`${id}-rf${k}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: `var(--rf${k}-0, var(--anatomy-shade-3))` }} />
          <stop offset="0.24" style={{ stopColor: `var(--rf${k}-1, var(--anatomy-top))` }} />
          <stop offset="0.52" style={{ stopColor: `var(--rf${k}-2, var(--anatomy-shade-3))` }} />
          <stop offset="0.8" style={{ stopColor: `var(--rf${k}-3, var(--anatomy-shade-1))` }} />
          <stop offset="1" style={{ stopColor: `var(--rf${k}-4, var(--anatomy-shade-0))` }} />
        </linearGradient>
      ))}
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

/* the tiles, back to front, each with what is sunk into its face. A grille tile is also the figure's sound
   switch (data-ctl "snd-…"), with a small lamp in its front corner. */
export function Tiles({
  id,
  world,
  halo = true,
  tile,
  hole,
  lamp,
}: {
  id: string;
  world: World;
  halo?: boolean; // the field draws its shadows itself, so they can wrap
  tile?: (i: number, el: SVGGElement | null) => void;
  hole: (g: number, k: number, el: SVGPathElement | null) => void;
  lamp: (g: number, el: SVGPathElement | null) => void;
}) {
  return (
    <g data-part="tiles">
      {halo ? <path className="iso-halo cm-halo" d={world.halo} /> : null}
      {world.tileOrder.map((i) => {
        const t = world.tiles[i]!;
        const [cx, cy] = centreOf(t);
        const z = topOf(t);
        let face: React.ReactNode = null;
        if (t.ctl.kind === "knob" && t.cell[2] === 1) face = <RecessArt r={circleRecess(cx, cy, SOCKET_R, z, 3)} id={`${id}-sock-${t.id}`} wall={0} />;
        const gi = world.grilles.indexOf(t);
        if (gi >= 0) face = <Grille t={t} hole={(k, el) => hole(gi, k, el)} lamp={(el) => lamp(gi, el)} />;
        // the lab bench: a dot scale round each small knob and an engraved mono label on every tile
        let bench: React.ReactNode = null;
        if (world.set === "lab") {
          const sc = t.ctl.kind === "knob" && !t.ctl.jog && t.cell[2] === 1 ? knobScale(t) : null;
          const word = labelOf(t, i);
          bench = (
            <>
              {sc ? (
                <>
                  <Dots points={sc.minor} size={0.85} tone="mid" />
                  <Dots points={sc.major} size={1.35} tone="hi" />
                </>
              ) : null}
              {word ? (
                <FaceText transform={labelAt(t)} size={5} tone="mid">
                  {word}
                </FaceText>
              ) : null}
            </>
          );
        }
        return (
          <g
            key={t.id}
            ref={tile ? (el) => tile(i, el) : undefined}
            data-tile={t.id}
            data-fill={tileFill(t) || undefined}
            data-ctl={gi >= 0 ? `snd-${gi}` : undefined}
          >
            <Solid paths={world.tilePaths[i]!} tone="mid" crease="faint" className="cm-tile" />
            {face}
            {bench}
          </g>
        );
      })}
    </g>
  );
}

const GRILLES = new Map<Tile, ReturnType<typeof grilleGeo>>();
export const grilleOf = (t: Tile) => {
  if (!GRILLES.has(t)) GRILLES.set(t, grilleGeo(t));
  return GRILLES.get(t)!;
};

/* the speaker grille's holes: one path per ring, so a ripple can darken them ring by ring; and its sound lamp */
function Grille({ t, hole, lamp }: { t: Tile; hole: (k: number, el: SVGPathElement | null) => void; lamp: (el: SVGPathElement | null) => void }) {
  const g = grilleOf(t);
  return (
    <g className="cm-grille">
      {g.rings.map((d, k) => (
        <path key={k} ref={(el) => hole(k, el)} className="cm-hole" d={d} />
      ))}
      <path className="iso-line" data-tone="faint" d={g.lampRing} />
      <path ref={lamp} className="cm-lamp" d={g.lamp} />
    </g>
  );
}

/* a round body whose tone turns smoothly across it: fill, top, crease, bevel, outline */
export const Round = React.forwardRef<
  SVGGElement,
  { paths: SolidPaths; paint: string; tone?: Tone; crease?: Tone; className?: string; top?: boolean; fill?: number | string; children?: React.ReactNode }
>(function Round({ paths, paint, tone = "mid", crease = "faint", className, top = true, fill = 0, children }, ref) {
  return (
    <g ref={ref} className={className ? `iso-solid cm-round ${className}` : "iso-solid cm-round"} data-fill={fill || undefined}>
      <path className="iso-fill" d={paths.fill} style={{ fill: `url(#${paint}-${fill ? `rf${fill}` : "round"})` }} />
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
export const LiveSolid = React.forwardRef<
  SVGGElement,
  { paths: SolidPaths; tone?: Tone; crease?: Tone; className?: string; fill?: number | string; children?: React.ReactNode }
>(function LiveSolid({ paths, tone = "mid", crease = "faint", className, fill = 0, children }, ref) {
    return (
      <g ref={ref} className={className ? `iso-solid ${className}` : "iso-solid"} data-fill={fill || undefined}>
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
