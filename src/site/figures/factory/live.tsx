/* The live factory: one loop moves the belt, the hopper, the press and the
   parts; the dial is the page's preset control. Writes attributes on refs,
   never re-renders per frame. */
import * as React from "react";
import type { RapPreset } from "../../../rapui";
import { IsoFigure } from "../iso/react/draw";
import { asksForStillness, spring, useInView, useLoop, useReadout, type Spring } from "../iso/react/live";
import { BEZEL_TOP, DIAL, HEIGHT, P, WIDTH } from "./view";
import { cleatsAt, DIE_ART, gripAt, spokesAt, tickOf } from "./geometry";
import { cycleOf, partOf, placedAt, ramShift, stackLift, shiftOf, travelUnits } from "./frame";
import {
  angleOf,
  DIAL_MAX,
  DIAL_MIN,
  landedBy,
  nearestPreset,
  PRESET_NAMES,
  PRESETS,
  RADIUS_PX,
  readoutOf,
  stampTime,
  STILL_T,
  STOCK,
} from "./model";
import { cameraOf } from "../iso/iso-kit";

const POOL = 12;

export interface Layers {
  halos: string;
  pressBack: string;
  under: string;
  crateBack: string;
  belt: string;
  drum: string;
  hopperBack: string;
  ram: string;
  stack: string;
  hopperFront: string;
  arm: string;
  dial: string;
  frontRail: string;
  front: string;
  crateFront: string;
  pile: string;
}

const Raw = ({ html, ...rest }: { html: string } & React.SVGProps<SVGGElement>) => <g {...rest} dangerouslySetInnerHTML={{ __html: html }} />;

/* screen point (viewBox) → floor point on the plane z = h */
function floorAt(sx: number, sy: number, h: number) {
  const { sinA, cosA, sinE, cosE, k } = cameraOf(P);
  const a = (sx - P.origin[0]) / k;
  const b = ((sy - P.origin[1]) / k + h * cosE) / sinE;
  return [a * sinA + b * cosA, -a * cosA + b * sinA] as const;
}

function angleAt(x: number, y: number) {
  const deg = (((Math.atan2(x - DIAL[0], -(y - DIAL[1])) * 180) / Math.PI) + 360) % 360;
  if (deg >= DIAL_MIN && deg <= DIAL_MAX) return deg;
  const past = (deg - DIAL_MAX + 360) % 360;
  const before = (DIAL_MIN - deg + 360) % 360;
  return past < before ? DIAL_MAX : DIAL_MIN;
}

interface Props {
  preset: RapPreset;
  onPreset?: (preset: RapPreset) => void;
  label: string;
  layers: Layers;
}

export function FactoryLive({ preset: given, onPreset, label, layers }: Props) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const [preset, setPreset] = React.useState(given);
  React.useEffect(() => setPreset(given), [given]);
  const presetRef = React.useRef(preset);
  presetRef.current = preset;

  const cleats = React.useRef<SVGPathElement | null>(null);
  const spokes = React.useRef<SVGPathElement | null>(null);
  const ram = React.useRef<SVGGElement | null>(null);
  const stack = React.useRef<SVGGElement | null>(null);
  const grip = React.useRef<SVGGElement | null>(null);
  const items = React.useRef<SVGGElement | null>(null);
  const slots = React.useRef<(SVGGElement | null)[]>([]);
  const shown = React.useRef<string[]>([]);
  const order = React.useRef("");

  const clock = React.useRef(STILL_T);
  const startLanded = React.useRef(landedBy(STILL_T));
  const stamped = React.useRef(new Map<number, RapPreset>());
  const basePreset = React.useRef(given);
  const knob = React.useRef<Spring>({ at: angleOf(given), rate: 0 });
  const target = React.useRef(angleOf(given));
  const gripDrawn = React.useRef(NaN);
  const paused = React.useRef(false);
  const dragging = React.useRef<number | null>(null);
  const wasStill = React.useRef(false);

  const visible = useInView(anchor);

  const still = React.useCallback(() => asksForStillness() || Boolean(anchor.current?.closest('[data-rap-motion="still"]')), [anchor]);

  const draw = React.useCallback(
    (t: number, calm: boolean) => {
      const current = presetRef.current;
      const map = stamped.current;
      const formOf = (k: number) => (calm ? current : (map.get(k) ?? basePreset.current));
      const list = placedAt(t);
      const used = new Set<number>();
      for (const part of list) {
        const slot = ((part.k % POOL) + POOL) % POOL;
        used.add(slot);
        const node = slots.current[slot];
        if (!node) continue;
        const { key, svg } = partOf(part.kind, part.formed ? formOf(part.k) : null, part.lit, part.on);
        if (shown.current[slot] !== key) {
          node.innerHTML = svg;
          shown.current[slot] = key;
        }
        node.setAttribute("transform", shiftOf(part.x, part.y, part.z));
        node.style.opacity = part.opacity < 1 ? `${Math.round(part.opacity * 100) / 100}` : "";
        node.style.display = "";
      }
      slots.current.forEach((node, slot) => {
        if (node && !used.has(slot)) node.style.display = "none";
      });
      /* painter's order: belt parts far to near (k descending), then the crate, oldest first */
      const belt = list.filter((p) => !p.crate).sort((a, b) => b.k - a.k);
      const crate = list.filter((p) => p.crate).sort((a, b) => a.k - b.k);
      const sequence = [...belt, ...crate].map((p) => ((p.k % POOL) + POOL) % POOL);
      const text = sequence.join(",");
      if (text !== order.current && items.current) {
        order.current = text;
        const fragment = document.createDocumentFragment();
        for (const slot of sequence) {
          const node = slots.current[slot];
          if (node) fragment.appendChild(node);
        }
        items.current.appendChild(fragment);
      }
      const travel = travelUnits(t);
      cleats.current?.setAttribute("d", cleatsAt(travel));
      spokes.current?.setAttribute("d", spokesAt(travel));
      ram.current?.setAttribute("transform", ramShift(t));
      stack.current?.setAttribute("transform", shiftOf(0, 0, stackLift(t)));
      const angle = Math.round(knob.current.at * 20) / 20;
      if (angle !== gripDrawn.current && grip.current) {
        gripDrawn.current = angle;
        grip.current.innerHTML = gripAt(angle);
      }
      const count = STOCK + landedBy(t) - startLanded.current;
      say(readoutOf(current, count) + (paused.current && !calm ? " · paused" : ""));
    },
    [say],
  );

  const kick = useLoop((dt, reduced) => {
    const calm = reduced || still();
    if (calm) {
      if (!wasStill.current) stamped.current.clear();
      wasStill.current = true;
      clock.current = STILL_T;
    } else {
      if (wasStill.current) {
        basePreset.current = presetRef.current;
        stamped.current.clear();
      }
      wasStill.current = false;
      if (!paused.current) {
        const from = clock.current;
        const to = from + dt;
        for (let c = cycleOf(from); c <= cycleOf(to); c++) {
          const hit = stampTime(c);
          if (hit > from && hit <= to) stamped.current.set(c, presetRef.current);
        }
        clock.current = to;
        for (const k of [...stamped.current.keys()]) if (k < cycleOf(to) - 12) stamped.current.delete(k);
      }
    }
    const settled = spring(knob.current, target.current, dt, 170, 17, calm);
    draw(clock.current, calm);
    return !(calm || paused.current) || !settled;
  }, visible);

  /* the first frame, before any loop runs */
  React.useLayoutEffect(() => {
    draw(clock.current, asksForStillness() || still());
  }, [draw, still]);

  /* the dial follows the page's preset unless a hand is on it */
  React.useEffect(() => {
    if (dragging.current === null) target.current = angleOf(preset);
    kick();
  }, [preset, kick]);

  const pick = React.useCallback(
    (next: RapPreset) => {
      if (next === presetRef.current) return;
      presetRef.current = next;
      setPreset(next);
      onPreset?.(next);
    },
    [onPreset],
  );

  const pointerAngle = (event: React.PointerEvent) => {
    const svg = anchor.current?.querySelector("svg");
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const [x, y] = floorAt(point.x, point.y, BEZEL_TOP);
    return { x, y, angle: angleAt(x, y) };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const hit = pointerAngle(event);
    if (!hit || Math.hypot(hit.x - DIAL[0], hit.y - DIAL[1]) > 40) return;
    event.preventDefault();
    dragging.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic pointers have no capture */
    }
    anchor.current?.setAttribute("data-held", "");
    target.current = hit.angle;
    pick(nearestPreset(hit.angle));
    kick();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current !== event.pointerId) return;
    const hit = pointerAngle(event);
    if (!hit) return;
    target.current = hit.angle;
    pick(nearestPreset(hit.angle));
    kick();
  };

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current !== event.pointerId) return;
    dragging.current = null;
    anchor.current?.removeAttribute("data-held");
    target.current = angleOf(presetRef.current);
    kick();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = PRESETS.indexOf(presetRef.current);
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(PRESETS.length - 1, index + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = PRESETS.length - 1;
    else if (/^[1-5]$/.test(event.key)) next = Number(event.key) - 1;
    else if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      paused.current = !paused.current;
      kick();
      return;
    }
    if (next === null) return;
    event.preventDefault();
    const chosen = PRESETS[next]!;
    target.current = angleOf(chosen);
    pick(chosen);
    kick();
  };

  const index = PRESETS.indexOf(preset);
  return (
    <div
      ref={anchor}
      className="fac-stage"
      tabIndex={0}
      role="slider"
      aria-label="Style dial. Arrow keys or 1 to 5 pick the character the press stamps; Space pauses the line."
      aria-valuemin={1}
      aria-valuemax={PRESETS.length}
      aria-valuenow={index + 1}
      aria-valuetext={`${PRESET_NAMES[preset]}, radius ${RADIUS_PX[preset]}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={onKeyDown}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={label}>
        <g>
          <Raw html={layers.halos} />
          <Raw html={layers.pressBack} />
          <Raw html={layers.under} />
          <Raw html={layers.crateBack} />
          <Raw html={layers.pile} />
          <Raw html={layers.belt} />
          <path ref={cleats} className="iso-line" data-tone="faint" d={cleatsAt(travelUnits(STILL_T))} />
          <Raw html={layers.drum} />
          <Raw html={layers.hopperBack} />
          <g ref={items}>
            {Array.from({ length: POOL }, (_, slot) => (
              <g
                key={slot}
                ref={(node) => {
                  slots.current[slot] = node;
                }}
                style={{ display: "none" }}
              />
            ))}
          </g>
          <g ref={ram} transform={ramShift(STILL_T)}>
            <Raw html={layers.ram} />
            <Raw html={DIE_ART[preset]} key={preset} />
          </g>
          <Raw html={layers.frontRail} />
          <g ref={stack}>
            <Raw html={layers.stack} />
          </g>
          <Raw html={layers.hopperFront} />
          <Raw html={layers.arm} />
          <Raw html={layers.dial} />
          <path className="iso-line fac-chosen" data-tone="hi" d={tickOf(preset)} />
          <g ref={grip} />
          <Raw html={layers.front} />
          <path ref={spokes} className="iso-line" data-tone="hi" d={spokesAt(travelUnits(STILL_T))} />
          <Raw html={layers.crateFront} />
        </g>
      </IsoFigure>
    </div>
  );
}
