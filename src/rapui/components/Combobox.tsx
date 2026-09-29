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
import { cn } from "../utils";
import { dealRowClass, selectIconClass, selectTriggerVariants, selectValueClass, selectWindowClass, useRoll } from "./Select";
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

/* The highlighter: each matched character is swiped left to right, one after the
   other along its run (--k, 18ms apart), in the acid marker. Acid is the same in both
   themes, so the ink on it is too. The ends of a run get rounder corners and a pixel
   of bleed so the stroke looks laid on, not boxed. */
const hitClass = cn(
  "text-[#282828] bg-[linear-gradient(var(--rap-acid),var(--rap-acid))] bg-no-repeat bg-[position:0_55%] bg-[size:100%_86%]",
  "fun:animate-[rap-combobox-swipe_110ms_linear_calc(var(--k,0)*18ms)_both]",
);

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
        const first = !hits.has(i - 1);
        const last = !hits.has(i + 1);
        return (
          <span
            key={i}
            data-slot={hit ? "combobox-hit" : undefined}
            className={
              hit
                ? cn(
                    hitClass,
                    first && last
                      ? "rounded-[5px]"
                      : first
                        ? "rounded-[5px_2px_2px_5px]"
                        : last
                          ? "rounded-[2px_5px_5px_2px]"
                          : undefined,
                    first && "-ml-px pl-px",
                    last && "-mr-px pr-px",
                  )
                : undefined
            }
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
          data-slot="combobox-trigger"
          data-size={size}
          className={cn(selectTriggerVariants({ size, invalid: !!invalid }), className)}
          {...rest}
        >
          <span data-slot="combobox-window" className={selectWindowClass}>
            <span ref={valueRef} data-slot="combobox-value" className={cn(selectValueClass, roll.valueClass)}>
              {selected ? selected.label : placeholder}
            </span>
            {roll.ghost}
          </span>
          <ChevronDown data-slot="combobox-icon" className={selectIconClass} aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          data-slot="combobox-content"
          className={cn("pop w-(--radix-popover-trigger-width) min-w-[220px]", contentClassName)}
        >
          <Command data-slot="combobox-command" className="flex flex-col" loop>
            <div
              data-slot="combobox-search"
              className={cn(
                "flex items-center gap-2 h-10 mt-1 mx-1 mb-0.5 px-3.5 rounded-pill bg-fill text-mute",
                "focus-within:shadow-[inset_0_0_0_2px_var(--rap-ring)] [&_svg]:size-4 [&_svg]:flex-none",
              )}
            >
              <Search aria-hidden />
              <Command.Input
                data-slot="combobox-input"
                className={cn(
                  "flex-1 min-w-0 h-full p-0 border-0 bg-transparent text-ink font-sans text-[0.9375rem] tracking-[-0.01em]",
                  "outline-none placeholder:text-mute",
                )}
                placeholder={searchPlaceholder}
                value={query}
                onValueChange={setQuery}
              />
            </div>
            <Command.List
              data-slot="combobox-list"
              data-dealing={dealing || undefined}
              className={cn(
                "max-h-[min(var(--radix-popover-content-available-height,320px),280px)] overflow-y-auto overscroll-contain",
                "pt-0.5 px-1 pb-1 scroll-py-1",
              )}
            >
              <Command.Empty data-slot="combobox-empty" className="py-5 px-[0.9rem] text-[0.875rem] text-mute text-center">
                {emptyText}
              </Command.Empty>
              {options.map((o, i) => (
                <Command.Item
                  key={o.value}
                  value={o.value}
                  keywords={[o.label, ...(o.keywords ?? [])]}
                  disabled={o.disabled}
                  data-slot="combobox-item"
                  className={cn(
                    // cmdk marks the active row with data-selected="true", and every row with
                    // data-disabled="true|false" (menu-item only dims a disabled that is not "false")
                    "menu-item pr-9 data-[selected=true]:bg-fill",
                    // the deal, only in the window just after opening
                    dealing && dealRowClass,
                  )}
                  style={{ "--i": Math.min(i, 12) } as CSSProperties}
                  onSelect={() => {
                    sound.play("tick");
                    setInnerValue(o.value);
                    onValueChange?.(o.value);
                    setOpen(false);
                  }}
                >
                  <span data-slot="combobox-label" className="overflow-hidden text-ellipsis whitespace-nowrap">
                    <Marked label={o.label} query={query} />
                  </span>
                  {o.value === current && (
                    <Check data-slot="combobox-check" className="absolute right-3 text-select" size={16} strokeWidth={2.5} />
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
