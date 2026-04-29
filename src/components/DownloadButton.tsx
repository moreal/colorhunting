import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./classNames";

export type DownloadButtonStatus = "idle" | "loading";

export type DownloadButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  fullWidth?: boolean;
  label?: string;
  status?: DownloadButtonStatus;
};

export function DownloadButton({
  "aria-label": ariaLabel,
  className,
  disabled = false,
  fullWidth = false,
  label = "DOWNLOAD",
  status = "idle",
  ...buttonProps
}: DownloadButtonProps) {
  const isBusy = status === "loading";
  const isDisabled = disabled || isBusy;

  return (
    <button
      aria-busy={isBusy ? "true" : undefined}
      aria-label={ariaLabel ?? (isBusy ? "Preparing download" : undefined)}
      className={classNames("ds-download-button", "ds-pixel-corner", className)}
      data-state={isDisabled ? "disabled" : "enabled"}
      data-status={status}
      data-width={fullWidth ? "full" : undefined}
      disabled={isDisabled}
      type="button"
      {...buttonProps}
    >
      <span className="ds-download-button-label">{label}</span>
      <svg
        aria-hidden="true"
        className="ds-download-button-icon"
        fill="none"
        height="14"
        viewBox="0 0 12 14"
        width="12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 14H0V12H12V14ZM10 7H9V8H8V9H7V10H5V9H4V8H3V7H2V5H4V0H8V5H10V7Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
