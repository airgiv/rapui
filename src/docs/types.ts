import type { ComponentType } from "react";

/** Sidebar sections, in display order. */
export const GROUPS = [
  "Actions",
  "Forms",
  "Scrubbers",
  "Overlays",
  "Navigation",
  "Data display",
  "Feedback",
  "Layout",
  "Expressive",
] as const;
export type Group = (typeof GROUPS)[number];

/**
 * One knob in the playground's settings panel. `prop` is the key in `Props`.
 * `codeDefault` is the COMPONENT's own default, used by `attrs()` to decide what
 * to leave out of the snippet; it falls back to `default` (the panel's starting
 * value). Set it to `null` for a prop that must always be printed.
 */
type Base = { prop: string; label?: string };
export type Control =
  | (Base & { type: "select"; options: readonly string[]; default: string; codeDefault?: string | null })
  | (Base & { type: "boolean"; default: boolean; codeDefault?: boolean | null })
  | (Base & { type: "text"; default: string; codeDefault?: string | null })
  | (Base & { type: "number"; min: number; max: number; step?: number; default: number; codeDefault?: number | null });

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
