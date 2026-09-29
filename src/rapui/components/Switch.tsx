import { useId, useState, type ReactNode } from "react";
import { cx } from "../utils";
import { useSound } from "../sound";
import "./Switch.css";

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

  return (
    <span className={cx("rap-switch", `rap-switch--${size}`, isOn && "is-on", disabled && "is-disabled", className)}>
      <button type="button" role="switch" id={id} aria-checked={isOn} disabled={disabled} className="rap-switch__track" onClick={toggle}>
        <span className="rap-switch__text rap-switch__text--on" aria-hidden>{onText}</span>
        <span className="rap-switch__text rap-switch__text--off" aria-hidden>{offText}</span>
        <span className="rap-switch__knob" aria-hidden />
      </button>
      {label && (
        <label htmlFor={id} className="rap-switch__label">
          {label}
        </label>
      )}
    </span>
  );
}
