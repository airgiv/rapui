/* ══ Textarea ═════════════════════════════════════════════
   Filled multi-line field with 20px corners.

   DELIGHT — THE FIELD BREATHES WITH WHAT YOU WRITE.

   With `autoGrow` the height does not jump a line at a time; it
   follows the content on the shared spring (useSpring, tune 34 —
   a damping ratio near 0.5, so a new line overshoots by a couple
   of pixels and settles, like paper being fed, instead of the
   box snapping). The spring is driven in PIXELS because its snap
   threshold is absolute. The natural height is measured by the
   usual auto/scrollHeight trick, then put straight back, so the
   spring never sees a frame of the collapsed box.

   With `limit` (a soft character limit) a small counter sits in
   the bottom-right corner. Going over it turns the counter flame
   and it hops — every time it crosses the line, and again with
   each character typed past it, so the field is visibly and
   audibly (sound "error") unhappy while you stay over, and quiet
   again the moment you are back under. A soft limit never eats
   what you typed; `maxLength` still hard-caps if you want that.

   Reduced motion / data-rap-motion="calm": the height snaps, the
   counter still turns flame but does not hop. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from "react";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { cx } from "../utils";
import { isMotionCalm } from "./FormField";
import "./Textarea.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: "sm" | "md" | "lg";
  /** Marks the field as invalid (red ring + aria-invalid). */
  invalid?: boolean;
  /** Grow with the content instead of scrolling. `rows` becomes the minimum; cap it with CSS `max-height`. */
  autoGrow?: boolean;
  /**
   * Soft character limit. Shows a `12/280` counter in the corner; over the limit the counter
   * turns flame and hops (and the field is marked invalid). Unlike `maxLength` it never blocks typing.
   */
  limit?: number;
  /** Show the counter against `maxLength` (or `limit`). Implied by `limit`. */
  showCount?: boolean;
}

/** Filled multi-line text field with 20px corners. Optional auto-grow and a soft-limit counter. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = "md", invalid, autoGrow = false, limit, showCount, className, rows = 3, onInput, style, ...rest },
  forwarded,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inner.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );

  /* ── the spring-fed height ── */
  const [natural, setNatural] = useState<number | null>(null);
  const [snap, setSnap] = useState(true); // first measure lands without motion
  const height = useSpring(natural ?? 0, 34, snap);
  const measured = useRef(false);

  const fit = useCallback(() => {
    const el = inner.current;
    if (!el || !autoGrow) return;
    const prev = el.style.height;
    el.style.height = "auto";
    const h = el.scrollHeight + (el.offsetHeight - el.clientHeight); // include borders if any
    el.style.height = prev;
    setSnap(!measured.current || isMotionCalm(el));
    measured.current = true;
    setNatural(h);
  }, [autoGrow]);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    if (autoGrow) fit();
    else {
      measured.current = false;
      setNatural(null);
    }
  }, [autoGrow, fit, rest.value]);

  // width changes re-wrap the text; follow them without a spring
  useEffect(() => {
    const el = inner.current;
    if (!el || !autoGrow || typeof ResizeObserver === "undefined") return;
    let w = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth === w) return;
      w = el.offsetWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoGrow, fit]);

  /* ── the counter ── */
  const cap = limit ?? (showCount ? rest.maxLength : undefined);
  const counted = cap != null;
  const [typed, setTyped] = useState(() => String(rest.value ?? rest.defaultValue ?? "").length);
  const length = rest.value != null ? String(rest.value).length : typed;
  const over = limit != null ? length > limit : cap != null && length >= cap;
  const [hops, setHops] = useState(0);
  const lastLen = useRef(length);
  const sound = useSound();
  useEffect(() => {
    const before = lastLen.current;
    lastLen.current = length;
    if (!counted || length <= before) return;
    const crossed = limit != null ? before <= limit && length > limit : cap != null && before < cap && length >= cap;
    if (over) setHops((n) => n + 1);
    if (crossed) sound.play("error");
  }, [length, over, counted, limit, cap, sound]);

  const field = (
    <textarea
      ref={setRef}
      rows={rows}
      className={cx(
        "rap-textarea",
        `rap-textarea--${size}`,
        autoGrow && "rap-textarea--grow",
        counted && "rap-textarea--counted",
        (invalid || (limit != null && over)) && "is-invalid",
        className,
      )}
      aria-invalid={invalid || (limit != null && over) || rest["aria-invalid"] || undefined}
      style={autoGrow && natural != null ? { ...style, height } : style}
      onInput={(e) => {
        fit();
        setTyped(e.currentTarget.value.length);
        onInput?.(e);
      }}
      {...rest}
    />
  );

  if (!counted) return field;
  return (
    <span className={cx("rap-textarea-wrap", `rap-textarea-wrap--${size}`)}>
      {field}
      <span
        className={cx("rap-textarea__count", over && "is-over", hops > 0 && (hops % 2 ? "is-hop-a" : "is-hop-b"))}
        aria-hidden
      >
        {length}/{cap}
      </span>
    </span>
  );
});
