import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./RadioGroup.css";

type RadioVariant = "default" | "card";
type RadioSize = "sm" | "md" | "lg";
const RadioCtx = createContext<{ variant: RadioVariant; size: RadioSize }>({ variant: "default", size: "md" });

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** `default` — dots with a label beside; `card` — each option is a filled tile. */
  variant?: RadioVariant;
  size?: RadioSize;
}

/**
 * One choice from a short list (Radix RadioGroup). Round 22px dots that fill
 * blue with a popping white centre, or `variant="card"` tiles with a blue ring.
 */
export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(function RadioGroup(
  { className, variant = "default", size = "md", ...rest },
  ref,
) {
  return (
    <RadioCtx.Provider value={{ variant, size }}>
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cx("rap-radio-group", `rap-radio-group--${variant}`, className)}
        {...rest}
      />
    </RadioCtx.Provider>
  );
});

export interface RadioGroupItemProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Card variant: the option's title. In the default variant, wrap the item with a `Label` instead. */
  label?: ReactNode;
  /** Card variant: a line of secondary text under the label. */
  description?: ReactNode;
}

export const RadioGroupItem = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  function RadioGroupItem({ className, label, description, children, ...rest }, ref) {
    const { variant, size } = useContext(RadioCtx);
    const dot = (
      <span className={cx("rap-radio", `rap-radio--${size}`)} aria-hidden>
        <RadioGroupPrimitive.Indicator className="rap-radio__dot" />
      </span>
    );
    if (variant === "card") {
      return (
        <RadioGroupPrimitive.Item ref={ref} className={cx("rap-radio-card", className)} {...rest}>
          <span className="rap-radio-card__text">
            {label != null && <span className="rap-radio-card__label">{label}</span>}
            {description != null && <span className="rap-radio-card__desc">{description}</span>}
            {children}
          </span>
          {dot}
        </RadioGroupPrimitive.Item>
      );
    }
    return (
      <RadioGroupPrimitive.Item ref={ref} className={cx("rap-radio-item", `rap-radio-item--${size}`, className)} {...rest}>
        <RadioGroupPrimitive.Indicator className="rap-radio-item__dot" />
      </RadioGroupPrimitive.Item>
    );
  },
);
