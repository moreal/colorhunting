import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes } from "react";
import { classNames } from "./classNames";
import logoUrl from "../logo.svg";

type LinkLogoProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  as?: "link";
  inert?: false;
};

type ButtonLogoProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
  as: "button";
  inert?: false;
};

type InertLogoProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  inert: true;
};

export type LogoProps = ButtonLogoProps | InertLogoProps | LinkLogoProps;

export function Logo(props: LogoProps) {
  const { "aria-label": ariaLabel, className } = props;
  const logoClassName = classNames("ds-logo", className);
  const logoContent = (
    <>
      <img alt="" aria-hidden="true" className="ds-logo-image" src={logoUrl} />
      <span className="ds-visually-hidden">Colorhunting</span>
    </>
  );

  if (isInertLogoProps(props)) {
    const { "aria-label": _ariaLabel, className: _className, inert: _inert, ...spanProps } = props;

    return (
      <span {...spanProps} aria-hidden="true" className={logoClassName}>
        {logoContent}
      </span>
    );
  }

  if (isButtonLogoProps(props)) {
    const {
      "aria-label": _ariaLabel,
      as: _as,
      className: _className,
      inert: _inert,
      ...buttonProps
    } = props;

    return (
      <button
        aria-label={ariaLabel ?? "Colorhunting"}
        className={logoClassName}
        type="button"
        {...buttonProps}
      >
        {logoContent}
      </button>
    );
  }

  const {
    "aria-label": _ariaLabel,
    as: _as,
    className: _className,
    href = "/",
    inert: _inert,
    ...linkProps
  } = props;

  return (
    <a
      aria-label={ariaLabel ?? "Colorhunting home"}
      className={logoClassName}
      href={href}
      {...linkProps}
    >
      {logoContent}
    </a>
  );
}

function isButtonLogoProps(props: LogoProps): props is ButtonLogoProps {
  return "as" in props && props.as === "button";
}

function isInertLogoProps(props: LogoProps): props is InertLogoProps {
  return props.inert === true;
}
