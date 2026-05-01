import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";
import { DownloadButton, type DownloadButtonProps } from "./DownloadButton";
import { RemoveButtonIcon } from "./RemoveButton";

export type DownloadBottomSheetState = "DOWNLOAD_COMPLETED" | "ENOUGH_IMAGES" | "NON_ENOUGH_IMAGES";
export type DownloadBottomSheetMode = "download" | "remove";

export type DownloadBottomSheetProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  buttonProps?: Omit<DownloadButtonProps, "disabled" | "fullWidth">;
  disabled?: boolean;
  mode?: DownloadBottomSheetMode;
  removeTargetActive?: boolean;
  state: DownloadBottomSheetState;
};

const DOWNLOAD_BOTTOM_SHEET_CONFIG: Record<
  DownloadBottomSheetState,
  {
    disabled: boolean;
    message: string | null;
  }
> = {
  DOWNLOAD_COMPLETED: {
    disabled: false,
    message: "다운로드 완료했어요!",
  },
  ENOUGH_IMAGES: {
    disabled: false,
    message: null,
  },
  NON_ENOUGH_IMAGES: {
    disabled: true,
    message: "아직 비어있어요...",
  },
};

export function DownloadBottomSheet({
  buttonProps,
  className,
  disabled = false,
  mode = "download",
  removeTargetActive = false,
  state,
  ...sheetProps
}: DownloadBottomSheetProps) {
  const stateConfig = DOWNLOAD_BOTTOM_SHEET_CONFIG[state];
  const isDisabled = disabled || stateConfig.disabled;

  if (mode === "remove") {
    return (
      <div
        className={classNames("ds-download-bottom-sheet", className)}
        data-mode="remove"
        data-remove-target={removeTargetActive ? "active" : "idle"}
        data-state={state}
        {...sheetProps}
      >
        <div className="ds-download-bottom-sheet-remove-target">
          <span
            aria-hidden="true"
            className="ds-download-bottom-sheet-remove-icon ds-remove-button"
            data-size="default"
            data-state={removeTargetActive ? "pressed" : "enabled"}
          >
            <RemoveButtonIcon />
          </span>
          <p aria-live="polite" className="ds-download-bottom-sheet-message" role="status">
            삭제하려면 끌어다 놓으세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames("ds-download-bottom-sheet", className)}
      data-mode="download"
      data-state={state}
      {...sheetProps}
    >
      <DownloadButton {...buttonProps} disabled={isDisabled} fullWidth />
      <p aria-live="polite" className="ds-download-bottom-sheet-message" role="status">
        {stateConfig.message ?? ""}
      </p>
    </div>
  );
}
