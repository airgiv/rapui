// Typefaces for the signal preset: DSEG14 Classic (a 14-segment LCD face, for the
// headlines, kickers, readouts and numbers), IBM Plex Sans (body) and IBM Plex Mono.
//
// DSEG14 Classic — copyright (c) 2017 keshikan (http://www.keshikan.net), with Reserved
// Font Name "DSEG", licensed under the SIL Open Font License 1.1 (the `dseg` npm package,
// v0.46.0; the licence ships as fonts/DSEG-LICENSE.txt). Two weights, ~6 KB each; they are
// registered here and only download when a page sets text in them. The space is left out
// (unicode-range from "!"): DSEG's own space is a hairline, so words would run together —
// it falls through to the next face in the stack (Plex Mono), a proper word space.
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import dsegRegular from "./dseg/DSEG14Classic-Regular.woff2";
import dsegBold from "./dseg/DSEG14Classic-Bold.woff2";

if (typeof document !== "undefined" && typeof FontFace !== "undefined" && document.fonts) {
  const has = [...document.fonts].some((f) => f.family.replace(/"/g, "") === "DSEG14 Classic");
  if (!has) {
    for (const [src, weight] of [
      [dsegRegular, "400"],
      [dsegBold, "700"],
    ] as const) {
      document.fonts.add(new FontFace("DSEG14 Classic", `url(${src}) format("woff2")`, { weight, style: "normal", display: "swap", unicodeRange: "U+0021-007E" }));
    }
  }
}
