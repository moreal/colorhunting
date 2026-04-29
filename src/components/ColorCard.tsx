import { motion } from "motion/react";
import type { Color } from "../appState";
import { classNames } from "./classNames";

export type ColorCardStatus = "available" | "loading" | "selected";

export type ColorCardProps = {
  className?: string;
  color: Color;
  description?: string;
  status?: ColorCardStatus;
  title?: string;
};

const COLOR_CARD_STATUS_LABELS: Record<ColorCardStatus, string> = {
  available: "Ready",
  loading: "Updating",
  selected: "Selected",
};

export function ColorCard({
  className,
  color,
  description,
  status = "available",
  title = "Theme color",
}: ColorCardProps) {
  return (
    <motion.article
      animate={{ opacity: status === "loading" ? 0.72 : 1 }}
      aria-label={`${title} ${color.hex}`}
      className={classNames("ds-color-card", className)}
      data-status={status}
      initial={false}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
    >
      <div
        aria-hidden="true"
        className="ds-color-card-preview"
        style={{ backgroundColor: color.hex }}
      />
      <div className="ds-color-card-body">
        <p className="ds-color-card-title">{title}</p>
        <code className="ds-color-card-code">{color.hex}</code>
        <span className="ds-status-label">{COLOR_CARD_STATUS_LABELS[status]}</span>
        {description ? <p className="ds-color-card-description">{description}</p> : null}
      </div>
    </motion.article>
  );
}
