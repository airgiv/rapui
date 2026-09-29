import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../utils";
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
    <div className={cx("rap-tabs", className)}>
      <div className="rap-tabs__list" role="tablist" ref={listRef} onKeyDown={onKey}>
        <span className="rap-tabs__ind" style={{ transform: `translateX(${ind.left}px)`, width: ind.width }} aria-hidden />
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
            className={cx("rap-tabs__tab", it.value === active && "is-active")}
            onClick={() => select(it.value)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {current?.content !== undefined && (
        <div className="rap-tabs__panel" role="tabpanel" id={`${base}-p-${current.value}`} aria-labelledby={`${base}-t-${current.value}`} key={current.value}>
          {current.content}
        </div>
      )}
    </div>
  );
}
