import { useId, useState, type ReactNode } from "react";
import { cn } from "../utils";
import { useSound } from "../sound";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  size?: "md" | "lg";
  /** Tiny words shown inside the track. */
  onText?: string;
  offText?: string;
  className?: string;
}

/** Chunky switch with a springy knob that squishes while it travels. */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  disabled,
  size = "md",
  onText = "on",
  offText = "off",
  className,
}: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const isOn = checked ?? inner;
  const id = useId();
  const sound = useSound();

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    sound.play(next ? "toggleOn" : "toggleOff");
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };

  /* --sw-h / --sw-w / --sw-pad size everything (hosts may override them on the
     root). The knob squishes while pressed: it widens to 1.45 of its height, and
     when on it grows leftwards so its right edge stays put. */
  return (
    <span
      data-slot="switch"
      data-size={size}
      data-state={isOn ? "checked" : "unchecked"}
      className={cn(
        // rap-switch: a stable marker the docs/site CSS still sizes the switch through
        "rap-switch inline-flex items-center gap-[0.9rem]",
        size === "md" && "[--sw-h:2.25rem] [--sw-w:4.5rem] [--sw-pad:4px]",
        size === "lg" && "[--sw-h:3.25rem] [--sw-w:6.5rem] [--sw-pad:5px]",
        disabled && "opacity-40",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={isOn}
        disabled={disabled}
        data-slot="switch-track"
        className={cn(
          "group/track relative w-(--sw-w) h-(--sw-h) p-0 border-[1.5px] border-solid border-ink rounded-pill bg-transparent cursor-pointer overflow-hidden",
          "[transition:background_var(--rap-dur)_var(--rap-ease-out),border-color_var(--rap-dur)]",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
          isOn && "bg-blue border-blue",
        )}
        onClick={toggle}
      >
        <span data-slot="switch-text" className={cn(switchText, "left-[0.7em] text-white", !isOn && "opacity-0")} aria-hidden>
          {onText}
        </span>
        <span data-slot="switch-text" className={cn(switchText, "right-[0.7em] text-ink", isOn && "opacity-0")} aria-hidden>
          {offText}
        </span>
        <span
          data-slot="switch-knob"
          className={cn(
            "absolute top-(--sw-pad) left-(--sw-pad) h-[calc(var(--sw-h)-var(--sw-pad)*2-3px)] aspect-square rounded-pill bg-ink",
            "[transition:left_var(--rap-dur)_var(--rap-ease-spring),width_var(--rap-dur-fast)_var(--rap-ease-out),background_var(--rap-dur)]",
            "group-active/track:aspect-[1.45]",
            isOn && "left-[calc(100%-var(--sw-h)+var(--sw-pad)+1.5px)] bg-white group-active/track:left-[calc(100%-var(--sw-h)*1.45+var(--sw-pad)*2)]",
          )}
          aria-hidden
        />
      </button>
      {label && (
        <label htmlFor={id} data-slot="switch-label" className="font-medium cursor-pointer">
          {label}
        </label>
      )}
    </span>
  );
}

const switchText =
  "absolute top-1/2 -translate-y-1/2 font-sans text-[length:calc(var(--sw-h)*0.3)] font-semibold uppercase [transition:opacity_var(--rap-dur-fast)]";
