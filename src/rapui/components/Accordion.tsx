import { useId, useState, type ReactNode } from "react";
import { cn } from "../utils";
import { useSound } from "../sound";

export interface AccordionItem {
  title: ReactNode;
  content: ReactNode;
  /** Right-side meta, e.g. a year or tag. */
  meta?: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow several open at once. */
  multiple?: boolean;
  defaultOpen?: number[];
  numbered?: boolean;
  className?: string;
}

/**
 * Big editorial list rows that open with a smooth height animation.
 * Calm: the hover band fades in instead of rising, the title nudges 4px (not 10),
 * the + turns to × on a plain ease (no spring) and the text drops in from 4px.
 */
export function Accordion({ items, multiple = false, defaultOpen = [], numbered = true, className }: AccordionProps) {
  const [open, setOpen] = useState<number[]>(defaultOpen);
  const base = useId();
  const sound = useSound();

  const toggle = (i: number) => {
    sound.play(open.includes(i) ? "drop" : "pop", { strength: 0.6 });
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : multiple ? [...cur, i] : [i]));
  };

  return (
    <div data-slot="accordion" className={cn("border-t-[1.5px] border-ink", className)}>
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        return (
          <div data-slot="accordion-item" data-state={isOpen ? "open" : "closed"} className="border-b-[1.5px] border-ink" key={i}>
            <button
              type="button"
              data-slot="accordion-trigger"
              className={cn(
                "group/head relative isolate grid grid-cols-[auto_1fr_auto_auto] items-center gap-[clamp(1rem,3vw,2.5rem)] w-full",
                "py-[clamp(1.1rem,2.4vw,2rem)] px-0 border-0 bg-transparent text-ink text-left cursor-pointer hover:text-flame",
                // on hover a paper band rises from the bottom behind the row
                "before:absolute before:inset-y-0 before:-inset-x-4 before:-z-1 before:rounded-sm before:bg-paper-3",
                "before:origin-bottom before:[transform:scaleY(0)] before:transition-transform before:duration-(--rap-dur) before:ease-soft",
                "hover:before:[transform:scaleY(1)]",
                // calm: no rising band — it is simply there, fading in
                "calm:before:[transform:none] calm:before:opacity-0 calm:hover:before:opacity-100",
                "calm:before:transition-opacity calm:before:duration-(--rap-dur-fast)",
              )}
              aria-expanded={isOpen}
              aria-controls={`${base}-${i}`}
              onClick={() => toggle(i)}
            >
              {numbered && (
                <span className="text-[0.875rem] font-medium text-mute tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              )}
              <span
                className={cn(
                  "font-display font-medium text-display-lg tracking-[var(--rap-display-tracking-md,-0.045em)] [text-transform:var(--rap-display-case,none)] leading-none",
                  "transition-transform duration-(--rap-dur) ease-soft group-hover/head:[transform:translateX(0.6rem)]",
                  "calm:group-hover/head:[transform:translateX(4px)]",
                )}
              >
                {item.title}
              </span>
              {item.meta && <span className="text-[0.875rem] font-medium text-mute">{item.meta}</span>}
              {/* a + drawn with two bars; open, it spins to an × on the accent */}
              <span
                aria-hidden
                className={cn(
                  "relative size-10 rounded-full border-[1.5px] border-current",
                  "[transition:transform_var(--rap-dur)_var(--rap-ease-spring),background_var(--rap-dur)]",
                  // calm: the same turn to ×, without the overshoot. Stays round on purpose:
                  // it rotates, and a preset's square-ish pill would read as a spinning diamond
                  "calm:[transition:transform_var(--rap-dur)_var(--rap-ease-out),background_var(--rap-dur)]",
                  "before:absolute before:left-1/2 before:top-1/2 before:w-2/5 before:h-0.5 before:bg-current before:[transform:translate(-50%,-50%)]",
                  "after:absolute after:left-1/2 after:top-1/2 after:w-2/5 after:h-0.5 after:bg-current after:[transform:translate(-50%,-50%)_rotate(90deg)]",
                  isOpen && "[transform:rotate(135deg)] bg-accent border-accent text-accent-ink",
                )}
              />
            </button>
            {/* height via grid rows 0fr → 1fr, so no measuring */}
            <div
              data-slot="accordion-content"
              className={cn(
                "grid transition-[grid-template-rows] duration-(--rap-dur-slow) ease-soft",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
              id={`${base}-${i}`}
              role="region"
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "pb-8 pl-[calc(clamp(1rem,3vw,2.5rem)+2ch)] max-w-[60ch] text-display-md leading-[1.4] text-ink-2",
                    // the text drops in a beat after the panel starts opening
                    isOpen
                      ? "opacity-100 [transform:none] [transition:opacity_var(--rap-dur)_var(--rap-ease-out)_120ms,transform_var(--rap-dur)_var(--rap-ease-out)_120ms]"
                      : "opacity-0 [transform:translateY(-1rem)] calm:[transform:translateY(-4px)] [transition:opacity_var(--rap-dur)_var(--rap-ease-out),transform_var(--rap-dur)_var(--rap-ease-out)]",
                  )}
                >
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
