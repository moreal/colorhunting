import { classNames } from "./classNames";
import logoUrl from "../logo.svg";
import type { AnchorHTMLAttributes } from "react";

export type LogoProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function Logo({ "aria-label": ariaLabel, className, href = "/", ...linkProps }: LogoProps) {
  return (
    <a
      aria-label={ariaLabel ?? "Colorhunting home"}
      className={classNames("ds-logo", className)}
      href={href}
      {...linkProps}
    >
      <img alt="" aria-hidden="true" className="ds-logo-image" src={logoUrl} />
      <span className="ds-visually-hidden">Colorhunting</span>
    </a>
  );
}
