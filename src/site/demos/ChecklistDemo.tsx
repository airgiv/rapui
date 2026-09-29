import { Checklist } from "../../rapui/components/Checklist";
import { cn } from "../../rapui/utils";

/* ── two lists on a table ────────────────────────────────
   A launch list in the mixed accents and a grocery list in acid,
   side by side on wide stages and stacked on a phone. Each card is
   width-flexible (up to 26rem) and the grid only splits once both
   can have ~20rem, so at 390px they stack full width. Tick the
   top row again and again: every task you finish rolls down to the
   Done pile and the next one slides up under your finger. */
const LAUNCH = ["Freeze the copy", "Export the hero film", "Swap the favicon", "Press publish"];
const GROCERIES = ["Oat milk", "Sourdough", "Lemons", "Basil"];

export function ChecklistDemo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-start justify-items-center gap-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper px-4 py-8 sm:p-10",
        className,
      )}
    >
      <Checklist title="Launch day" tasks={LAUNCH} max={5} />
      <Checklist title="Groceries" tone="acid" tasks={GROCERIES} max={5} />
    </div>
  );
}
