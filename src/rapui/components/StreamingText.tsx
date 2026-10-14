/* ══ StreamingText ════════════════════════════════════════
   An answer arriving word by word. Two ways to drive it:

   - real streaming: pass the text so far as `children` and
     `streaming` while chunks keep coming — words that are new since
     the last render fade in, a caret blinks at the end;
   - demo / replay: pass the whole text with `simulate` and it types
     itself out at `speed` words per second, then calls `onDone`.

   Paragraphs are split on blank lines. Words fade in with a 2px
   rise (fun) or a plain fade (calm); still shows them at once. The
   caret is a bar in the accent colour; it hides when done. */
import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../utils";
import "./StreamingText.css";

export interface StreamingTextProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: string;
  /** More text is still coming: show the caret. */
  streaming?: boolean;
  /** Type the whole text out by itself. */
  simulate?: boolean;
  /** Words per second when simulating. */
  speed?: number;
  onDone?: () => void;
}

export function StreamingText({ children, streaming = false, simulate = false, speed = 28, onDone, className, ...rest }: StreamingTextProps) {
  const words = children.split(/(\s+)/); // keep the spaces and newlines as their own tokens
  const [shown, setShown] = useState(simulate ? 0 : words.length);
  const seen = useRef(simulate ? 0 : words.length); // tokens already on screen last time: they don't fade again
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!simulate) {
      setShown(words.length);
      return;
    }
    setShown(0);
    seen.current = 0;
    const id = window.setInterval(() => {
      setShown((n) => {
        const next = Math.min(words.length, n + 2); // a word and its space
        if (next >= words.length) {
          window.clearInterval(id);
          done.current?.();
        }
        return next;
      });
    }, 1000 / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, simulate, speed]);

  const from = seen.current;
  useEffect(() => {
    seen.current = shown;
  });

  const typing = streaming || (simulate && shown < words.length);
  // rebuild paragraphs from the visible tokens
  const paras: { t: string; i: number }[][] = [[]];
  words.slice(0, shown).forEach((t, i) => {
    if (/\n\s*\n/.test(t)) paras.push([]);
    else paras[paras.length - 1].push({ t, i });
  });

  return (
    <div data-slot="streaming-text" aria-live="polite" aria-busy={typing || undefined} className={cn("rap-streaming flex flex-col gap-[0.8em]", className)} {...rest}>
      {paras.map((p, k) => (
        <p key={k} className="m-0">
          {p.map(({ t, i }) => (
            <span key={i} className={i >= from ? "rap-stream-new" : undefined}>
              {t}
            </span>
          ))}
          {typing && k === paras.length - 1 && <span aria-hidden className="rap-stream-caret" />}
        </p>
      ))}
    </div>
  );
}
