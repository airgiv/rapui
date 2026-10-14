/* ══ ChatMessage · MessageActions · ChatThread ═══════════
   The parts of a conversation with an assistant.

     <ChatThread className="h-[480px]">
       <ChatMessage role="user" time="09:41">Is it tree-shakable?</ChatMessage>
       <ChatMessage role="assistant" streaming={!done} actions={<MessageActions text={answer} />}>
         {answer}
       </ChatMessage>
     </ChatThread>

   ChatMessage — the user speaks in a bubble on the right (its corner
   toward them pinched small); the assistant speaks without one, full
   width, beside a small AIOrb that thinks while `pending`, speaks while
   `streaming` and rests otherwise. Attachments sit as file chips.
   MessageActions — copy, regenerate, thumbs up / down, share: quiet
   icon buttons with tooltips.
   ChatThread — a scroll box that keeps to the bottom as the answer
   grows, unless you have scrolled up to read; then a "New messages"
   pill offers the way back.

   Delight (fun): the user's bubble pops out of its own corner like a
   speech balloon; a chosen thumb hops and throws a pinch of confetti;
   the copy icon turns into a check that draws itself.
   Calm: messages fade in, the thumb's fill fades in, nothing jumps. */
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowDown, Copy, FileText, Image as ImageIcon, RefreshCw, Share2, ThumbsDown, ThumbsUp } from "../icons";
import { cn } from "../utils";
import { AILoader } from "./AILoader";
import { AIOrb } from "./AIOrb";
import { isMotionCalm } from "./FormField";
import { StreamingText } from "./StreamingText";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";
import "./ChatMessage.css";

/* ── FileChip ───────────────────────────────────────────── */

export interface ChatAttachment {
  name: string;
  /** Shown after the name, e.g. "240 KB". */
  size?: string;
  /** Picks the icon. Default "file". */
  kind?: "file" | "image";
  href?: string;
}

export interface FileChipProps extends HTMLAttributes<HTMLElement> {
  file: ChatAttachment;
}

/** One attachment as a small pill: icon, name, size. A link when it has `href`. */
export function FileChip({ file, className, ...rest }: FileChipProps) {
  const Icon = file.kind === "image" ? ImageIcon : FileText;
  const cls = cn(
    "inline-flex h-control-sm max-w-[16rem] items-center gap-2 rounded-pill bg-paper-2 pr-3.5 pl-2.5 text-[0.8125rem] text-ink",
    "shadow-[inset_0_0_0_1px_var(--rap-edge)]",
    file.href && "transition-colors duration-(--rap-dur) hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    className,
  );
  const body = (
    <>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface text-ink-2">
        <Icon size={14} />
      </span>
      <span className="min-w-0 truncate font-medium">{file.name}</span>
      {file.size && <span className="shrink-0 text-mute tabular-nums">{file.size}</span>}
    </>
  );
  return file.href ? (
    <a data-slot="file-chip" href={file.href} className={cls} {...rest}>
      {body}
    </a>
  ) : (
    <span data-slot="file-chip" className={cls} {...rest}>
      {body}
    </span>
  );
}

/* ── ChatMessage ────────────────────────────────────────── */

export type ChatRole = "user" | "assistant";

export interface ChatMessageProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  role: ChatRole;
  /** The message. A string streams (assistant) and splits into paragraphs on blank lines. */
  children?: ReactNode;
  /** Shown above the message; also its accessible name. Defaults to "You" / "Assistant". */
  name?: string;
  /** Shown beside the name, e.g. "09:41". */
  time?: ReactNode;
  /** Assistant: still thinking — an AILoader instead of text, the orb thinking. */
  pending?: boolean;
  /** Loader label while `pending`. */
  label?: string;
  /** Assistant: text still arriving — caret on, orb speaking. */
  streaming?: boolean;
  /** Assistant: type the whole text out by itself (demos, replays). */
  simulate?: boolean;
  /** Words per second for `simulate`. */
  speed?: number;
  onDone?: () => void;
  /** Files as chips, or your own nodes. */
  attachments?: ChatAttachment[] | ReactNode;
  /** Assistant: a row under the answer, e.g. <MessageActions />. Hidden while pending or streaming. */
  actions?: ReactNode;
  /** Orb diameter, px. */
  orbSize?: number;
  /** Play the arrival animation. Default true. */
  animate?: boolean;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-[0.8em]">
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i} className="m-0 whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function Attachments({ value, align }: { value: ChatMessageProps["attachments"]; align: "start" | "end" }) {
  if (value == null || value === false) return null;
  const isList = Array.isArray(value) && value.every((v) => v && typeof v === "object" && !isValidElement(v) && "name" in v);
  return (
    <div data-slot="chat-attachments" className={cn("flex flex-wrap gap-2", align === "end" ? "justify-end" : "justify-start")}>
      {isList ? (value as ChatAttachment[]).map((f, i) => <FileChip key={f.name + i} file={f} />) : (value as ReactNode)}
    </div>
  );
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(function ChatMessage(
  {
    role,
    children,
    name,
    time,
    pending = false,
    label = "Thinking",
    streaming = false,
    simulate = false,
    speed,
    onDone,
    attachments,
    actions,
    orbSize = 28,
    animate = true,
    className,
    ...rest
  },
  ref,
) {
  const who = name ?? (role === "user" ? "You" : "Assistant");
  // simulate: the orb keeps speaking until the text has typed itself out
  const [typing, setTyping] = useState(simulate);
  const [wasSimulating, setWasSimulating] = useState(simulate);
  if (simulate !== wasSimulating) {
    // adjust during render, so the orb and the actions row never see a stale frame
    setWasSimulating(simulate);
    setTyping(simulate);
  }
  const live = streaming || typing;

  const meta = (name || time) && (
    <div data-slot="chat-meta" className="rap-chat-meta flex items-baseline gap-2 text-[0.75rem] leading-none text-mute">
      {name && <span className="font-medium text-ink-2">{name}</span>}
      {time && <span className="tabular-nums">{time}</span>}
    </div>
  );

  if (role === "user") {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${who} said`}
        data-slot="chat-message"
        data-role="user"
        className={cn("flex flex-col items-end gap-2", animate && "rap-chat-in", className)}
        {...rest}
      >
        {meta}
        <Attachments value={attachments} align="end" />
        {Children.count(children) > 0 && (
          <div
            data-slot="chat-bubble"
            className="rap-chat-bubble max-w-[min(70%,36rem)] rounded-card rounded-br-xs bg-paper-3 px-4 py-2.5 text-[1rem] leading-[1.55] text-ink [overflow-wrap:anywhere] max-[520px]:max-w-[85%]"
          >
            {typeof children === "string" ? <Paragraphs text={children} /> : children}
          </div>
        )}
      </div>
    );
  }

  const orbState = pending ? "thinking" : live ? "speaking" : "idle";
  let body: ReactNode;
  if (pending) body = <AILoader label={label} />;
  else if (typeof children === "string" && (streaming || simulate))
    body = (
      <StreamingText
        streaming={streaming}
        simulate={simulate}
        speed={speed}
        onDone={() => {
          // StreamingText reports from inside its state update: hop out of it first
          queueMicrotask(() => {
            setTyping(false);
            onDone?.();
          });
        }}
      >
        {children}
      </StreamingText>
    );
  else if (typeof children === "string") body = <Paragraphs text={children} />;
  else body = children;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={`${who} said`}
      aria-busy={pending || live || undefined}
      data-slot="chat-message"
      data-role="assistant"
      data-state={pending ? "pending" : live ? "streaming" : "done"}
      className={cn("flex items-start gap-3", animate && "rap-chat-in", className)}
      {...rest}
    >
      <AIOrb state={orbState} size={orbSize} label="" aria-hidden className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {meta}
        <div data-slot="chat-content" className="text-[1rem] leading-[1.6] text-ink [overflow-wrap:anywhere]" style={{ minHeight: orbSize - 4 }}>
          {body}
        </div>
        <Attachments value={attachments} align="start" />
        {actions && !pending && !live && (
          <div data-slot="chat-actions" className="-ml-1.5 animate-fade-in">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

/* ── MessageActions ─────────────────────────────────────── */

export type MessageFeedback = "up" | "down" | null;

export interface MessageActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** The text the copy button puts on the clipboard. Omit to hide copy. */
  text?: string;
  onCopy?: () => void;
  /** Shows the regenerate button. */
  onRegenerate?: () => void;
  /** Shows the share button. */
  onShare?: () => void;
  /** Controlled feedback. */
  feedback?: MessageFeedback;
  defaultFeedback?: MessageFeedback;
  onFeedbackChange?: (value: MessageFeedback) => void;
  /** Hide the thumbs. */
  hideFeedback?: boolean;
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton({ label, className, children, ...rest }, ref) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          data-slot="message-action"
          className={cn(
            "relative grid size-8 cursor-pointer place-items-center rounded-sm text-mute [-webkit-tap-highlight-color:transparent]",
            "transition-[color,background-color,transform] duration-(--rap-dur) ease-soft",
            "hover:bg-fill hover:text-ink active:scale-92 calm:active:scale-100",
            "aria-pressed:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
            className,
          )}
          {...rest}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
});

const CONFETTI = [
  { a: -70, d: 15, c: "var(--rap-accent)" },
  { a: -35, d: 19, c: "var(--rap-flame)" },
  { a: 0, d: 17, c: "var(--rap-blue)" },
  { a: 35, d: 20, c: "var(--rap-bubble)" },
  { a: 70, d: 14, c: "var(--rap-acid)" },
  { a: 160, d: 11, c: "var(--rap-accent)" },
];

function Thumb({ down, pressed, burst }: { down?: boolean; pressed: boolean; burst: number }) {
  return (
    <>
      {/* keyed on each new choice so the hop replays */}
      <span key={burst} className="rap-thumb-hop grid place-items-center">
        {down ? <ThumbsDown size={16} className="rap-thumb" /> : <ThumbsUp size={16} className="rap-thumb" />}
      </span>
      {pressed && burst > 0 && (
        <span key={`c${burst}`} aria-hidden className="rap-confetti pointer-events-none absolute inset-0" style={down ? { transform: "rotate(180deg)" } : undefined}>
          {CONFETTI.map((p, i) => (
            <i key={i} style={{ "--a": `${p.a}deg`, "--d": `${p.d}px`, "--c": p.c } as CSSProperties} />
          ))}
        </span>
      )}
    </>
  );
}

export const MessageActions = forwardRef<HTMLDivElement, MessageActionsProps>(function MessageActions(
  { text, onCopy, onRegenerate, onShare, feedback, defaultFeedback = null, onFeedbackChange, hideFeedback = false, className, ...rest },
  ref,
) {
  const [inner, setInner] = useState<MessageFeedback>(defaultFeedback);
  const value = feedback !== undefined ? feedback : inner;
  const [burst, setBurst] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (text == null) return;
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* no clipboard (insecure context, denied): still acknowledge the press */
    }
    onCopy?.();
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const choose = (v: "up" | "down") => {
    const next = value === v ? null : v;
    if (next) setBurst((b) => b + 1);
    if (feedback === undefined) setInner(next);
    onFeedbackChange?.(next);
  };

  return (
    <TooltipProvider>
      <div ref={ref} role="toolbar" aria-label="Message actions" data-slot="message-actions" className={cn("flex items-center gap-0.5", className)} {...rest}>
        {text != null && (
          <ActionButton label={copied ? "Copied" : "Copy"} onClick={copy}>
            {copied ? (
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden fill="none" className="text-ink">
                <path className="rap-copy-check" d="M5 13.5L9.5 18L19 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
              </svg>
            ) : (
              <Copy size={16} />
            )}
            <span className="sr-only" aria-live="polite">
              {copied ? "Copied to clipboard" : ""}
            </span>
          </ActionButton>
        )}
        {onRegenerate && (
          <ActionButton label="Regenerate" onClick={onRegenerate} className="[&:active_svg]:rotate-[-90deg] [&_svg]:transition-transform [&_svg]:duration-(--rap-dur)">
            <RefreshCw size={16} />
          </ActionButton>
        )}
        {!hideFeedback && (
          <>
            <ActionButton label="Good response" aria-pressed={value === "up"} onClick={() => choose("up")}>
              <Thumb pressed={value === "up"} burst={value === "up" ? burst : 0} />
            </ActionButton>
            <ActionButton label="Bad response" aria-pressed={value === "down"} onClick={() => choose("down")}>
              <Thumb down pressed={value === "down"} burst={value === "down" ? burst : 0} />
            </ActionButton>
          </>
        )}
        {onShare && (
          <ActionButton label="Share" onClick={onShare}>
            <Share2 size={16} />
          </ActionButton>
        )}
      </div>
    </TooltipProvider>
  );
});

/* ── ChatThread ─────────────────────────────────────────── */

export interface ChatThreadProps extends HTMLAttributes<HTMLDivElement> {
  /** Distance from the bottom (px) that still counts as "at the bottom". */
  threshold?: number;
  /** Classes for the inner column of messages. */
  contentClassName?: string;
  /** Pill text. */
  newLabel?: string;
}

export const ChatThread = forwardRef<HTMLDivElement, ChatThreadProps>(function ChatThread(
  { threshold = 48, contentClassName, newLabel = "New messages", className, children, ...rest },
  ref,
) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const [fresh, setFresh] = useState(false);

  const toBottom = useCallback((smooth: boolean) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !isMotionCalm(el) ? "smooth" : "auto" });
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const at = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    stuck.current = at;
    if (at) setFresh(false);
  };

  // content grew (a new message, a streamed word, an image loading): follow it, or flag it
  useLayoutEffect(() => {
    const box = content.current;
    if (!box) return;
    let last = box.scrollHeight;
    const grew = () => {
      const h = box.scrollHeight;
      if (h <= last) return void (last = h);
      last = h;
      if (stuck.current) toBottom(false);
      else setFresh(true);
    };
    toBottom(false);
    const ro = new ResizeObserver(grew);
    ro.observe(box);
    return () => ro.disconnect();
  }, [toBottom]);

  return (
    <div ref={ref} data-slot="chat-thread" className={cn("relative flex min-h-0 flex-col", className)} {...rest}>
      <div
        ref={scroller}
        onScroll={onScroll}
        role="log"
        aria-label="Conversation"
        data-slot="chat-thread-viewport"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <div ref={content} className={cn("flex flex-col gap-7 p-4 pb-6", contentClassName)}>
          {children}
        </div>
      </div>
      {fresh && (
        <button
          type="button"
          data-slot="chat-thread-jump"
          onClick={() => {
            stuck.current = true;
            setFresh(false);
            toBottom(true);
          }}
          className={cn(
            "rap-chat-pill absolute inset-x-0 bottom-3 mx-auto inline-flex h-control-sm w-fit cursor-pointer items-center gap-1.5 rounded-pill bg-ink pr-3.5 pl-3 text-[0.8125rem] font-medium text-paper",
            "shadow-[0_6px_20px_-8px_rgb(0_0_0/0.35)] transition-transform duration-(--rap-dur) hover:-translate-y-0.5 calm:hover:translate-y-0",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <ArrowDown size={14} className="fun:animate-hop" />
          {newLabel}
        </button>
      )}
    </div>
  );
});
