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
import { Dialog as DialogPrimitive } from "radix-ui";
import { Search } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
  dialogContentVariants,
  useMergedRef,
  useOpenCloseSound,
} from "./Dialog";
import { useRowGlide } from "./DropdownMenu";
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
    return (
      <CommandPrimitive
        ref={ref}
        data-slot="command"
        className={cn(
          "flex flex-col w-full overflow-hidden p-1.5 rounded-pop bg-surface text-ink shadow-[0_0_0_1px_var(--rap-line)] font-sans",
          className,
        )}
        {...rest}
      />
    );
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
  const setRef = useOpenCloseSound("pop", "drop");
  return (
    <Dialog {...rest}>
      {/* the Dialog card (as DialogContent, no close button) with its own motion: a quick
          drop-in instead of the toss, the same in calm and reduced motion (--rap-dur is 0 there).
          Anchored near the top so the box doesn't jump while the list filters. */}
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={setRef}
          data-slot="command-dialog"
          className={cn(
            dialogContentVariants({ size: "md", motion: "none" }),
            "p-2.5 gap-0 rounded-card overflow-hidden top-[18vh] max-h-[72vh] [transform:translate(-50%,0)]",
            "animate-[rap-command-in_var(--rap-dur)_var(--rap-ease-out)]",
            "data-[state=closed]:animate-[rap-command-out_180ms_var(--rap-ease-rm)_forwards]",
            className,
          )}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          <Command
            {...commandProps}
            className={cn("p-0 rounded-none bg-transparent shadow-none", commandProps?.className)}
          >
            {children}
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

export const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(function CommandInput({ className, ...rest }, ref) {
  return (
    <div
      data-slot="command-input-wrapper"
      className={cn(
        "flex flex-none items-center gap-[0.6rem] h-control px-[1.1rem] rounded-pill bg-fill",
        "in-data-[slot=command-dialog]:h-control-lg",
        "transition-[background,box-shadow] duration-(--rap-dur-fast) ease-rm",
        "focus-within:bg-surface focus-within:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
      )}
    >
      <Search className="size-[18px] flex-none text-mute" aria-hidden />
      <CommandPrimitive.Input
        ref={ref}
        data-slot="command-input"
        className={cn(
          // the field's font follows the palette (longhands: a `font` shorthand would also reset the size)
          "flex-1 min-w-0 h-full p-0 border-0 bg-transparent text-inherit tracking-[-0.01em]",
          "[font-family:inherit] [font-style:inherit] [font-weight:inherit] text-[1rem] [line-height:inherit]",
          "outline-none placeholder:text-mute",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

const pickCmdk = (root: HTMLElement) => root.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]');
const CMDK_WATCH = ["data-selected"];
const CMDK_ROWS = '[cmdk-item], [cmdk-group-heading], [data-slot="command-separator"]';

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
        data-slot="command-list"
        data-deal={dealing ? "" : undefined}
        className={cn(
          "relative isolate max-h-[320px] mt-1 overflow-y-auto overscroll-contain scroll-p-1",
          "in-data-[slot=command-dialog]:max-h-[min(400px,60vh)] in-data-[slot=command-dialog]:pb-[2px]",
          // rows dealt in on mount only (see the top comment)
          "fun:data-[deal]:[&_:is([cmdk-item],[cmdk-group-heading],[data-slot=command-separator])]:animate-[rap-deal-in_240ms_var(--rap-ease-out)_calc(var(--i,0)*22ms)_both]",
          className,
        )}
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
    return (
      <CommandPrimitive.Empty
        ref={ref}
        data-slot="command-empty"
        className={cn("py-7 px-4 text-center text-[0.9375rem] text-mute", className)}
        {...rest}
      />
    );
  },
);

export const CommandGroup = forwardRef<ElementRef<typeof CommandPrimitive.Group>, ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(
  function CommandGroup({ className, ...rest }, ref) {
    return (
      <CommandPrimitive.Group
        ref={ref}
        data-slot="command-group"
        className={cn(
          "[&_[cmdk-group-heading]]:pt-[0.6rem] [&_[cmdk-group-heading]]:px-[0.9rem] [&_[cmdk-group-heading]]:pb-1",
          "[&_[cmdk-group-heading]]:text-[0.8125rem] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[-0.01em]",
          "[&_[cmdk-group-heading]]:text-mute",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const CommandSeparator = forwardRef<
  ElementRef<typeof CommandPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(function CommandSeparator({ className, ...rest }, ref) {
  return <CommandPrimitive.Separator ref={ref} data-slot="command-separator" className={cn("menu-separator", className)} {...rest} />;
});

export const CommandItem = forwardRef<ElementRef<typeof CommandPrimitive.Item>, ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(
  function CommandItem({ className, onSelect, ...rest }, ref) {
    const sound = useSound();
    return (
      <CommandPrimitive.Item
        ref={ref}
        data-slot="command-item"
        className={cn(
          // cmdk marks rows with data-selected / data-disabled="true|false" (the `menu-item`
          // utility already ignores data-disabled="false"); the glider paints the selection,
          // except under calm, where rows light up on their own again
          "menu-item calm:data-[selected=true]:bg-fill [&>svg]:text-ink-2 [&[hidden]]:hidden",
          className,
        )}
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
  return <span data-slot="command-shortcut" className={cn("menu-shortcut", className)} {...rest} />;
}
