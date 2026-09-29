import { useId, useState, type ReactNode } from "react";
import { cx } from "../utils";
import { useSound } from "../sound";
import "./Accordion.css";

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

/** Big editorial list rows that open with a smooth height animation. */
export function Accordion({ items, multiple = false, defaultOpen = [], numbered = true, className }: AccordionProps) {
  const [open, setOpen] = useState<number[]>(defaultOpen);
  const base = useId();
  const sound = useSound();

  const toggle = (i: number) => {
    sound.play(open.includes(i) ? "drop" : "pop", { strength: 0.6 });
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : multiple ? [...cur, i] : [i]));
  };

  return (
    <div className={cx("rap-acc", className)}>
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        return (
          <div className={cx("rap-acc__item", isOpen && "is-open")} key={i}>
            <button
              type="button"
              className="rap-acc__head"
              aria-expanded={isOpen}
              aria-controls={`${base}-${i}`}
              onClick={() => toggle(i)}
            >
              {numbered && <span className="rap-acc__num">{String(i + 1).padStart(2, "0")}</span>}
              <span className="rap-acc__title">{item.title}</span>
              {item.meta && <span className="rap-acc__meta">{item.meta}</span>}
              <span className="rap-acc__icon" aria-hidden />
            </button>
            <div className="rap-acc__panel" id={`${base}-${i}`} role="region">
              <div className="rap-acc__inner">
                <div className="rap-acc__body">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
