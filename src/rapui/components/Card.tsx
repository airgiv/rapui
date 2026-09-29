import { forwardRef, type HTMLAttributes, type PointerEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../utils";

/* ── Card ──────────────────────────────────────────────────
   Delight: card stock on a soft desk. A card you can click
   gives under the finger — it squashes 1.5% toward the exact
   point you pressed (transform-origin follows the pointer), so
   pressing a corner dips that corner, and on release it springs
   back past flat and settles (--rap-ease-back). 1.5% is the
   most a surface holding text can move without the text
   visibly swimming; the press lands in 90ms so it feels like
   contact, the release takes 450ms so you see the rebound.

   Only for cards that are a target: `pressable`, or any card
   with an onClick. A card that just holds content stays still. */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  /** Squash under the pointer like card stock. Defaults to true when `onClick` is set. */
  pressable?: boolean;
}

const cardVariants = cva(
  "flex flex-col p-(--card-pad) bg-surface text-ink font-sans",
  {
    variants: {
      size: {
        sm: "[--card-pad:1.25rem] gap-4 rounded-[22px]",
        md: "[--card-pad:1.75rem] gap-5 rounded-card",
        lg: "[--card-pad:2.25rem] gap-6 rounded-lg",
      },
      // delight: card stock gives under the finger. The origin follows the pointer
      // (--card-ox/--card-oy set on pointerdown); 1.5% lands in 90ms, the release
      // springs back past flat over 450ms.
      pressable: {
        true: [
          "cursor-pointer origin-[var(--card-ox,50%)_var(--card-oy,50%)] [-webkit-tap-highlight-color:transparent]",
          "transition-[scale] duration-450 ease-(--rap-ease-back)",
          "active:scale-[0.985] active:duration-90 active:ease-soft",
          "calm:active:scale-none motion-reduce:active:scale-none",
          "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
        ],
        false: "",
      },
    },
    defaultVariants: { size: "md", pressable: false },
  },
);

/** White surface with the big 28px radius. No border, no shadow — it sits on paper. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, size = "md", pressable, onPointerDown, ...rest },
  ref,
) {
  const press = pressable ?? rest.onClick != null;
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (press) {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--card-ox", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--card-oy", `${e.clientY - r.top}px`);
    }
    onPointerDown?.(e);
  };
  return (
    <div
      ref={ref}
      data-slot="card"
      data-size={size}
      className={cn(cardVariants({ size, pressable: press }), className)}
      onPointerDown={down}
      {...rest}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader({ className, ...rest }, ref) {
  return <div ref={ref} data-slot="card-header" className={cn("flex flex-col gap-[0.35rem]", className)} {...rest} />;
});

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle({ className, ...rest }, ref) {
  return <h3 ref={ref} data-slot="card-title" className={cn("m-0 text-[1.25rem] font-medium leading-[1.2] tracking-[-0.02em]", className)} {...rest} />;
});

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(function CardDescription(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} data-slot="card-description" className={cn("m-0 text-[0.9375rem] leading-[1.45] tracking-[-0.01em] text-mute", className)} {...rest} />;
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent({ className, ...rest }, ref) {
  return <div ref={ref} data-slot="card-content" className={cn("text-[0.9375rem] leading-normal", className)} {...rest} />;
});

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter({ className, ...rest }, ref) {
  return <div ref={ref} data-slot="card-footer" className={cn("flex items-center gap-tight mt-auto", className)} {...rest} />;
});
