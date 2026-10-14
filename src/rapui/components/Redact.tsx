/* ══ Redact ═══════════════════════════════════════════════
   Text set like a marked-up document: some words printed on an
   ink bar (inverted), some blacked out entirely. Write it inline:

     <Redact>Searcy [locks] your {focus on} what [matters]</Redact>

   [word]  → on a bar, in paper colour (highlighted)
   {word}  → blacked out: the bar hides it (screen readers still
             read it — the redaction is visual)

   Delight: the bars are laid down when the text scrolls into view,
   each wiping in from the left after the one before, like a marker
   going over a page. Hover a blacked-out word and it is
   declassified: the bar lifts to a hairline and the word shows.
   Fun wipes quickly with a slight overshoot; calm wipes once,
   evenly; still shows the bars in place. */
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import "./Redact.css";

export interface RedactProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3";
  /** Delay between bars, ms. */
  stagger?: number;
}

type Part = { text: string; kind: "plain" | "mark" | "black" };

function parse(src: string): Part[] {
  const out: Part[] = [];
  const re = /\[([^\]]+)\]|\{([^}]+)\}/g;
  let last = 0;
  for (const m of src.matchAll(re)) {
    if (m.index! > last) out.push({ text: src.slice(last, m.index), kind: "plain" });
    out.push(m[1] !== undefined ? { text: m[1], kind: "mark" } : { text: m[2], kind: "black" });
    last = m.index! + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last), kind: "plain" });
  return out;
}

export function Redact({ children, as: Tag = "p", stagger = 110, className, ...rest }: RedactProps) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let n = 0;
  const parts: ReactNode[] = parse(children).map((p, i) => {
    if (p.kind === "plain") return <span key={i}>{p.text}</span>;
    const k = n++;
    return (
      <span
        key={i}
        data-kind={p.kind}
        className="rap-redact-bar"
        style={{ "--k": k, "--stagger": `${stagger}ms` } as CSSProperties}
        tabIndex={p.kind === "black" ? 0 : undefined}
      >
        {p.text}
      </span>
    );
  });

  return (
    <Tag ref={ref as never} data-slot="redact" data-on={on || undefined} className={cn("rap-redact m-0", className)} {...rest}>
      {parts}
    </Tag>
  );
}
