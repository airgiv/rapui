/* ══ ToolCall · ToolChips ═════════════════════════════════
   One tool the assistant called, as a card: the tool's name in mono
   on a chip, a line saying what it was called with, where it stands
   (running, done in 1.2s, failed) and, folded underneath, the Input
   and Output as code. With `needsApproval` the card asks first: the
   action in plain words, Approve / Deny, and an optional "Always
   allow"; once you decide, the card says what you decided.

     <ToolCall name="web_search" status="done" duration={1240}
       input={{ query: "rapui presets" }} output={results} />
     <ToolCall name="send_email" needsApproval action="Send an email to…"
       onApprove={({ always }) => run()} onDeny={cancel} />

   ToolChips is the receipt under an answer: a row of small chips,
   "Searched the web · 6 results", "Read 3 files".

   Delight (fun): approving brings down an "Approved" seal like a
   rubber stamp — big and tilted, it squashes onto the card and rests
   a little crooked; denying nudges the card a few px aside and greys
   it, as if pushed off the desk. The chips are dealt in one by one.
   Calm: approving tints the card and the seal fades in; denying only
   fades the card back. */
import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Spinner } from "./Spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./Collapsible";
import { CalendarDays, Check, ChevronRight, CircleX, Code2, FileText, Globe, Image, Mail, Search, Zap, type IconComponent } from "../icons";
import "./ToolCall.css";

export type ToolCallStatus = "pending" | "running" | "done" | "error";
export type ToolCallDecision = "approved" | "denied";

/** A fitting icon for a tool, guessed from its name (web_search → a magnifier, send_email → an envelope). */
export function toolIcon(name: string): IconComponent {
  const n = name.toLowerCase();
  if (/search|query|find|lookup/.test(n)) return Search;
  if (/web|browse|fetch|http|url|scrape/.test(n)) return Globe;
  if (/mail|email|inbox/.test(n)) return Mail;
  if (/calendar|event|schedule|meeting/.test(n)) return CalendarDays;
  if (/image|photo|draw|render/.test(n)) return Image;
  if (/code|exec|run|python|shell|bash|sql/.test(n)) return Code2;
  if (/file|read|write|doc|pdf/.test(n)) return FileText;
  return Zap;
}

const ms = (d: number) => (d < 1000 ? `${Math.round(d)}ms` : d < 60000 ? `${(d / 1000).toFixed(1)}s` : `${Math.floor(d / 60000)}m ${Math.round((d % 60000) / 1000)}s`);

/* the one-line summary when none is given: the input's first plain values */
function summarise(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input === "string") return input.split("\n")[0];
  if (typeof input !== "object") return String(input);
  const vals = Object.values(input as Record<string, unknown>)
    .filter((v) => ["string", "number", "boolean"].includes(typeof v))
    .slice(0, 2)
    .map((v) => (typeof v === "string" ? `“${v}”` : String(v)));
  return vals.length ? vals.join(", ") : null;
}

/* JSON as code, with keys, strings and literals told apart */
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
function Code({ value }: { value: unknown }) {
  if (typeof value === "string") return <>{value}</>;
  const text = JSON.stringify(value, null, 2) ?? String(value);
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > at) out.push(text.slice(at, i));
    const cls = m[1] ? (m[2] ? "text-ink font-medium" : "text-ink-2") : "text-blue";
    out.push(
      <span key={i} className={cls}>
        {m[1] ?? m[0]}
      </span>,
    );
    if (m[2]) out.push(m[2]);
    at = i + m[0].length;
  }
  out.push(text.slice(at));
  return <>{out}</>;
}

function Section({ label, value, defaultOpen }: { label: string; value: unknown; defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen} data-slot="tool-call-section" className="gap-1.5">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "group/sec inline-flex items-center gap-1 self-start rounded-xs border-0 bg-transparent p-0 font-[inherit] text-[0.8125rem] font-medium text-mute cursor-pointer",
            "transition-colors duration-(--rap-dur-fast) ease-rm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <ChevronRight aria-hidden size={14} className="transition-transform duration-(--rap-dur-fast) ease-rm group-data-[state=open]/sec:rotate-90" />
          {label}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre
          data-slot="tool-call-code"
          tabIndex={0}
          aria-label={label}
          className="m-0 max-h-64 overflow-auto rounded-sm bg-paper-2 px-3.5 py-3 font-mono text-[0.78125rem] leading-[1.6] whitespace-pre text-ink-2 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Code value={value} />
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface ToolCallProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The tool's name, shown in mono: "web_search". */
  name: string;
  /** Defaults to an icon guessed from the name. */
  icon?: ReactNode;
  /** One line on what it was called with. Defaults to the input's first values. */
  summary?: ReactNode;
  status?: ToolCallStatus;
  /** How long it took, in ms (shown when done). */
  duration?: number;
  input?: unknown;
  output?: unknown;
  /** What went wrong (status "error"). */
  error?: ReactNode;
  /** Open the Input / Output sections to start with. */
  defaultExpanded?: boolean;
  /** Ask before running: shows `action`, Approve and Deny. */
  needsApproval?: boolean;
  /** The action in plain words: "Send an email to alex@… with the subject …". */
  action?: ReactNode;
  /** Offer "Always allow" next to the buttons. Default true. */
  allowAlways?: boolean;
  /** Controlled decision; leave out to let the card keep its own. */
  decision?: ToolCallDecision;
  onApprove?: (opts: { always: boolean }) => void;
  onDeny?: () => void;
}

/** A card for one tool invocation, with optional approval before it runs. */
export const ToolCall = forwardRef<HTMLDivElement, ToolCallProps>(function ToolCall(
  {
    name,
    icon,
    summary,
    status = "done",
    duration,
    input,
    output,
    error,
    defaultExpanded = false,
    needsApproval = false,
    action,
    allowAlways = true,
    decision: decisionProp,
    onApprove,
    onDeny,
    className,
    ...rest
  },
  ref,
) {
  const [decisionState, setDecisionState] = useState<ToolCallDecision | undefined>();
  const decision = decisionProp ?? decisionState;
  const [always, setAlways] = useState(false);
  const alwaysId = useId();
  const outcome = useRef<HTMLDivElement>(null);
  const decided = useRef(false);

  // the buttons go away when you decide, so focus moves to what replaced them
  useEffect(() => {
    if (decision && decided.current) outcome.current?.focus({ preventScroll: true });
  }, [decision]);

  const decide = (d: ToolCallDecision) => {
    decided.current = true;
    if (decisionProp === undefined) setDecisionState(d);
    if (d === "approved") onApprove?.({ always });
    else onDeny?.();
  };

  const asking = needsApproval && !decision;
  const denied = needsApproval && decision === "denied";
  const approved = needsApproval && decision === "approved";
  const Icon = toolIcon(name);
  const line = summary ?? summarise(input);

  let statusNode: ReactNode;
  if (asking)
    statusNode = (
      <span className="inline-flex items-center gap-1.5 text-[color-mix(in_srgb,var(--rap-warning)_55%,var(--rap-ink))]">
        <span aria-hidden className="size-1.5 rounded-full bg-warning" />
        Needs approval
      </span>
    );
  else if (denied) statusNode = <span className="text-mute">Denied</span>;
  else if (status === "running")
    statusNode = (
      <span className="inline-flex items-center gap-1.5 text-ink-2">
        <Spinner size="sm" label="Running" />
        Running
      </span>
    );
  else if (status === "pending") statusNode = <span className="text-mute">Queued</span>;
  else if (status === "error")
    statusNode = (
      <span className="inline-flex items-center gap-1 text-danger">
        <CircleX aria-hidden size={15} />
        Failed
      </span>
    );
  else
    statusNode = (
      <span className="inline-flex items-center gap-1 text-mute">
        <Check aria-hidden size={15} className="text-success" />
        {duration != null ? <span className="font-mono text-[0.75rem] tabular-nums">{ms(duration)}</span> : "Done"}
      </span>
    );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={`Tool call: ${name}`}
      data-slot="tool-call"
      data-status={status}
      data-decision={needsApproval ? (decision ?? "pending") : undefined}
      className={cn(
        "relative flex flex-col gap-3 rounded-card bg-surface p-4 text-ink shadow-[inset_0_0_0_1px_var(--rap-edge)]",
        "transition-[background-color,opacity,filter] duration-(--rap-dur) ease-soft",
        approved && "bg-[color-mix(in_srgb,var(--rap-success)_6%,var(--rap-surface))]",
        denied && "opacity-60 grayscale fun:animate-[rap-tool-nudge_420ms_var(--rap-ease-out)_both]",
        className,
      )}
      {...rest}
    >
      {/* header: the tool, what it was asked, where it stands */}
      <div data-slot="tool-call-header" className="flex min-w-0 items-center gap-2.5">
        <span
          data-slot="tool-call-chip"
          className="inline-flex h-7 flex-none items-center gap-1.5 rounded-pill bg-fill px-2.5 font-mono text-[0.78125rem] font-medium text-ink"
        >
          <span aria-hidden className="inline-flex text-ink-2 [&_svg]:size-[15px]">
            {icon ?? <Icon />}
          </span>
          {name}
        </span>
        {line != null && (
          <span data-slot="tool-call-summary" className="min-w-0 flex-1 truncate text-[0.875rem] text-ink-2">
            {line}
          </span>
        )}
        <span data-slot="tool-call-status" role="status" className="ml-auto flex-none text-[0.8125rem] font-medium whitespace-nowrap">
          {statusNode}
        </span>
      </div>

      {status === "error" && error != null && !asking && !denied && (
        <p data-slot="tool-call-error" className="m-0 text-[0.875rem] text-danger">
          {error}
        </p>
      )}

      {/* asking: the action in plain words, then the decision */}
      {asking && (
        <div data-slot="tool-call-approval" className="flex flex-col gap-3 rounded-sm bg-paper-2 p-3.5">
          <p className="m-0 text-[0.9375rem] leading-[1.5] text-ink">{action ?? <>Run <code className="font-mono text-[0.875em]">{name}</code>?</>}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="accent" onClick={() => decide("approved")}>
              Approve
            </Button>
            <Button size="sm" variant="soft" onClick={() => decide("denied")}>
              Deny
            </Button>
            {allowAlways && (
              <label htmlFor={alwaysId} className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[0.8125rem] text-ink-2 select-none">
                <Checkbox id={alwaysId} size="sm" checked={always} onCheckedChange={(v) => setAlways(v === true)} />
                Always allow <code className="font-mono text-[0.75rem]">{name}</code>
              </label>
            )}
          </div>
        </div>
      )}

      {/* decided: what you said, and in fun the seal */}
      {needsApproval && decision && (
        <div
          ref={outcome}
          tabIndex={-1}
          role="status"
          data-slot="tool-call-outcome"
          className="flex items-center gap-3 rounded-sm text-[0.875rem] text-ink-2 outline-none calm:animate-fade-in"
        >
          <span className="min-w-0 flex-1">
            {approved ? (
              <>
                You approved this{always ? <> — <code className="font-mono text-[0.8125rem]">{name}</code> is allowed from now on</> : null}.
              </>
            ) : (
              <>You denied this. It won’t run.</>
            )}
          </span>
          {approved && (
            <span
              aria-hidden
              data-slot="tool-call-seal"
              className={cn(
                "flex-none rotate-[-8deg] rounded-xs border-2 border-success px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.12em] text-success uppercase",
                "fun:animate-[rap-tool-stamp_520ms_var(--rap-ease-out)_both] calm:animate-[rap-tool-seal-calm_320ms_var(--rap-ease-out)_both]",
              )}
            >
              Approved
            </span>
          )}
        </div>
      )}

      {(input !== undefined || output !== undefined) && (
        <div data-slot="tool-call-sections" className="flex flex-col gap-2 border-t border-line pt-3">
          {input !== undefined && <Section label="Input" value={input} defaultOpen={defaultExpanded} />}
          {output !== undefined && <Section label="Output" value={output} defaultOpen={defaultExpanded} />}
        </div>
      )}
    </div>
  );
});

export interface ToolChip {
  /** A tool name to pick the icon from, if no `icon`. */
  tool?: string;
  icon?: ReactNode;
  /** "Searched the web" */
  label: ReactNode;
  /** "6 results" — shown after a dot, quieter. */
  detail?: ReactNode;
  onClick?: () => void;
}

export interface ToolChipsProps extends HTMLAttributes<HTMLUListElement> {
  items: ToolChip[];
}

/** A compact row of what the assistant used, for under an answer. */
export const ToolChips = forwardRef<HTMLUListElement, ToolChipsProps>(function ToolChips({ items, className, ...rest }, ref) {
  return (
    <ul ref={ref} aria-label="Tools used" data-slot="tool-chips" className={cn("m-0 flex list-none flex-wrap gap-1.5 p-0", className)} {...rest}>
      {items.map((it, i) => {
        const Icon = it.tool ? toolIcon(it.tool) : null;
        const body = (
          <>
            {(it.icon ?? Icon) && (
              <span aria-hidden className="inline-flex text-mute [&_svg]:size-[14px]">
                {it.icon ?? (Icon && <Icon />)}
              </span>
            )}
            <span className="text-ink-2">{it.label}</span>
            {it.detail != null && (
              <>
                <span aria-hidden className="text-mute">·</span>
                <span className="text-mute tabular-nums">{it.detail}</span>
              </>
            )}
          </>
        );
        const chip = "inline-flex h-7 items-center gap-1.5 rounded-pill bg-fill px-2.5 font-sans text-[0.8125rem] font-medium whitespace-nowrap";
        return (
          <li
            key={i}
            data-slot="tool-chip"
            className="fun:animate-[rap-deal-in_280ms_var(--rap-ease-out)_both] calm:animate-[rap-fade-in_220ms_var(--rap-ease-rm)_both]"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {it.onClick ? (
              <button
                type="button"
                onClick={it.onClick}
                className={cn(
                  chip,
                  "border-0 cursor-pointer transition-colors duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                {body}
              </button>
            ) : (
              <span className={chip}>{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
});
