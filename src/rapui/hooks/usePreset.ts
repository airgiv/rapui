/* The style preset and motion level in effect for an element: read from the
   nearest data-rap-preset / data-rap-motion ancestor (or <html>), and kept live —
   a MutationObserver on <html> catches a RapStyle switch. For components whose
   *shape* (not just colour) changes with the preset, like the AI orb. */
import { useLayoutEffect, useState, type RefObject } from "react";
import type { RapMotion, RapPreset } from "../components/RapStyle";

export function usePreset(ref: RefObject<Element | null>): { preset: RapPreset; motion: RapMotion } {
  const [state, setState] = useState<{ preset: RapPreset; motion: RapMotion }>({ preset: "fun", motion: "fun" });
  useLayoutEffect(() => {
    const read = () => {
      const el = ref.current;
      const p = (el?.closest("[data-rap-preset]")?.getAttribute("data-rap-preset") ?? "fun") as RapPreset;
      const m = (el?.closest("[data-rap-motion]")?.getAttribute("data-rap-motion") ?? "fun") as RapMotion;
      setState((s) => (s.preset === p && s.motion === m ? s : { preset: p, motion: m }));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rap-preset", "data-rap-motion"], subtree: true });
    return () => mo.disconnect();
  }, [ref]);
  return state;
}
