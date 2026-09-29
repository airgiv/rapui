import { Group, Panel, Separator, type GroupProps, type PanelProps, type SeparatorProps } from "react-resizable-panels";
import { cx } from "../utils";
import "./Resizable.css";

/*
 * Built on react-resizable-panels v4 (Group / Panel / Separator).
 * Size props: numbers are PIXELS, strings are percentages ("25" or "25%") or CSS units ("16rem").
 */

export interface ResizablePanelGroupProps extends GroupProps {
  /** "tiles" gives each panel a filled, rounded surface 4px apart; "plain" leaves them bare. */
  variant?: "tiles" | "plain";
}

export function ResizablePanelGroup({ className, variant = "tiles", orientation = "horizontal", ...rest }: ResizablePanelGroupProps) {
  return (
    <Group
      orientation={orientation}
      className={cx("rap-resizable", `rap-resizable--${orientation}`, `rap-resizable--${variant}`, className)}
      {...rest}
    />
  );
}

export function ResizablePanel({ className, ...rest }: PanelProps) {
  return <Panel className={cx("rap-resizable__panel", className)} {...rest} />;
}

export interface ResizableHandleProps extends SeparatorProps {
  /** Show a small grip pill in the gap. */
  withHandle?: boolean;
}

export function ResizableHandle({ className, withHandle, children, ...rest }: ResizableHandleProps) {
  return (
    <Separator className={cx("rap-resizable__handle", className)} {...rest}>
      {withHandle && <span className="rap-resizable__grip" aria-hidden />}
      {children}
    </Separator>
  );
}

export type { PanelImperativeHandle, GroupImperativeHandle, Layout as ResizableLayout } from "react-resizable-panels";
export { usePanelRef, useGroupRef } from "react-resizable-panels";
