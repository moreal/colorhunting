import { forwardRef, type ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type CloseButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  label?: string;
};

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(
  { className, label = "Close", ...buttonProps },
  ref,
) {
  return (
    <button
      aria-label={label}
      className={classNames("ds-icon-button", className)}
      ref={ref}
      type="button"
      {...buttonProps}
    >
      <span aria-hidden="true">x</span>
    </button>
  );
});
