/* ══ PromptInput ══════════════════════════════════════════
   The "Ask anything…" composer: one generous rounded field with a
   textarea that grows as you write (up to `maxRows`, then scrolls),
   attached files as chips above the text, and a row of controls —
   attach, voice, send.

     <PromptInput placeholder={["Plan a trip…", "Explain this bill…"]}
                  suggestions={["Summarise my notes"]}
                  busy={streaming} onStop={abort}
                  onSubmit={(text, files) => ask(text, files)} />

   Enter sends, Shift+Enter is a newline, Escape stops a busy answer.
   While `busy` the send button turns into a stop button (a square);
   while `listening` the mic button holds a small listening AIOrb
   that swells with `level`. The field's corners are a pill, clamped
   to half its resting height — so civic and fun read as a soft pill,
   product and signal as a crisp card, minimal as a box.

   DELIGHT — THE QUESTION LEAVES.
   An array `placeholder` cycles through example prompts, each one
   sliding up and out as the next rises in (paused while you are in
   the field or have typed anything). On send, your words lift out
   of the top of the field and fade, as if posted upward, and the
   send arrow hops out of its button and back in from below.

   Calm: the examples crossfade, the sent text simply fades where it
   stood, and the arrow stays put. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowUp, FileText, Image as ImageIcon, X, Mic, Paperclip } from "../icons";
import { cn } from "../utils";
import { AIOrb } from "./AIOrb";
import "./PromptInput.css";

export interface PromptInputProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit" | "defaultValue" | "placeholder"> {
  /** Controlled text. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Enter or the send button. The field clears itself afterwards (controlled: through `onValueChange("")`). */
  onSubmit?: (text: string, files: File[]) => void;
  /** The stop button, or Escape, while `busy`. */
  onStop?: () => void;
  /** An answer is on its way: send becomes stop, Enter does nothing. */
  busy?: boolean;
  /** The mic is open: the mic button shows a listening orb. */
  listening?: boolean;
  /** Mic input level 0..1 for the listening orb. */
  level?: number;
  /** Shows the mic button. */
  onMicClick?: () => void;
  /** One placeholder, or several example prompts to cycle through. */
  placeholder?: string | string[];
  /** Milliseconds each example stays. Default 3200. */
  cycleInterval?: number;
  /** Chips under the field. */
  suggestions?: string[];
  /** What a suggestion click does: put the text in the field, or send it straight away. Default "fill". */
  suggestionAction?: "fill" | "send";
  /** Rows before the field starts scrolling. Default 8. */
  maxRows?: number;
  disabled?: boolean;
  /** `lg` is the hero size for an empty page. */
  size?: "md" | "lg";
  /** Show the attach button. Default true. */
  attach?: boolean;
  /** File types for the picker, as in `<input accept>`. */
  accept?: string;
  /** Called whenever the attached files change. */
  onFilesChange?: (files: File[]) => void;
  /** Extra controls at the start of the toolbar, after attach (a model picker, a tools menu…). */
  toolbar?: ReactNode;
  /** Accessible name of the text field. Defaults to the first placeholder. */
  label?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

const SIZES = {
  md: {
    root: "[--pi-min:4rem] [--pi-btn:2.5rem] [--pi-pad:0.875rem] text-[1.0625rem]",
    text: "text-[1.0625rem] leading-[1.5]",
    icon: 20,
    orb: 22,
  },
  lg: {
    root: "[--pi-min:5.25rem] [--pi-btn:3rem] [--pi-pad:1.125rem] text-[1.25rem]",
    text: "text-[1.25rem] leading-[1.45] tracking-[-0.015em]",
    icon: 22,
    orb: 26,
  },
} as const;

/** The "Ask anything…" composer: auto-growing text, attachments, voice, send / stop, suggestions. */
export const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(function PromptInput(
  {
    value: valueProp,
    defaultValue = "",
    onValueChange,
    onSubmit,
    onStop,
    busy = false,
    listening = false,
    level = 0,
    onMicClick,
    placeholder = "Ask anything…",
    cycleInterval = 3200,
    suggestions,
    suggestionAction = "fill",
    maxRows = 8,
    disabled = false,
    size = "md",
    attach = true,
    accept,
    onFilesChange,
    toolbar,
    label,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const s = SIZES[size];
  const id = useId();

  /* ── value, controlled or not ── */
  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const setValue = useCallback(
    (v: string) => {
      if (!controlled) setInner(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  /* ── the textarea, and its height ── */
  const ta = useRef<HTMLTextAreaElement | null>(null);
  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      ta.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );
  const fit = useCallback(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    const max = lh * maxRows + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const h = Math.min(el.scrollHeight, max);
    el.style.height = `${h}px`;
    el.style.overflowY = el.scrollHeight > max + 1 ? "auto" : "hidden";
  }, [maxRows]);
  useLayoutEffect(fit, [fit, value, size]);
  useEffect(() => {
    const el = ta.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let w = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth === w) return;
      w = el.offsetWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  /* ── the cycling placeholder ── */
  const examples = Array.isArray(placeholder) ? placeholder : [placeholder];
  const [ph, setPh] = useState({ i: 0, prev: -1 });
  const [focused, setFocused] = useState(false);
  const cycling = examples.length > 1 && !focused && value === "" && !disabled;
  useEffect(() => {
    if (!cycling) return;
    const t = window.setInterval(() => setPh((p) => ({ i: (p.i + 1) % examples.length, prev: p.i })), cycleInterval);
    return () => window.clearInterval(t);
  }, [cycling, examples.length, cycleInterval]);
  const current = examples[ph.i % examples.length] ?? "";
  const previous = ph.prev >= 0 ? examples[ph.prev % examples.length] : undefined;

  /* ── files ── */
  const [files, setFilesState] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const setFiles = (next: File[]) => {
    setFilesState(next);
    onFilesChange?.(next);
  };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.currentTarget.files ?? []);
    if (picked.length) setFiles([...files, ...picked]);
    e.currentTarget.value = ""; // the same file can be picked again
  };

  /* ── sending ── */
  const [sent, setSent] = useState<{ n: number; text: string }>({ n: 0, text: "" });
  const [ghost, setGhost] = useState<{ n: number; text: string } | null>(null);
  useEffect(() => {
    if (!ghost) return;
    const t = window.setTimeout(() => setGhost(null), 700);
    return () => window.clearTimeout(t);
  }, [ghost]);

  const canSend = !disabled && !busy && (value.trim() !== "" || files.length > 0);
  const send = (text = value) => {
    if (disabled || busy || (text.trim() === "" && files.length === 0)) return;
    onSubmit?.(text, files);
    const n = sent.n + 1;
    setSent({ n, text });
    if (text.trim()) setGhost({ n, text });
    setValue("");
    if (files.length) setFiles([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    } else if (e.key === "Escape" && busy) {
      e.preventDefault();
      onStop?.();
    }
  };

  const pickSuggestion = (text: string) => {
    if (suggestionAction === "send" && !busy) return send(text);
    setValue(text);
    requestAnimationFrame(() => {
      const el = ta.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  };

  const iconBtn = cn(
    "relative inline-grid place-items-center shrink-0 size-(--pi-btn) rounded-pill cursor-pointer",
    "text-ink-2 bg-transparent transition-[background-color,color,scale] duration-(--rap-dur-fast) ease-rm",
    "hover:bg-fill hover:text-ink active:scale-92 calm:active:scale-97",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:opacity-40 disabled:pointer-events-none",
  );

  return (
    <div
      data-slot="prompt-input"
      data-size={size}
      data-busy={busy || undefined}
      data-disabled={disabled || undefined}
      className={cn("flex w-full flex-col gap-tile", s.root, className)}
      style={style}
      {...rest}
    >
      <div
        data-slot="prompt-input-field"
        className={cn(
          "relative flex flex-col bg-surface text-ink",
          "rounded-[min(var(--rap-radius-pill),calc(var(--pi-min)/2))]",
          "shadow-[inset_0_0_0_1px_var(--rap-edge),0_1px_2px_color-mix(in_oklab,var(--rap-ink)_6%,transparent),0_8px_28px_-12px_color-mix(in_oklab,var(--rap-ink)_22%,transparent)]",
          "transition-[box-shadow] duration-(--rap-dur-fast) ease-rm",
          "focus-within:shadow-[inset_0_0_0_2px_var(--rap-ring),0_8px_28px_-12px_color-mix(in_oklab,var(--rap-ink)_22%,transparent)]",
          "p-(--pi-pad) pl-[calc(var(--pi-pad)*1.3)]",
          disabled && "opacity-55",
        )}
        onClick={(e) => {
          // a click on the padding still lands in the text
          if (e.target === e.currentTarget) ta.current?.focus();
        }}
      >
        {files.length > 0 && (
          <ul data-slot="prompt-input-files" aria-label="Attached files" className="flex flex-wrap gap-tight pb-2.5">
            {files.map((f, i) => {
              const Icon = f.type.startsWith("image/") ? ImageIcon : FileText;
              return (
                <li
                  key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
                  data-slot="prompt-input-file"
                  className="inline-flex max-w-[16rem] items-center gap-2 rounded-pill bg-fill py-1 pl-2.5 pr-1 text-[0.8125rem] fun:animate-pop-in calm:animate-fade-in"
                >
                  <Icon size={16} className="shrink-0 text-mute" />
                  <span className="truncate font-medium text-ink">{f.name}</span>
                  <span className="shrink-0 tabular-nums text-mute">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    data-slot="prompt-input-file-remove"
                    aria-label={`Remove ${f.name}`}
                    disabled={disabled}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="inline-grid size-6 shrink-0 cursor-pointer place-items-center rounded-pill text-mute transition-colors duration-(--rap-dur-fast) hover:bg-fill-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <X size={13} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div data-slot="prompt-input-text" className="relative">
          <textarea
            ref={setRef}
            id={id}
            rows={1}
            value={value}
            disabled={disabled}
            aria-label={label ?? examples[0]}
            onChange={(e) => setValue(e.currentTarget.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              "block w-full resize-none overflow-hidden border-0 bg-transparent p-0 py-[0.35rem] pr-1 outline-none",
              "font-sans text-ink caret-accent",
              s.text,
            )}
          />

          {/* the placeholder, drawn by hand so it can cycle; the old one leaves on top */}
          {value === "" && !ghost && (
            <div
              data-slot="prompt-input-placeholder"
              aria-hidden
              className={cn("pointer-events-none absolute inset-x-0 top-0 overflow-hidden py-[0.35rem] text-mute", s.text)}
            >
              <span
                key={`in-${ph.i}`}
                className={cn(
                  "block truncate",
                  ph.prev >= 0 && "fun:animate-[rap-pi-ph-in_520ms_var(--rap-ease-out)_both] calm:animate-[rap-fade-in_420ms_var(--rap-ease-rm)_both]",
                )}
              >
                {current}
              </span>
              {previous !== undefined && (
                <span
                  key={`out-${ph.prev}-${ph.i}`}
                  className={cn(
                    "absolute inset-x-0 top-[0.35rem] block truncate opacity-0",
                    "fun:animate-[rap-pi-ph-out_440ms_var(--rap-ease-rm)_both] calm:animate-[rap-pi-fade-out_420ms_var(--rap-ease-rm)_both]",
                  )}
                >
                  {previous}
                </span>
              )}
            </div>
          )}

          {/* what was just sent, leaving */}
          {ghost && (
            <div
              key={ghost.n}
              data-slot="prompt-input-sent"
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 line-clamp-3 whitespace-pre-wrap break-words py-[0.35rem] text-ink opacity-0",
                "fun:animate-[rap-pi-lift_560ms_var(--rap-ease-out)_both] calm:animate-[rap-pi-sent-fade_320ms_var(--rap-ease-rm)_both]",
                s.text,
              )}
            >
              {ghost.text}
            </div>
          )}
        </div>

        <div data-slot="prompt-input-toolbar" className="-mb-1 -ml-[calc(var(--pi-pad)*0.45)] mt-2 flex items-center gap-1">
          {attach && (
            <>
              <button
                type="button"
                data-slot="prompt-input-attach"
                aria-label="Attach files"
                title="Attach files"
                disabled={disabled}
                onClick={() => fileInput.current?.click()}
                className={cn(iconBtn, "fun:hover:[&>svg]:-rotate-12 [&>svg]:transition-transform [&>svg]:duration-(--rap-dur) [&>svg]:ease-soft")}
              >
                <Paperclip size={s.icon} strokeWidth={2} aria-hidden focusable="false" />
              </button>
              <input ref={fileInput} type="file" multiple accept={accept} hidden tabIndex={-1} onChange={onPick} />
            </>
          )}
          {toolbar}

          <div className="ml-auto flex items-center gap-1.5">
            {onMicClick && (
              <button
                type="button"
                data-slot="prompt-input-mic"
                aria-label={listening ? "Stop listening" : "Voice input"}
                aria-pressed={listening}
                title={listening ? "Stop listening" : "Voice input"}
                disabled={disabled}
                onClick={onMicClick}
                className={cn(iconBtn, listening && "bg-fill text-ink")}
              >
                {listening ? (
                  <AIOrb state="listening" level={level} size={s.orb} label="Listening" />
                ) : (
                  <Mic size={s.icon} strokeWidth={2} aria-hidden focusable="false" />
                )}
              </button>
            )}

            {busy ? (
              <button
                type="button"
                data-slot="prompt-input-stop"
                aria-label="Stop generating"
                title="Stop (Esc)"
                disabled={disabled}
                onClick={onStop}
                className={cn(
                  iconBtn,
                  "bg-ink text-paper hover:bg-ink hover:text-paper",
                  "fun:animate-pop-in calm:animate-fade-in",
                )}
              >
                <span aria-hidden className="size-[calc(var(--pi-btn)*0.3)] rounded-[3px] bg-current" />
              </button>
            ) : (
              <button
                type="button"
                data-slot="prompt-input-send"
                aria-label="Send"
                title="Send (Enter)"
                disabled={!canSend}
                onClick={() => send()}
                className={cn(
                  iconBtn,
                  "overflow-hidden bg-accent text-accent-ink hover:bg-accent hover:text-accent-ink",
                  "disabled:bg-fill disabled:text-mute disabled:opacity-100",
                )}
              >
                <ArrowUp
                  key={sent.n}
                  size={s.icon}
                  strokeWidth={2.25}
                  className={cn(sent.n > 0 && "fun:animate-[rap-pi-nudge_460ms_var(--rap-ease-out)]")}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <ul data-slot="prompt-input-suggestions" aria-label="Suggestions" className="flex flex-wrap justify-center gap-tight">
          {suggestions.map((text, i) => (
            <li key={text} className="fun:animate-deal-in" style={{ animationDelay: `${i * 40}ms` }}>
              <button
                type="button"
                data-slot="prompt-input-suggestion"
                disabled={disabled}
                onClick={() => pickSuggestion(text)}
                className={cn(
                  "inline-flex h-control-sm cursor-pointer items-center rounded-pill px-4 text-[0.875rem] font-medium tracking-[-0.01em]",
                  "bg-paper-2 text-ink-2 shadow-[inset_0_0_0_1px_var(--rap-edge)]",
                  "transition-[background-color,color,translate] duration-(--rap-dur-fast) ease-rm",
                  "hover:bg-fill hover:text-ink fun:hover:-translate-y-0.5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
