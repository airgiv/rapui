/* ══ Combobox ═════════════════════════════════════════════
   A Select you can type into (Radix Popover + cmdk).

   DELIGHT — THE SAME HAND OF CARDS AS SELECT, AND A HIGHLIGHTER.

   Like Select, opening deals the rows in (22ms apart, capped at
   the 12th) and a pick rolls the new value into the trigger's
   slot window (the `useRoll` from Select). The deal only runs
   in a short window after opening: rows that come back while you
   filter just appear, because rows re-dealing on every keystroke
   would make typing feel slow.

   What is Combobox's own: as you type, the characters that MATCH
   are swiped with the acid marker, left to right, one character
   18ms after the other — the way you would run a highlighter
   over the part of a word you were looking for. A character that
   stays matched stays marked; only newly matched ones are swiped,
   so extending the query extends the stroke instead of redrawing
   it. Contiguous matches first, then a subsequence (so "nmtl"
   still marks N-M-T-L in Neue Montreal); a row found only by its
   keywords is not marked, since nothing in its label matched.

   Reduced motion / data-rap-motion="calm": the marker is simply
   there, the deal and roll are off.
   Sound: "pop" on open, "tick" on pick. */
import { forwardRef, useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { Check, ChevronDown, Search } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import { useRoll } from "./Select";
import "./Select.css";
import "./Combobox.css";

/** Indices of `label` that match `query`: a contiguous run if there is one, else a full subsequence, else none. */
function matchesOf(label: string, query: string): number[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const l = label.toLowerCase();
  const at = l.indexOf(q);
  if (at >= 0) return Array.from({ length: q.length }, (_, i) => at + i);
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < l.length && j < q.length; i++) {
    if (l[i] === q[j]) {
      out.push(i);
      j++;
    }
  }
  return j === q.length ? out : [];
}

/** The label with every matched character marked; `--k` is its place in its run, for the swipe. */
function Marked({ label, query }: { label: string; query: string }) {
  const hits = new Set(matchesOf(label, query));
  if (!hits.size) return <>{label}</>;
  let k = 0;
  return (
    <>
      {Array.from(label).map((ch, i) => {
        const hit = hits.has(i);
        k = hit ? k + 1 : 0;
        return (
          <span
            key={i}
            className={hit ? cx("rap-combobox__hit", !hits.has(i - 1) && "is-first", !hits.has(i + 1) && "is-last") : undefined}
            style={hit ? ({ "--k": k - 1 } as CSSProperties) : undefined}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
}

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
 * Matched characters are swiped with the acid marker as you type.
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
  const [query, setQuery] = useState("");
  const current = value ?? innerValue;
  const isOpen = open ?? innerOpen;
  const sound = useSound();
  const setOpen = (o: boolean) => {
    setInnerOpen(o);
    if (o) sound.play("pop");
    else setQuery("");
    onOpenChange?.(o);
  };
  const selected = options.find((o) => o.value === current);
  const valueRef = useRef<HTMLSpanElement>(null);
  const roll = useRoll(valueRef, { text: selected ? selected.label : placeholder });

  // the deal runs only just after opening; rows that return while filtering simply appear
  const [dealing, setDealing] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    setDealing(true);
    const id = window.setTimeout(() => setDealing(false), 260 + 22 * Math.min(options.length, 12) + 80);
    return () => window.clearTimeout(id);
  }, [isOpen, options.length]);

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
          <span className="rap-select-trigger__window">
            <span ref={valueRef} className={cx("rap-select-trigger__value", roll.valueClass)}>
              {selected ? selected.label : placeholder}
            </span>
            {roll.ghost}
          </span>
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
              <Command.Input className="rap-combobox__input" placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
            </div>
            <Command.List className={cx("rap-combobox__list", dealing && "is-dealing")}>
              <Command.Empty className="rap-combobox__empty">{emptyText}</Command.Empty>
              {options.map((o, i) => (
                <Command.Item
                  key={o.value}
                  value={o.value}
                  keywords={[o.label, ...(o.keywords ?? [])]}
                  disabled={o.disabled}
                  className="rap-menu-item rap-combobox__item"
                  style={{ "--i": Math.min(i, 12) } as CSSProperties}
                  onSelect={() => {
                    sound.play("tick");
                    setInnerValue(o.value);
                    onValueChange?.(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="rap-combobox__label">
                    <Marked label={o.label} query={query} />
                  </span>
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
