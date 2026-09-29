/* Adapted in part from Bencho — https://bencho.dev — MIT licence,
   see bencho.dev/licence. What is still Bencho's is marked
   "(Bencho)" below: the one-spring-per-row rule and its clamped
   readings (the LAG/RUN window), the add-a-task row, the reset,
   and the whole of `finish="heap"` — the collapse, the lean that
   comes from the overhang, the daylight between two slips, the
   gravity timing. The liquid rows, the scribble, the roll to the
   Done pile, the progress pill and the party are rap/ui's own. */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { isCalm } from "../hooks/useGlide";
import { clamp, cn, prefersReducedMotion } from "../utils";
import "./Checklist.css";

/* ══ Checklist ════════════════════════════════════════════
   A card of big round rows. Tick one and it is POURED: the
   round box bursts into a splash, liquid runs out of it across
   the whole pill and turns the words its own colour, a pen
   scribbles the task out — and then the row rolls down into a
   Done pile at the bottom while the rest close the gap. Tick the
   last one and the progress pill on top is brim-full, the card
   squashes like a jelly and throws a handful of rap/ui shapes.

   ── EVERYTHING IS A READING OF A SPRING (Bencho) ─────────
   Nothing in a row is animated toward a moment; each part
   reads a number, so no part can arrive early. The box's dot
   and its tick read the row's spring — the dot raw, so it
   swells past full and settles, the tick clamped (an
   overshooting stroke draws past its own end and pulls back,
   which is a glitch, not a bounce). The liquid, the scribble
   and the fading words read the POUR, a second, heavier spring
   started by the same tick (see usePour): the box answers
   first, the colour follows out of it, and the scribble waits
   a tenth of the pour in (Bencho's LAG/RUN window), so the
   words are crossed out as the colour reaches them — cause,
   then effect.

   ── WHY LIQUID, AND WHY FROM THE BOX ─────────────────────
   rap/ui's "done" is a fill (HoldButton, Stepper, FormStack):
   colour arriving from somewhere, not a state being swapped.
   Here it arrives from the thing you pressed. The liquid is a
   clip-path circle centred on the box whose radius reads the
   spring; its rim wobbles (two sines, 5 and 3 lobes, phase
   advancing with the fill itself, so no timer) and the wobble
   is strongest mid-pour and gone at both ends — the pill is
   round at rest, liquid only while it moves. The words are a
   second copy of the row in the liquid's ink, clipped by the
   same circle, so they change colour exactly where it reaches.
   Seven droplets fly off the box on the way in (CSS, `fun:`).

   ── THE SCRIBBLE ─────────────────────────────────────────
   Not a ruler line: one stroke there and a quicker one back,
   jittered per task (a seeded random, stable across renders),
   drawn with stroke-dashoffset in the row's own pixels — the
   label is measured, so the stroke is cut for those words and
   its thickness never stretches.

   ── THE ROLL ─────────────────────────────────────────────
   480ms after the tick — long enough to see it poured and
   crossed out, short enough that you do not wait — the row is
   filed and rolls to the top of the Done pile. Every row sits
   on its own pixel spring for `y` (a FLIP without measuring:
   rows are one fixed height, so the new place is arithmetic),
   so the rows below slide up into the hole as the filed one
   travels. The filed row lifts off the card while it travels
   (3% and the pop shadow, both fading with the distance left)
   and its box ROLLS: it turns by distance / radius, so a
   150px trip is two full turns and the tick comes to rest
   upright because the angle is read off the distance still to
   go. The travel spring is heavier than the tick's (`bounce`
   halved): a row overshooting its slot by a third of its
   height lands on its neighbour.

   Rows in the pile lean ±0.6° in turn — laid down by hand,
   like the Toast pile — and newest sits on top, nearest the
   open tasks, so the shortest trip is always the latest one.
   Ticking the top row over and over is the fast way through
   the list: the next task slides up under your finger.

   ── THE FINISH ───────────────────────────────────────────
   `finish="party"` (default): once the last row has landed,
   the card squashes (1.035 × 0.955, then back through a small
   rebound — a jelly, not a zoom) and 28 little shapes (dot,
   pill, sparkle, ring, squiggle, flower in the accent colours)
   are thrown up from the progress pill and rain down over the
   card under gravity (a short throw, a long fall: the shapes
   should land on the list, not leave the stage). `finish="heap"`: Bencho's collapse, below. `"none"`:
   the pill fills and that is all. After `resetAfter` the list
   drains and rolls back into its first order.

   Calm (`calm`, data-rap-motion="calm" or reduced motion): the
   state change stays — rows fill and are crossed out at once,
   in place, no roll, no splash, no finish. Sound (opt-in): a
   tick that rises in pitch as the list empties, a release on
   untick, success on the party, a thud when the heap lands. */

/* ── sizes ─────────────────────────────────────────────── */
/* the card's inset: 8, so a 52px pill (radius 26) sits
   concentric in a 34px card corner */
const PAD = 8;
/* the progress pill is a control (44), the rows a large
   control (52): the header reads as smaller than a task */
const HEAD = 44;
const ROW = 52;
/* tiles sit 4px apart (--rap-gap-tile) */
const GAP = 4;
/* the "Done" caption above the pile */
const DIV = 30;
const BOX = 24;
const CORNER = 34;
const BOUNCE = 50;
/* the scribble's window on the spring (Bencho's LAG/RUN) */
const LAG = 0.12;
const RUN = 0.72;
/* see THE ROLL */
const ROLL_MS = 480;
/* let the last row land before the finish starts */
const FINALE_MS = 420;
const HOLD = 3200;
const MAX = 6;
const TASKS = ["Book the studio", "Send the estimate", "Pick a typeface"];

export type ChecklistTone = "mix" | "blue" | "flame" | "acid" | "bubble" | "sky" | "plum" | "ink";
export type ChecklistFinish = "party" | "heap" | "none";

/* the liquid and the ink it carries — Sticker's pairs: light
   accents keep dark ink in both themes, so a fixed #282828
   (as in Sticker), not --rap-ink, which turns light in dark */
const TONE: Record<Exclude<ChecklistTone, "mix">, string> = {
  blue: "[--chk-tone:var(--rap-blue)] [--chk-tone-ink:#fff]",
  flame: "[--chk-tone:var(--rap-flame)] [--chk-tone-ink:#fff]",
  plum: "[--chk-tone:var(--rap-plum)] [--chk-tone-ink:#fff]",
  acid: "[--chk-tone:var(--rap-acid)] [--chk-tone-ink:#282828]",
  bubble: "[--chk-tone:var(--rap-bubble)] [--chk-tone-ink:#282828]",
  sky: "[--chk-tone:var(--rap-sky)] [--chk-tone-ink:#282828]",
  ink: "[--chk-tone:var(--rap-ink)] [--chk-tone-ink:var(--rap-paper-2)]",
};
/* "mix" deals the accents out by row, like a sheet of stickers */
const MIX: Exclude<ChecklistTone, "mix" | "ink">[] = ["blue", "flame", "acid", "bubble", "sky", "plum"];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/* a seeded random: the same task always gets the same scribble */
const rnd = (seed: number, k: number) => {
  const s = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/* ── the heap (Bencho) ─────────────────────────────────────
   Finishing the list takes the floor out from under it: the
   rows stop being held up, fall, and land in a heap on the
   bottom of the card. THE FALL IS A COLLAPSE: the card keeps
   its height, so the distance comes from the rows closing up —
   each slip lies over the one below by the slack above that
   one's words, so the bottom row barely moves and the top one
   travels the whole compaction. One gravity: the furthest fall
   takes DROP_MS and the others √(distance) of it, which is
   where the cascade comes from — nothing is delayed.

   THE TILT IS THE OVERHANG: a slip longer than the one it
   lands on hangs over by the difference and tips that way, and
   the lean accumulates from the floor up. It saturates (two
   degrees for sixteen pixels, never six — the angle where a
   slip stops resting and starts looking dropped). The daylight
   between two slips is computed from the leans where the INK
   is, so a tilted edge never covers the words below it. */
const DROP_MS = 0.46;
const REBOUND = 8;
const FALL_EASE = ["easeIn", "easeOut", "easeIn"] as const;
const MAX_LEAN = 6;
const REACH = 40;
const leanOf = (over: number) => MAX_LEAN * (1 - Math.exp(-over / REACH));
const DRIFT = [-5, 4, -2, 5, -3, 3, -4];
const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);
const gapFor = (leans: number[], runs: number[], mid: number) =>
  1 +
  Math.max(
    0,
    ...leans.slice(1).map((below, i) => {
      const ink = Math.max(runs[i] ?? mid, runs[i + 1] ?? mid);
      return Math.max(0, (ink - mid) * (sin(leans[i]) - sin(below)));
    }),
  );

interface Task {
  id: number;
  text: string;
  done: boolean;
  /** 0 = in the open list; otherwise the order it was filed in */
  filed: number;
}

export interface ChecklistProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  /** The starting tasks (uncontrolled; the list resets to these). */
  tasks?: string[];
  /** Shown in the progress pill. */
  title?: ReactNode;
  /** What finishing the list does: squash + confetti, Bencho's heap, or nothing. */
  finish?: ChecklistFinish;
  /** The liquid colour; "mix" deals the accents out row by row. */
  tone?: ChecklistTone;
  /** Plain: fills and crosses out in place, no roll, no splash, no finish. */
  calm?: boolean;
  /** How far the box swells past full, 0..100 (0 arrives dead). */
  bounce?: number;
  /** The round box, px. */
  box?: number;
  /** The card corner, px. */
  corner?: number;
  /** Back to the starting list this long after finishing; `false` stays done. */
  resetAfter?: number | false;
  /** Most tasks the card holds (the add row goes when full). */
  max?: number;
  onComplete?: () => void;
}

export function Checklist({
  tasks = TASKS,
  title = "Today",
  finish = "party",
  tone = "mix",
  calm = false,
  corner = CORNER,
  bounce = BOUNCE,
  box = BOX,
  resetAfter = HOLD,
  max = MAX,
  onComplete,
  className,
  style,
  onKeyDown,
  ...rest
}: ChecklistProps) {
  const root = useRef<HTMLDivElement>(null);
  const base = useRef(tasks);
  const [items, setItems] = useState<Task[]>(() => tasks.map((text, id) => ({ id, text, done: false, filed: 0 })));
  const nextId = useRef(tasks.length);
  const seq = useRef(0);
  const timers = useRef(new Set<number>());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [inner, setInner] = useState(344);
  /* each row reports where its ink ends and how tall a line
     sets (Bencho: the heap leans on the WORDS, not the row) */
  const [ink, setInk] = useState<Record<number, { run: number; line: number }>>({});
  const measure = useCallback((id: number, run: number, line: number) => {
    setInk((v) => (v[id]?.run === run && v[id]?.line === line ? v : { ...v, [id]: { run, line } }));
  }, []);

  const sound = useSound();
  const still = calm || isCalm(root.current);
  const side = clamp(Math.round(box), 14, 28);
  const r = clamp(corner, 0, 40);
  const cap = Math.max(max, base.current.length);
  const spare = items.length < cap;

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () => setInner(Math.max(0, el.offsetWidth - PAD * 2));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach((id) => window.clearTimeout(id));
  }, []);

  /* ── the finish, derived (Bencho) ────────────────────────
     Every task filed IS the finish; untick one and it is over
     on the same render, so the rows climb back with nothing
     having to remember they had fallen. */
  const complete = items.length > 0 && items.every((t) => t.done && t.filed > 0);
  const [finale, setFinale] = useState(false);
  useEffect(() => {
    if (!complete) {
      setFinale(false);
      return;
    }
    const id = window.setTimeout(() => setFinale(true), still ? 0 : FINALE_MS);
    return () => window.clearTimeout(id);
  }, [complete, still]);
  const fell = finale && finish === "heap" && !still;
  const party = finale && finish === "party" && !still;
  const [burst, setBurst] = useState(0);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  useEffect(() => {
    if (!finale) return;
    completeRef.current?.();
    if (party) {
      setBurst((b) => b + 1);
      sound.play("success");
    }
    if (fell) {
      /* the heap lands at the 0.66 keyframe of the furthest fall */
      const id = window.setTimeout(() => sound.play("drop"), DROP_MS * 1000 * 0.66);
      return () => window.clearTimeout(id);
    }
  }, [finale]);

  /* ── and it puts itself away (Bencho) ────────────────────
     All the way back: the starting tasks, unticked, in their
     first order — added ones go. Ids are kept, so the rows
     drain and roll back up rather than being replaced. */
  useEffect(() => {
    if (!finale || resetAfter === false) return;
    const id = window.setTimeout(() => {
      setItems((v) =>
        v.filter((t) => t.id < base.current.length).sort((a, b) => a.id - b.id).map((t) => ({ ...t, done: false, filed: 0 })),
      );
      if (!still) sound.play("whoosh");
    }, resetAfter);
    return () => window.clearTimeout(id);
  }, [finale, resetAfter, still, sound]);

  const toggle = (id: number) => {
    const task = items.find((t) => t.id === id);
    if (!task) return;
    const on = !task.done;
    const count = items.filter((t) => t.done).length + (on ? 1 : -1);
    /* the pitch climbs as the list empties: the ear hears it filling */
    sound.play(on ? "tick" : "release", on ? { pitch: 0.9 + (0.6 * count) / items.length } : undefined);
    setItems((v) => v.map((t) => (t.id === id ? { ...t, done: on, filed: 0 } : t)));
    if (!on) return;
    const tm = window.setTimeout(
      () => {
        timers.current.delete(tm);
        setItems((v) => v.map((t) => (t.id === id && t.done && !t.filed ? { ...t, filed: ++seq.current } : t)));
      },
      still ? 0 : ROLL_MS,
    );
    timers.current.add(tm);
  };

  const add = () => {
    const text = draft.trim();
    setAdding(false);
    setDraft("");
    if (!text || items.length >= cap) return;
    setItems((v) => [...v, { id: nextId.current++, text, done: false, filed: 0 }]);
  };

  /* ── the layout is arithmetic ────────────────────────────
     Open rows in the order they were written, then the add
     row, then the caption and the pile, newest filed on top.
     Calm keeps every row where it is. */
  const pile = !still;
  const open = items.filter((t) => !(pile && t.filed));
  const filed = pile ? items.filter((t) => t.filed).sort((a, b) => b.filed - a.filed) : [];
  const order = [...open, ...filed];
  const ys: Record<number, number> = {};
  let y = PAD + HEAD + GAP * 2;
  for (const t of open) {
    ys[t.id] = y;
    y += ROW + GAP;
  }
  const spareY = y;
  if (spare) y += ROW + GAP;
  const divY = y;
  if (filed.length) y += DIV;
  for (const t of filed) {
    ys[t.id] = y;
    y += ROW + GAP;
  }
  const height = y - GAP + PAD;

  /* ── where the heap goes (Bencho), from the floor up ── */
  const heap = (() => {
    const n = order.length;
    const runs = order.map((t) => ink[t.id]?.run ?? inner / 2);
    const line = Math.max(20, ...order.map((t) => ink[t.id]?.line ?? 20));
    const leans = order.map(() => 0);
    for (let i = n - 2; i >= 0; i--) {
      const over = Math.max(0, runs[i] - runs[i + 1]);
      leans[i] = clamp(leans[i + 1] + leanOf(over), 0, MAX_LEAN);
    }
    const touch = gapFor(leans, runs, inner / 2);
    /* a slip lies over the one below by the air above its words */
    const slack = Math.max(0, (ROW - line) / 2 - 2);
    const floor = n ? ys[order[n - 1].id] : 0;
    const drops = order.map((t, i) => Math.max(0, floor - (n - 1 - i) * (ROW - slack + touch) - ys[t.id]));
    const longest = Math.max(...drops, 1);
    return { leans, drops, longest };
  })();

  /* ── focus follows the task ──────────────────────────────
     Filing moves the row in the DOM (the DOM is kept in visual
     order, so Tab and the arrows walk the list as it looks), and
     a focused node that is moved loses focus. Read which row had
     it during render — before the move — and hand it back after. */
  const focusRef = useRef<string | undefined>(undefined);
  if (typeof document !== "undefined") {
    const a = document.activeElement as HTMLElement | null;
    focusRef.current = a && root.current?.contains(a) && a.dataset.slot === "checklist-row" ? a.dataset.id : undefined;
  }
  useLayoutEffect(() => {
    const id = focusRef.current;
    if (!id) return;
    const el = root.current?.querySelector<HTMLElement>(`[data-slot="checklist-row"][data-id="${id}"]`);
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  });

  /* ↑ ↓ Home End walk the rows in the order they are drawn */
  const nav = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const list = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-slot="checklist-row"], [data-slot="checklist-new"]') ?? [],
    ).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const at = list.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : clamp(at + (e.key === "ArrowDown" ? 1 : -1), 0, list.length - 1);
    if (list[next]) {
      e.preventDefault();
      list[next].focus();
    }
  };

  const done = items.filter((t) => t.done).length;
  const label = typeof title === "string" ? title : "Checklist";

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      data-slot="checklist"
      data-finish={finish}
      data-party={party || undefined}
      data-rap-motion={calm ? "calm" : undefined}
      onKeyDown={nav}
      className={cn(
        "relative w-full max-w-[26rem] shrink-0 bg-paper-2 font-sans text-ink",
        /* the field must be OPAQUE (FormStack's grey): heaped slips
           and a lifted row lie over each other */
        "[--chk-field:color-mix(in_srgb,var(--rap-ink)_6%,var(--rap-paper-2))] [--chk-field-hover:color-mix(in_srgb,var(--rap-ink)_10%,var(--rap-paper-2))]",
        /* light ink on a dark card needs more of it to separate a row from the card */
        "dark:[--chk-field:color-mix(in_srgb,var(--rap-ink)_9%,var(--rap-paper-2))] dark:[--chk-field-hover:color-mix(in_srgb,var(--rap-ink)_14%,var(--rap-paper-2))]",
        /* it opens, it does not jump (Bencho): one row taller over a third of a second */
        "transition-[height] duration-[360ms] ease-[cubic-bezier(0.22,0.9,0.28,1)] motion-reduce:transition-none",
        "fun:data-party:animate-[chk-squash_720ms_var(--rap-ease-out)]",
        tone !== "mix" && TONE[tone],
        className,
      )}
      style={
        {
          height,
          borderRadius: r,
          "--chk-pad": `${PAD}px`,
          "--chk-row": `${ROW}px`,
          "--chk-box": `${side}px`,
          /* the box sits concentric in the pill's round end */
          "--chk-inset": `${(ROW - side) / 2}px`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <Progress title={title} label={label} done={done} total={items.length} still={still} width={inner} />

      <AnimatePresence initial={false}>
        {order.map((task, i) => (
          <Row
            key={task.id}
            id={task.id}
            label={task.text}
            on={task.done}
            filed={pile && task.filed > 0}
            tone={tone === "mix" ? TONE[MIX[task.id % MIX.length]] : undefined}
            y={ys[task.id]}
            lean={filed.length > 1 ? (task.filed % 2 ? 0.6 : -0.6) : 0}
            side={side}
            wide={inner}
            bounce={clamp(bounce, 0, 100)}
            still={still}
            fell={fell}
            drop={heap.drops[i] ?? 0}
            secs={DROP_MS * Math.sqrt((heap.drops[i] ?? 0) / heap.longest)}
            drift={DRIFT[i % DRIFT.length]}
            tilt={heap.leans[i] ?? 0}
            layer={fell ? order.length - i + 3 : undefined}
            onMeasure={measure}
            onToggle={() => toggle(task.id)}
          />
        ))}
      </AnimatePresence>

      {/* ── the spare row (Bencho) ────────────────────────
          Quiet on purpose — at full strength it reads as a task
          you have not ticked. It keeps its space while the heap
          is down: removing it would change the card mid-fall. */}
      {spare && (
        <Slot y={spareY} still={still} hide={fell}>
          <div
            className="flex size-full items-center gap-3 rounded-pill pl-(--chk-inset) text-[18px] font-[450] leading-[1.2] tracking-[-0.015em]"
            onClick={(e) => e.stopPropagation()}
          >
            <span aria-hidden className="size-(--chk-box) flex-none rounded-full shadow-[inset_0_0_0_1.5px_var(--rap-fill-strong)]" />
            {adding ? (
              <input
                data-slot="checklist-field"
                className="min-w-0 flex-1 bg-transparent p-0 pr-5 text-ink outline-none [font:inherit] [letter-spacing:inherit] placeholder:text-mute"
                autoFocus
                value={draft}
                placeholder="New task"
                aria-label="New task"
                maxLength={40}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    add();
                  }
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setAdding(false);
                    setDraft("");
                  }
                }}
                onBlur={add}
              />
            ) : (
              <button
                type="button"
                data-slot="checklist-new"
                className="cursor-pointer rounded-pill bg-transparent p-0 text-left text-ink opacity-35 outline-none transition-opacity duration-(--rap-dur-fast) [font:inherit] [letter-spacing:inherit] hover:opacity-60 focus-visible:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                onClick={() => setAdding(true)}
              >
                Add a task
              </button>
            )}
          </div>
        </Slot>
      )}

      <Slot y={divY} still={still} hide={fell || !filed.length} height={DIV}>
        <div
          data-slot="checklist-divider"
          aria-hidden
          className="flex h-full items-end gap-1.5 px-5 pb-1.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-mute"
        >
          Done <span className="tabular-nums">{filed.length}</span>
        </div>
      </Slot>

      {party && <Confetti key={burst} seed={burst} x={PAD + inner / 2} y={PAD + HEAD / 2} spread={inner * 0.62} />}
    </div>
  );
}

/* a part that rides its own pixel spring for `y` */
function Slot({ y, still, hide, height = ROW, children }: { y: number; still: boolean; hide?: boolean; height?: number; children: ReactNode }) {
  const at = useSpring(y, 25, still);
  return (
    <div
      className="absolute top-0 right-(--chk-pad) left-(--chk-pad) transition-opacity duration-(--rap-dur-fast) data-hide:pointer-events-none data-hide:opacity-0"
      data-hide={hide || undefined}
      style={{ height, transform: `translateY(${at}px)` }}
    >
      {children}
    </div>
  );
}

/* ══ the progress pill ════════════════════════════════════
   The header IS the progress: ink poured in from the left, one
   share per task, with HoldButton's wavy edge —
     x(y) = X + A·sin(2π·0.9·y/H + φ) + lean·(y/H − ½)·H
   — where the level rides a spring, the wave's height and the
   lean come from how far the level still has to go (so it
   sloshes when a tick lands and lies flat at rest), and φ moves
   with the level itself. The words are a copy in the ink's
   colour, clipped by the same edge. */
function Progress({ title, label, done, total, still, width }: { title: ReactNode; label: string; done: number; total: number; still: boolean; width: number }) {
  const pct = total ? (done / total) * 100 : 0;
  const L = useSpring(pct, 40, still);
  const lag = pct - L;
  const H = HEAD;
  const ceil = H * 0.12;
  const empty = L <= 0.05;
  const full = L >= 99.95;
  const A = empty || full || still ? 0 : ceil * (0.35 + 0.65 * Math.min(1, Math.abs(lag) / 15));
  const X = -ceil + ((width + 2 * ceil) * L) / 100;
  const lean = clamp(lag * 0.012, -0.25, 0.25);
  const phase = L * 0.21;
  let clip = "inset(0 100% 0 0)";
  if (full) clip = "none";
  else if (!empty) {
    const pts: string[] = ["0px 0px"];
    for (let k = 0; k <= 12; k++) {
      const yy = (k / 12) * H;
      const x = X + A * Math.sin(2 * Math.PI * 0.9 * (yy / H) + phase) + lean * (yy / H - 0.5) * H;
      pts.push(`${x.toFixed(1)}px ${yy.toFixed(1)}px`);
    }
    pts.push(`0px ${H}px`);
    clip = `polygon(${pts.join(",")})`;
  }
  const bar = (
    <span className="flex h-full items-center justify-between gap-3 px-5 text-base font-medium tracking-[-0.01em]">
      <span className="truncate">{title}</span>
      <span className="flex-none tabular-nums">{total && done === total ? "All done" : `${done} of ${total}`}</span>
    </span>
  );
  return (
    <div
      data-slot="checklist-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total} done`}
      className="absolute top-(--chk-pad) right-(--chk-pad) left-(--chk-pad) overflow-hidden rounded-pill bg-(--chk-field) text-ink"
      style={{ height: H }}
    >
      {bar}
      <span data-slot="checklist-progress-liquid" aria-hidden className="absolute inset-0 bg-ink text-paper-2" style={{ clipPath: clip }}>
        {bar}
      </span>
    </div>
  );
}

/* the liquid's outline: a circle from the box, rim wobbling mid-pour */
function liquidClip(held: number, cx: number, cy: number, w: number) {
  if (held <= 0.001) return "circle(0px at 0 0)";
  if (held >= 0.999) return "none";
  const R = held * (Math.hypot(w - cx, cy) + 14);
  const wob = Math.sin(Math.PI * held);
  const phase = held * 9;
  const pts: string[] = [];
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    const rr = R * (1 + wob * (0.07 * Math.sin(5 * a + phase) + 0.04 * Math.sin(3 * a - 1.7 * phase)));
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)}px ${(cy + rr * Math.sin(a)).toFixed(1)}px`);
  }
  return `polygon(${pts.join(",")})`;
}

/* one stroke across, a quicker one back — jittered per task */
function scribbleOf(seed: number, w: number) {
  const x = (p: number) => ((p / 100) * w).toFixed(1);
  const y = (b: number, k: number, amp = 2) => (b + (rnd(seed, k) - 0.5) * 2 * amp).toFixed(1);
  return (
    `M${x(-3)} ${y(11, 1)} C${x(20)} ${y(8, 2)} ${x(42)} ${y(14, 3)} ${x(66)} ${y(10, 4)} ` +
    `S${x(96)} ${y(9, 5)} ${x(103)} ${y(11, 6, 1)} ` +
    `C${x(84)} ${y(15, 7)} ${x(56)} ${y(12, 8)} ${x(30)} ${y(15, 9)} S${x(6)} ${y(14, 10)} ${x(1)} ${y(15, 11, 1)}`
  );
}

/* ── the pour's spring ─────────────────────────────────────
   Bencho's loop (frames, decay raised to dt, parks when
   settled) with HoldButton's heavier liquid numbers: k 0.05,
   decay 0.8 → zeta ≈ 0.5, so the pour takes ~420ms, sloshes 15%
   past full at the far end (invisible — the pill is already
   covered — but it keeps the rim moving as it arrives) and
   drains at the same weight on untick. At the tick's own spring
   (~200ms) the liquid was across the pill before the eye found
   it and read as a colour swap. Driven 0..100: the snap is
   absolute, see useSpring. */
function usePour(target: number, instant: boolean) {
  const [at, setAt] = useState(target);
  const cur = useRef(target);
  const vel = useRef(0);
  useEffect(() => {
    if (instant || prefersReducedMotion()) {
      cur.current = target;
      vel.current = 0;
      setAt(target);
      return;
    }
    let prev = 0;
    let raf = 0;
    const tick = (now: number) => {
      const dt = prev ? clamp((now - prev) / 16.67, 0, 2.5) : 1;
      prev = now;
      vel.current += (target - cur.current) * 0.05 * dt;
      vel.current *= Math.pow(0.8, dt);
      cur.current += vel.current * dt;
      if (Math.abs(target - cur.current) < 0.02 && Math.abs(vel.current) < 0.02) {
        cur.current = target;
        vel.current = 0;
        setAt(target);
        return;
      }
      setAt(cur.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, instant]);
  return at;
}

interface RowProps {
  id: number;
  label: string;
  on: boolean;
  filed: boolean;
  tone?: string;
  y: number;
  lean: number;
  side: number;
  wide: number;
  bounce: number;
  still: boolean;
  fell: boolean;
  drop: number;
  secs: number;
  drift: number;
  tilt: number;
  layer?: number;
  onMeasure: (id: number, run: number, line: number) => void;
  onToggle: () => void;
}

function Row({ id, label, on, filed, tone, y, lean, side, wide, bounce, still, fell, drop, secs, drift, tilt, layer, onMeasure, onToggle }: RowProps) {
  /* ── the one number (Bencho) — the box and its tick ── */
  const t = useSpring(on ? 1 : 0, bounce, still);
  const held = clamp(t, 0, 1);
  /* ── and the liquid poured out of it, which has weight ──
     See WHY LIQUID: the pour, the scribble and the fading words
     read this one number; the box reads the one above. */
  const pour = clamp(usePour(on ? 100 : 0, still) / 100, 0, 1);
  const cut = clamp((pour - LAG) / RUN, 0, 1);

  /* ── the row's place, on a heavier spring (see THE ROLL) ── */
  const at = useSpring(y, bounce / 2, still);
  const lag = y - at;
  const [was, setWas] = useState(filed);
  const [travel, setTravel] = useState(false);
  if (was !== filed) {
    setWas(filed);
    setTravel(!still);
  }
  useEffect(() => {
    if (travel && Math.abs(lag) < 0.5) setTravel(false);
  }, [travel, lag]);
  const lift = travel ? clamp(Math.abs(lag) / 60, 0, 1) : 0;
  /* rolls by distance / radius, read off the distance LEFT, so it lands upright */
  const roll = ((-lag / (side / 2)) * 180) / Math.PI;

  /* ── a splash on the way in ── */
  const [splash, setSplash] = useState(0);
  const [prevOn, setPrevOn] = useState(on);
  if (prevOn !== on) {
    setPrevOn(on);
    if (on && !still) setSplash((s) => s + 1);
  }

  /* ── it measures its words: the scribble is cut for them and
     the heap leans on where they end ── */
  const say = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState(0);
  useLayoutEffect(() => {
    const el = say.current;
    if (!el) return;
    setRun(el.offsetWidth);
    onMeasure(id, el.offsetLeft + el.offsetWidth, el.offsetHeight);
  }, [label, side, wide, id, onMeasure]);
  const scribble = useMemo(() => scribbleOf(id + 1, run), [id, run]);

  const cx = (ROW - side) / 2 + side / 2;
  const clip = liquidClip(pour, cx, ROW / 2, wide);

  /* ── falling and climbing are not the same motion (Bencho) ──
     Down is gravity with a small rebound; up is a spring, which
     interrupts cleanly — untick mid-fall and the row is picked
     up from wherever it got to. */
  const up = Math.min(REBOUND, drop * 0.22);
  const land = { duration: secs, times: [0, 0.66, 0.84, 1], ease: [...FALL_EASE] };
  const tip = { duration: secs, ease: "easeIn" as const };

  return (
    <div
      data-slot="checklist-item"
      className={cn("absolute top-0 right-(--chk-pad) left-(--chk-pad) h-(--chk-row)", tone)}
      style={{ transform: `translateY(${at.toFixed(2)}px)`, zIndex: layer ?? (travel ? 4 : on ? 2 : 1) }}
    >
      <motion.div
        className="size-full"
        initial={false}
        exit={{ opacity: 0, transition: { duration: 0.18 } }}
        animate={fell ? { y: [0, drop, drop - up, drop], x: drift, rotate: tilt } : { y: 0, x: 0, rotate: 0 }}
        transition={fell ? { y: land, x: tip, rotate: tip } : { type: "spring", stiffness: 420, damping: 26, mass: 0.9 }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={on}
          aria-label={label}
          data-slot="checklist-row"
          data-id={id}
          data-state={on ? "checked" : "unchecked"}
          data-fell={fell || undefined}
          onClick={onToggle}
          className={cn(
            "group/row relative block size-full cursor-pointer rounded-pill border-0 bg-(--chk-field) p-0 text-left font-sans text-ink select-none",
            "hover:bg-(--chk-field-hover) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "[-webkit-tap-highlight-color:transparent] transition-[rotate,background-color] duration-(--rap-dur) ease-spring",
            /* on the floor, a die-cut edge in the card's colour, so
               slips of one colour still read as separate slips */
            "data-fell:shadow-[0_0_0_2px_var(--rap-paper-2)]",
          )}
          style={{ rotate: `${filed && !fell ? lean : 0}deg`, scale: `${1 + lift * 0.03}` }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-pill shadow-pop" style={{ opacity: lift }} />
          <Face label={label} held={held} pour={pour} t={t} cut={cut} roll={roll} run={run} scribble={scribble} sayRef={say} />
          <span
            data-slot="checklist-liquid"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-pill bg-(--chk-tone) text-(--chk-tone-ink)"
            style={{ clipPath: clip }}
          >
            <Face liquid label={label} held={held} pour={pour} t={t} cut={cut} roll={roll} run={run} scribble={scribble} />
          </span>
          {splash > 0 && <Splash key={splash} seed={id * 31 + splash} />}
        </button>
      </motion.div>
    </div>
  );
}

/* one face of a row; drawn twice — in ink, and in the liquid's ink under its clip */
function Face({
  liquid,
  label,
  held,
  pour,
  t,
  cut,
  roll,
  run,
  scribble,
  sayRef,
}: {
  liquid?: boolean;
  label: string;
  held: number;
  pour: number;
  t: number;
  cut: number;
  roll: number;
  run: number;
  scribble: string;
  sayRef?: Ref<HTMLSpanElement>;
}) {
  return (
    <span className="absolute inset-0 flex items-center gap-3 pr-5 pl-(--chk-inset)">
      <span data-slot="checklist-box" className="relative grid size-(--chk-box) flex-none place-items-center rounded-full" style={{ rotate: `${roll.toFixed(1)}deg` }}>
        {liquid ? (
          <>
            {/* RAW, so it swells past full and settles — the one place the overshoot belongs (Bencho) */}
            <span className="absolute inset-0 rounded-full bg-(--chk-tone-ink)" style={{ scale: `${Math.max(0, t).toFixed(4)}` }} />
            <svg viewBox="0 0 24 24" aria-hidden className="relative size-[72%] overflow-visible" fill="none">
              <path
                d="M6 12.4 L10.3 16.7 L18 7.6"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - held}
                stroke="var(--chk-tone)"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        ) : (
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_currentColor] opacity-30" />
        )}
      </span>
      <span ref={sayRef} className="relative inline-block max-w-full min-w-0 text-[18px] leading-[1.2] font-[450] tracking-[-0.015em]">
        {/* the words give up some ink as they are crossed out — less in
            the liquid, where they already sit on colour */}
        <span data-slot="checklist-label" className="block truncate" style={{ opacity: mix(1, liquid ? 0.78 : 0.42, pour) }}>
          {label}
        </span>
        {run > 0 && (
          <svg
            aria-hidden
            data-slot="checklist-scribble"
            className="pointer-events-none absolute top-1/2 left-0 h-6 -translate-y-1/2 overflow-visible"
            width={run}
            viewBox={`0 0 ${run} 24`}
            fill="none"
          >
            <path d={scribble} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cut} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </span>
  );
}

/* seven droplets thrown off the box, away from the pill (left half-circle) */
function Splash({ seed }: { seed: number }) {
  const drops = Array.from({ length: 7 }, (_, k) => ({
    a: 110 + (k / 6) * 140 + (rnd(seed, k) - 0.5) * 16,
    d: 22 + rnd(seed, k + 9) * 16,
    s: 4 + rnd(seed, k + 17) * 4,
  }));
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-[calc(var(--chk-inset)+var(--chk-box)/2)]">
      {drops.map((p, k) => (
        <span
          key={k}
          className="absolute rounded-full bg-(--chk-tone) opacity-0 fun:animate-[chk-drop_560ms_var(--rap-ease-out)_both]"
          style={
            {
              width: p.s,
              height: p.s,
              marginLeft: -p.s / 2,
              marginTop: -p.s / 2,
              "--a": `${p.a}deg`,
              "--d": `${p.d}px`,
              animationDelay: `${40 + k * 8}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/* ── the party: rap/ui's shapes, thrown up and falling ── */
const CONFETTI_COLORS = ["flame", "blue", "acid", "bubble", "sky", "plum"];
const SHAPES: ((s: number) => ReactNode)[] = [
  (s) => <circle cx={s / 2} cy={s / 2} r={s / 2} fill="currentColor" />,
  (s) => <rect x={0} y={s * 0.3} width={s} height={s * 0.4} rx={s * 0.2} fill="currentColor" />,
  (s) => <path d={`M${s / 2} 0 Q${s * 0.58} ${s * 0.42} ${s} ${s / 2} Q${s * 0.58} ${s * 0.58} ${s / 2} ${s} Q${s * 0.42} ${s * 0.58} 0 ${s / 2} Q${s * 0.42} ${s * 0.42} ${s / 2} 0Z`} fill="currentColor" />,
  (s) => <circle cx={s / 2} cy={s / 2} r={s * 0.36} fill="none" stroke="currentColor" strokeWidth={s * 0.2} />,
  (s) => <path d={`M1 ${s * 0.6} q${s * 0.2} ${-s * 0.5} ${s * 0.4} 0 t${s * 0.4} 0`} fill="none" stroke="currentColor" strokeWidth={s * 0.18} strokeLinecap="round" />,
  (s) => (
    <g fill="currentColor">
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={s / 2 + Math.cos((a * Math.PI) / 180) * s * 0.26} cy={s / 2 + Math.sin((a * Math.PI) / 180) * s * 0.26} r={s * 0.24} />
      ))}
    </g>
  ),
];

function Confetti({ seed, x, y, spread }: { seed: number; x: number; y: number; spread: number }) {
  const bits = Array.from({ length: 28 }, (_, k) => ({
    shape: k % SHAPES.length,
    color: CONFETTI_COLORS[(k * 5 + seed) % CONFETTI_COLORS.length],
    dx: (rnd(seed, k) - 0.5) * 2 * spread,
    dy: -(30 + rnd(seed, k + 40) * 70),
    fall: 220 + rnd(seed, k + 80) * 180,
    rot: (rnd(seed, k + 120) - 0.5) * 900,
    size: 11 + rnd(seed, k + 160) * 9,
    delay: rnd(seed, k + 200) * 90,
  }));
  return (
    <div aria-hidden data-slot="checklist-confetti" className="pointer-events-none absolute inset-0 z-10">
      {bits.map((b, k) => (
        <svg
          key={k}
          width={b.size}
          height={b.size}
          viewBox={`0 0 ${b.size} ${b.size}`}
          className="absolute overflow-visible opacity-0 fun:animate-[chk-confetti_1300ms_linear_both]"
          style={
            {
              left: x - b.size / 2,
              top: y - b.size / 2,
              color: `var(--rap-${b.color})`,
              "--dx": `${b.dx}px`,
              "--dy": `${b.dy}px`,
              "--fall": `${b.fall}px`,
              "--rot": `${b.rot}deg`,
              animationDelay: `${b.delay}ms`,
            } as CSSProperties
          }
        >
          {SHAPES[b.shape](b.size)}
        </svg>
      ))}
    </div>
  );
}
