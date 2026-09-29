/* ══ FormStack ════════════════════════════════════════════
   Readymag's big form: tall pills set edge to edge — fields,
   then the button — reading as one object. rap/ui makes that
   object LIQUID.

   ── ONE SHAPE, DRAWN UNDER A GOO FILTER ─────────────────
   The pills keep their content (inputs, labels, icons) but lose
   their own background inside a stack. Their backgrounds are
   redrawn as plain rounded blobs behind them, through the classic
   metaball filter: blur the alpha, then a steep alpha curve (×22 −9)
   that snaps the blur back into a hard edge (~1px of anti-aliasing).
   Where two pills touch, the blur pools in the notch between their
   round ends and the threshold turns it into a neck — so the stack
   is one continuous shape instead of a column of capsules.

   ── TWO LAYERS, SO THE NECK HAS ONE COLOUR ──────────────
   A blur averages COLOUR as well as alpha. With a grey field and
   an orange button in one gooey layer, the neck between them came
   out as a muddy grey-to-orange gradient (and even a one-colour
   neck banded in the dark theme, because its colour was read back
   from pixels at 40% alpha, then boosted ×22). So the filter only
   ever takes the SHAPE from the blur — colour is put back flat —
   and the shape and the paint are split into two layers:
   · the SHAPE layer draws every blob — the button's too — in the
     field grey and goos them together, filled with one flood of that
     grey. It owns the silhouette: every neck, every swell, every blob
     on its way into the button. All one colour, nothing to smear.
   · the PAINT layer draws only the buttons, in their own colour,
     through the same threshold (coloured by the button itself,
     dilated so the colour reaches past the blur). A lone pill through
     the goo comes out as the same pill grown the same ~2px the shape
     layer grows it, so the paint covers the button's part of the
     silhouette exactly, with no grey rim — and stops dead at the
     button's own outline instead of bleeding into the neck.
   The neck therefore belongs to the field: grey liquid flows up to
   the button and meets it on a crisp, anti-aliased edge, like a
   drop of water touching a sweet.

   ── IT BEHAVES LIKE LIQUID ──────────────────────────────
   Focus swells the focused blob (3.5% wider, 8% taller): the necks
   to its neighbours thicken, the way a drop pulls on the drops
   next to it. Hover swells it a hair.

   Submitting (state="loading") SUCKS THE FIELDS INTO THE BUTTON:
   each field blob — and the field itself — slides to the
   button's centre and shrinks to 30%, top one first, 70ms apart,
   on a gravity curve (slow start, fast finish) so it reads as
   being drawn in rather than moved. The button then runs its own
   loading stripes, and on "success" splats green.

   "error" SPITS THEM BACK OUT on a back-out curve (overshoots,
   settles) in reverse order, and the field at `errorIndex` shakes
   "no" — blob and content together.

   The state change itself is instant (the button's label, ARIA);
   everything above rides on top, and under reduced motion or
   data-rap-motion="calm" the fields simply stay put. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormHTMLAttributes,
} from "react";
import { cn } from "../utils";
import { isCalm } from "../hooks/useGlide";
import { useSound } from "../sound";
import { StackContext, type StackState } from "./stackContext";

export interface FormStackProps extends FormHTMLAttributes<HTMLFormElement> {
  /** idle · loading (fields are sucked into the button) · success · error (spat back out). */
  state?: StackState;
  /** Which child failed, 0-based — it shakes when state turns "error". */
  errorIndex?: number;
  /** Melt the pills into one liquid shape. Off: plain touching pills, like Readymag. */
  liquid?: boolean;
  /** column (a login form) or row (a newsletter / search bar: field and button side by side). */
  direction?: "column" | "row";
}

interface Blob {
  x: number;
  y: number;
  w: number;
  h: number;
  /** the button's own colour (its --btn-bg); empty for fields and see-through buttons */
  paint: string;
  isButton: boolean;
}

/* the field colour must be OPAQUE: the goo filter rewrites alpha, so a translucent
   fill (like --rap-fill) would come out as solid ink. 6% ink into the surface is the
   same grey Readymag uses, and it follows the dark theme. */
const FIELD = "color-mix(in srgb, var(--rap-ink) 6%, var(--rap-surface))";

export const FormStack = forwardRef<HTMLFormElement, FormStackProps>(function FormStack(
  { state = "idle", errorIndex, liquid = true, direction = "column", className, style, children, ...rest },
  forwarded,
) {
  const form = useRef<HTMLFormElement>(null);
  useImperativeHandle(forwarded, () => form.current as HTMLFormElement);
  const filterId = `rap-goo-${useId().replace(/:/g, "")}`;
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [focused, setFocused] = useState(-1);
  const [hovered, setHovered] = useState(-1);
  const sound = useSound();

  const items = useCallback(
    () => Array.from(form.current?.children ?? []).filter((el) => !(el as HTMLElement).dataset.stackLayer) as HTMLElement[],
    [],
  );
  const indexOf = (target: EventTarget | null) => items().findIndex((el) => el.contains(target as Node));

  /* ── measure the pills and read their colours ── */
  const measure = useCallback(() => {
    setBlobs(
      items().map((el) => {
        const isButton = el.dataset.slot === "button";
        // a Button keeps its colour in --btn-bg (the background itself is cleared in a stack)
        const btn = isButton ? getComputedStyle(el).getPropertyValue("--btn-bg").trim() : "";
        // outline / ghost buttons have no fill of their own: the field grey shows through
        const paint = btn && btn !== "transparent" ? btn : "";
        return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, paint, isButton };
      }),
    );
  }, [items]);

  useLayoutEffect(() => {
    measure();
    const el = form.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    items().forEach((c) => ro.observe(c));
    // theme switches and button states repaint --btn-bg
    const mo = new MutationObserver(measure);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rap-theme"] });
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state", "data-variant"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure, items, children]);

  /* ── absorb / release ── */
  const absorbed = state === "loading" || state === "success";
  const sink = blobs.map((b) => b.isButton).lastIndexOf(true);
  const calm = isCalm(form.current);
  const offsets = blobs.map((b, i) => {
    if (!absorbed || calm || sink < 0 || i === sink) return null;
    const to = blobs[sink];
    return { dx: to.x + to.w / 2 - (b.x + b.w / 2), dy: to.y + to.h / 2 - (b.y + b.h / 2) };
  });

  // the fields themselves travel with their blobs (content and shape together)
  useLayoutEffect(() => {
    const els = items();
    const n = els.length;
    els.forEach((el, i) => {
      const o = offsets[i];
      if (o) {
        el.style.transition = `translate 520ms var(--rap-ease-gravity) ${i * 70}ms, scale 520ms var(--rap-ease-gravity) ${i * 70}ms, opacity 260ms linear ${i * 70 + 260}ms`;
        el.style.translate = `${o.dx}px ${o.dy}px`;
        el.style.scale = "0.3";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      } else if (i !== sink) {
        el.style.transition = `translate 620ms var(--rap-ease-back) ${(n - i) * 60}ms, scale 620ms var(--rap-ease-back) ${(n - i) * 60}ms, opacity 160ms linear ${(n - i) * 60}ms`;
        el.style.translate = "";
        el.style.scale = "";
        el.style.opacity = "";
        el.style.pointerEvents = "";
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absorbed, calm, blobs.length, sink, items]);

  /* ── sounds and the "no" ── */
  const was = useRef<StackState>(state);
  useEffect(() => {
    const prev = was.current;
    was.current = state;
    if (prev === state) return;
    if (state === "loading" && !calm) sound.play("whoosh");
    if (state === "error" && (prev === "loading" || prev === "success")) sound.play("pop", { strength: 0.6 });
    if (state === "error" && errorIndex != null && !calm) {
      const el = items()[errorIndex];
      // its blob in both layers (a button has one in each)
      const blobs = form.current?.querySelectorAll<HTMLElement>(`[data-stack-layer] [data-i="${errorIndex}"]`) ?? [];
      const shake = [
        { translate: "0" },
        { translate: "-9px" },
        { translate: "8px" },
        { translate: "-5px" },
        { translate: "3px" },
        { translate: "0" },
      ];
      // after the spit-back lands
      window.setTimeout(() => {
        el?.animate(shake, { duration: 440, easing: "ease-out" });
        blobs.forEach((b) => b.animate(shake, { duration: 440, easing: "ease-out" }));
      }, prev === "loading" || prev === "success" ? 520 : 0);
    }
  }, [state, errorIndex, calm, sound, items]);

  const goo = (layer: "shape" | "paint") => (liquid ? `url(#${filterId}-${layer})` : undefined);
  // one geometry for both layers, so the paint always sits exactly on its part of the shape
  const blobStyle = (b: Blob, i: number): CSSProperties => {
    const o = offsets[i];
    const swell = i === focused ? "1.035 1.08" : i === hovered ? "1.012 1.02" : "1";
    return {
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      translate: o ? `${o.dx}px ${o.dy}px` : "0 0",
      scale: o ? "0.3" : swell,
      transition: o
        ? `translate 520ms var(--rap-ease-gravity) ${i * 70}ms, scale 520ms var(--rap-ease-gravity) ${i * 70}ms, background-color 300ms`
        : `translate 620ms var(--rap-ease-back) ${(blobs.length - i) * 60}ms, scale 420ms var(--rap-ease-spring), background-color 300ms`,
    };
  };

  return (
    <StackContext.Provider value={{ state }}>
      <form
        ref={form}
        data-slot="form-stack"
        data-state={state}
        className={cn(
          "relative isolate flex w-full",
          direction === "column" ? "flex-col" : "flex-row items-stretch [&>[data-slot=input]]:flex-1 [&>[data-slot=input]]:min-w-0 [&>[data-slot=button]]:w-auto [&>[data-slot=button]]:flex-none",
          // inside a stack the pills lose their own background: the blob layer draws it
          "[&>[data-slot=input]]:bg-transparent! [&>[data-slot=button]]:bg-transparent!",
          className,
        )}
        style={style}
        onFocusCapture={(e) => setFocused(indexOf(e.target))}
        onBlurCapture={() => setFocused(-1)}
        onPointerOver={(e) => setHovered(indexOf(e.target))}
        onPointerLeave={() => setHovered(-1)}
        {...rest}
      >
        <svg data-stack-layer="filter" aria-hidden className="absolute size-0 overflow-hidden">
          {/* shape: goo the ALPHA only, then fill it with one flat field colour */}
          <filter id={`${filterId}-shape`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur" />
            {/* alpha × 22 − 9: the blur's soft edge snaps back to a hard one, pooled into necks */}
            <feColorMatrix in="blur" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 22 -9" result="goo" />
            <feFlood style={{ floodColor: FIELD }} result="ink" />
            <feComposite in="ink" in2="goo" operator="in" />
          </filter>
          {/* paint: the same goo alpha, coloured by the button itself grown 16px (a bridge between
              blobs never lies further than ~10px from one), so its edge is the threshold's, not the blur's */}
          <filter id={`${filterId}-paint`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 22 -9" result="goo" />
            <feMorphology in="SourceGraphic" operator="dilate" radius="16" result="ink" />
            <feComposite in="ink" in2="goo" operator="in" />
          </filter>
        </svg>
        {/* shape: every blob in the field grey — the silhouette, necks included */}
        <div data-stack-layer="shape" aria-hidden className="absolute inset-0 -z-1 pointer-events-none" style={{ filter: goo("shape") }}>
          {blobs.map((b, i) => (
            <span key={i} data-i={i} data-slot="form-stack-blob" className="absolute rounded-pill" style={{ ...blobStyle(b, i), background: FIELD }} />
          ))}
        </div>
        {/* paint: the buttons' own colour on top, gooed alike so it matches the shape to the pixel */}
        <div data-stack-layer="paint" aria-hidden className="absolute inset-0 -z-1 pointer-events-none" style={{ filter: goo("paint") }}>
          {blobs.map((b, i) =>
            b.paint ? (
              <span
                key={i}
                data-i={i}
                data-slot="form-stack-paint"
                className="absolute rounded-pill"
                style={{ ...blobStyle(b, i), background: b.paint }}
              />
            ) : null,
          )}
        </div>
        {children}
      </form>
    </StackContext.Provider>
  );
});
