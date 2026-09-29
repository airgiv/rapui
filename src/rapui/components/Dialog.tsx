import {
  forwardRef,
  useCallback,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ForwardedRef,
  type HTMLAttributes,
} from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { springOf } from "../hooks/useSpring";
import { X } from "../icons";
import { useSound, type SoundName } from "../sound";
import { clamp, cn, prefersReducedMotion } from "../utils";
import "./Dialog.css";

/* Composable, shadcn-style: <Dialog><DialogTrigger/><DialogContent><DialogHeader><DialogTitle/>…

   Delight: a dialog is a card tossed onto the table. It opens with the shared
   `rap-toss-in` (from 36px below, turned -4°, overshooting to +1° and settling)
   and on close it FALLS — `rap-fall-out` on the gravity curve, 120px down,
   turning 8° — before Radix unmounts it. The fall is 420ms because a real drop
   of ~120px at screen scale reads as about that long; any quicker and it looks
   like a fade, any slower and it holds up the page. The scrim lingers to match
   so the card doesn't fall over an already-bright page.
   Both are individual `translate`/`rotate`/`scale` properties, so they stack
   on top of the centring `transform` instead of fighting it. Calm and reduced
   motion get the old quiet fade. Open/close state itself is immediate.
   Sound (only inside an enabled <SoundProvider>): a pop as it lands, a drop
   as it falls. */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

/* The card: shared by Dialog, AlertDialog and CommandDialog (not exported from the barrel).
   Centred with `transform` on purpose — the toss/fall keyframes animate the
   individual `translate`/`rotate`/`scale` properties, so they stack on top of
   the centring instead of fighting it (Tailwind's -translate-* would use
   `translate` and be overwritten by the animation). */
export const dialogContentVariants = cva(
  [
    "fixed z-1000 left-1/2 top-1/2 flex flex-col gap-5 [transform:translate(-50%,-50%)]",
    "w-[min(var(--dlg-w),calc(100vw-32px))] max-h-[calc(100vh-32px)] overflow-auto p-(--dlg-pad)",
    "rounded-card bg-surface text-ink shadow-pop font-sans focus:outline-none",
    // a closing (falling) card no longer takes clicks
    "data-[state=closed]:pointer-events-none",
  ],
  {
    variants: {
      size: {
        sm: "[--dlg-w:400px] [--dlg-pad:24px]",
        md: "[--dlg-w:520px] [--dlg-pad:28px]",
        lg: "[--dlg-w:720px] [--dlg-pad:32px]",
      },
      motion: {
        toss: [
          // calm / reduced motion: the old quiet fade and lift (Dialog.css keyframes)
          "animate-[rap-dialog-in_var(--rap-dur)_var(--rap-ease-out)]",
          "data-[state=closed]:animate-[rap-dialog-out_180ms_var(--rap-ease-rm)_forwards]",
          "motion-reduce:data-[state=closed]:animate-[rap-dialog-out_1ms_linear_forwards]",
          // tossed onto the table (theme `rap-toss-in`)…
          "fun:animate-[rap-toss-in_var(--rap-dur)_var(--rap-ease-out)]",
          // …and it falls off it under gravity; Radix waits for this before unmounting
          "fun:data-[state=closed]:animate-fall-out",
        ],
        none: "",
      },
    },
    defaultVariants: { size: "md", motion: "toss" },
  },
);

/* the scrim stays dim while the card is falling (380ms, the fall is 420ms);
   calm keeps the scrim's own 160ms fade, reduced motion leaves at once */
const dialogScrimClass = cn(
  "scrim",
  "fun:data-[state=closed]:[animation-duration:380ms] motion-reduce:data-[state=closed]:[animation-duration:1ms]",
);

/* header, footer, title and description: shared by Dialog, AlertDialog, Sheet and Drawer */
export const dialogHeaderClass = "flex flex-col gap-1.5 pr-11";
/** Actions row: right-aligned, buttons 2px apart. */
export const dialogFooterClass = "flex flex-wrap justify-end items-center gap-tight mt-1";
export const dialogTitleClass = "m-0 text-[1.5rem] font-medium leading-[1.15] tracking-[-0.03em]";
export const dialogDescriptionClass = "m-0 text-[0.9375rem] leading-[1.45] tracking-[-0.01em] text-mute";

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...rest }, ref) {
  return <DialogPrimitive.Overlay ref={ref} data-slot="dialog-overlay" className={cn(dialogScrimClass, className)} {...rest} />;
});

/** The round 36px close button used by Dialog and Sheet. */
export const DialogCloseButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function DialogCloseButton(
  { className, ...rest },
  ref,
) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      data-slot="dialog-close"
      className={cn(
        // round close button, top right; turns a quarter on hover
        "absolute top-5 right-5 grid place-items-center size-control-sm p-0 border-0 rounded-full bg-fill text-ink cursor-pointer",
        "[transition:background_var(--rap-dur-fast)_var(--rap-ease-rm),transform_var(--rap-dur-fast)_var(--rap-ease-spring)]",
        "hover:bg-fill-hover hover:[transform:rotate(90deg)]",
        "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)] [&_svg]:size-[18px]",
        className,
      )}
      aria-label="Close"
      {...rest}
    >
      <X aria-hidden />
    </DialogPrimitive.Close>
  );
});

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Card width: sm 400px, md 520px, lg 720px. */
  size?: "sm" | "md" | "lg";
  /** Show the round close button in the top-right corner. */
  showClose?: boolean;
}

/** Centred card on a scrim. Focus is trapped; Esc and a click outside close it. */
export const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(function DialogContent(
  { className, children, size = "md", showClose = true, ...rest },
  ref,
) {
  const setRef = useMergedRef(ref, useOpenCloseSound("pop", "drop"));
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRef}
        data-slot="dialog-content"
        data-size={size}
        className={cn(dialogContentVariants({ size }), className)}
        {...rest}
      >
        {children}
        {showClose && <DialogCloseButton />}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-header" className={cn(dialogHeaderClass, className)} {...rest} />;
}

/** Actions row: right-aligned, buttons 2px apart. */
export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-footer" className={cn(dialogFooterClass, className)} {...rest} />;
}

export const DialogTitle = forwardRef<ElementRef<typeof DialogPrimitive.Title>, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  function DialogTitle({ className, ...rest }, ref) {
    return <DialogPrimitive.Title ref={ref} data-slot="dialog-title" className={cn(dialogTitleClass, className)} {...rest} />;
  },
);

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Description ref={ref} data-slot="dialog-description" className={cn(dialogDescriptionClass, className)} {...rest} />
  );
});

/* ── overlay physics helpers (shared by HoverCard and Drawer) ──────────
   Kept here because Dialog is the base every overlay already imports.
   Portals render into <body>, so "calm" is checked on the node's ancestors
   (which include <html>, where the docs put it). */

/** True when playful motion should stay off for this node. */
export function isCalm(el?: Element | null): boolean {
  if (prefersReducedMotion()) return true;
  if (el?.closest('[data-rap-motion="calm"]')) return true;
  return typeof document !== "undefined" && document.documentElement.getAttribute("data-rap-motion") === "calm";
}

/**
 * The same spring as useSpring (same maths, same `tune`), but it writes to the
 * DOM through `onFrame` instead of React state — for things driven by pointer
 * moves at 60fps (hover-card tilt, drawer handle) where re-rendering the whole
 * overlay every frame would be wasteful. Parks itself when settled.
 */
export function createSpring(onFrame: (v: number) => void, tune = 50, initial = 0) {
  const { k, d } = springOf(tune);
  let cur = initial;
  let vel = 0;
  let target = initial;
  let raf = 0;
  let prev = 0;
  const tick = (t: number) => {
    const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
    prev = t;
    vel += (target - cur) * k * dt;
    vel *= Math.pow(d, dt);
    cur += vel * dt;
    if (Math.abs(target - cur) < 0.02 && Math.abs(vel) < 0.02) {
      cur = target;
      vel = 0;
      raf = 0;
      onFrame(cur);
      return;
    }
    onFrame(cur);
    raf = requestAnimationFrame(tick);
  };
  return {
    to(v: number) {
      target = v;
      if (!raf) {
        prev = 0;
        raf = requestAnimationFrame(tick);
      }
    },
    set(v: number) {
      cancelAnimationFrame(raf);
      raf = 0;
      cur = target = v;
      vel = 0;
      onFrame(v);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

/** Merge a forwarded ref with a local callback ref. */
export function useMergedRef<T>(forwarded: ForwardedRef<T>, local: (node: T | null) => void) {
  return useCallback(
    (node: T | null) => {
      local(node);
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded, local],
  );
}

/**
 * Callback ref that plays `open` when an overlay's content appears (or its
 * Radix `data-state` turns open again) and `close` when it turns "closed" —
 * i.e. at the start of the exit animation, when the eye sees it go. Silent
 * without an enabled SoundProvider. Re-attaching the same node plays nothing.
 */
export function useOpenCloseSound(open?: SoundName, close?: SoundName, strength?: number) {
  const sound = useSound();
  const api = useRef(sound);
  api.current = sound;
  const last = useRef<{ node: Element; mo: MutationObserver } | null>(null);
  return useCallback(
    (node: Element | null) => {
      if (!node || last.current?.node === node) return;
      last.current?.mo.disconnect();
      const isOpen = () => node.getAttribute("data-state") !== "closed";
      let was = isOpen();
      if (was && open) api.current.play(open, { strength });
      const mo = new MutationObserver(() => {
        const now = isOpen();
        if (now === was) return;
        was = now;
        const name = now ? open : close;
        if (name) api.current.play(name, { strength });
      });
      mo.observe(node, { attributes: true, attributeFilter: ["data-state"] });
      last.current = { node, mo };
    },
    [open, close, strength],
  );
}
