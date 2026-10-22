/* The presets the site shows. The library still ships all five (presets.css,
   RapStyle), but the site — home, docs, the landing preview — only offers fun
   and civic for now; the other three are being reworked separately. */
import { RAP_PRESETS, type RapPreset } from "../rapui";

export const SITE_PRESETS = RAP_PRESETS.filter((p) => p.value === "fun" || p.value === "civic");

/* the "look" select on block docs: follow the page's preset, or force one of the shown ones */
export const SITE_LOOKS = ["preset", "fun", "civic"] as const;

/* a stored or requested preset the site no longer offers falls back to fun */
export const sitePreset = (v: unknown): RapPreset => (SITE_PRESETS.some((p) => p.value === v) ? (v as RapPreset) : "fun");
