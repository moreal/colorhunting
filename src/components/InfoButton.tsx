import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type InfoButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
  label?: string;
};

export function InfoButton({
  className,
  label = "Open information",
  ...buttonProps
}: InfoButtonProps) {
  return (
    <button
      aria-label={label}
      className={classNames("ds-icon-button", className)}
      type="button"
      {...buttonProps}
    >
      <span aria-hidden="true">i</span>
    </button>
  );
}
