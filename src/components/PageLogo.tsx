import { classNames } from "./classNames";
import { Logo, type LogoProps } from "./Logo";

export type PageLogoProps = LogoProps;

export function PageLogo(props: PageLogoProps) {
  return <Logo {...props} className={classNames("ds-page-logo", props.className)} />;
}
