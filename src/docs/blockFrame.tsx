import type { ReactNode } from "react";

/* A landing block fills the docs stage edge to edge, on the page's paper
   (the stage itself is a surface card), so toned sections read as they
   would on a real page. The negative margin undoes the stage's padding. */
const PAD = "clamp(1.5rem,4vw,3rem)";

export function BlockFrame({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="block-frame"
      className="self-stretch rounded-card bg-paper text-ink font-sans py-[6px] shadow-[inset_0_0_0_1px_var(--rap-line)]"
      style={{ width: `calc(100% + 2 * ${PAD})`, margin: `calc(-1 * ${PAD})` }}
    >
      {children}
    </div>
  );
}
