import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { format as formatDate } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays } from "../icons";
import { cx } from "../utils";
import { Calendar, type CalendarProps } from "./Calendar";
import "./Select.css";
import "./DatePicker.css";

export type { DateRange };

interface DatePickerBase
  extends Omit<ComponentPropsWithoutRef<"button">, "value" | "defaultValue" | "onChange" | "children"> {
  placeholder?: string;
  /** date-fns format string for the trigger. */
  format?: string;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  /** Extra DayPicker props (disabled days, locale, weekStartsOn, footer…). */
  calendarProps?: Partial<Omit<CalendarProps, "mode" | "selected" | "onSelect">>;
  /** Optional content under the calendar (presets, a time field…). */
  footer?: ReactNode;
}

export interface DatePickerSingleProps extends DatePickerBase {
  mode?: "single";
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date | undefined) => void;
}

export interface DatePickerRangeProps extends DatePickerBase {
  mode: "range";
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  /** Months shown side by side (default 2). */
  numberOfMonths?: number;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

/**
 * Pill trigger with a calendar icon that opens a Calendar in a popover
 * (Radix Popover + react-day-picker). `mode="range"` picks a start and end.
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(props, ref) {
  const {
    mode = "single",
    value,
    defaultValue,
    onValueChange,
    placeholder = mode === "range" ? "Pick dates" : "Pick a date",
    format = "d MMM yyyy",
    size = "md",
    invalid,
    open,
    onOpenChange,
    align = "start",
    calendarProps,
    footer,
    className,
    ...rest
  } = props;
  const { numberOfMonths, ...buttonRest } = rest as typeof rest & { numberOfMonths?: number };

  const [inner, setInner] = useState<Date | DateRange | undefined>(defaultValue);
  const [innerOpen, setInnerOpen] = useState(false);
  const current = value !== undefined ? value : inner;
  const isOpen = open ?? innerOpen;
  const setOpen = (o: boolean) => {
    setInnerOpen(o);
    onOpenChange?.(o);
  };

  let label: string | null = null;
  if (mode === "range") {
    const r = current as DateRange | undefined;
    if (r?.from) label = r.to ? `${formatDate(r.from, format)} – ${formatDate(r.to, format)}` : `${formatDate(r.from, format)} – …`;
  } else if (current instanceof Date) {
    label = formatDate(current, format);
  }

  const calendar =
    mode === "range" ? (
      <Calendar
        {...(calendarProps as CalendarProps)}
        mode="range"
        numberOfMonths={numberOfMonths ?? 2}
        defaultMonth={(current as DateRange | undefined)?.from}
        selected={current as DateRange | undefined}
        onSelect={(r: DateRange | undefined) => {
          setInner(r);
          (onValueChange as DatePickerRangeProps["onValueChange"])?.(r);
        }}
      />
    ) : (
      <Calendar
        {...(calendarProps as CalendarProps)}
        mode="single"
        defaultMonth={current as Date | undefined}
        selected={current as Date | undefined}
        onSelect={(d: Date | undefined) => {
          setInner(d);
          (onValueChange as DatePickerSingleProps["onValueChange"])?.(d);
          if (d) setOpen(false);
        }}
      />
    );

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={ref}
          type="button"
          aria-invalid={invalid || buttonRest["aria-invalid"] || undefined}
          data-placeholder={label ? undefined : ""}
          className={cx(
            "rap-select-trigger",
            `rap-select-trigger--${size}`,
            "rap-datepicker",
            invalid && "is-invalid",
            className,
          )}
          {...buttonRest}
        >
          <CalendarDays className="rap-datepicker__icon" aria-hidden />
          <span className="rap-select-trigger__value">{label ?? placeholder}</span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align={align} sideOffset={6} className="rap-pop rap-datepicker__content">
          {calendar}
          {footer != null && <div className="rap-datepicker__footer">{footer}</div>}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
