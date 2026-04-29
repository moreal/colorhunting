import { classNames } from "./classNames";
import logoUrl from "../logo.svg";

export type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <a aria-label="Colorhunting home" className={classNames("ds-logo", className)} href="/">
      <img alt="" aria-hidden="true" className="ds-logo-image" src={logoUrl} />
      <span className="ds-visually-hidden">Colorhunting</span>
    </a>
  );
}
