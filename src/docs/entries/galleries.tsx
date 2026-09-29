import { useId, type ReactNode } from "react";
import { CardStack, FanGallery, Lightbox, ShapeGallery, TiltGallery, WarpStrip, useLightbox, type GalleryItem } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* ── demo artworks ─────────────────────────────────────────
   Generated posters, inline SVG, so the docs work offline and
   the layouts get real variety: portrait, landscape and square,
   loud colour, big type, a little grain. Accents come from the
   palette tokens; the poster's own paper and ink are fixed so a
   print looks like the same print in either theme. */

const PAPER = "#f3efe6";
const INK = "#1f1d1a";
const C = {
  flame: "var(--rap-flame)",
  blue: "var(--rap-blue)",
  plum: "var(--rap-plum)",
  acid: "var(--rap-acid)",
  bubble: "var(--rap-bubble)",
  sky: "var(--rap-sky)",
};
const FONT = { fontFamily: "var(--rap-font-sans)", letterSpacing: "-0.05em" } as const;

function Poster({ ratio, bg, children }: { ratio: number; bg: string; children: ReactNode }) {
  const id = useId().replace(/:/g, "");
  const W = 400;
  const H = Math.round(W / ratio);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`g${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={bg} />
      {children}
      <rect width={W} height={H} filter={`url(#g${id})`} opacity="0.22" style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

const T = ({ x, y, size, fill, children, anchor = "start", weight = 700 }: { x: number; y: number; size: number; fill: string; children: ReactNode; anchor?: "start" | "middle" | "end"; weight?: number }) => (
  <text x={x} y={y} fontSize={size} fill={fill} fontWeight={weight} textAnchor={anchor} style={FONT}>
    {children}
  </text>
);

const flower = (cx: number, cy: number, r: number, bumps = 12, depth = 0.1) =>
  Array.from({ length: 96 }, (_, k) => {
    const t = (k / 96) * Math.PI * 2;
    const rr = r * (1 - depth + depth * Math.cos(bumps * t));
    return `${k ? "L" : "M"}${(cx + rr * Math.cos(t)).toFixed(1)} ${(cy + rr * Math.sin(t)).toFixed(1)}`;
  }).join(" ") + "Z";

export const ART: GalleryItem[] = [
  {
    id: "sun-club",
    alt: "Poster: a big acid-yellow sun on flame orange, with the words sun club",
    title: "Sun Club",
    caption: "Risograph, 2024",
    ratio: 4 / 5,
    node: (
      <Poster ratio={4 / 5} bg={C.flame}>
        <circle cx="200" cy="210" r="140" fill={C.acid} />
        <T x={200} y={440} size={92} fill={INK} anchor="middle">sun club</T>
        <T x={200} y={40} size={18} fill={INK} weight={500} anchor="middle">no. 01 — summer issue</T>
      </Poster>
    ),
  },
  {
    id: "blue-hour",
    alt: "Poster: sky-blue stripes under a white half sun on blue, the words blue hour",
    title: "Blue Hour",
    caption: "Screen print, 3 colours",
    ratio: 3 / 2,
    node: (
      <Poster ratio={3 / 2} bg={C.blue}>
        <circle cx="200" cy="168" r="84" fill={PAPER} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x="0" y={160 + i * 18 + i * i} width="400" height={12 - i * 1.6} fill={C.sky} />
        ))}
        <rect x="0" y="160" width="400" height="120" fill={C.blue} opacity="0.35" />
        <T x={200} y={78} size={44} fill={PAPER} anchor="middle">blue hour</T>
      </Poster>
    ),
  },
  {
    id: "plum-days",
    alt: "Poster: four pink quarter circles turning on plum, the words plum days",
    title: "Plum Days",
    caption: "Offset, 2023",
    ratio: 1,
    node: (
      <Poster ratio={1} bg={C.plum}>
        <path d="M60 60h120a120 120 0 0 1-120 120z" fill={C.bubble} />
        <path d="M340 60v120a120 120 0 0 1-120-120z" fill={C.bubble} />
        <path d="M60 340v-120a120 120 0 0 1 120 120z" fill={C.bubble} />
        <circle cx="280" cy="280" r="60" fill={C.acid} />
        <T x={200} y={214} size={40} fill={PAPER} anchor="middle">plum days</T>
      </Poster>
    ),
  },
  {
    id: "acid-test",
    alt: "Poster: a grid of black dots with one orange dot on acid yellow, the words acid test",
    title: "Acid Test",
    caption: "Type specimen",
    ratio: 2 / 3,
    node: (
      <Poster ratio={2 / 3} bg={C.acid}>
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={60 + (i % 5) * 70} cy={60 + Math.floor(i / 5) * 62} r="22" fill={i === 17 ? C.flame : INK} />
        ))}
        <rect x="0" y="410" width="400" height="190" fill={C.acid} />
        <T x={200} y={488} size={84} fill={INK} anchor="middle">acid test</T>
      </Poster>
    ),
  },
  {
    id: "soft-machine",
    alt: "Poster: an orange arch on bubble pink, the words soft machine",
    title: "Soft Machine",
    caption: "Gig poster, Lisbon",
    ratio: 3 / 4,
    node: (
      <Poster ratio={3 / 4} bg={C.bubble}>
        <path d="M80 480V230a120 120 0 0 1 240 0v250z" fill={C.flame} />
        <circle cx="200" cy="232" r="46" fill={C.bubble} />
        <T x={200} y={80} size={52} fill={INK} anchor="middle">soft machine</T>
        <T x={200} y={508} size={18} fill={INK} anchor="middle" weight={500}>fri 14.06 — doors 21:00</T>
      </Poster>
    ),
  },
  {
    id: "big-r",
    alt: "Poster: a giant black lowercase r with an orange dot on cream paper",
    title: "Big R",
    caption: "Letterpress, edition of 40",
    ratio: 1,
    node: (
      <Poster ratio={1} bg={PAPER}>
        <T x={96} y={352} size={400} fill={INK} weight={800}>r</T>
        <circle cx="300" cy="306" r="40" fill={C.flame} />
        <T x={200} y={48} size={18} fill={INK} anchor="middle" weight={500}>alphabet series · 18/26</T>
      </Poster>
    ),
  },
  {
    id: "night-swim",
    alt: "Poster: sky-blue wavy lines on near-black, the words night swim",
    title: "Night Swim",
    caption: "Film still, 16:9",
    ratio: 16 / 9,
    node: (
      <Poster ratio={16 / 9} bg={INK}>
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${110 + i * 16} C 60 ${96 + i * 16}, 120 ${124 + i * 16}, 200 ${110 + i * 16} S 340 ${96 + i * 16}, 410 ${110 + i * 16}`}
            stroke={C.sky}
            strokeWidth={5 - i * 0.5}
            fill="none"
            opacity={1 - i * 0.1}
          />
        ))}
        <circle cx="200" cy="34" r="14" fill={PAPER} />
        <T x={200} y={92} size={36} fill={PAPER} anchor="middle">night swim</T>
      </Poster>
    ),
  },
  {
    id: "half-half",
    alt: "Poster: a canvas split diagonally into orange and blue, with a cream circle across the split",
    title: "Half & Half",
    caption: "Poster for a talk on colour",
    ratio: 4 / 5,
    node: (
      <Poster ratio={4 / 5} bg={C.blue}>
        <path d="M0 0H400L0 500Z" fill={C.flame} />
        <circle cx="200" cy="250" r="110" fill={PAPER} />
        <T x={200} y={262} size={38} fill={INK} anchor="middle">half & half</T>
      </Poster>
    ),
  },
  {
    id: "orbit",
    alt: "Poster: plum rings on sky blue with an orange ball on an orbit",
    title: "Orbit",
    caption: "Animated cover, frame 1",
    ratio: 1,
    node: (
      <Poster ratio={1} bg={C.sky}>
        {[150, 118, 86, 54].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={C.plum} strokeWidth={i === 0 ? 3 : 14} />
        ))}
        <circle cx="200" cy="200" r="24" fill={C.plum} />
        <circle cx="306" cy="94" r="20" fill={C.flame} />
        <T x={200} y={386} size={30} fill={INK} anchor="middle">orbit</T>
      </Poster>
    ),
  },
  {
    id: "stripes",
    alt: "Poster: orange and cream vertical stripes with an acid circle, the words stripes forever",
    title: "Stripes Forever",
    caption: "Wallpaper study",
    ratio: 4 / 3,
    node: (
      <Poster ratio={4 / 3} bg={PAPER}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 40} y="0" width="20" height="300" fill={C.flame} />
        ))}
        <circle cx="200" cy="130" r="84" fill={C.acid} />
        <rect x="84" y="222" width="232" height="58" rx="29" fill={INK} />
        <T x={200} y={260} size={30} fill={PAPER} anchor="middle">stripes forever</T>
      </Poster>
    ),
  },
  {
    id: "loud-type",
    alt: "Poster: the word loud repeated five times in cream on blue, one line in acid",
    title: "Loud Type",
    caption: "Festival identity",
    ratio: 3 / 4,
    node: (
      <Poster ratio={3 / 4} bg={C.blue}>
        {[0, 1, 2, 3, 4].map((i) => (
          <T key={i} x={-8} y={120 + i * 104} size={140} fill={i === 2 ? C.acid : PAPER} weight={800}>
            loud
          </T>
        ))}
      </Poster>
    ),
  },
  {
    id: "flower-power",
    alt: "Poster: a pink scalloped flower with a plum centre on acid yellow",
    title: "Flower Power",
    caption: "Sticker sheet, die-cut",
    ratio: 3 / 4,
    node: (
      <Poster ratio={3 / 4} bg={C.acid}>
        <path d={flower(200, 250, 150)} fill={C.bubble} />
        <circle cx="200" cy="250" r="62" fill={C.plum} />
        <T x={200} y={470} size={44} fill={INK} anchor="middle">flower power</T>
      </Poster>
    ),
  },
];

/* the gallery + its lightbox, as every demo wires them */
function WithLightbox({ children, items = ART }: { children: (open: ReturnType<typeof useLightbox>["open"]) => ReactNode; items?: GalleryItem[] }) {
  const lb = useLightbox();
  return (
    <>
      {children(lb.open)}
      <Lightbox items={items} {...lb.props} />
    </>
  );
}

const LB_SNIPPET = `const lb = useLightbox();`;

/* ── controls ───────────────────────────────────────────── */
const tiltControls: Control[] = [
  { type: "number", prop: "max", label: "max tilt (°)", min: 0, max: 20, default: 10 },
  { type: "number", prop: "minWidth", label: "min column (px)", min: 120, max: 320, step: 10, default: 160, codeDefault: 190 },
  { type: "boolean", prop: "glare", default: true },
  { type: "boolean", prop: "lean", default: true },
  { type: "boolean", prop: "captions", default: true },
];
const stackControls: Control[] = [
  { type: "number", prop: "mess", label: "mess (°)", min: 0, max: 15, default: 6 },
  { type: "number", prop: "depth", min: 1, max: 6, default: 4 },
  { type: "number", prop: "width", min: 200, max: 360, step: 10, default: 280 },
  { type: "boolean", prop: "controls", default: true },
];
const stripControls: Control[] = [
  { type: "select", prop: "direction", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "number", prop: "skew", label: "max skew (°)", min: 0, max: 20, default: 10 },
  { type: "number", prop: "stretch", min: 0, max: 0.3, step: 0.01, default: 0.12 },
  { type: "number", prop: "size", min: 160, max: 400, step: 10, default: 280, codeDefault: 300 },
  { type: "boolean", prop: "captions", default: true },
  { type: "boolean", prop: "fade", default: true },
];
const shapeControls: Control[] = [
  { type: "select", prop: "morph", options: ["swap", "none", "circle", "pill", "arch", "blob", "flower", "rect"], default: "swap" },
  { type: "number", prop: "tilt", label: "tilt (°)", min: 0, max: 12, default: 5 },
  { type: "number", prop: "size", min: 120, max: 260, step: 10, default: 180, codeDefault: 200 },
  { type: "boolean", prop: "captions", default: true },
];
const fanControls: Control[] = [
  { type: "number", prop: "size", min: 120, max: 260, step: 10, default: 200 },
  { type: "boolean", prop: "captions", default: true },
];
const lbControls: Control[] = [{ type: "boolean", prop: "rail", default: true }];

/* min-w-0: the stage is a grid, and a scroller inside an auto track would otherwise size the track to its whole content */
const WRAP = "w-full min-w-0 py-2";

export const entries: DocEntry[] = [
  {
    slug: "tilt-gallery",
    name: "Tilt gallery",
    group: "Galleries",
    description:
      "A grid of pictures for portfolios and moodboards; each card opens a Lightbox through `onOpen`. Delight: move over a card and it turns toward your hand with a glare sliding across it, its neighbours lean out of the way, and pressing squashes it like a print under a thumb.",
    controls: tiltControls,
    Demo: ({ p }) => (
      <div className={WRAP}>
        <WithLightbox>
          {(open) => (
            <TiltGallery
              items={ART.slice(0, 9)}
              max={Number(p.max)}
              minWidth={Number(p.minWidth)}
              glare={Boolean(p.glare)}
              lean={Boolean(p.lean)}
              captions={Boolean(p.captions)}
              onOpen={open}
            />
          )}
        </WithLightbox>
      </div>
    ),
    code: (p) => `import { TiltGallery, Lightbox, useLightbox } from "@rapui/react";

${LB_SNIPPET}

<TiltGallery items={posters}${attrs(p, tiltControls)} onOpen={lb.open} />
<Lightbox items={posters} {...lb.props} />`,
  },
  {
    slug: "card-stack",
    name: "Card stack",
    group: "Galleries",
    description:
      "A pile of pictures, one on top: flick through a collection one at a time with a drag, the arrow keys or the buttons; clicking the top card opens it. Delight: throw the top print and it flies off with your speed and spin, the pile shuffles up, and the print slides back in under the bottom — going back pulls it out from under the pile again.",
    controls: stackControls,
    Demo: ({ p }) => (
      <div className="w-full min-w-0 py-6">
        <WithLightbox>
          {(open) => (
            <CardStack
              items={ART}
              aria-label="Posters"
              mess={Number(p.mess)}
              depth={Number(p.depth)}
              width={Number(p.width)}
              controls={Boolean(p.controls)}
              onOpen={open}
            />
          )}
        </WithLightbox>
      </div>
    ),
    code: (p) => `import { CardStack } from "@rapui/react";

<CardStack items={posters} aria-label="Posters"${attrs(p, stackControls)} onOpen={lb.open} />`,
  },
  {
    slug: "warp-strip",
    name: "Warp strip",
    group: "Galleries",
    description:
      "A scrolling strip of pictures at their natural proportions — drag it with the mouse, swipe, scroll or use the arrow keys; `direction=\"vertical\"` makes it a column. Delight: throw it and the prints lean back and stretch with the speed like a rubber sheet, then spring upright with one wobble when it stops.",
    controls: stripControls,
    Demo: ({ p }) => (
      <div className={WRAP}>
        <WithLightbox>
          {(open) => (
            <WarpStrip
              items={ART}
              direction={p.direction as "horizontal" | "vertical"}
              skew={Number(p.skew)}
              stretch={Number(p.stretch)}
              size={Number(p.size)}
              captions={Boolean(p.captions)}
              fade={Boolean(p.fade)}
              onOpen={open}
            />
          )}
        </WithLightbox>
      </div>
    ),
    code: (p) => `import { WarpStrip } from "@rapui/react";

<WarpStrip items={posters}${attrs(p, stripControls)} onOpen={lb.open} />`,
    examples: [
      {
        title: "Vertical column",
        Demo: () => (
          <div className="w-full min-w-0 max-w-80 mx-auto">
            <WarpStrip items={ART.slice(3, 10)} direction="vertical" size={240} length={480} captions={false} aria-label="Posters, vertical" />
          </div>
        ),
        code: `<WarpStrip items={posters} direction="vertical" size={240} length={480} captions={false} />`,
      },
    ],
  },
  {
    slug: "shape-gallery",
    name: "Shape gallery",
    group: "Galleries",
    description:
      "A loose collage of pictures cut into circles, pills, arches, blobs and scalloped stickers — for moodboards, team pages and editorial covers. Set `shape` per item or let it cycle. Delight: hover a piece and it lifts off the board, straightens, and its cut-out morphs into another shape point by point.",
    controls: shapeControls,
    Demo: ({ p }) => (
      <div className={WRAP}>
        <WithLightbox items={ART.slice(0, 7)}>
          {(open) => (
            <ShapeGallery
              items={ART.slice(0, 7)}
              morph={p.morph as "swap"}
              tilt={Number(p.tilt)}
              size={Number(p.size)}
              captions={Boolean(p.captions)}
              onOpen={open}
            />
          )}
        </WithLightbox>
      </div>
    ),
    code: (p) => `import { ShapeGallery } from "@rapui/react";

// shape per item is optional: "circle" | "pill" | "arch" | "blob" | "flower" | "rect"
<ShapeGallery items={posters}${attrs(p, shapeControls)} onOpen={lb.open} />`,
  },
  {
    slug: "fan-gallery",
    name: "Fan gallery",
    group: "Galleries",
    description:
      "Pictures fanned out like a hand of playing cards: pick one to bring it to the front, click it again (or press Enter) to open it. Arrow keys walk the hand. Delight: run your pointer along the fan and the cards part around it to let it rise; choosing one turns the whole hand so it stands upright in front.",
    controls: fanControls,
    Demo: ({ p }) => (
      <div className={WRAP}>
        <WithLightbox items={ART.slice(0, 9)}>
          {(open) => <FanGallery items={ART.slice(0, 9)} size={Number(p.size)} captions={Boolean(p.captions)} onOpen={open} />}
        </WithLightbox>
      </div>
    ),
    code: (p) => `import { FanGallery } from "@rapui/react";

<FanGallery items={posters}${attrs(p, fanControls)} onOpen={lb.open} />`,
  },
  {
    slug: "lightbox",
    name: "Lightbox",
    group: "Galleries",
    basedOn: "Radix Dialog",
    description:
      "Full-screen viewer for any gallery (pass `lb.open` as its `onOpen`) or your own thumbnails: swipe, drag or use ←/→ to step, a thumbnail rail and a counter, Escape to close. Delight: the picture flies out of its thumbnail and grows to fill the dark; the ends give like a rubber band, and pulling it down shrinks it in your hand as the lights come back — let go and it flies home to its slot.",
    controls: lbControls,
    Demo: ({ p }) => {
      const lb = useLightbox();
      return (
        <div className="w-full min-w-0 py-4">
          <div data-gallery="" className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 w-full max-w-160 mx-auto">
            {ART.map((it, i) => (
              <button
                key={it.id}
                type="button"
                data-gallery-index={i}
                aria-label={it.alt}
                onClick={(e) => lb.open(i, e.currentTarget)}
                className="relative aspect-square p-0 border-0 overflow-hidden rounded-[18px] bg-paper-3 cursor-zoom-in outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring [&>span>svg]:block [&>span>svg]:size-full"
              >
                <span className="absolute inset-0 block" aria-hidden>
                  {it.node}
                </span>
              </button>
            ))}
          </div>
          <Lightbox items={ART} rail={Boolean(p.rail)} {...lb.props} />
        </div>
      );
    },
    code: (p) => `import { Lightbox, useLightbox } from "@rapui/react";

const lb = useLightbox();

// any thumbnail: pass the element so the picture can fly out of it
<button data-gallery-index={i} onClick={(e) => lb.open(i, e.currentTarget)}>…</button>

<Lightbox items={pictures}${attrs(p, lbControls)} {...lb.props} />`,
  },
];
