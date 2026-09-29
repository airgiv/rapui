import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Button, Sticker, type StickerProps } from "../../rapui";
import { createLoop, setSpring, spring, stepSpring, wobble, type Spring } from "../../rapui/components/galleryKit";
import { useSound } from "../../rapui/sound/SoundProvider";
import { cn, prefersReducedMotion } from "../../rapui/utils";

/* ── a sticker board ─────────────────────────────────────
   Stickers slapped onto a sheet of paper at angles, a little on
   top of each other. Grab one and it lifts (8% bigger, a deeper
   shadow) and follows the hand on the library's spring, leaning
   into the direction you fling it; let go and it stays where it
   landed. "Slap another" (or a tap on bare paper) presses a new
   one down with Sticker's own `slap` landing.

   Positions are kept as thousandths of the board, so the pile
   keeps its composition when the board is resized; all springs
   run from ONE parked-when-idle rAF loop (galleryKit). */

type Kind = { key: string; round?: boolean; make: (size: (lo: number, v: number, hi: number) => string) => Omit<StickerProps, "rotate"> & { children: ReactNode } };

/* sizes in container units, so the pile scales with the board */
const KINDS: Kind[] = [
  { key: "tag", make: (s) => ({ shape: "tag", color: "acid", size: s(1.05, 2.8, 1.7), children: "€24" }) },
  {
    key: "burst",
    round: true,
    make: (s) => ({
      shape: "burst",
      color: "flame",
      size: s(0.85, 1.7, 1.15),
      style: { width: s(6.4, 13.2, 9) },
      children: (
        <>
          hot
          <br />
          drop
        </>
      ),
    }),
  },
  {
    key: "seal",
    round: true,
    make: (s) => ({
      shape: "seal",
      color: "blue",
      ring: "limited run ✳ limited run ✳ ",
      size: s(0.9, 1.8, 1.2),
      style: { width: s(7.6, 15.6, 10.5) },
      children: "no. 7",
    }),
  },
  { key: "label", make: (s) => ({ shape: "label", color: "paper", size: s(0.95, 2.3, 1.4), children: "peel me" }) },
  { key: "stamp", make: (s) => ({ shape: "stamp", color: "sky", grain: true, size: s(0.9, 2.2, 1.35), airmail: true, children: "air mail" }) },
  { key: "bubble", make: (s) => ({ shape: "bubble", color: "bubble", diecut: true, size: s(0.95, 2.3, 1.45), children: "hey!" }) },
  { key: "live", make: (s) => ({ shape: "pill", color: "green", dot: true, size: s(0.9, 2.0, 1.3), children: "live" }) },
  {
    key: "star",
    round: true,
    make: (s) => ({ shape: "star", color: "acid", diecut: true, size: s(0.8, 1.4, 1), style: { width: s(5.6, 10.8, 7.5) }, children: "fave" }),
  },
  {
    key: "badge",
    round: true,
    make: (s) => ({
      shape: "circle",
      color: "flame",
      ring: "open for projects • open for projects • ",
      spin: "ring",
      size: s(1.3, 2.9, 1.9),
      style: { width: s(6.6, 13.2, 9) },
      children: "✳",
    }),
  },
  { key: "arch", make: (s) => ({ shape: "arch", color: "sky", size: s(0.9, 1.9, 1.25), children: "new in" }) },
  { key: "heart", round: true, make: (s) => ({ shape: "heart", color: "bubble", diecut: true, size: s(0.8, 1.4, 1), style: { width: s(5, 9.6, 6.5) }, children: "yes" }) },
  { key: "clover", round: true, make: (s) => ({ shape: "clover", color: "acid", size: s(0.8, 1.4, 1), style: { width: s(5.4, 10.2, 7) }, children: "lucky" }) },
  { key: "sale", make: (s) => ({ shape: "pill", color: "flame", size: s(0.95, 2.3, 1.45), children: "−30%" }) },
];
const byKey = Object.fromEntries(KINDS.map((k) => [k.key, k]));
/* rem at the small end, cqw in between, rem at the big end */
const cq = (lo: number, v: number, hi: number) => `clamp(${lo}rem, ${v}cqw, ${hi}rem)`;

/* the opening pile: x, y in thousandths of the board, tilt in degrees */
type Seed = [key: string, x: number, y: number, rot: number];
const WIDE: Seed[] = [
  ["tag", 170, 330, -9],
  ["live", 310, 190, 5],
  ["burst", 320, 610, 12],
  ["seal", 490, 400, -5],
  ["label", 670, 220, -4],
  ["badge", 650, 640, 0],
  ["arch", 850, 340, 6],
  ["stamp", 150, 770, -4],
  ["bubble", 850, 730, 5],
  ["star", 480, 790, -12],
]
const NARROW: Seed[] = [
  ["tag", 320, 110, -8],
  ["live", 760, 120, 5],
  ["burst", 290, 350, 10],
  ["seal", 690, 340, -5],
  ["label", 320, 590, -4],
  ["star", 690, 600, 7],
  ["stamp", 300, 850, -5],
  ["bubble", 730, 840, 4],
]

type Item = { id: number; key: string; rot: number; delay: number; z: number };
type Motion = { x: Spring; y: Spring; lean: Spring; lift: Spring };

export function StickersDemo({ className }: { className?: string }) {
  const sound = useSound();
  const board = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const motion = useRef(new Map<number, Motion>());
  const els = useRef(new Map<number, HTMLDivElement>());
  const size = useRef({ w: 0, h: 0 });
  const drag = useRef<{ id: number; gx: number; gy: number; lx: number } | null>(null);
  const nextId = useRef(0);
  /* new ones start with the kinds the opening pile left out */
  const nextKind = useRef(10);
  const top = useRef(1);

  const place = (id: number) => {
    const el = els.current.get(id);
    const m = motion.current.get(id);
    if (!el || !m) return;
    const { w, h } = size.current;
    el.style.transform = `translate(${((m.x.x / 1000) * w).toFixed(1)}px, ${((m.y.x / 1000) * h).toFixed(1)}px) translate(-50%, -50%) rotate(${m.lean.x.toFixed(2)}deg) scale(${(m.lift.x / 100).toFixed(4)})`;
  };

  /* one loop for every spring on the board; parks when all have settled */
  const loop = useRef<ReturnType<typeof createLoop> | null>(null);
  if (!loop.current)
    loop.current = createLoop((dt) => {
      let moving = false;
      for (const [id, m] of motion.current) {
        /* the lean decays back to upright unless the hand keeps flinging */
        if (drag.current?.id !== id) m.lean.to = 0;
        else m.lean.to *= Math.pow(0.86, dt);
        const a = stepSpring(m.x, 62, dt);
        const b = stepSpring(m.y, 62, dt);
        const c = stepSpring(m.lean, 45, dt);
        const d = stepSpring(m.lift, 60, dt);
        if (a || b || c || d || drag.current?.id === id) moving = true;
        place(id);
      }
      return moving;
    });
  useEffect(() => () => loop.current?.stop(), []);

  const still = () => prefersReducedMotion() || !!board.current?.closest('[data-rap-motion="calm"]');

  const addItem = (key: string, x: number, y: number, rot: number, delay = 0): Item => {
    const id = nextId.current++;
    motion.current.set(id, { x: spring(x), y: spring(y), lean: spring(0), lift: spring(100) });
    return { id, key, rot, delay, z: ++top.current };
  };

  /* lay the opening pile once the board is on screen, so the slaps are seen */
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const seeds = el.clientWidth < 640 ? NARROW : WIDE;
        setItems(seeds.map(([key, x, y, rot], i) => addItem(key, x, y, rot, 120 + i * 110)));
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep positions proportional when the board resizes */
  useLayoutEffect(() => {
    const el = board.current;
    if (!el) return;
    const read = () => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
      for (const id of motion.current.keys()) place(id);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slapAnother = (x?: number, y?: number) => {
    const kind = KINDS[nextKind.current++ % KINDS.length];
    const n = nextId.current;
    const px = x ?? 120 + Math.random() * 760;
    const py = y ?? 140 + Math.random() * 720;
    const item = addItem(kind.key, px, py, Math.round(wobble(n, 7.7) * 14));
    sound.play("pop", { strength: 0.5, pitch: 0.9 + (n % 5) * 0.06 });
    setItems((cur) => {
      const next = [...(cur ?? []), item];
      /* a board holds so many; the oldest comes off */
      while (next.length > 18) {
        const gone = next.shift()!;
        motion.current.delete(gone.id);
        els.current.delete(gone.id);
      }
      return next;
    });
  };

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const r = board.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (id: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const m = motion.current.get(id);
    if (!m) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.zIndex = String(++top.current);
    const p = toBoard(e);
    const { w, h } = size.current;
    drag.current = { id, gx: p.x - (m.x.x / 1000) * w, gy: p.y - (m.y.x / 1000) * h, lx: p.x };
    e.currentTarget.dataset.lifted = "";
    if (still()) return;
    m.lift.to = 108;
    sound.play("tap", { strength: 0.3, pitch: 1.2 });
    loop.current!.kick();
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const m = motion.current.get(d.id);
    if (!m) return;
    const p = toBoard(e);
    const { w, h } = size.current;
    /* keep the middle on the board, 3% in from each edge */
    const x = Math.min(970, Math.max(30, ((p.x - d.gx) / w) * 1000));
    const y = Math.min(970, Math.max(30, ((p.y - d.gy) / h) * 1000));
    if (still()) {
      setSpring(m.x, x);
      setSpring(m.y, y);
      place(d.id);
      return;
    }
    m.x.to = x;
    m.y.to = y;
    /* lean into the fling: 0.5° per px of this move, never more than 14° */
    m.lean.to = Math.max(-14, Math.min(14, m.lean.to + (p.x - d.lx) * 0.5));
    d.lx = p.x;
    loop.current!.kick();
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    delete e.currentTarget.dataset.lifted;
    const m = motion.current.get(d.id);
    if (!m || still()) return;
    m.lift.to = 100;
    sound.play("tap", { strength: 0.55, pitch: 0.8 });
    loop.current!.kick();
  };

  return (
    <div data-slot="stickers-demo" className={cn("grid gap-3 w-full min-w-0", className)}>
      <div
        ref={board}
        role="group"
        aria-label="Sticker board"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          const p = toBoard(e);
          const { w, h } = size.current;
          slapAnother(Math.min(940, Math.max(60, (p.x / w) * 1000)), Math.min(920, Math.max(80, (p.y / h) * 1000)));
        }}
        className={cn(
          "relative w-full overflow-hidden rounded-card bg-paper-3 [container-type:inline-size] cursor-copy",
          "h-[clamp(30rem,42vw,36rem)] max-[640px]:h-[32rem]",
          /* a faint dot grid: a cutting mat under the stickers */
          "[background-image:radial-gradient(circle,color-mix(in_oklab,var(--rap-ink)_14%,transparent)_1px,transparent_1.5px)] [background-size:22px_22px] [background-position:11px_11px]",
        )}
      >
        {items?.map((it) => {
          const kind = byKey[it.key];
          const { children, ...props } = kind.make(cq);
          return (
            <div
              key={it.id}
              ref={(el) => {
                if (el) {
                  els.current.set(it.id, el);
                  place(it.id);
                }
              }}
              data-slot="stickers-demo-item"
              onPointerDown={onDown(it.id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              className={cn(
                "absolute left-0 top-0 touch-none select-none cursor-grab active:cursor-grabbing will-change-transform",
                /* lifted off the board: a deeper, softer shadow under everything */
                "transition-[filter] duration-(--rap-dur-fast) ease-rm data-lifted:[filter:drop-shadow(0_14px_14px_rgb(0_0_0/0.16))]",
              )}
              style={{ zIndex: it.z } as CSSProperties}
            >
              <Sticker {...props} rotate={it.rot} slap={it.delay}>
                {children}
              </Sticker>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="m-0 text-[0.875rem] font-medium tracking-[-0.01em] text-mute">Drag them about. Tap bare paper to slap one there.</p>
        <Button size="sm" variant="acid" onClick={() => slapAnother()}>
          Slap another
        </Button>
      </div>
    </div>
  );
}
