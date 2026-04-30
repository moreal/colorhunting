import { forwardRef, type ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";
import closeIconUrl from "../close.svg";

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
      className={classNames("ds-icon-button ds-close-button", className)}
      ref={ref}
      type="button"
      {...buttonProps}
    >
      <img alt="" aria-hidden="true" className="ds-icon-button-image" src={closeIconUrl} />
    </button>
  );
});
