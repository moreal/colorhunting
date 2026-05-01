import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type RemoveButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  label?: string;
  pressed?: boolean;
  size?: "compact" | "default";
};

export function RemoveButton({
  className,
  disabled = false,
  label = "Remove image",
  pressed = false,
  size = "default",
  ...buttonProps
}: RemoveButtonProps) {
  const state = disabled ? "disabled" : pressed ? "pressed" : "enabled";

  return (
    <button
      aria-label={label}
      className={classNames("ds-remove-button", className)}
      data-size={size}
      data-state={state}
      disabled={disabled}
      type="button"
      {...buttonProps}
    >
      <RemoveButtonIcon />
    </button>
  );
}

export function RemoveButtonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="ds-remove-button-icon"
      fill="none"
      height="24"
      viewBox="0 0 20 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="currentColor" height="3" transform="rotate(180 20 6)" width="20" x="20" y="6" />
      <rect fill="currentColor" height="2" transform="rotate(180 8 3)" width="2" x="8" y="3" />
      <rect fill="currentColor" height="2" transform="rotate(180 14 3)" width="2" x="14" y="3" />
      <rect fill="currentColor" height="2" transform="rotate(180 14 2)" width="8" x="14" y="2" />
      <path d="M7 21H16V24H4V20H3V15H2V11H1V7H16V10H4V11H5V15H6V20H7V21Z" fill="currentColor" />
      <path d="M13 24H16V20H17V15H18V11H19V7H16V11H15V15H14V20H13V24Z" fill="currentColor" />
    </svg>
  );
}
