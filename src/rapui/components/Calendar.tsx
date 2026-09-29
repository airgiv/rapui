/* ══ Calendar ═════════════════════════════════════════════
   Month grid (react-day-picker 10). Pass mode="single" | "range" |
   "multiple" and the matching selected / onSelect — every DayPicker
   prop is passed through.

   AT REST it should look like rap/ui, not a stock date picker:
   big round days (44px, the control height, so a day is as easy
   to hit as a button), today circled by hand in the flame pen — a
   loop that does not quite close on itself and overshoots its
   start, the way you would ring a date on a paper calendar — and
   a caption that is the month set large with an acid highlighter
   stroke under it and the year quiet beside it.

   DELIGHT — A DAY IS A DROP IN A POND. Picking a day SPLATS its
   circle (motion.css `rap-splat`: lands small, overshoots wide
   and flat, settles) and sends a RIPPLE out through the days
   around it: every day within four cells is pushed a few pixels
   AWAY from the one you picked and tinted for a moment, each one
   40ms per cell of distance later and a little weaker, so the
   wave visibly travels outward and dies. The grid distance is
   Euclidean on (row, column), which is what makes it a ring and
   not a square.

   Changing month TURNS THE PAGE: the new grid slides in from the
   side you are heading to with a 3° turn that straightens as it
   lands, and the caption comes with it.

   Splat and ripple are set as data attributes on the day buttons
   straight from the click (react-day-picker owns their classes,
   and a re-render must not cancel a wave that is running). The
   selection is immediate. Reduced motion / data-rap-motion="calm":
   no splat, ripple or turn. Sound: "tap" on pick. */
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import {
  DayPicker,
  type CaptionLabelProps,
  type ChevronProps,
  type ClassNames,
  type DayButtonProps,
  type DayPickerProps,
} from "react-day-picker";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import { isMotionCalm } from "./FormField";
import "./Calendar.css";

export type CalendarProps = DayPickerProps & {
  /** Day cell diameter: sm 36px, md 44px. */
  size?: "sm" | "md";
};

const CLASSES: Partial<ClassNames> = {
  root: "rap-cal",
  months: "rap-cal__months",
  month: "rap-cal__month",
  month_caption: "rap-cal__caption",
  caption_label: "rap-cal__caption-label",
  dropdowns: "rap-cal__dropdowns",
  dropdown_root: "rap-cal__dropdown-root",
  dropdown: "rap-cal__dropdown",
  months_dropdown: "rap-cal__months-dropdown",
  years_dropdown: "rap-cal__years-dropdown",
  nav: "rap-cal__nav",
  button_previous: "rap-cal__nav-btn rap-cal__nav-btn--prev",
  button_next: "rap-cal__nav-btn rap-cal__nav-btn--next",
  chevron: "rap-cal__chevron",
  month_grid: "rap-cal__grid",
  weekdays: "rap-cal__weekdays",
  weekday: "rap-cal__weekday",
  weeks: "rap-cal__weeks",
  week: "rap-cal__week",
  week_number: "rap-cal__week-number",
  week_number_header: "rap-cal__week-number-header",
  day: "rap-cal__day",
  day_button: "rap-cal__day-btn",
  footer: "rap-cal__footer",
  selected: "is-selected",
  range_start: "is-range-start",
  range_middle: "is-range-middle",
  range_end: "is-range-end",
  today: "is-today",
  outside: "is-outside",
  disabled: "is-disabled",
  hidden: "is-hidden",
  focused: "is-focused",
};

/* how far the ripple reaches, in cells, and how fast it travels */
const REACH = 4.5;
const CELL_MS = 40;

function RapChevron({ orientation = "left", className }: ChevronProps) {
  const Icon = { left: ChevronLeft, right: ChevronRight, up: ChevronUp, down: ChevronDown }[orientation];
  return <Icon className={className} strokeWidth={2.2} aria-hidden />;
}

/** Today's ring: a pen loop that overshoots its own start, drawn slightly askew. */
function TodayRing() {
  return (
    <svg className="rap-cal__today-ring" viewBox="0 0 48 48" aria-hidden>
      <path d="M33.5 7.5C24 2.6 9.8 5.8 6.2 19.2 3 31.6 12.4 43.6 25.6 42.8 38.8 42 45.6 31.4 43.2 20.4 41.2 11 32 4.8 19.4 7.8" />
    </svg>
  );
}

/* The day button: react-day-picker's own (it focuses itself when the grid says so) plus the ring. */
function RapDayButton({ day: _day, modifiers, children, ...rest }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button ref={ref} {...rest}>
      {modifiers.today && <TodayRing />}
      <span className="rap-cal__num">{children}</span>
    </button>
  );
}

/* "September 2026" → the month large on a highlighter stroke, the year quiet. */
function RapCaptionLabel({ children, className, ...rest }: CaptionLabelProps) {
  const m = typeof children === "string" ? children.match(/^(.*\S)\s+(\d{4})$/) : null;
  return (
    <span className={className} {...rest}>
      {m ? (
        <>
          <span className="rap-cal__caption-month">{m[1]}</span>
          <span className="rap-cal__caption-year">{m[2]}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
}

/** Restart a keyframe driven by a data attribute on an element React does not manage it on. */
function replay(el: HTMLElement, attr: string) {
  el.removeAttribute(attr);
  void el.offsetWidth;
  el.setAttribute(attr, "");
}

/** The drop: splat the picked day, ripple the ones around it. */
function drop(btn: HTMLElement) {
  const grid = btn.closest(".rap-cal__grid");
  if (!grid) return;
  const rows = Array.from(grid.querySelectorAll<HTMLElement>(".rap-cal__week")).map((r) =>
    Array.from(r.querySelectorAll<HTMLElement>(".rap-cal__day-btn")),
  );
  let r0 = -1;
  let c0 = -1;
  rows.forEach((row, r) => {
    const c = row.indexOf(btn);
    if (c >= 0) {
      r0 = r;
      c0 = c;
    }
  });
  if (r0 < 0) return;
  replay(btn, "data-splat");
  rows.forEach((row, r) =>
    row.forEach((b, c) => {
      if (b === btn) return;
      const d = Math.hypot(r - r0, c - c0);
      if (d > REACH) return;
      b.style.setProperty("--rip-x", String((c - c0) / d));
      b.style.setProperty("--rip-y", String((r - r0) / d));
      b.style.setProperty("--rip-a", String(1 - d / (REACH + 0.5)));
      b.style.setProperty("--rip-delay", `${Math.round((d - 1) * CELL_MS)}ms`);
      replay(b, "data-ripple");
    }),
  );
}

/**
 * Month grid (react-day-picker 10) with big round days, a hand-drawn ring round today,
 * a splat-and-ripple on pick and a page turn between months. Pass `mode="single" | "range" | "multiple"`
 * and the matching `selected` / `onSelect` — every DayPicker prop is passed through.
 */
export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  size = "md",
  onDayClick,
  onMonthChange,
  ...rest
}: CalendarProps) {
  const sound = useSound();
  const shown = useRef<Date>(rest.month ?? rest.defaultMonth ?? new Date());
  const [turn, setTurn] = useState<{ dir: 1 | -1; n: number } | null>(null);

  const handleDayClick: DayPickerProps["onDayClick"] = (date, modifiers, e: MouseEvent) => {
    if (!modifiers.disabled) {
      sound.play("tap");
      const btn = e.currentTarget as HTMLElement;
      if (!isMotionCalm(btn)) drop(btn);
    }
    onDayClick?.(date, modifiers, e);
  };

  const handleMonthChange = (month: Date) => {
    const dir = month.getTime() >= shown.current.getTime() ? 1 : -1;
    shown.current = month;
    setTurn((t) => ({ dir, n: (t?.n ?? 0) + 1 })); // the CSS stands it down under calm
    onMonthChange?.(month);
  };

  return (
    <DayPicker
      {...(rest as DayPickerProps)}
      showOutsideDays={showOutsideDays}
      className={cx(`rap-cal--${size}`, turn && (turn.n % 2 ? "is-turn-a" : "is-turn-b"), className)}
      style={turn ? ({ "--turn": turn.dir, ...rest.style } as CSSProperties) : rest.style}
      classNames={{ ...CLASSES, ...classNames }}
      components={{ Chevron: RapChevron, DayButton: RapDayButton, CaptionLabel: RapCaptionLabel, ...components }}
      onDayClick={handleDayClick}
      onMonthChange={handleMonthChange}
    />
  );
}
