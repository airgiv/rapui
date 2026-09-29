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
   circle (`animate-splat`: lands small, overshoots wide
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
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type MouseEvent } from "react";
import {
  DayPicker,
  Day as RdpDay,
  DropdownNav as RdpDropdownNav,
  Footer as RdpFooter,
  Month as RdpMonth,
  MonthCaption as RdpMonthCaption,
  MonthGrid as RdpMonthGrid,
  Months as RdpMonths,
  Nav as RdpNav,
  NextMonthButton as RdpNextMonthButton,
  PreviousMonthButton as RdpPreviousMonthButton,
  Week as RdpWeek,
  Weekday as RdpWeekday,
  Weekdays as RdpWeekdays,
  Weeks as RdpWeeks,
  type CaptionLabelProps,
  type ChevronProps,
  type ClassNames,
  type CustomComponents,
  type DayButtonProps,
  type DayPickerProps,
  type DayProps,
} from "react-day-picker";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
import "./Calendar.css";

export type CalendarProps = DayPickerProps & {
  /** Day cell diameter: sm 36px, md 44px. */
  size?: "sm" | "md";
};

/* The page turn: the new month slides in from where you are heading (--turn: 1 or -1)
   with a 3° turn that straightens as it lands; the grid pivots on a point below
   itself so the turn reads as a page, not a spin. Two names so a quick second
   turn restarts it. */
const turnClass =
  "group-data-[turn=a]/cal:fun:animate-[rap-cal-turn-a_460ms_var(--rap-ease-spring)] group-data-[turn=b]/cal:fun:animate-[rap-cal-turn-b_460ms_var(--rap-ease-spring)]";

const CLASSES: Partial<ClassNames> = {
  root: "group/cal relative inline-block text-ink font-sans text-[0.9375rem] tracking-[-0.01em] [--cal-pen:var(--rap-flame)]",
  months: "relative flex flex-wrap gap-7",
  month: "flex flex-col gap-1.5",
  // caption on the left, round nav buttons pinned top-right
  month_caption: "flex items-center h-(--cal-cell) px-2",
  caption_label: cn(
    "relative inline-flex items-baseline gap-[0.4rem] text-[1rem] font-medium tracking-[-0.01em] whitespace-nowrap",
    "[&_svg]:size-4 [&_svg]:opacity-60",
    turnClass,
  ),
  // dropdown caption: native select laid invisibly over a styled label
  dropdowns: "inline-flex items-center gap-tight",
  dropdown_root: cn(
    "relative inline-flex items-center h-8 pl-3 pr-2.5 rounded-pill bg-fill hover:bg-fill-hover",
    "focus-within:shadow-[inset_0_0_0_2px_var(--rap-ring)] [&_[data-slot=calendar-caption-label]]:text-[0.875rem]",
  ),
  dropdown: "absolute inset-0 z-2 w-full m-0 p-0 border-0 opacity-0 cursor-pointer appearance-none [font:inherit]",
  months_dropdown: "",
  years_dropdown: "",
  nav: "absolute top-0 right-0 z-1 flex gap-tight",
  button_previous: navButton(),
  button_next: navButton(),
  chevron: "",
  month_grid: cn("border-separate border-spacing-x-0 border-spacing-y-tight origin-[50%_130%]", turnClass),
  weekdays: "",
  weekday: "w-(--cal-cell) h-7 p-0 text-[0.8125rem] font-medium text-mute text-center",
  weeks: "",
  week: "",
  week_number: "w-(--cal-cell) text-[0.75rem] text-mute text-center",
  week_number_header: "w-(--cal-cell) text-[0.75rem] text-mute text-center",
  day: cn(
    "group/day size-(--cal-cell) p-0 text-center data-[outside]:text-mute data-[hidden]:invisible",
    // range: a fill band behind the middle, the ends are blue circles sitting on the band;
    // the band wraps round at the row edges
    "data-[range-middle]:bg-fill data-[range-middle]:first:rounded-l-pill data-[range-middle]:last:rounded-r-pill",
    "data-[range-start]:bg-[linear-gradient(to_right,transparent_50%,var(--rap-fill)_50%)]",
    "data-[range-end]:bg-[linear-gradient(to_left,transparent_50%,var(--rap-fill)_50%)]",
    "data-[range-start]:data-[range-end]:bg-none data-[range-start]:last:bg-none data-[range-end]:first:bg-none",
    // days from the neighbouring month keep their state but step back
    "data-[outside]:data-[selected]:opacity-45 data-[outside]:data-[range-middle]:opacity-45",
  ),
  day_button: "",
  footer: "pt-2.5 px-2 pb-0.5 text-[0.8125rem] text-mute",
};

function navButton() {
  return cn(
    "grid place-items-center size-(--cal-cell) p-0 border-0 rounded-full bg-fill text-ink cursor-pointer",
    "transition-[background-color,scale] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover active:scale-92",
    "focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-ring!",
    "aria-disabled:opacity-35 aria-disabled:pointer-events-none [&_svg]:size-[18px]",
  );
}

/* how far the ripple reaches, in cells, and how fast it travels */
const REACH = 4.5;
const CELL_MS = 40;

/** A react-day-picker part with a `data-slot` on its element. */
function slotted<P extends object>(Part: ComponentType<P>, slot: string) {
  const Slotted = (props: P) => <Part {...props} {...({ "data-slot": slot } as object)} />;
  Slotted.displayName = `Calendar(${slot})`;
  return Slotted;
}

function RapChevron({ orientation = "left", className }: ChevronProps) {
  const Icon = { left: ChevronLeft, right: ChevronRight, up: ChevronUp, down: ChevronDown }[orientation];
  return <Icon data-slot="calendar-chevron" className={className} strokeWidth={2.2} aria-hidden />;
}

/** Today's ring: a pen loop that overshoots its own start, drawn slightly askew. */
function TodayRing() {
  return (
    <svg
      data-slot="calendar-today-ring"
      className={cn(
        "absolute -inset-[3px] z-2 w-[calc(100%+6px)] h-[calc(100%+6px)] -rotate-8 pointer-events-none",
        "fill-none stroke-(--cal-pen) stroke-[2.2] [stroke-linecap:round] [stroke-linejoin:round]",
      )}
      viewBox="0 0 48 48"
      aria-hidden
    >
      <path d="M33.5 7.5C24 2.6 9.8 5.8 6.2 19.2 3 31.6 12.4 43.6 25.6 42.8 38.8 42 45.6 31.4 43.2 20.4 41.2 11 32 4.8 19.4 7.8" />
    </svg>
  );
}

/* The day cell: react-day-picker's own <td> (it already carries data-selected, -today,
   -outside, -disabled, -hidden), plus the range position it only exposes as classes. */
function RapDay(props: DayProps) {
  const m = props.modifiers;
  return (
    <RdpDay
      {...props}
      {...({
        "data-slot": "calendar-day",
        "data-range-start": m.range_start || undefined,
        "data-range-middle": m.range_middle || undefined,
        "data-range-end": m.range_end || undefined,
      } as object)}
    />
  );
}

/* The day button: react-day-picker's own (it focuses itself when the grid says so) plus the ring.
   Its look follows one tone worked out here — a range middle is also "selected", but sits on
   the band as plain ink — so no two state rules have to fight over the background. */
function RapDayButton({ day: _day, modifiers, children, className, ...rest }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const tone = modifiers.range_middle ? "middle" : modifiers.selected ? "selected" : "plain";
  return (
    <button
      ref={ref}
      data-slot="calendar-day-button"
      className={cn(
        "relative grid place-items-center size-(--cal-cell) mx-auto p-0 border-0 rounded-full bg-transparent text-inherit tabular-nums cursor-pointer",
        // the parent's font, spelled out: a `font` shorthand would also reset tabular-nums
        "[font-family:inherit] [font-size:inherit] [line-height:inherit] [font-style:inherit]",
        "transition-[background-color,color,box-shadow] duration-(--rap-dur-fast) ease-rm",
        "focus-visible:outline-none! focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
        // today: circled by hand in the flame pen (TodayRing), and a touch bolder
        tone === "plain" && (modifiers.today ? "font-semibold" : "[font-weight:inherit]"),
        tone === "plain" && !modifiers.disabled && "hover:bg-fill-hover",
        tone === "selected" &&
          "bg-select text-select-ink font-medium focus-visible:shadow-[0_0_0_2px_var(--rap-surface),0_0_0_4px_var(--rap-ring)]",
        tone === "middle" && "text-ink font-normal hover:bg-fill-hover",
        modifiers.disabled && "opacity-35 cursor-not-allowed",
        /* the drop: the picked day splats, the days around it ripple outward (data attributes
           set from the click; --rip-x/-y point away from the drop, --rip-a is the strength left
           at that distance, --rip-delay the travel time). A ripple outranks a splat, and the
           selected disc keeps its own colour while it ripples. */
        "data-[splat]:not-data-[ripple]:fun:animate-splat",
        tone === "selected"
          ? "data-[ripple]:fun:animate-[rap-cal-ripple-still_520ms_var(--rap-ease-out)_var(--rip-delay,0ms)_both]"
          : "data-[ripple]:fun:animate-[rap-cal-ripple_520ms_var(--rap-ease-out)_var(--rip-delay,0ms)_both]",
        className,
      )}
      {...rest}
    >
      {modifiers.today && <TodayRing />}
      <span data-slot="calendar-day-number" className="relative z-1">
        {children}
      </span>
    </button>
  );
}

/* "September 2026" → the month large on a hand-laid acid highlighter stroke, the year quiet. */
function RapCaptionLabel({ children, className, ...rest }: CaptionLabelProps) {
  const m = typeof children === "string" ? children.match(/^(.*\S)\s+(\d{4})$/) : null;
  return (
    <span data-slot="calendar-caption-label" className={className} {...rest}>
      {m ? (
        <>
          <span
            data-slot="calendar-caption-month"
            className={cn(
              "relative z-0 text-[1.375rem] font-semibold tracking-[-0.035em] leading-none group-data-[size=sm]/cal:text-[1.1875rem]",
              "after:absolute after:-z-1 after:-left-1 after:-right-1.5 after:-bottom-[0.08em] after:h-[0.42em]",
              "after:rounded-[3px_8px_5px_10px] after:bg-acid after:-rotate-[1.5deg] after:origin-left dark:after:opacity-55",
            )}
          >
            {m[1]}
          </span>
          <span data-slot="calendar-caption-year" className="text-[1rem] font-normal text-mute tracking-[-0.01em]">
            {m[2]}
          </span>
        </>
      ) : (
        children
      )}
    </span>
  );
}

const COMPONENTS: Partial<CustomComponents> = {
  Chevron: RapChevron,
  Day: RapDay,
  DayButton: RapDayButton,
  CaptionLabel: RapCaptionLabel,
  Months: slotted(RdpMonths, "calendar-months"),
  Month: slotted(RdpMonth, "calendar-month"),
  MonthCaption: slotted(RdpMonthCaption, "calendar-caption"),
  DropdownNav: slotted(RdpDropdownNav, "calendar-dropdowns"),
  Nav: slotted(RdpNav, "calendar-nav"),
  PreviousMonthButton: slotted(RdpPreviousMonthButton, "calendar-previous"),
  NextMonthButton: slotted(RdpNextMonthButton, "calendar-next"),
  MonthGrid: slotted(RdpMonthGrid, "calendar-grid"),
  Weekdays: slotted(RdpWeekdays, "calendar-weekdays"),
  Weekday: slotted(RdpWeekday, "calendar-weekday"),
  Weeks: slotted(RdpWeeks, "calendar-weeks"),
  Week: slotted(RdpWeek, "calendar-week"),
  Footer: slotted(RdpFooter, "calendar-footer"),
};

/** Restart a keyframe driven by a data attribute on an element React does not manage it on. */
function replay(el: HTMLElement, attr: string) {
  el.removeAttribute(attr);
  void el.offsetWidth;
  el.setAttribute(attr, "");
}

/** The drop: splat the picked day, ripple the ones around it. */
function drop(btn: HTMLElement) {
  const grid = btn.closest('[data-slot="calendar-grid"]');
  if (!grid) return;
  const rows = Array.from(grid.querySelectorAll<HTMLElement>('[data-slot="calendar-week"]')).map((r) =>
    Array.from(r.querySelectorAll<HTMLElement>('[data-slot="calendar-day-button"]')),
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
    setTurn((t) => ({ dir, n: (t?.n ?? 0) + 1 })); // `fun:` stands it down under calm
    onMonthChange?.(month);
  };

  return (
    <DayPicker
      {...(rest as DayPickerProps)}
      showOutsideDays={showOutsideDays}
      data-slot="calendar"
      data-size={size}
      data-turn={turn ? (turn.n % 2 ? "a" : "b") : undefined}
      className={cn(size === "sm" ? "[--cal-cell:36px] text-[0.875rem]" : "[--cal-cell:var(--rap-control-h)]", className)}
      style={turn ? ({ "--turn": turn.dir, ...rest.style } as CSSProperties) : rest.style}
      classNames={{ ...CLASSES, ...classNames }}
      components={{ ...COMPONENTS, ...components }}
      onDayClick={handleDayClick}
      onMonthChange={handleMonthChange}
    />
  );
}
