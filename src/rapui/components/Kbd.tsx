import { forwardRef, useEffect, useRef, type ForwardedRef, type HTMLAttributes } from "react";
import { useSound } from "../sound";
import { cva } from "class-variance-authority";
import { cn } from "../utils";

/* ── Kbd ───────────────────────────────────────────────────
   Delight: it is a real key. Press that key on your keyboard
   and every <Kbd> showing it goes down — 2px, the bottom lip
   flattens, the cap darkens a shade — and springs back up when
   you let go. A shortcut hint that answers your fingers teaches
   the shortcut: hold ⌘ and the ⌘ caps on the page sink with you.

   One window listener for the whole page (not one per key);
   each Kbd subscribes with the key it shows. What it shows is
   read from its text and normalised (⌘/Cmd → Meta, ⇧ → Shift,
   Esc → Escape, ↵ → Enter, letters by physical code so ⌥K still
   finds "K"). A key drawn as an icon names itself with `keyName`.
   Everything is released on keyup, on Meta's keyup (macOS eats
   the other keyups while ⌘ is down) and on window blur. The
   state is a data attribute written straight to the node — no
   React render per keystroke. Calm switches the sink off in CSS.
   With a SoundProvider on, a press plays "type" (once per
   keystroke, however many caps show that key). */

const ALIASES: Record<string, string> = {
  "⌘": "meta", cmd: "meta", command: "meta", meta: "meta", win: "meta", super: "meta",
  "⌥": "alt", opt: "alt", option: "alt", alt: "alt",
  "⇧": "shift", shift: "shift",
  "⌃": "control", ctrl: "control", control: "control", "^": "control",
  "↵": "enter", "⏎": "enter", "⌤": "enter", return: "enter", enter: "enter",
  esc: "escape", "⎋": "escape", escape: "escape",
  "⌫": "backspace", backspace: "backspace", "⌦": "delete", del: "delete", delete: "delete",
  "⇥": "tab", tab: "tab",
  space: " ", "␣": " ", spacebar: " ",
  "←": "arrowleft", "→": "arrowright", "↑": "arrowup", "↓": "arrowdown",
  left: "arrowleft", right: "arrowright", up: "arrowup", down: "arrowdown",
  pgup: "pageup", pgdn: "pagedown", "⇞": "pageup", "⇟": "pagedown",
  home: "home", end: "end", "⇪": "capslock", capslock: "capslock",
};

const norm = (label: string) => {
  const t = label.trim().toLowerCase();
  if (!t) return "";
  return ALIASES[t] ?? t;
};

/** the names this keydown answers to: its key, and its physical letter/digit */
function namesOf(e: KeyboardEvent) {
  const out = [e.key.toLowerCase()];
  if (e.code.startsWith("Key")) out.push(e.code.slice(3).toLowerCase());
  else if (e.code.startsWith("Digit")) out.push(e.code.slice(5));
  return out;
}

type Sub = { el: HTMLElement; name: () => string; onPress: () => void };
const subs = new Set<Sub>();
let lastSound = 0;

function press(e: KeyboardEvent) {
  const names = namesOf(e);
  let hit = false;
  subs.forEach((s) => {
    if (names.includes(s.name())) {
      if (!s.el.hasAttribute("data-pressed")) hit = true;
      s.el.setAttribute("data-pressed", "");
    }
  });
  if (hit && !e.repeat && performance.now() - lastSound > 20) {
    lastSound = performance.now();
    // one sound per keystroke: the first subscriber that matched plays it
    for (const s of subs) if (names.includes(s.name())) return s.onPress();
  }
}
function lift(e: KeyboardEvent) {
  const names = namesOf(e);
  const all = e.key === "Meta";
  subs.forEach((s) => {
    if (all || names.includes(s.name())) s.el.removeAttribute("data-pressed");
  });
}
function liftAll() {
  subs.forEach((s) => s.el.removeAttribute("data-pressed"));
}

function subscribe(s: Sub) {
  if (subs.size === 0) {
    window.addEventListener("keydown", press, true);
    window.addEventListener("keyup", lift, true);
    window.addEventListener("blur", liftAll);
  }
  subs.add(s);
  return () => {
    subs.delete(s);
    s.el.removeAttribute("data-pressed");
    if (subs.size === 0) {
      window.removeEventListener("keydown", press, true);
      window.removeEventListener("keyup", lift, true);
      window.removeEventListener("blur", liftAll);
    }
  };
}

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  size?: "sm" | "md";
  /**
   * The key this cap stands for, when its content is not the key's name
   * (e.g. an icon): "Meta", "Enter", "k"… Defaults to the text inside.
   * Pass `false` to stop it reacting to the keyboard.
   */
  keyName?: string | false;
}

const kbdVariants = cva(
  [
    "inline-flex items-center justify-center min-w-(--kbd-h) h-(--kbd-h) px-[0.45em] rounded-[8px]",
    "bg-fill shadow-[inset_0_-1px_0_var(--rap-fill-strong)] text-ink-2",
    "font-sans text-[0.8125rem] font-medium leading-none tracking-[0.01em] whitespace-nowrap align-middle tabular-nums",
    "[&_svg]:size-[1.1em]",
    // delight: it goes down when you press the real key — lands in 60ms like contact,
    // springs back up over 380ms; the bottom lip flattens into a shade on the top edge
    "[transition:translate_380ms_var(--rap-ease-back),box-shadow_380ms_var(--rap-ease-out),background_var(--rap-dur-fast)_var(--rap-ease-rm)]",
    "data-pressed:translate-y-0.5 data-pressed:bg-fill-hover data-pressed:shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--rap-ink)_14%,transparent)]",
    "data-pressed:duration-60 data-pressed:ease-soft",
    // calm: no sink at all; reduced motion: it still darkens, but does not move
    "calm:data-pressed:translate-none calm:data-pressed:bg-fill calm:data-pressed:shadow-[inset_0_-1px_0_var(--rap-fill-strong)]",
    "motion-reduce:data-pressed:translate-none",
  ],
  {
    variants: {
      size: {
        sm: "[--kbd-h:20px] text-[0.6875rem]/none rounded-[6px]",
        md: "[--kbd-h:26px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** A keyboard key. Put several side by side for a chord, or use `KbdGroup`. */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd({ size = "md", keyName, className, ...rest }, ref) {
  const node = useRef<HTMLElement | null>(null);
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const nameRef = useRef(keyName);
  nameRef.current = keyName;

  useEffect(() => {
    const el = node.current;
    if (!el || nameRef.current === false) return;
    return subscribe({
      el,
      name: () => (typeof nameRef.current === "string" ? norm(nameRef.current) : norm(el.textContent ?? "")),
      onPress: () => soundRef.current.play("type"),
    });
  }, [keyName === false]);

  return (
    <kbd
      ref={(el) => {
        node.current = el;
        setRef(ref, el);
      }}
      data-slot="kbd"
      data-size={size}
      className={cn(kbdVariants({ size }), className)}
      {...rest}
    />
  );
});

/** Keys of one shortcut, packed 2px apart. */
export function KbdGroup({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="kbd-group" className={cn("inline-flex items-center gap-tight", className)} {...rest} />;
}
