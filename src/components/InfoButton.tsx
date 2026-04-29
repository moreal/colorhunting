import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";
import infoIconUrl from "../info.svg";

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
      <img alt="" aria-hidden="true" className="ds-icon-button-image" src={infoIconUrl} />
    </button>
  );
}
