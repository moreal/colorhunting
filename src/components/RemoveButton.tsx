import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type RemoveButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  label?: string;
};

export function RemoveButton({
  className,
  label = "Remove image",
  ...buttonProps
}: RemoveButtonProps) {
  return (
    <button
      aria-label={label}
      className={classNames("ds-text-button", className)}
      data-variant="danger"
      type="button"
      {...buttonProps}
    >
      Remove
    </button>
  );
}
