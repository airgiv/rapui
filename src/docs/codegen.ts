import type { Control, Props } from "./types";

/**
 * Turns control values into JSX attributes, skipping the ones still at
 * their default so the snippet shows only what you changed.
 *   attrs(p, controls) → ` size="lg" disabled`
 */
export function attrs(p: Props, controls: Control[] = [], skip: string[] = []): string {
  const out: string[] = [];
  for (const c of controls) {
    if (skip.includes(c.prop)) continue;
    const v = p[c.prop];
    if (v === c.default) continue;
    if (typeof v === "boolean") out.push(v ? ` ${c.prop}` : ` ${c.prop}={false}`);
    else if (typeof v === "number") out.push(` ${c.prop}={${v}}`);
    else out.push(` ${c.prop}="${v}"`);
  }
  return out.join("");
}

/** Default values for a control list. */
export function defaults(controls: Control[] = []): Props {
  return Object.fromEntries(controls.map((c) => [c.prop, c.default]));
}
