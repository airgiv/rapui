import { DayPicker, type ChevronProps, type ClassNames, type DayPickerProps } from "react-day-picker";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cx } from "../utils";
import "./Calendar.css";

export type CalendarProps = DayPickerProps & {
  /** Day cell diameter: sm 36px, md 40px. */
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

function RapChevron({ orientation = "left", className }: ChevronProps) {
  const Icon = { left: ChevronLeft, right: ChevronRight, up: ChevronUp, down: ChevronDown }[orientation];
  return <Icon className={className} strokeWidth={2.2} aria-hidden />;
}

/**
 * Month grid (react-day-picker 10) with round day cells. Pass `mode="single" | "range" | "multiple"`
 * and the matching `selected` / `onSelect` — every DayPicker prop is passed through.
 */
export function Calendar({ className, classNames, components, showOutsideDays = true, size = "md", ...rest }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cx(`rap-cal--${size}`, className)}
      classNames={{ ...CLASSES, ...classNames }}
      components={{ Chevron: RapChevron, ...components }}
      {...(rest as DayPickerProps)}
    />
  );
}
