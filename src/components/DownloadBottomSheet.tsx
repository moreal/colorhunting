import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";
import { DownloadButton, type DownloadButtonProps } from "./DownloadButton";

export type DownloadBottomSheetState = "DOWNLOAD_COMPLETED" | "ENOUGH_IMAGES" | "NON_ENOUGH_IMAGES";

export type DownloadBottomSheetProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  buttonProps?: Omit<DownloadButtonProps, "disabled" | "fullWidth">;
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
  state,
  ...sheetProps
}: DownloadBottomSheetProps) {
  const stateConfig = DOWNLOAD_BOTTOM_SHEET_CONFIG[state];

  return (
    <div
      className={classNames("ds-download-bottom-sheet", className)}
      data-state={state}
      {...sheetProps}
    >
      <DownloadButton {...buttonProps} disabled={stateConfig.disabled} fullWidth />
      <p aria-live="polite" className="ds-download-bottom-sheet-message" role="status">
        {stateConfig.message ?? ""}
      </p>
    </div>
  );
}
