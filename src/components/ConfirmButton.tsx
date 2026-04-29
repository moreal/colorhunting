import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { classNames } from "./classNames";

type ConfirmButtonStyle = CSSProperties & {
  "--ds-confirm-button-background": string;
};

export type ConfirmButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "color" | "type"
> & {
  color?: string;
  label?: string;
};

export function ConfirmButton({
  className,
  color = "#EF4B4B",
  label = "Confirm",
  style,
  ...buttonProps
}: ConfirmButtonProps) {
  const buttonStyle: ConfirmButtonStyle = {
    ...style,
    "--ds-confirm-button-background": color,
  };

  return (
    <button
      className={classNames("ds-action-button", "ds-confirm-button", className)}
      style={buttonStyle}
      type="button"
      {...buttonProps}
    >
      <span className="ds-action-button-label">{label}</span>
      <span aria-hidden="true" className="ds-action-button-icon" />
    </button>
  );
}
