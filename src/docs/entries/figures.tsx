import { Display, Eyebrow, Figure, FIGURE_SHAPES, type FigureHidden, type FigureLook, type FigureShape } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const controls: Control[] = [
  { type: "select", prop: "shape", options: FIGURE_SHAPES, default: "icosahedron", codeDefault: null },
  { type: "number", prop: "size", min: 64, max: 320, step: 8, default: 240, codeDefault: 160 },
  { type: "number", prop: "speed", label: "speed (°/s)", min: 0, max: 90, step: 2, default: 16 },
  { type: "select", prop: "projection", options: ["iso", "perspective"], default: "iso" },
  { type: "select", prop: "backLines", label: "back lines", options: ["preset", "fade", "dash", "none", "show"], default: "preset", codeDefault: "preset" },
  { type: "select", prop: "look", options: ["preset", "line", "plot"], default: "preset", codeDefault: "preset" },
  { type: "number", prop: "strokeWidth", label: "stroke", min: 0.5, max: 3, step: 0.25, default: 1, codeDefault: 1 },
];

const opt = <T,>(v: unknown) => (v === "preset" ? undefined : (v as T));

/* a short line under each figure in the gallery: what it is, in the voice of a plate caption */
const CAPTIONS: Record<FigureShape, string> = {
  cube: "Hexahedron",
  tetrahedron: "Tetrahedron",
  octahedron: "Octahedron",
  icosahedron: "Icosahedron",
  dodecahedron: "Dodecahedron",
  sphere: "Sphere, 8 × 8",
  torus: "Torus",
  cylinder: "Cylinder",
  cone: "Cone",
  pyramid: "Pyramid, 5 courses",
  helix: "Double helix",
  knot: "Trefoil knot",
  stairs: "Stair, 5 risers",
  lattice: "Lattice, 3³",
  wave: "Standing wave",
  gyroscope: "Gyroscope",
  tesseract: "Tesseract",
};

export const entries: DocEntry[] = [
  {
    slug: "figure",
    name: "Figure",
    group: "Figures",
    description:
      "Thin-line 3D figures — the platonic solids, a torus, a trefoil knot, a gyroscope, a tesseract turning through the fourth dimension — drawn as hairlines in SVG and turning slowly on their own. The lines at the back fade (or dash, or drop out) so the solid reads without shading. Grab one and spin it. Each preset draws them its way: a touch heavier with the accent in fun, a plotter's dots on every corner in signal, one plain hairline elsewhere. No 3D library: a 4 KB projector.",
    controls,
    Demo: ({ p }) => (
      <Figure
        shape={p.shape as FigureShape}
        size={Number(p.size)}
        speed={Number(p.speed)}
        projection={p.projection as "iso"}
        backLines={opt<FigureHidden>(p.backLines)}
        look={opt<FigureLook>(p.look)}
        strokeWidth={Number(p.strokeWidth)}
      />
    ),
    code: (p) => `import { Figure } from "@rapui/react";

<Figure${attrs(p, controls)} />`,
    examples: [
      {
        title: "The set",
        Demo: () => (
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-4 gap-y-6">
            {FIGURE_SHAPES.map((s) => (
              <figure key={s} className="m-0 flex flex-col items-center gap-2">
                <Figure shape={s} size={112} />
                <figcaption className="text-[0.75rem] text-mute">{CAPTIONS[s]}</figcaption>
              </figure>
            ))}
          </div>
        ),
        code: `{FIGURE_SHAPES.map((shape) => <Figure key={shape} shape={shape} size={112} />)}`,
      },
      {
        title: "Beside a headline",
        Demo: () => (
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-6 max-[640px]:grid-cols-1">
            <div className="flex flex-col gap-4">
              <Eyebrow>Plate IV</Eyebrow>
              <Display size="lg" className="max-w-[14ch]">
                Every shape is a few hundred lines of light
              </Display>
              <p className="m-0 max-w-[40ch] text-ink-2">Drawn live, turned by hand, gone the moment it scrolls off screen.</p>
            </div>
            <Figure shape="torus" size={260} speed={10} label="" />
          </div>
        ),
        code: `<Figure shape="torus" size={260} speed={10} label="" /> {/* label="" — decoration */}`,
      },
    ],
  },
];
