import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type ResetButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  label?: string;
};

export function ResetButton({ className, label = "Reset", ...buttonProps }: ResetButtonProps) {
  return (
    <button
      className={classNames("ds-action-button", "ds-reset-button", className)}
      type="button"
      {...buttonProps}
    >
      <span className="ds-action-button-label">{label}</span>
      <span aria-hidden="true" className="ds-action-button-icon" />
    </button>
  );
}
