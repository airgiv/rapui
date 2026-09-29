import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Slider.css";

/** Range slider (Radix). One thumb per value — pass two values for a range. */
export const Slider = forwardRef<ElementRef<typeof SliderPrimitive.Root>, ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  function Slider({ className, value, defaultValue, ...rest }, ref) {
    const count = (value ?? defaultValue ?? [0]).length;
    return (
      <SliderPrimitive.Root ref={ref} className={cx("rap-slider", className)} value={value} defaultValue={defaultValue} {...rest}>
        <SliderPrimitive.Track className="rap-slider__track">
          <SliderPrimitive.Range className="rap-slider__range" />
        </SliderPrimitive.Track>
        {Array.from({ length: count }, (_, i) => (
          <SliderPrimitive.Thumb key={i} className="rap-slider__thumb" />
        ))}
      </SliderPrimitive.Root>
    );
  },
);
