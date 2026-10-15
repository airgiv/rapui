/* #landing — a whole landing page built from the blocks, in the preset the
   docs are previewing. A small floating bar switches the preset, the motion,
   the theme and the grid overlay, so you can watch one page re-lay itself. */
import { useEffect, useState } from "react";
import { Button, GridOverlay, PRESET_MOTION, RapStyle, Switch } from "../rapui";
import "../rapui/fonts/all";
import { LandingTemplate } from "./landing/Template";
import { StyleControls, useStylePreset } from "./StyleControls";

export function LandingPreview({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const { preset, setPreset, motion, setMotion } = useStylePreset();
  const [grid, setGrid] = useState(false);
  useEffect(() => {
    document.title = "Docket — a rapui landing page";
    window.scrollTo(0, 0);
  }, []);
  // Shift+G toggles the grid here too, in step with the switch
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "g") setGrid((v) => !v);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  return (
    <RapStyle preset={preset} motion={motion ?? undefined}>
      <div className="rap-root min-h-screen bg-paper pb-28">
        <LandingTemplate />
        <GridOverlay visible={grid} />
      </div>
      {/* the preview's own controls: a dark pill in the page's own preset */}
      <div
        data-rap-theme="dark"
        className="fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] left-1/2 z-[2147483001] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-3 overflow-x-auto rounded-pill bg-paper py-2 pr-2 pl-4 font-sans text-ink shadow-pop"
      >
        <a href="#" className="shrink-0 text-[0.875rem] font-medium text-ink-2 hover:text-ink">
          ← Home
        </a>
        <StyleControls preset={preset} setPreset={setPreset} motion={motion ?? PRESET_MOTION[preset]} setMotion={setMotion} />
        <label className="flex shrink-0 items-center gap-2 text-[0.8125rem] text-ink-2">
          Grid
          <Switch checked={grid} onCheckedChange={setGrid} aria-label="Show the layout grid (Shift+G)" />
        </label>
        <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" aria-label="Dark theme" />
        <Button size="sm" variant="soft" className="shrink-0 max-[640px]:hidden" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Top
        </Button>
      </div>
    </RapStyle>
  );
}
