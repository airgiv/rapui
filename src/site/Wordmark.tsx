import { cn } from "../rapui/utils";

/* ── the wordmark ─────────────────────────────────────────
   One word, "rapui", read as one word — no slash splitting it into
   a brand and a category. The only mark on it is the dot of the i,
   which is a flame-coloured disc rather than a glyph: it is the one
   place the logo gets colour, and it is round like every control in
   the kit. On hover it hops (behind `fun:`), which is the library's
   whole pitch in one pixel-sized gesture.

   The i is a dotless ı with the dot drawn separately, so the disc
   can be larger than a font dot (0.17em, about a third wider than
   the stem) — at logo sizes a font's own dot looks timid. It sits
   0.05em above the x-height, the gap Onest's own i keeps.
   Tracking −0.06em: set this tight, the five letters close into a
   single shape, which is what a wordmark wants. */
export function Wordmark({ className, dot = true }: { className?: string; dot?: boolean }) {
  return (
    <span
      className={cn("group/wm relative inline-flex items-baseline font-display font-semibold tracking-[-0.06em] leading-none", className)}
      aria-label="rapui"
      role="img"
    >
      <span aria-hidden>rapu</span>
      <span aria-hidden className="relative">
        {dot ? "ı" : "i"}
        {dot && (
          <span
            className={cn(
              "absolute left-1/2 top-[0.08em] size-[0.17em] -translate-x-1/2 rounded-full bg-flame",
              "fun:group-hover/wm:animate-hop",
            )}
          />
        )}
      </span>
    </span>
  );
}
