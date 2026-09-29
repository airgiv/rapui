import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* tailwind-merge needs to know rap/ui's theme names, or it cannot tell that
   `text-display-xl` is a font size (and not a colour) or that `rounded-pill`
   and `rounded-card` conflict. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "paper", "paper-2", "paper-3", "surface", "ink", "ink-2", "mute", "line", "fill", "fill-hover", "fill-strong",
        "flame", "blue", "plum", "acid", "bubble", "sky", "accent", "accent-ink", "select", "select-ink", "ring",
        "danger", "success", "warning", "scrim",
      ],
      font: ["sans", "display", "mono"],
      text: ["display-mega", "display-xxl", "display-xl", "display-lg", "display-md"],
      radius: ["xs", "sm", "row", "pop", "card", "lg", "pill"],
      spacing: ["control-sm", "control", "control-lg", "tight", "tile"],
      shadow: ["pop"],
      ease: ["rm", "soft", "spring", "back", "gravity"],
      animate: ["shake", "hop", "splat", "wiggle", "toss-in", "fall-out", "deal-in", "float", "pop-in", "pop-out", "fade-in", "fade-out", "spin-slow"],
    },
  },
});

/** Merge class names, Tailwind-aware (the shadcn `cn`): later utilities win over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** @deprecated kept for components not yet on Tailwind — use `cn`. */
export const cx = cn;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
