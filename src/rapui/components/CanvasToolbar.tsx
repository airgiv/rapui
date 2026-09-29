/* Adapted from Bencho — https://bencho.dev — MIT licence,
   see bencho.dev/licence. Renamed Toolbar → CanvasToolbar;
   the behavioural change is noted at `Btn` below, the default
   corner at BAR_CORNER. The
   tokens its CSS reads are mapped onto rap/ui's in
   CanvasToolbar.css. */
import { useState } from "react";
import { Circle, Code, Frame, MousePointer2, Slash, Spline, Square, Star, Type } from "../icons";
import "./CanvasToolbar.css";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const hold = (e: React.PointerEvent) => e.stopPropagation();

/* ══ 1 · canvas toolbar ═══════════════════════════════════
   A floating tool bar, the kind every canvas app grows. No
   title, no chip — it is a bar, and a bar is the whole
   component.

   The shape slot keeps whichever shape you last chose, so the
   bar teaches you your own habit instead of resetting to a
   default every time. That is the small thing these get wrong
   most often. */

const SHAPES = [
  { key: "rect", Icon: Square },
  { key: "oval", Icon: Circle },
  { key: "line", Icon: Slash },
  { key: "star", Icon: Star },
];

const TOOLS = [
  { key: "move", Icon: MousePointer2 },
  { key: "frame", Icon: Frame },
];

/* after the shape slot, still left of the divider: text is a
   thing you put ON the canvas, like a frame or a shape */
const PLACE = [
  { key: "text", Icon: Type },
];

/* right of the divider: the curve and the code, the two that
   are about paths and output rather than placing things. The
   hand went on 2026-09-26. */
const TAIL = [
  { key: "pen", Icon: Spline },
  { key: "code", Icon: Code },
];

/* ── the toolbar's two corners, and they are concentric ────
   The rail is 14 and the tools inside it are 10, which is the
   rail's radius less the 4px of padding between them — the
   rule that makes a corner hug what is inside it. So the knob
   sets the RAIL and the tools follow, and there is no setting
   where a square rail holds rounded tools. */
/* rap/ui: 27, from 15 — half the rail's height (46px slot +
   4px pad each side = 54), so the rail is a full pill and the
   46px tools inside it (27 − 4 = 23) are circles. Readymag's
   controls are round, and the concentric rule above still holds.
   BAR_MAX goes to 32 so the knob can still reach a full pill. */
const BAR_CORNER = 27;
const BAR_MAX = 32;
/* rap/ui: glyphs at 20 on a 1.75 stroke, from 17 on 2 — sized
   to the 46px slot the way 17 was to 38. */
const GLYPH = 20;
const STROKE = 1.75;

/* ── hoisted out of the component (rap/ui change) ───────────
   In the original this was declared inside Toolbar, which
   makes it a NEW component type on every render — so React
   unmounted and remounted every tool button on each click,
   and the selected pad's scale-in (see .bar-tool::before)
   never got to play on move, frame, text, pen or code: a
   freshly mounted button starts already lit. Declared once,
   the buttons persist and the pad arrives as intended. */
function Btn({
  k,
  Icon,
  tool,
  setTool,
}: {
  k: string;
  Icon: typeof Square;
  tool: string;
  setTool: (k: string) => void;
}) {
  return (
    <button
      className="bar-tool"
      data-on={tool === k}
      onClick={() => { setTool(k); }}
      onPointerDown={hold}
      aria-label={k}
    >
      <Icon size={GLYPH} strokeWidth={STROKE} />
    </button>
  );
}

export function CanvasToolbar({ corner = BAR_CORNER }: { corner?: number } = {}) {
  const [tool, setTool] = useState("move");
  const [shape, setShape] = useState(SHAPES[0]);
  const [open, setOpen] = useState(false);

  const pick = (s: (typeof SHAPES)[number]) => {
    setShape(s);
    setTool("shape");
    setOpen(false);
  };

  return (
    <div
      className="bar-well"
      style={{
        "--bar-r": `${clamp(corner, 0, BAR_MAX)}px`,
        "--bar-tool-r": `${Math.max(0, clamp(corner, 0, BAR_MAX) - 4)}px`,
      } as React.CSSProperties}
    >
      {open && (
        <div className="bar-flyout gpane">
          {SHAPES.map((s) => (
            <button
              key={s.key}
              className="bar-tool"
              data-on={shape.key === s.key}
              onClick={() => pick(s)}
              onPointerDown={hold}
              aria-label={s.key}
            >
              <s.Icon size={GLYPH} strokeWidth={STROKE} />
            </button>
          ))}
        </div>
      )}

      <div className="bar-rail gpane">
        {TOOLS.map((t) => <Btn key={t.key} k={t.key} Icon={t.Icon} tool={tool} setTool={setTool} />)}

        {/* the shape slot: the face is the last shape used, the
            notch opens the rest */}
        <span className="bar-slot" data-on={tool === "shape"}>
          <button
            className="bar-tool"
            data-on={tool === "shape"}
            onClick={() => setTool("shape")}
            onPointerDown={hold}
            aria-label={shape.key}
          >
            <shape.Icon size={GLYPH} strokeWidth={STROKE} />
          </button>
          <button
            className="bar-notch"
            data-open={open}
            onClick={() => { setOpen((o) => !o); }}
            onPointerDown={hold}
            aria-label="More shapes"
          />
        </span>

        {PLACE.map((t) => <Btn key={t.key} k={t.key} Icon={t.Icon} tool={tool} setTool={setTool} />)}

        <span className="bar-split" />
        {TAIL.map((t) => <Btn key={t.key} k={t.key} Icon={t.Icon} tool={tool} setTool={setTool} />)}
      </div>
    </div>
  );
}
