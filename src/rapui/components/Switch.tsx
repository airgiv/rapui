import { useId, useState, type ReactNode } from "react";
import { cn } from "../utils";
import { useSound } from "../sound";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  size?: "md" | "lg";
  /** Shown inside the track, in the half the knob leaves free: a short word ("on"), a single glyph ("☾"),
   *  or any React node such as an icon (`<Moon />`). */
  onText?: ReactNode;
  offText?: ReactNode;
  className?: string;
}

/* ── what goes in the track ───────────────────────────────
   The words sit in the half of the track the knob leaves free,
   centred in it by geometry (the span runs from the track's edge
   to the knob's, and centres its content), not hung 0.7em off an
   edge. A word stays small caps-ish at 0.3 of the height; a single
   glyph or an icon is a picture, so it gets 0.5 of the height and
   is forced to text presentation (☀ would otherwise turn into a
   tiny colour emoji) — or, for ☀ and ☾, drawn (below). Off, the track is filled (fill-strong) rather
   than outlined: a 1.5px ink ring around a small glyph read as
   noise, and the glyph lost against it — on a fill it is ink on
   grey, as legible as the on side's white on blue. */
const GLYPH = /^\S[\uFE0E\uFE0F]?$/u;
const bare = (t: string) => t.replace(/[\uFE0E\uFE0F]/gu, "");

/* The two a theme toggle reaches for are DRAWN, centred on their own
   bounding box: set as text, ☀ comes from a colour-emoji font and ☾ from
   whatever fallback has it (a hairline, its ink hung left of centre). */
const Sun = () => (
  <svg viewBox="-12 -12 24 24" fill="none" aria-hidden>
    <circle r="4.4" fill="currentColor" />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return <line key={i} x1={c * 7.4} y1={s * 7.4} x2={c * 10} y2={s * 10} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />;
    })}
  </svg>
);
/* a disc of r 9 less one of r 7.6 up and to the right, shifted so the
   crescent's bounding box (not the disc) is centred */
const MoonGlyph = () => (
  <svg viewBox="-12 -12 24 24" aria-hidden>
    <path d="M8.81 2.57A9 9 0 1 1 -0.52 -8.99A7.6 7.6 0 0 0 8.81 2.57Z" fill="currentColor" />
  </svg>
);
const DRAWN: Record<string, () => ReactNode> = { "☀": Sun, "☼": Sun, "☾": MoonGlyph, "☽": MoonGlyph, "🌙": MoonGlyph };

const isGlyph = (t: ReactNode) => typeof t !== "string" || GLYPH.test(t);
const asContent = (t: ReactNode) => {
  if (typeof t !== "string" || !GLYPH.test(t)) return t;
  const Drawn = DRAWN[bare(t)];
  /* any other lone glyph: forced to text presentation */
  return Drawn ? <Drawn /> : bare(t) + "\uFE0E";
};

/** Chunky switch with a springy knob that squishes while it travels. */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  disabled,
  size = "md",
  onText = "on",
  offText = "off",
  className,
}: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const isOn = checked ?? inner;
  const id = useId();
  const sound = useSound();

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    sound.play(next ? "toggleOn" : "toggleOff");
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };

  /* --sw-h / --sw-w / --sw-pad size everything (hosts may override them on the
     root). The knob squishes while pressed: it widens to 1.45 of its height, and
     when on it grows leftwards so its right edge stays put. */
  return (
    <span
      data-slot="switch"
      data-size={size}
      data-state={isOn ? "checked" : "unchecked"}
      className={cn(
        // rap-switch: a stable marker the docs/site CSS still sizes the switch through
        "rap-switch inline-flex items-center gap-[0.9rem] [--sw-knob:calc(var(--sw-h)-var(--sw-pad)*2-3px)]",
        size === "md" && "[--sw-h:2.25rem] [--sw-w:4.5rem] [--sw-pad:4px]",
        size === "lg" && "[--sw-h:3.25rem] [--sw-w:6.5rem] [--sw-pad:5px]",
        disabled && "opacity-40",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={isOn}
        disabled={disabled}
        data-slot="switch-track"
        className={cn(
          "group/track relative w-(--sw-w) h-(--sw-h) p-0 border-[1.5px] border-solid border-transparent rounded-pill bg-fill-strong cursor-pointer overflow-hidden",
          "[transition:background_var(--rap-dur)_var(--rap-ease-out),border-color_var(--rap-dur)]",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
          isOn && "bg-blue border-blue",
        )}
        onClick={toggle}
      >
        {onText !== "" && onText != null && (
          <span
            data-slot="switch-text"
            data-glyph={isGlyph(onText) || undefined}
            className={cn(switchText, "left-0 right-[calc(var(--sw-pad)+var(--sw-knob))] text-white", !isOn && "opacity-0")}
            aria-hidden
          >
            {asContent(onText)}
          </span>
        )}
        {offText !== "" && offText != null && (
          <span
            data-slot="switch-text"
            data-glyph={isGlyph(offText) || undefined}
            className={cn(switchText, "left-[calc(var(--sw-pad)+var(--sw-knob))] right-0 text-ink", isOn && "opacity-0")}
            aria-hidden
          >
            {asContent(offText)}
          </span>
        )}
        <span
          data-slot="switch-knob"
          className={cn(
            "absolute top-(--sw-pad) left-(--sw-pad) h-(--sw-knob) aspect-square rounded-pill bg-ink",
            "[transition:left_var(--rap-dur)_var(--rap-ease-spring),width_var(--rap-dur-fast)_var(--rap-ease-out),background_var(--rap-dur)]",
            "group-active/track:aspect-[1.45]",
            isOn && "left-[calc(100%-var(--sw-h)+var(--sw-pad)+1.5px)] bg-white group-active/track:left-[calc(100%-var(--sw-h)*1.45+var(--sw-pad)*2)]",
          )}
          aria-hidden
        />
      </button>
      {label && (
        <label htmlFor={id} data-slot="switch-label" className="font-medium cursor-pointer">
          {label}
        </label>
      )}
    </span>
  );
}

/* the free half of the track (left/right set per side); a word at 0.3 of
   the height, a glyph or icon at 0.5 (see the note above the component) */
const switchText = cn(
  "absolute inset-y-0 flex items-center justify-center leading-none pointer-events-none",
  "font-sans text-[length:calc(var(--sw-h)*0.3)] font-semibold uppercase [transition:opacity_var(--rap-dur-fast)]",
  "data-[glyph]:text-[length:calc(var(--sw-h)*0.5)] data-[glyph]:font-normal data-[glyph]:normal-case data-[glyph]:[font-variant-emoji:text]",
  "[&_svg]:size-[calc(var(--sw-h)*0.5)] [&_svg]:shrink-0",
);
