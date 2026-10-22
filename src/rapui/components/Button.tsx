import { forwardRef, useEffect, useImperativeHandle, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useMagnetic } from "../hooks/useMagnetic";
import { cn } from "../utils";
import { RollText } from "./RollText";
import { useSound } from "../sound";
import { useStack, type StackState } from "./stackContext";

/* ── Button, on Tailwind ────────────────────────────────────
   Each variant only sets a handful of local custom properties
   (--btn-bg, --btn-fg, --btn-blob…) and every rule reads them, so
   the hover fill, the arrow bubble and the ghost underline are
   written once for all seven variants instead of seven times.
   The hover is deliberately simple: the pill grows a little on a
   springy overshoot and settles, the other colour fades in, the
   label rolls up once as one line, the arrow nudges. Press squashes.
   Calm (and still): no bounce, no roll — only the colour.
   Sizes do the same with --btn-h / --btn-px / --btn-fs, which is
   what lets the icon bubble and the word-to-bubble gap scale with
   the button (the gap is 0.36 × height: roughly twice the bubble's
   inset from the edge, so the bubble never looks glued to the word). */

const buttonVariants = cva(
  [
    "group/btn rap-roll-host relative isolate inline-flex items-center justify-center",
    /* no overflow clip: the hover fill is a pill of its own (below) and
       inside a FormStack it has to swell past the box with the blob */
    "h-(--btn-h) px-(--btn-px) gap-3 whitespace-nowrap cursor-pointer",
    "rounded-pill border-[1.5px] border-(--btn-border) bg-(--btn-bg) text-(--btn-fg)",
    "font-sans text-(length:--btn-fs) font-medium tracking-[-0.01em]",
    /* colour on a short ease, the size on the spring (it overshoots, then settles) */
    "[transition:color_var(--rap-dur-fast)_var(--rap-ease-out),border-color_var(--rap-dur-fast)_var(--rap-ease-out),background-color_var(--rap-dur-fast)_var(--rap-ease-out),scale_460ms_var(--rap-ease-spring)]",
    // the rim changes with the fill, so the new colour reaches the edge in one go
    "hover:text-(--btn-blob-fg) hover:border-(--btn-blob)",
    "fun:hover:scale-105 active:scale-96 fun:active:scale-96 calm:active:scale-98",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring",
    "[-webkit-tap-highlight-color:transparent]",
    // defaults every variant may override
    "[--btn-border:transparent] [--btn-icon-bg:var(--btn-fg)] [--btn-icon-fg:var(--btn-bg)]",
  ],
  {
    variants: {
      variant: {
        solid: "[--btn-bg:var(--rap-ink)] [--btn-fg:var(--rap-paper)] [--btn-blob:var(--rap-accent)] [--btn-blob-fg:var(--rap-accent-ink)]",
        accent: "[--btn-bg:var(--rap-accent)] [--btn-fg:var(--rap-accent-ink)] [--btn-blob:var(--rap-ink)] [--btn-blob-fg:var(--rap-paper)]",
        blue: "[--btn-bg:var(--rap-blue)] [--btn-fg:#fff] [--btn-blob:var(--rap-ink)] [--btn-blob-fg:var(--rap-paper)]",
        soft: "[--btn-bg:var(--rap-paper-3)] [--btn-fg:var(--rap-ink)] [--btn-blob:var(--rap-ink)] [--btn-blob-fg:var(--rap-paper)] [--btn-icon-bg:var(--rap-paper-2)] [--btn-icon-fg:var(--rap-ink)]",
        acid: "[--btn-bg:var(--rap-acid)] [--btn-fg:#282828] [--btn-blob:var(--rap-ink)] [--btn-blob-fg:var(--rap-paper)]",
        outline:
          "[--btn-bg:transparent] [--btn-fg:var(--rap-ink)] [--btn-border:var(--rap-ink)] [--btn-blob:var(--rap-ink)] [--btn-blob-fg:var(--rap-paper)] [--btn-icon-bg:var(--rap-ink)] [--btn-icon-fg:var(--rap-paper)]",
        ghost: [
          "[--btn-bg:transparent] [--btn-fg:var(--rap-ink)] [--btn-blob:transparent] [--btn-blob-fg:var(--rap-ink)]",
          "[--btn-icon-bg:transparent] [--btn-icon-fg:currentColor] px-[0.2rem] rounded-none overflow-visible",
          // an underline that draws itself from a quarter to full width
          "after:absolute after:inset-x-0 after:bottom-[0.55em] after:h-0.5 after:bg-current after:origin-left after:scale-x-25",
          "after:transition-transform after:duration-(--rap-dur) after:ease-soft hover:after:scale-x-100",
          // a text link: the underline is its hover, it does not grow
          "fun:hover:scale-100",
        ],
      },
      size: {
        sm: "[--btn-h:2.5rem] [--btn-px:1.1rem] [--btn-fs:0.875rem] gap-2",
        md: "[--btn-h:3.25rem] [--btn-px:1.6rem] [--btn-fs:1rem]",
        lg: "[--btn-h:4.25rem] [--btn-px:2.2rem] [--btn-fs:1.25rem]",
        xl: "[--btn-h:6rem] [--btn-px:3rem] [--btn-fs:clamp(1.4rem,2.2vw,2rem)] font-display-ui font-medium tracking-[-0.04em]",
        /* Readymag's form scale: a pill as tall as a line of body text is wide
           (88px), sans at 20px, regular weight — big because it is the only
           thing to press, not because it shouts */
        hero: "[--btn-h:5.5rem] [--btn-px:2.2rem] [--btn-fs:1.25rem] font-normal",
      },
      block: { true: "w-full", false: "" },
      /* start: the label sits at the left edge like a form row; an icon goes to the far right */
      align: { center: "", start: "justify-between text-left" },
      hasIcon: {
        true: "gap-[calc(var(--btn-h)*0.36)] pr-[calc(var(--btn-h)*0.14)]",
        false: "",
      },
      iconStart: {
        true: "flex-row-reverse pr-(--btn-px) pl-[calc(var(--btn-h)*0.14)]",
        false: "",
      },
    },
    compoundVariants: [{ variant: "ghost", hasIcon: true, className: "pr-[0.2rem]" }],
    defaultVariants: { variant: "solid", size: "md", hasIcon: false, iconStart: false, block: false, align: "center" },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
export { buttonVariants };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading/trailing icon. Pass `true` for the default arrow. */
  icon?: ReactNode | true;
  iconPosition?: "start" | "end";
  /** Follow the pointer a little. */
  magnetic?: boolean;
  /** The label rolls up once, as one line, on hover (only when children is a string). */
  roll?: boolean;
  /** Stretch to the full width of the container. */
  block?: boolean;
  /** `start` puts the label at the left edge (big form rows). */
  align?: "center" | "start";
  /**
   * loading — stripes run across the pill and three dots hop where the label was;
   * success — the pill splats green and a check draws itself;
   * error — it turns red and shakes "no". Inside a FormStack a submit button
   * follows the stack's state unless you set this.
   */
  state?: StackState;
  /** Label for the success / error / loading states (default: a check, "Try again", dots). */
  successLabel?: ReactNode;
  errorLabel?: ReactNode;
  loadingLabel?: ReactNode;
}

/* three dots that hop in turn */
const Dots = () => (
  <span className="inline-flex gap-[0.28em]" aria-label="Loading">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="size-[0.34em] rounded-full bg-current fun:animate-dot"
        style={{ animationDelay: `${i * 120}ms` }}
      />
    ))}
  </span>
);

/* a check that draws itself (pathLength 1 → the dash offset is a fraction) */
const Check = () => (
  <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" aria-hidden>
    <path
      d="M5 12.5 10 17.5 19.5 7"
      pathLength={1}
      strokeDasharray={1}
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-draw calm:animate-none"
    />
  </svg>
);

/* One continuous stroke — head and shaft meet at a single round join, so
   there is no overlap seam where two square-capped lines used to cross. */
export const Arrow = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" aria-hidden>
    <path
      d="M7.5 6.5h10v10M17.5 6.5 6.5 17.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Pill button. On hover it grows a little on a spring and settles, the other colour
 * fades in and the label rolls up once; the arrow nudges. Calm: only the colour.
 * Optional magnetic pull.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "solid",
    size = "md",
    icon,
    iconPosition = "end",
    magnetic = false,
    roll = true,
    block = false,
    align = "center",
    state: stateProp,
    successLabel,
    errorLabel = "Try again",
    loadingLabel,
    className,
    children,
    ...rest
  },
  forwarded,
) {
  const ref = useMagnetic<HTMLButtonElement>(0.25, magnetic);
  useImperativeHandle(forwarded, () => ref.current as HTMLButtonElement);
  const sound = useSound();
  const { onPointerDown } = rest;
  // a submit button inside a FormStack takes the stack's state
  const stack = useStack();
  const state: StackState = stateProp ?? (stack && rest.type === "submit" ? stack.state : "idle");

  // sound and the "no" shake on the rising edge of a state
  const was = useRef<StackState>(state);
  useEffect(() => {
    if (state !== was.current) {
      if (state === "success") sound.play("success");
      if (state === "error") sound.play("error");
    }
    was.current = state;
  }, [state, sound]);

  const iconNode = icon === true ? <Arrow /> : icon;
  const hasIcon = iconNode != null && state === "idle";
  // one line rolling as a whole (no per-letter ripple): the simple version of the roll
  const idleLabel = typeof children === "string" && roll ? <RollText stagger={0}>{children}</RollText> : <span>{children}</span>;
  const label =
    state === "idle" ? (
      idleLabel
    ) : (
      // keyed by state so each new label rolls up into place
      <span key={state} className="inline-flex items-center gap-[0.5em] animate-label-in calm:animate-none">
        {state === "loading" && (loadingLabel ?? <Dots />)}
        {state === "success" && (
          <>
            <Check />
            {successLabel}
          </>
        )}
        {state === "error" && errorLabel}
      </span>
    );

  /* The pill-shaped layers inside the button (hover fill, loading stripes).
     Inside a FormStack the pill we see is the stack's paint blob, and
     hovering or focusing it swells that blob by 1.012 × 1.02 (focus
     1.035 × 1.08 — keep in step with FormStack's blobStyle); the layers
     swell with it on the same spring, or the rim would come out ~3px at the
     round ends and ~1px at the top and bottom. And the goo's threshold
     (blur 9, alpha × 22 − 9) lays a straight edge ~2px outside the geometry
     but a round end only ~1px, so in a stack the layers are also 1px taller
     each way: 2.5px of rim all round. */
  const layer = cn(
    // inside the 1.5px border, so its corners are the button's less the border: concentric
    "absolute -z-1 inset-x-0 rounded-[max(0px,calc(var(--rap-radius-pill)-1.5px))] pointer-events-none",
    stack ? "-inset-y-px group-hover/btn:[scale:1.012_1.02] group-focus/btn:[scale:1.035_1.08]" : "inset-y-0",
  );

  return (
    <button
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-state={state}
      aria-busy={state === "loading" || undefined}
      className={cn(
        buttonVariants({ variant, size, hasIcon, iconStart: hasIcon && iconPosition === "start", block, align }),
        // states repaint the pill through the same custom properties the variants use
        state === "loading" && "pointer-events-none",
        state === "success" && "[--btn-bg:var(--rap-success)] [--btn-fg:#fff] [--btn-blob:var(--rap-success)] [--btn-blob-fg:#fff] fun:animate-splat",
        state === "error" && "[--btn-bg:var(--rap-danger)] [--btn-fg:#fff] [--btn-blob:var(--rap-danger)] [--btn-blob-fg:#fff] fun:animate-shake",
        // in a FormStack the stack's blob is the pill we see: the button itself must not grow
        stack && "fun:hover:scale-100",
        className,
      )}
      {...rest}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        sound.play("tap");
      }}
    >
      {/* the hover fill: a concentric pill inside the border that simply fades
          in — one colour change, no flood. (In a stack it swells with the blob.) */}
      <span
        aria-hidden
        data-slot="button-fill"
        className={cn(
          layer,
          "bg-(--btn-blob) opacity-0 group-hover/btn:opacity-100",
          "[transition:opacity_var(--rap-dur-fast)_var(--rap-ease-out),scale_420ms_var(--rap-swell-ease,var(--rap-ease-spring))]",
          "calm:[transition:opacity_var(--rap-dur-fast)_var(--rap-ease-out),scale_420ms_var(--rap-ease-out)]",
        )}
      />
      {/* loading: diagonal stripes run across the pill, a barber pole for
          "working". They sit on exactly the fill's geometry — same box, same
          swell in a stack — so they too are a concentric pill with one inset
          all round. (They were a plain inset-0 box: in a stack, pressing the
          button focuses it and its blob swells 1.035 × 1.08, which left the
          stripes ~11px short of the round ends but only ~4.5px short of the
          top and bottom.) The layer is always in the tree and only shown
          while loading: mounted on the press it appeared already swollen
          while the blob was still springing up to its focus swell, and
          poked ~9px past the round ends for the first frames. */}
      <span
        aria-hidden
        data-slot="button-stripes"
        className={cn(
          layer,
          "overflow-hidden [transition:scale_420ms_var(--rap-swell-ease,var(--rap-ease-spring))]",
          state === "loading"
            ? "bg-[repeating-linear-gradient(-45deg,transparent_0_14px,color-mix(in_srgb,var(--btn-fg)_16%,transparent)_14px_28px)] [background-size:40px_40px] fun:animate-stripes"
            : "invisible",
        )}
      />
      {label}
      {hasIcon && (
        <span
          data-slot="button-icon"
          className={cn(
            /* concentric with the button: the bubble sits 14% of the height in from the
               edge, so its radius is the button's less that inset (a circle when the
               preset's pill is round, a matching softer square when it is not) */
            "relative grid place-items-center size-[calc(var(--btn-h)*0.72)] overflow-hidden",
            "rounded-[max(2px,calc(min(var(--rap-radius-pill),var(--btn-h)/2)-var(--btn-h)*0.14))]",
            "bg-(--btn-icon-bg) text-(--btn-icon-fg) text-[calc(var(--btn-fs)*1.05)]",
            "transition-[background-color,color] duration-(--rap-dur-fast) ease-out",
            // the bubble swaps colours with the pill; it does not grow on its own
            "group-hover/btn:bg-(--btn-blob-fg) group-hover/btn:text-(--btn-blob)",
            variant === "ghost" && "w-auto group-hover/btn:bg-transparent group-hover/btn:text-current",
          )}
        >
          {/* the default arrow nudges a hair toward where it points; any other icon holds still */}
          <span
            className={cn(
              "grid place-items-center",
              icon === true && "transition-[translate] duration-300 ease-out fun:group-hover/btn:translate-x-[0.1em] fun:group-hover/btn:-translate-y-[0.1em]",
            )}
          >
            {iconNode}
          </span>
        </span>
      )}
    </button>
  );
});

const circleVariants = cva(
  [
    "group/cbtn relative isolate grid place-items-center overflow-hidden rounded-full p-4 cursor-pointer",
    "border-[1.5px] border-transparent bg-(--c-bg) text-(--c-fg)",
    "font-display-ui font-medium text-base leading-none tracking-[-0.03em] text-center",
    /* the same hover as Button: a springy grow that settles, the colour fades in, the arrow nudges */
    "[transition:color_var(--rap-dur-fast)_var(--rap-ease-out),scale_460ms_var(--rap-ease-spring)] hover:text-(--c-fill-fg)",
    "fun:hover:scale-105 fun:active:scale-96 active:scale-96 calm:active:scale-98",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring",
  ],
  {
    variants: {
      variant: {
        accent: "[--c-bg:var(--rap-accent)] [--c-fg:var(--rap-accent-ink)] [--c-fill:var(--rap-ink)] [--c-fill-fg:var(--rap-paper)]",
        blue: "[--c-bg:var(--rap-blue)] [--c-fg:#fff] [--c-fill:var(--rap-ink)] [--c-fill-fg:var(--rap-paper)]",
        ink: "[--c-bg:var(--rap-ink)] [--c-fg:var(--rap-paper)] [--c-fill:var(--rap-accent)] [--c-fill-fg:var(--rap-accent-ink)]",
        acid: "[--c-bg:var(--rap-acid)] [--c-fg:#282828] [--c-fill:var(--rap-ink)] [--c-fill-fg:var(--rap-paper)]",
        outline: "[--c-bg:transparent] [--c-fg:var(--rap-ink)] [--c-fill:var(--rap-ink)] [--c-fill-fg:var(--rap-paper)] border-ink",
      },
    },
    defaultVariants: { variant: "accent" },
  },
);

export interface CircleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number | string;
  variant?: "accent" | "blue" | "ink" | "acid" | "outline";
}

/** Big round call-to-action — text around, arrow in the middle. On hover it grows a little and the other colour fades in. */
export function CircleButton({ size = 160, variant = "accent", className, children, style, ...rest }: CircleButtonProps) {
  const ref = useMagnetic<HTMLButtonElement>(0.4);
  const sound = useSound();
  const { onPointerDown } = rest;
  return (
    <button
      ref={ref}
      data-slot="circle-button"
      className={cn(circleVariants({ variant }), className)}
      style={{ width: size, height: size, ...style }}
      {...rest}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        sound.play("tap", { pitch: 0.8 });
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-1 rounded-full bg-(--c-fill) opacity-0 transition-opacity duration-(--rap-dur-fast) ease-out group-hover/cbtn:opacity-100"
      />
      <span className="grid place-items-center size-full [&>svg]:size-[38%] [&>svg]:transition-[translate] [&>svg]:duration-300 [&>svg]:ease-out fun:group-hover/cbtn:[&>svg]:translate-x-[4%] fun:group-hover/cbtn:[&>svg]:-translate-y-[4%]">
        {children ?? <Arrow />}
      </span>
    </button>
  );
}

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Stack vertically instead of in a row. */
  vertical?: boolean;
  /** Stretch the buttons to share the full width equally. */
  fill?: boolean;
}

/**
 * Buttons packed edge to edge with a 2px seam: a group of actions reads as
 * one object rather than a row of loose pills.
 */
export function ButtonGroup({ vertical = false, fill = false, className, ...rest }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "inline-flex flex-wrap items-center gap-tight",
        vertical && "flex-col items-stretch",
        fill && "flex *:flex-1",
        className,
      )}
      {...rest}
    />
  );
}
