import type { CSSProperties, ReactNode, SVGProps } from "react";
import { cn } from "../utils";
import "./EditorToolbar.css";

/* ── the editor icon set ─────────────────────────────────────
   Bespoke glyphs for the big EditorToolbar — the "fun" tier between
   the technical Hugeicons set (icons.tsx) and the illustrative Solar
   one (FancyIcon). Drawn by hand on a 32px grid, 2px round strokes.

   Two-tone like a riso print: a soft filled shape sits BEHIND the ink
   and a little off-register (1.5–2px down-right), so the strokes mostly
   cross paper rather than colour and stay legible in both themes. The
   fill reads `--tone` (any colour — the toolbar sets a per-tool tint,
   and swaps it for a bright one on the selected pad); without it the
   fill is 16% of the ink.

   Each icon has ONE small motion that plays while its host is hovered
   (`.rap-eti-host:hover`) or picked (`.rap-eti-on`): the cursor clicks,
   the hand waves, the pen wiggles and draws, the sticker peels, the
   ball bounces… The moving part carries `--eti-a` (its animation
   shorthand) and one shared class that only applies it behind `fun:`,
   so calm and reduced motion keep every icon still. Keyframes live in
   EditorToolbar.css. Parts animate the individual `translate` /
   `rotate` / `scale` properties so they never fight an SVG transform. */

export interface EditorIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Pixel size (or any CSS length). Default 32 — the grid it is drawn on. */
  size?: number | string;
  /** Fill colour for the soft shape; sets `--tone`. */
  tone?: string;
}
export type EditorIconComponent = (props: EditorIconProps) => ReactNode;

const PART = cn(
  "[transform-box:fill-box]",
  "fun:in-[.rap-eti-host:hover]:[animation:var(--eti-a)]",
  "fun:in-[.rap-eti-on]:[animation:var(--eti-a)]",
);
/** the soft fill, off-register behind the ink */
const TONE: CSSProperties = { fill: "var(--tone, color-mix(in oklab, currentColor 16%, transparent))", stroke: "none" };

/** A moving part: its animation and where it pivots. */
const m = (a: string, origin = "50% 50%", extra?: CSSProperties) =>
  ({ "--eti-a": a, transformOrigin: origin, ...extra }) as CSSProperties;

function Svg({ size = 32, tone, className, style, children, ...rest }: EditorIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      data-slot="editor-icon"
      className={cn("rap-eti shrink-0 overflow-visible", className)}
      style={{ ...(tone ? { "--tone": tone } : null), ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </svg>
  );
}

const CURSOR = "M8 4.5v20.2l5.4-5 3.9 8.3 3.7-1.7-3.9-8.2 7.4-.6z";

/** A fat arrow cursor. Motion: it clicks — presses in, and three sparks flick off the tip. */
export function SelectIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <g className={PART} style={m("eti-click 520ms var(--rap-ease-out)", "20% 10%")}>
        <path d={CURSOR} style={TONE} transform="translate(2 2)" />
        <path d={CURSOR} />
      </g>
      <g className={cn(PART, "opacity-0")} style={m("eti-spark 520ms var(--rap-ease-out)", "100% 100%")}>
        <path d="M4.5 4.5 2.5 2.5M8 2V.5M4.5 8H2.5" />
      </g>
    </Svg>
  );
}

/** A chunky open hand. Motion: a friendly wave from the wrist. */
export function HandIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <g className={PART} style={m("eti-wave 700ms var(--rap-ease-out)", "45% 100%")}>
        <rect x="11.5" y="13.5" width="16" height="16" rx="7" style={TONE} />
        <path d="M10 19V10.5a2 2 0 0 1 4 0V16V8a2 2 0 0 1 4 0v8V9a2 2 0 0 1 4 0v7v-3.5a2 2 0 0 1 4 0v7c0 4.7-3.8 8.5-8.5 8.5h-1.5c-2.6 0-4.6-1.1-6.1-3.2l-4.1-5.6a2 2 0 0 1 3.1-2.5L10 21z" />
      </g>
    </Svg>
  );
}

/** "Aa" in a soft blob. Motion: the letters wobble like jelly. */
export function TextIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <path
        d="M16 5.5c7.3-.5 12.7 3.3 13 10.3.3 7.6-4.4 12-11.8 11.7C9.7 27.2 5 23.5 5.2 16.3 5.4 9.8 9.6 6 16 5.5z"
        style={TONE}
      />
      <g className={PART} style={m("eti-jelly 640ms var(--rap-ease-out)", "50% 100%")}>
        <path d="M5 23 10 9l5 14M6.8 18.5h6.4" />
        <circle cx="21.5" cy="19.5" r="3.5" />
        <path d="M25 16v7" />
      </g>
    </Svg>
  );
}

/** A circle overlapping a square. Motion: the square does a quarter turn and lands. */
export function ShapeIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <circle cx="21.5" cy="12.5" r="7.5" style={TONE} />
      <circle cx="20" cy="11" r="7.5" />
      <g className={PART} style={m("eti-turn 620ms var(--rap-ease-spring)")}>
        <rect x="4" y="13" width="14" height="14" rx="3.5" className="[fill:var(--eti-cut,var(--rap-surface))]" />
      </g>
    </Svg>
  );
}

/** A pencil over a squiggle. Motion: the pencil wiggles and the squiggle draws itself. */
export function PenIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <path
        d="M4.5 28.5c2-1.8 3.6-1.8 5 0s3.4 1.8 5.4 0 3.6-1.8 5.4 0"
        pathLength={1}
        strokeDasharray="1 1"
        className={PART}
        style={m("eti-draw 620ms var(--rap-ease-out)")}
      />
      <g className={PART} style={m("eti-scribble 620ms var(--rap-ease-out)", "0% 100%")}>
        <path d="m9.5 17.5 11-11 5.5 5.5-11 11z" style={TONE} transform="translate(1.5 1.5)" />
        <path d="M7 25l1.4-7 12.6-12.6a2.8 2.8 0 0 1 4 0l1.6 1.6a2.8 2.8 0 0 1 0 4L14 23.6zM18.5 8l5.5 5.5" />
      </g>
    </Svg>
  );
}

/** Mountain and sun in a rounded frame. Motion: the sun rises over the ridge. */
export function ImageIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <rect x="6" y="8" width="24" height="20" rx="5.5" style={TONE} />
      <rect x="4" y="6" width="24" height="20" rx="5.5" />
      <g className={PART} style={m("eti-rise 640ms var(--rap-ease-spring)")}>
        <circle cx="11.5" cy="12.5" r="2.5" />
      </g>
      <path d="M4.5 22.5 12 15l4.5 4.5 3.5-3.5 7.5 7.5" />
    </Svg>
  );
}

/** Play in a rounded screen. Motion: the play button nudges forward. */
export function VideoIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="8.5" width="25" height="18" rx="5.5" style={TONE} />
      <rect x="3.5" y="7" width="25" height="18" rx="5.5" />
      <path d="M11 29h10" />
      <g className={PART} style={m("eti-nudge 520ms var(--rap-ease-spring)")}>
        <path d="M13.5 12.2v7.6l6.4-3.8z" className="fill-current" />
      </g>
    </Svg>
  );
}

/** Crop marks round a section. Motion: the marks breathe outward, like a frame being sized. */
export function FrameIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <rect x="11.5" y="11.5" width="11" height="11" rx="2.5" style={TONE} />
      <g className={PART} style={m("eti-pulse 560ms var(--rap-ease-spring)")}>
        <path d="M10 3.5V10H3.5M22 3.5V10h6.5M10 28.5V22H3.5M22 28.5V22h6.5" />
      </g>
    </Svg>
  );
}

/** A smiling sticker with a peeling corner. Motion: the corner peels up and smacks back down. */
export function StickerIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <path d="M10.5 5.5h14a5 5 0 0 1 5 5v9l-10 10h-9a5 5 0 0 1-5-5v-14a5 5 0 0 1 5-5z" style={TONE} />
      <path d="M9 4h14a5 5 0 0 1 5 5v9L18 28H9a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5z" />
      <path d="M11.5 12v1M19.5 12v1M11.5 18.5c2.3 1.9 5.7 1.9 8 0" />
      <g className={PART} style={m("eti-peel 640ms var(--rap-ease-out)", "0% 0%")}>
        <path d="M28 18h-5a5 5 0 0 0-5 5v5z" className="[fill:var(--eti-cut,var(--rap-surface))]" />
      </g>
    </Svg>
  );
}

const BUBBLE =
  "M16 5c6.6 0 12 4.3 12 9.7s-5.4 9.7-12 9.7c-1.3 0-2.6-.2-3.8-.5L6 27l1.4-5.4C5.3 19.8 4 17.4 4 14.7 4 9.3 9.4 5 16 5z";

/** A speech bubble with typing dots. Motion: the dots bounce in turn. */
export function CommentIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <path d={BUBBLE} style={TONE} transform="translate(2 2)" />
      <path d={BUBBLE} />
      {[11, 16, 21].map((x, i) => (
        <g key={x} className={PART} style={m(`eti-dot 520ms var(--rap-ease-out) ${i * 90}ms`)}>
          <path d={`M${x} 15h.01`} strokeWidth={2.8} />
        </g>
      ))}
    </Svg>
  );
}

/** A ball with motion lines over the ground. Motion: it bounces and squashes on landing. */
export function AnimationIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <path d="M8 28h18" />
      <g className={PART} style={m("eti-streak 700ms var(--rap-ease-out)")}>
        <path d="M3.5 8h6M5 12.5h5M3.5 17h4" />
      </g>
      <g className={PART} style={m("eti-bounce 700ms linear", "50% 100%")}>
        <circle cx="21" cy="11" r="6" style={TONE} />
        <circle cx="19.5" cy="9.5" r="5.5" />
      </g>
    </Svg>
  );
}

const PIECE = "M6 11a2 2 0 0 1 2-2h4a3 3 0 1 1 6 0h3a2 2 0 0 1 2 2v3a3 3 0 1 1 0 6v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z";

/** A puzzle piece — widgets and embeds. Motion: the piece twists and snaps into place. */
export function WidgetIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <g className={PART} style={m("eti-snap 620ms var(--rap-ease-out)", "30% 90%")}>
        <path d={PIECE} style={TONE} transform="translate(2 1.5)" />
        <path d={PIECE} />
      </g>
    </Svg>
  );
}

/** Three stacked sheets. Motion: the stack fans apart and settles. */
export function LayersIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <g className={PART} style={m("eti-sink 600ms var(--rap-ease-spring)")}>
        <path d="M4 21.5 16 27.5l12-6" />
      </g>
      <path d="M4 16.5 16 22.5l12-6" />
      <g className={PART} style={m("eti-lift 600ms var(--rap-ease-spring)")}>
        <path d="M16 6.5 28 12.5 16 18.5 4 12.5z" style={TONE} transform="translate(0 1.5)" />
        <path d="M16 5 28 11 16 17 4 11z" />
      </g>
    </Svg>
  );
}

/** A tilted eraser over a line. Motion: it rubs back and forth. */
export function EraserIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <path d="M6 28h20" />
      <g className={PART} style={m("eti-rub 600ms var(--rap-ease-out)", "50% 100%")}>
        <g transform="rotate(-45 16 14.5)">
          <rect x="6" y="9.5" width="9" height="10" rx="2" style={TONE} />
          <rect x="6" y="9.5" width="20" height="10" rx="3" />
          <path d="M15 9.5v10" />
        </g>
      </g>
    </Svg>
  );
}

/** A plus in a soft blob. Motion: it spins a quarter turn on a spring. */
export function PlusIcon(p: EditorIconProps) {
  return (
    <Svg {...p}>
      <circle cx="17.5" cy="17.5" r="11" style={TONE} />
      <g className={PART} style={m("eti-turn 560ms var(--rap-ease-spring)")}>
        <path d="M16 8.5v15M8.5 16h15" strokeWidth={2.5} />
      </g>
    </Svg>
  );
}

/** A little waveform. Motion: the bars dance like a level meter. */
export function AudioIcon(p: EditorIconProps) {
  const bars = [
    [7, 13, 19],
    [11.5, 9, 23],
    [16, 6, 26],
    [20.5, 10, 22],
    [25, 13.5, 18.5],
  ];
  return (
    <Svg {...p}>
      <rect x="5.5" y="9.5" width="23" height="18" rx="9" style={TONE} />
      {bars.map(([x, y1, y2], i) => (
        <g key={x} className={PART} style={m(`eti-meter 560ms var(--rap-ease-out) ${i * 60}ms`)}>
          <path d={`M${x} ${y1}V${y2}`} />
        </g>
      ))}
    </Svg>
  );
}

/** Every editor icon by name. */
export const editorIcons = {
  select: SelectIcon,
  hand: HandIcon,
  text: TextIcon,
  shape: ShapeIcon,
  pen: PenIcon,
  image: ImageIcon,
  video: VideoIcon,
  frame: FrameIcon,
  sticker: StickerIcon,
  comment: CommentIcon,
  animation: AnimationIcon,
  widget: WidgetIcon,
  layers: LayersIcon,
  eraser: EraserIcon,
  plus: PlusIcon,
  audio: AudioIcon,
} satisfies Record<string, EditorIconComponent>;
export type EditorIconName = keyof typeof editorIcons;
