import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type DownloadButtonStatus = "completed" | "idle" | "loading";

export type DownloadButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  status?: DownloadButtonStatus;
};

const DOWNLOAD_BUTTON_LABELS: Record<DownloadButtonStatus, string> = {
  completed: "Downloaded",
  idle: "Download board",
  loading: "Preparing download",
};

export function DownloadButton({
  className,
  disabled = false,
  status = "idle",
  ...buttonProps
}: DownloadButtonProps) {
  const isBusy = status === "loading";
  const isDisabled = disabled || isBusy;
  const label =
    disabled && status === "idle" ? "Download unavailable" : DOWNLOAD_BUTTON_LABELS[status];

  return (
    <button
      aria-busy={isBusy ? "true" : undefined}
      className={classNames("ds-text-button", "ds-download-button", className)}
      data-status={status}
      data-variant="primary"
      disabled={isDisabled}
      type="button"
      {...buttonProps}
    >
      {label}
    </button>
  );
}
