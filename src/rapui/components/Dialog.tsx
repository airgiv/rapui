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
import { springOf } from "../hooks/useSpring";
import { X } from "../icons";
import { useSound, type SoundName } from "../sound";
import { clamp, cx, prefersReducedMotion } from "../utils";
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

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...rest }, ref) {
  return <DialogPrimitive.Overlay ref={ref} className={cx("rap-scrim", "rap-dialog-scrim", className)} {...rest} />;
});

/** The round 36px close button used by Dialog and Sheet. */
export const DialogCloseButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function DialogCloseButton(
  { className, ...rest },
  ref,
) {
  return (
    <DialogPrimitive.Close ref={ref} className={cx("rap-dialog-x", className)} aria-label="Close" {...rest}>
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
      <DialogPrimitive.Content ref={setRef} className={cx("rap-dialog", `rap-dialog--${size}`, className)} {...rest}>
        {children}
        {showClose && <DialogCloseButton />}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-header", className)} {...rest} />;
}

/** Actions row: right-aligned, buttons 2px apart. */
export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-footer", className)} {...rest} />;
}

export const DialogTitle = forwardRef<ElementRef<typeof DialogPrimitive.Title>, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  function DialogTitle({ className, ...rest }, ref) {
    return <DialogPrimitive.Title ref={ref} className={cx("rap-dialog-title", className)} {...rest} />;
  },
);

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...rest }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cx("rap-dialog-description", className)} {...rest} />;
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
