import {
  forwardRef,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle, useMergedRef } from "./Dialog";
import { useRowGlide } from "./DropdownMenu";
import "./DropdownMenu.css";
import "./Command.css";

/**
 * Searchable command list (cmdk): filter as you type, arrow keys to move,
 * Enter to run. Put it inline or in a <CommandDialog> for a ⌘K palette.
 *
 * Delight: the same as the menus (useRowGlide in DropdownMenu) — when the
 * list appears its rows are dealt in top to bottom, and ONE highlight glides
 * between rows like a caterpillar, following cmdk's `data-selected` whether
 * you arrow, hover or type (typing re-selects the first match, so the pill
 * visibly runs up to it). The deal plays once when the list mounts, not on
 * every keystroke — re-dealing while typing would be noise. The palette
 * (CommandDialog) keeps a quick drop-in of its own rather than the Dialog's
 * toss: ⌘K is opened dozens of times a day. Sound: pop on palette open, a
 * soft detent per row, tick on run.
 */
export const Command = forwardRef<ElementRef<typeof CommandPrimitive>, ComponentPropsWithoutRef<typeof CommandPrimitive>>(
  function Command({ className, ...rest }, ref) {
    return <CommandPrimitive ref={ref} className={cx("rap-command", className)} {...rest} />;
  },
);

export interface CommandDialogProps extends ComponentPropsWithoutRef<typeof Dialog> {
  /** Screen-reader title of the palette. */
  title?: string;
  /** Screen-reader description of the palette. */
  description?: string;
  className?: string;
  /** Props for the inner <Command> (filter, loop, value…). */
  commandProps?: ComponentPropsWithoutRef<typeof CommandPrimitive>;
  children?: ReactNode;
}

/** A Command inside the library Dialog — the classic ⌘K palette. */
export function CommandDialog({
  title = "Command palette",
  description = "Search for a command to run",
  className,
  commandProps,
  children,
  ...rest
}: CommandDialogProps) {
  return (
    <Dialog {...rest}>
      <DialogContent size="md" showClose={false} className={cx("rap-command-dialog", className)}>
        <DialogTitle className="rap-dialog-sr">{title}</DialogTitle>
        <DialogDescription className="rap-dialog-sr">{description}</DialogDescription>
        <Command {...commandProps} className={cx("rap-command--dialog", commandProps?.className)}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(function CommandInput({ className, ...rest }, ref) {
  return (
    <div className="rap-command-input">
      <Search className="rap-command-input__icon" aria-hidden />
      <CommandPrimitive.Input ref={ref} className={cx("rap-command-input__el", className)} {...rest} />
    </div>
  );
});

const pickCmdk = (root: HTMLElement) => root.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]');
const CMDK_WATCH = ["data-selected"];
const CMDK_ROWS = "[cmdk-item], [cmdk-group-heading], .rap-menu-separator";

export const CommandList = forwardRef<ElementRef<typeof CommandPrimitive.List>, ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(
  function CommandList({ className, children, ...rest }, ref) {
    const { attach, glider } = useRowGlide({ pick: pickCmdk, watch: CMDK_WATCH, rows: CMDK_ROWS, pop: 0 });
    const setRef = useMergedRef(ref, attach);
    // deal only on the first appearance; rows that come back while filtering just appear
    const [dealing, setDealing] = useState(true);
    useEffect(() => {
      const id = window.setTimeout(() => setDealing(false), 700);
      return () => window.clearTimeout(id);
    }, []);
    return (
      <CommandPrimitive.List
        ref={setRef}
        className={cx("rap-command-list", "rap-command-list--glide", dealing && "rap-command-list--deal", className)}
        {...rest}
      >
        {glider}
        {children}
      </CommandPrimitive.List>
    );
  },
);

export const CommandEmpty = forwardRef<ElementRef<typeof CommandPrimitive.Empty>, ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>(
  function CommandEmpty({ className, ...rest }, ref) {
    return <CommandPrimitive.Empty ref={ref} className={cx("rap-command-empty", className)} {...rest} />;
  },
);

export const CommandGroup = forwardRef<ElementRef<typeof CommandPrimitive.Group>, ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(
  function CommandGroup({ className, ...rest }, ref) {
    return <CommandPrimitive.Group ref={ref} className={cx("rap-command-group", className)} {...rest} />;
  },
);

export const CommandSeparator = forwardRef<
  ElementRef<typeof CommandPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(function CommandSeparator({ className, ...rest }, ref) {
  return <CommandPrimitive.Separator ref={ref} className={cx("rap-menu-separator", className)} {...rest} />;
});

export const CommandItem = forwardRef<ElementRef<typeof CommandPrimitive.Item>, ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(
  function CommandItem({ className, onSelect, ...rest }, ref) {
    const sound = useSound();
    return (
      <CommandPrimitive.Item
        ref={ref}
        className={cx("rap-menu-item", "rap-command-item", className)}
        onSelect={(value) => {
          sound.play("tick");
          onSelect?.(value);
        }}
        {...rest}
      />
    );
  },
);

export function CommandShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("rap-menu-shortcut", className)} {...rest} />;
}
