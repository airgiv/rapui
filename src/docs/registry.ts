import { GROUPS, type DocEntry } from "./types";
import { entries as actions } from "./entries/actions";
import { entries as forms } from "./entries/forms";
import { entries as overlays } from "./entries/overlays";
import { entries as display } from "./entries/display";
import { entries as navigation } from "./entries/navigation";
import { entries as expressive } from "./entries/expressive";

/** Every documented component, sorted by sidebar group then name. */
export const ENTRIES: DocEntry[] = [...actions, ...forms, ...overlays, ...display, ...navigation, ...expressive].sort(
  (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.name.localeCompare(b.name),
);
