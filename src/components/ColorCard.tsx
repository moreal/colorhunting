import type { CSSProperties } from "react";
import type { Color } from "../domain/appState";
import { classNames } from "./classNames";

export type ColorCardProps = {
  className?: string;
  color: Color;
  title?: string;
};

export function ColorCard({ className, color, title = "Theme color" }: ColorCardProps) {
  const cardStyle: CSSProperties & Record<"--ds-color-card-color", string> = {
    "--ds-color-card-color": color.hex,
  };

  return (
    <div className={classNames("ds-color-card-root", className)} style={cardStyle}>
      <span aria-hidden="true" className="ds-color-card-glow" />
      <article aria-label={`${title} ${color.hex}`} className="ds-color-card">
        <div aria-hidden="true" className="ds-color-card-preview" />
        <div className="ds-color-card-body">
          <p className="ds-color-card-title">{title}</p>
        </div>
      </article>
    </div>
  );
}
