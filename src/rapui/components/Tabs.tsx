import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";
import "./Tabs.css";

export interface TabItem {
  value: string;
  label: ReactNode;
  content?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/** Pill tabs with a gooey indicator that slides between options. */
export function Tabs({ items, value, defaultValue, onValueChange, className }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const active = value ?? inner;
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0 });
  const base = useId();

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const btn = list.querySelector<HTMLElement>(`[data-value="${CSS.escape(active ?? "")}"]`);
      if (btn) setInd({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [active, items]);

  const onKey = (e: KeyboardEvent) => {
    const idx = items.findIndex((i) => i.value === active);
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = items[(idx + dir + items.length) % items.length];
    select(next.value);
    listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  };

  const current = items.find((i) => i.value === active);

  return (
    <div data-slot="animated-tabs" className={className}>
      <div
        data-slot="animated-tabs-list"
        className="relative isolate inline-flex p-[5px] rounded-pill bg-paper-3"
        role="tablist"
        ref={listRef}
        onKeyDown={onKey}
      >
        {/* the ink pill springs to the measured tab */}
        <span
          data-slot="animated-tabs-indicator"
          className={cn(
            "absolute -z-1 top-[5px] bottom-[5px] left-0 rounded-pill bg-ink",
            "[transition:transform_var(--rap-dur)_var(--rap-ease-spring),width_var(--rap-dur)_var(--rap-ease-spring)]",
          )}
          style={{ transform: `translateX(${ind.left}px)`, width: ind.width }}
          aria-hidden
        />
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            role="tab"
            data-value={it.value}
            id={`${base}-t-${it.value}`}
            aria-selected={it.value === active}
            aria-controls={`${base}-p-${it.value}`}
            tabIndex={it.value === active ? 0 : -1}
            data-slot="animated-tabs-trigger"
            data-state={it.value === active ? "active" : "inactive"}
            className={cn(
              "relative py-[0.8rem] px-[1.4rem] border-0 rounded-pill bg-transparent text-ink font-sans font-medium text-[1rem] cursor-pointer",
              "transition-[color] duration-(--rap-dur) ease-soft",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              it.value === active ? "text-paper" : "hover:text-accent",
            )}
            onClick={() => select(it.value)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {current?.content !== undefined && (
        <div
          data-slot="animated-tabs-panel"
          className="pt-8 animate-[rap-tab-in_var(--rap-dur)_var(--rap-ease-out)]"
          role="tabpanel" id={`${base}-p-${current.value}`} aria-labelledby={`${base}-t-${current.value}`} key={current.value}>
          {current.content}
        </div>
      )}
    </div>
  );
}
