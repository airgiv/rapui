import { useEffect, useRef } from "react";
import { Toaster as Sonner, toast, type ToasterProps as SonnerProps } from "sonner";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import { Spinner } from "./Spinner";
import "./Toast.css";

/* ── Toast ─────────────────────────────────────────────────
   Delight: toasts are stickers slapped onto a pile. Each one
   lands with its own small tilt — alternating sides, ±1.2–1.8°,
   so a stack reads as a hand-made pile rather than a machine
   queue — and it arrives a touch big (1.06×, tilted three times
   as far) and settles flat on the overshooting ease, like a
   sticker pressed down with a thumb.

   Swipe it away and it FLINGS: while you drag, it leans in the
   direction of travel (0.06° per px, up to 14°), and when you let
   go past the threshold it flies off spinning further instead of
   Sonner's straight slide.

   Sonner owns the DOM, so the tilt is assigned once per toast
   by a MutationObserver (it must stay put when newer toasts
   push it down the pile — Sonner's own index changes, ours does
   not), and the drag lean is read off Sonner's --swipe-amount-x.
   Only `rotate` / `scale` are used, which stack on top of
   Sonner's `transform` instead of fighting it.

   Sound (with a SoundProvider on): "pop" as a toast lands —
   "success" / "error" for those types — and "drop" as one leaves.
   Calm / reduced motion: flat toasts and Sonner's plain slide. */

export type ToasterProps = SonnerProps;

let tiltCounter = 0;

/* Toasts are rounded ink slabs (they invert in dark mode). Sonner's own stylesheet is
   unlayered, so whatever it sets on the <li> (transition, the swipe-out animation)
   is overridden in Toast.css; everything it leaves alone is utilities here. */
const TOAST_CLASSES = [
  "flex items-center gap-3 w-(--width) min-h-13 py-3 pr-3 pl-[18px] rounded-[22px] bg-ink text-paper font-sans tracking-[-0.01em]",
  // faint ring keeps the edge visible on dark backgrounds
  "shadow-[var(--rap-shadow-pop),0_0_0_1px_color-mix(in_srgb,var(--rap-paper)_10%,transparent)]",
  // stacked toasts behind the front one show only their edge
  "data-[expanded=false]:data-[front=false]:*:opacity-0",
  "data-[type=success]:[&_[data-icon]]:text-success data-[type=error]:[&_[data-icon]]:text-danger",
  "data-[type=warning]:[&_[data-icon]]:text-warning data-[type=info]:[&_[data-icon]]:text-sky dark:data-[type=info]:[&_[data-icon]]:text-blue",
  // delight: a pile of stickers. Each toast keeps the tilt it was given (--rap-tilt, set once
  // by the observer) plus the lean of the drag (--rap-lean); it lands a touch big and tilted
  // three times as far, then settles on the overshoot (the transition lives in Toast.css).
  // Only rotate / scale, so they stack on Sonner's transform instead of fighting it.
  "[--rap-tilt:0deg] [--rap-lean:0deg] [rotate:calc(var(--rap-tilt)+var(--rap-lean))]",
  "data-[mounted=false]:scale-106 data-[mounted=false]:[rotate:calc(var(--rap-tilt)*3)]",
  "calm:rotate-none calm:scale-none motion-reduce:rotate-none motion-reduce:scale-none",
];

const BUTTON = cn(
  "flex-none h-8 px-[0.9rem] border-0 rounded-pill [font-family:inherit] text-[0.8125rem] leading-[inherit] font-medium tracking-[-0.01em]",
  "cursor-pointer transition-[background-color,scale] duration-(--rap-dur-fast) ease-rm active:scale-96",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // two buttons sit 2px apart, not a full toast gap
  "[[data-button]+&]:ml-[calc(var(--rap-gap-tight)-0.75rem)]",
);

/**
 * Mount once near the root, then call `toast()` from anywhere.
 * Toasts are rounded ink slabs (they invert in dark mode) with a pill action.
 */
export function Toaster({ className, toastOptions, icons, position = "bottom-right", gap = 8, ...rest }: ToasterProps) {
  const own = toastOptions?.classNames ?? {};
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const seen = new WeakSet<Element>();
    const gone = new WeakSet<Element>();
    const setLean = (li: HTMLElement) => {
      const x = parseFloat(li.style.getPropertyValue("--swipe-amount-x")) || 0;
      const lean = `${Math.max(-14, Math.min(14, x * 0.06)).toFixed(2)}deg`;
      if (li.style.getPropertyValue("--rap-lean") !== lean) li.style.setProperty("--rap-lean", lean);
    };
    const adopt = (li: HTMLElement) => {
      if (seen.has(li)) return;
      seen.add(li);
      const side = tiltCounter++ % 2 === 0 ? 1 : -1;
      li.style.setProperty("--rap-tilt", `${(side * (1.2 + Math.random() * 0.6)).toFixed(2)}deg`);
      const type = li.getAttribute("data-type");
      soundRef.current.play(type === "success" ? "success" : type === "error" ? "error" : "pop");
    };
    // Sonner owns the toast <li>s, so they carry its attribute rather than a data-slot of ours
    const TOAST = "[data-sonner-toast]";
    const scan = () => root.querySelectorAll<HTMLElement>(TOAST).forEach(adopt);

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") {
          r.addedNodes.forEach((n) => {
            if (n instanceof HTMLElement && n.matches(TOAST)) adopt(n);
            else if (n instanceof HTMLElement) n.querySelectorAll<HTMLElement>(TOAST).forEach(adopt);
          });
        } else if (r.target instanceof HTMLElement && r.target.matches(TOAST)) {
          const li = r.target;
          if (r.attributeName === "style") setLean(li);
          if (r.attributeName === "data-removed" && li.getAttribute("data-removed") === "true" && !gone.has(li)) {
            gone.add(li);
            soundRef.current.play("drop");
          }
        }
      }
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-removed"],
    });
    scan();
    return () => mo.disconnect();
  }, []);

  return (
    // display: contents — a handle on Sonner's list for the observer, no box of its own
    <div ref={host} data-slot="toaster" className="contents">
      <Sonner
        className={cn("[--width:372px] font-sans", className)}
        position={position}
        gap={gap}
        icons={{
          success: <CircleCheck />,
          error: <CircleAlert />,
          warning: <TriangleAlert />,
          info: <Info />,
          loading: <Spinner size="sm" label="Working" />,
          close: <X />,
          ...icons,
        }}
        toastOptions={{
          ...toastOptions,
          unstyled: true,
          classNames: {
            ...own,
            toast: cn(TOAST_CLASSES, own.toast),
            title: cn("text-[0.9375rem] font-medium leading-[1.3]", own.title),
            description: cn("text-[0.8125rem] leading-[1.4] text-[color-mix(in_srgb,var(--rap-paper)_62%,var(--rap-ink))]", own.description),
            content: cn("flex flex-col gap-0.5 flex-1 min-w-0", own.content),
            icon: cn("relative grid place-items-center flex-none size-5 [&_svg]:size-5", own.icon),
            actionButton: cn(BUTTON, "bg-paper text-ink hover:bg-paper-3", own.actionButton),
            cancelButton: cn(BUTTON, "bg-[color-mix(in_srgb,var(--rap-paper)_14%,transparent)] text-paper", own.cancelButton),
            closeButton: cn(
              "absolute -top-1.5 -left-1.5 grid place-items-center size-[22px] p-0 border-0 rounded-full",
              "bg-surface text-ink shadow-[0_0_0_1px_var(--rap-line)] cursor-pointer [&_svg]:size-3",
              own.closeButton,
            ),
          },
        }}
        {...rest}
      />
    </div>
  );
}

export { toast };
