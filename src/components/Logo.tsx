import { classNames } from "./classNames";

export type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <a aria-label="Colorhunting home" className={classNames("ds-logo", className)} href="/">
      <span aria-hidden="true" className="ds-logo-mark">
        CH
      </span>
      <span>Colorhunting</span>
    </a>
  );
}
