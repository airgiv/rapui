/* The live machine: places the static art and the slots for the moving parts
   in painter's order, runs one time-based loop that looks every moving thing up
   in the precomputed run, and writes attributes through refs (no re-render per
   frame). Stops offscreen; one composed still under reduced motion or an
   ancestor with data-rap-motion="still"; no flourishes beyond the physics under
   data-rap-motion="calm". */
import * as React from "react";
import { useInView, useLoop } from "../iso/react/live";
import { Items, LiveSolid, Marble, writeSolid } from "./art";
import {
  BELL_ART,
  CHANNEL_BACK,
  CHANNEL_FRONT,
  DECK_ART,
  DRIVE_ART,
  GATE_HOUSING,
  LEVER_BACK,
  LEVER_FRONT,
  LEVER_PIN,
  LIFT_BACK,
  LIFT_FRONT,
  PEDESTAL_ART,
  RAMPS_BACK,
  RAMPS_FRONT,
  SPIRAL_BACK,
  SPIRAL_FRONT,
  SPIRAL_MID,
  STAIRS_ART,
  TABLE_ART,
  TABLE_FRONT,
  WALL_ART,
} from "./geometry";
import { bellShiver, dominoesAt, hammerAtTime, leverAtTime, screwAtTime } from "./frame";
import { RUN, STILL_T, litOf, readoutOf, runnerAt, waiterAt, SLOTS } from "./model";
import { HEIGHT, WIDTH, at } from "./view";
import type { Slot } from "./tracks";
import { DOM_N } from "./view";

export interface ChainHandle {
  /** Restart the run: the machine hurries (continuously, nothing jumps) to the start of the next run, then plays it. */
  run(): void;
}

export const DESCRIPTION =
  "A marble machine on a chamfered plinth: a screw lift carries a wooden marble up a wall, it zigzags down three ramps, bounces down four stairs and knocks over a row of seven dominoes; the last domino trips a catapult that throws a second marble into a spiral, which winds down past a bell and rolls home to the lift.";
const HINT = "Chain reaction — press Enter to start a run";

type Motion = "fun" | "calm" | "still";
function motionOf(node: Element | null): Motion {
  if (typeof window === "undefined") return "fun";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  const m = node?.closest("[data-rap-motion]")?.getAttribute("data-rap-motion");
  return m === "still" ? "still" : m === "calm" ? "calm" : "fun";
}

const WARP = 5;

interface Nodes {
  marbles: Record<Slot, [SVGGElement | null, SVGGElement | null]>;
  dominoes: (SVGGElement | null)[];
  beam: SVGGElement | null;
  paddle: SVGGElement | null;
  cup: SVGGElement | null;
  lip: SVGPathElement | null;
  spring: SVGPathElement | null;
  gate: SVGGElement | null;
  rod: SVGGElement | null;
  head: SVGGElement | null;
  bell: SVGGElement | null;
  wireBack: SVGPathElement | null;
  wireFront: SVGPathElement | null;
  readout: Element | null;
}

const fixed = (v: number) => Math.round(v * 100) / 100;

/* the first frame, also what renders before any effect runs */
const FIRST = STILL_T;
const DOM0 = dominoesAt(FIRST, false);
const LEVER0 = leverAtTime(FIRST);
const HAMMER0 = hammerAtTime(FIRST, false);
const WIRE0 = screwAtTime(FIRST);

export const ChainLive = React.forwardRef<ChainHandle, { framed?: boolean; onReadout?: (text: string) => void; runKey?: number }>(function ChainLive(
  { onReadout, runKey },
  ref,
) {
  const root = React.useRef<HTMLDivElement | null>(null);
  const emptyPair = (): [SVGGElement | null, SVGGElement | null] => [null, null];
  const nodes = React.useRef<Nodes>({
    marbles: Object.fromEntries(SLOTS.map((s) => [s, emptyPair()])) as Nodes["marbles"],
    dominoes: [],
    beam: null,
    paddle: null,
    cup: null,
    lip: null,
    spring: null,
    gate: null,
    rod: null,
    head: null,
    bell: null,
    wireBack: null,
    wireFront: null,
    readout: null,
  });
  const clock = React.useRef({ t: FIRST, warpTo: -1, held: false });
  const [motion, setMotion] = React.useState<Motion>("fun");
  const visible = useInView(root);
  const said = React.useRef("");

  const draw = React.useCallback(
    (t: number, calm: boolean) => {
      const n = nodes.current;
      const loop = Math.floor(t / RUN.T);
      const lt = t - loop * RUN.T;
      const lit = litOf(lt);
      const runner = runnerAt(lt);
      const waiter = waiterAt(lt);
      // marble 0 runs on even loops, marble 1 on odd ones
      const states = loop % 2 === 0 ? [runner, waiter] : [waiter, runner];
      const lits = loop % 2 === 0 ? [lit.runner, lit.waiter] : [lit.waiter, lit.runner];
      for (const slot of SLOTS) {
        for (let m = 0; m < 2; m++) {
          const g = n.marbles[slot][m];
          if (!g) continue;
          const s = states[m]!;
          if (s.slot !== slot) {
            if (g.style.display !== "none") g.style.display = "none";
            continue;
          }
          const [x, y] = at(s.p);
          g.setAttribute("transform", `translate(${fixed(x)} ${fixed(y)})`);
          g.style.display = "";
          const litNode = g.lastElementChild as SVGGElement | null;
          if (litNode) litNode.style.opacity = `${fixed(lits[m]!)}`;
        }
      }
      const doms = dominoesAt(lt, calm);
      for (let i = 0; i < DOM_N; i++) writeSolid(n.dominoes[i] ?? null, doms[i]!);
      const lever = leverAtTime(lt);
      writeSolid(n.beam, lever.beam);
      writeSolid(n.paddle, lever.paddle);
      writeSolid(n.cup, lever.cup);
      writeSolid(n.gate, lever.gate);
      n.lip?.setAttribute("d", lever.lip);
      n.spring?.setAttribute("d", lever.spring);
      const hammer = hammerAtTime(lt, calm);
      writeSolid(n.rod, hammer.rod);
      writeSolid(n.head, hammer.head);
      const shiver = bellShiver(lt, calm);
      if (shiver) n.bell?.setAttribute("transform", shiver);
      else n.bell?.removeAttribute("transform");
      const wire = screwAtTime(lt);
      n.wireBack?.setAttribute("d", wire.back);
      n.wireFront?.setAttribute("d", wire.front);
      const text = clock.current.warpTo >= 0 ? "restarting the run" : readoutOf(lt);
      if (text !== said.current) {
        said.current = text;
        n.readout ??= root.current?.closest(".iso-plate")?.querySelector("[data-readout]") ?? null;
        if (n.readout) n.readout.textContent = text;
        onReadout?.(text);
      }
    },
    [onReadout],
  );

  // watch the motion level: OS reduced motion, or the page's data-rap-motion
  React.useEffect(() => {
    const update = () => setMotion(motionOf(root.current));
    update();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", update);
    const watcher = new MutationObserver(update);
    watcher.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-rap-motion"] });
    return () => {
      media.removeEventListener("change", update);
      watcher.disconnect();
    };
  }, []);

  const still = motion === "still";
  React.useEffect(() => {
    if (still) {
      clock.current = { t: STILL_T, warpTo: -1, held: false };
      draw(STILL_T, true);
    }
  }, [still, draw]);

  const kick = useLoop((dt, reduced) => {
    if (reduced || still) return false;
    const c = clock.current;
    if (c.held) return false;
    let speed = 1;
    if (c.warpTo >= 0) {
      speed = WARP;
      if (c.t + dt * speed >= c.warpTo) {
        c.t = c.warpTo;
        c.warpTo = -1;
        speed = 0;
      }
    }
    c.t += dt * speed;
    // keep the clock small without changing the phase (two loops: the marbles swap each loop)
    if (c.t > RUN.T * 2000) c.t -= RUN.T * 2000;
    draw(c.t, motion === "calm");
    return true;
  }, visible && !still);

  const run = React.useCallback(() => {
    if (still) return;
    const c = clock.current;
    const into = c.t % RUN.T;
    if (into < 1) return; // a run has only just started
    c.warpTo = Math.ceil(c.t / RUN.T) * RUN.T;
    kick();
  }, [still, kick]);

  React.useImperativeHandle(ref, () => ({ run }), [run]);

  // a seek hook for visual checks: dispatch "cr-seek" with { t } to hold a moment, { t: -1 } to let go
  React.useEffect(() => {
    const node = root.current;
    if (!node) return;
    const seek = (e: Event) => {
      const t = (e as CustomEvent<{ t: number; calm?: boolean }>).detail.t;
      if (t < 0) {
        clock.current.held = false;
        kick();
        return;
      }
      clock.current = { t, warpTo: -1, held: true };
      draw(t, Boolean((e as CustomEvent<{ calm?: boolean }>).detail.calm));
    };
    node.addEventListener("cr-seek", seek);
    return () => node.removeEventListener("cr-seek", seek);
  }, [draw, kick]);
  const firstKey = React.useRef(runKey);
  React.useEffect(() => {
    if (runKey === undefined || runKey === firstKey.current) return;
    firstKey.current = runKey;
    run();
  }, [runKey, run]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      run();
    }
  };

  const m = nodes.current;
  const marbleRefs = (slot: Slot) =>
    [0, 1].map((i) => (
      <g
        key={i}
        ref={(el) => {
          m.marbles[slot][i] = el;
        }}
        style={{ display: "none" }}
      >
        <Marble />
      </g>
    ));
  const slotG = (slot: Slot) => (
    <g key={`slot-${slot}`} data-slot={slot}>
      {marbleRefs(slot)}
    </g>
  );

  return (
    <div
      ref={root}
      className="cr-stage"
      tabIndex={still ? undefined : 0}
      role={still ? undefined : "button"}
      aria-label={still ? undefined : HINT}
      onClick={still ? undefined : run}
      onKeyDown={still ? undefined : onKey}
    >
      <svg className="iso-svg cr-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={DESCRIPTION} focusable="false">
        <Items items={DECK_ART} name="deck" />
        <Items items={DRIVE_ART} name="drive" />
        <Items items={WALL_ART} name="wall" />
        <Items items={PEDESTAL_ART} name="pedestal" />
        {/* the return channel and the bell */}
        <Items items={CHANNEL_BACK} name="channel-back" />
        {slotG("exitA")}
        <g
          ref={(el) => {
            m.bell = el;
          }}
        >
          <Items items={BELL_ART} name="bell" />
        </g>
        <LiveSolid ref={(el) => void (m.rod = el)} paths={HAMMER0.rod} tone="mid" />
        <LiveSolid ref={(el) => void (m.head = el)} paths={HAMMER0.head} tone="hi" crease="lo" />
        {slotG("exitB")}
        {slotG("back")}
        <Items items={CHANNEL_FRONT} name="channel-front" />
        {/* the screw lift */}
        <path ref={(el) => void (m.wireBack = el)} className="iso-line cr-wire" data-tone="mid" d={WIRE0.back} />
        <Items items={LIFT_BACK} name="lift-back" />
        {slotG("lift")}
        <path ref={(el) => void (m.wireFront = el)} className="iso-line cr-wire" data-tone="hi" d={WIRE0.front} />
        <Items items={LIFT_FRONT} name="lift-front" />
        {/* the zigzag on the wall and the turn chute */}
        <Items items={RAMPS_BACK} name="ramps-back" />
        {slotG("wall")}
        <Items items={RAMPS_FRONT} name="ramps-front" />
        {/* the catapult and the gutter */}
        <Items items={LEVER_BACK} name="lever-back" />
        <path ref={(el) => void (m.spring = el)} className="iso-line" data-tone="mid" d={LEVER0.spring} />
        <LiveSolid ref={(el) => void (m.gate = el)} paths={LEVER0.gate} tone="mid" />
        <Items items={GATE_HOUSING} name="gate" />
        <LiveSolid ref={(el) => void (m.beam = el)} paths={LEVER0.beam} tone="mid" />
        <LiveSolid ref={(el) => void (m.paddle = el)} paths={LEVER0.paddle} tone="mid" />
        <Items items={LEVER_PIN} name="pin" />
        <LiveSolid ref={(el) => void (m.cup = el)} paths={LEVER0.cup} tone="hi" />
        {slotG("gutter")}
        <path ref={(el) => void (m.lip = el)} className="iso-line" data-tone="hi" d={LEVER0.lip} />
        <Items items={LEVER_FRONT} name="lever-front" />
        {/* the spiral tower */}
        <Items items={SPIRAL_BACK} name="spiral-back" />
        {slotG("spiralBack")}
        <Items items={SPIRAL_MID} name="spiral-mid" />
        {slotG("spiralFront")}
        <Items items={SPIRAL_FRONT} name="spiral-front" />
        {/* the stairs */}
        <Items items={STAIRS_ART} name="stairs" />
        {slotG("stairs")}
        {/* the domino table */}
        <Items items={TABLE_ART} name="table" />
        {DOM0.map((_p, i) => (
          <LiveSolid key={`dom-${DOM_N - 1 - i}`} ref={(el) => void (m.dominoes[DOM_N - 1 - i] = el)} paths={DOM0[DOM_N - 1 - i]!} tone="hi" crease="lo" />
        ))}
        {slotG("table")}
        <Items items={TABLE_FRONT} name="table-front" />
        {slotG("top")}
      </svg>
    </div>
  );
});
