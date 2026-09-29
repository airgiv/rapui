import type { ComponentType } from "react";

/** Sidebar sections, in display order. */
export const GROUPS = [
  "Actions",
  "Forms",
  "Overlays",
  "Navigation",
  "Data display",
  "Feedback",
  "Layout",
  "Expressive",
] as const;
export type Group = (typeof GROUPS)[number];

/** One knob in the playground's settings panel. `prop` is the key in `Props`. */
export type Control =
  | { type: "select"; prop: string; label?: string; options: readonly string[]; default: string }
  | { type: "boolean"; prop: string; label?: string; default: boolean }
  | { type: "text"; prop: string; label?: string; default: string }
  | { type: "number"; prop: string; label?: string; min: number; max: number; step?: number; default: number };

export type Props = Record<string, string | number | boolean>;

export interface DocEntry {
  /** URL token: lowercase, digits and dashes (#docs.<slug>). */
  slug: string;
  name: string;
  group: Group;
  /** One or two plain sentences: what it is and when to use it. */
  description: string;
  /** What it is built on, e.g. "Radix Dialog" or "react-day-picker". Optional. */
  basedOn?: string;
  controls?: Control[];
  /** The live preview. Receives the current control values. May use hooks. */
  Demo: ComponentType<{ p: Props }>;
  /** Usage snippet for the current control values. */
  code: (p: Props) => string;
  /** Extra fixed examples under the playground. */
  examples?: { title: string; Demo: ComponentType; code: string }[];
}
