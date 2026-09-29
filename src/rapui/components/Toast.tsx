import { useEffect, useRef } from "react";
import { Toaster as Sonner, toast, type ToasterProps as SonnerProps } from "sonner";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
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

/**
 * Mount once near the root, then call `toast()` from anywhere.
 * Toasts are rounded ink slabs (they invert in dark mode) with a pill action.
 */
export function Toaster({ className, toastOptions, icons, position = "bottom-right", gap = 8, ...rest }: ToasterProps) {
  const cn = toastOptions?.classNames ?? {};
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
    const scan = () => root.querySelectorAll<HTMLElement>(".rap-toast").forEach(adopt);

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") {
          r.addedNodes.forEach((n) => {
            if (n instanceof HTMLElement && n.classList.contains("rap-toast")) adopt(n);
            else if (n instanceof HTMLElement) n.querySelectorAll<HTMLElement>(".rap-toast").forEach(adopt);
          });
        } else if (r.target instanceof HTMLElement && r.target.classList.contains("rap-toast")) {
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
    <div ref={host} className="rap-toaster-host">
      <Sonner
        className={cx("rap-toaster", className)}
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
            ...cn,
            toast: cx("rap-toast", cn.toast),
            title: cx("rap-toast__title", cn.title),
            description: cx("rap-toast__desc", cn.description),
            content: cx("rap-toast__content", cn.content),
            icon: cx("rap-toast__icon", cn.icon),
            actionButton: cx("rap-toast__btn", "rap-toast__btn--action", cn.actionButton),
            cancelButton: cx("rap-toast__btn", "rap-toast__btn--cancel", cn.cancelButton),
            closeButton: cx("rap-toast__close", cn.closeButton),
          },
        }}
        {...rest}
      />
    </div>
  );
}

export { toast };
