import { GROUPS, type DocEntry } from "./types";
import { entries as actions } from "./entries/actions";
import { entries as buttonsFun } from "./entries/buttons-fun";
import { entries as forms } from "./entries/forms";
import { entries as overlays } from "./entries/overlays";
import { entries as display } from "./entries/display";
import { entries as navigation } from "./entries/navigation";
import { entries as expressive } from "./entries/expressive";
import { entries as scrubbers } from "./entries/scrubbers";
import { entries as charts } from "./entries/charts";
import { entries as chartsA } from "./entries/charts-a";
import { entries as chartsB } from "./entries/charts-b";
import { entries as galleries } from "./entries/galleries";
import { entries as players } from "./entries/players";
import { entries as tools } from "./entries/tools";

/** Every documented component, sorted by sidebar group then name. */
export const ENTRIES: DocEntry[] = [...actions, ...buttonsFun, ...forms, ...scrubbers, ...overlays, ...display, ...charts, ...chartsA, ...chartsB, ...galleries, ...players, ...tools, ...navigation, ...expressive].sort(
  (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.name.localeCompare(b.name),
);
