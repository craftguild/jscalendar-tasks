import type { ChangeEventHandler, ReactNode } from "react";
import { HiCheck } from "react-icons/hi";
import {
  getButtonClassName,
  type ButtonFontWeight,
  type ButtonSize,
} from "@/components/Button";

type RadioButtonProps = {
  name: string;
  checked: boolean;
  label: ReactNode;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  size?: ButtonSize;
  fontWeight?: ButtonFontWeight;
};

/**
 * Renders a radio input using the shared button visual treatment.
 */
export default function RadioButton({
  name,
  checked,
  label,
  onChange,
  disabled,
  size = "compact",
  fontWeight,
}: RadioButtonProps) {
  return (
    <label>
      <input
        type="radio"
        name={name}
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span
        className={getButtonClassName({
          variant: checked ? "accentSoft" : "surface",
          size,
          fontWeight,
        })}
      >
        {checked ? (
          <HiCheck className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        {label}
      </span>
    </label>
  );
}
