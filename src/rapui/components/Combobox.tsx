import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { cx } from "../utils";
import "./Select.css";
import "./Combobox.css";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Extra words that should match the search (e.g. a foundry name). */
  keywords?: string[];
  disabled?: boolean;
}

export interface ComboboxProps
  extends Omit<ComponentPropsWithoutRef<"button">, "value" | "defaultValue" | "onChange" | "children"> {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: ReactNode;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Open state, if you want to control it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Class for the floating list. */
  contentClassName?: string;
}

/**
 * Searchable select: a Select-style trigger that opens a filterable list
 * (Radix Popover + cmdk). Type to narrow, arrows to move, Enter to pick.
 */
export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyText = "Nothing found.",
    size = "md",
    invalid,
    open,
    onOpenChange,
    className,
    contentClassName,
    disabled,
    ...rest
  },
  ref,
) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const [innerOpen, setInnerOpen] = useState(false);
  const current = value ?? innerValue;
  const isOpen = open ?? innerOpen;
  const setOpen = (o: boolean) => {
    setInnerOpen(o);
    onOpenChange?.(o);
  };
  const selected = options.find((o) => o.value === current);

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-invalid={invalid || rest["aria-invalid"] || undefined}
          disabled={disabled}
          data-placeholder={selected ? undefined : ""}
          className={cx(
            "rap-select-trigger",
            `rap-select-trigger--${size}`,
            "rap-combobox",
            invalid && "is-invalid",
            className,
          )}
          {...rest}
        >
          <span className="rap-select-trigger__value">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="rap-select-trigger__icon" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cx("rap-pop", "rap-combobox__content", contentClassName)}
        >
          <Command className="rap-combobox__command" loop>
            <div className="rap-combobox__search">
              <Search aria-hidden />
              <Command.Input className="rap-combobox__input" placeholder={searchPlaceholder} />
            </div>
            <Command.List className="rap-combobox__list">
              <Command.Empty className="rap-combobox__empty">{emptyText}</Command.Empty>
              {options.map((o) => (
                <Command.Item
                  key={o.value}
                  value={o.value}
                  keywords={[o.label, ...(o.keywords ?? [])]}
                  disabled={o.disabled}
                  className="rap-menu-item rap-combobox__item"
                  onSelect={() => {
                    setInnerValue(o.value);
                    onValueChange?.(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="rap-combobox__label">{o.label}</span>
                  {o.value === current && <Check className="rap-combobox__check" size={16} strokeWidth={2.5} />}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
