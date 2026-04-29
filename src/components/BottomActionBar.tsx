import type { ReactNode } from "react";
import { classNames } from "./classNames";

export type BottomActionBarAlign = "end" | "space-between";

export type BottomActionBarProps = {
  align?: BottomActionBarAlign;
  children: ReactNode;
  className?: string;
  label?: string;
};

export function BottomActionBar({
  align = "space-between",
  children,
  className,
  label = "Page actions",
}: BottomActionBarProps) {
  return (
    <div
      aria-label={label}
      className={classNames("ds-bottom-action-bar", className)}
      data-align={align}
      role="toolbar"
    >
      {children}
    </div>
  );
}
