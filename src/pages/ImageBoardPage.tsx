import { useCallback, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AppState, BoardSlot, ColorDeterminedAppState } from "../domain/appState";
import { composeBoardImage } from "../domain/boardExport";
import { BOARD_IMAGE_FILE_ACCEPT, createBoardImageFromFile } from "../domain/boardImages";
import { DownloadBottomSheet, ImageBoard, InfoButton, Logo } from "../components";
import {
  useImageBoardController,
  type BoardExportDescriptor,
  type CreateImageFromFile,
  type ExportBoardImage,
  type SaveBoardState,
  type TriggerBoardDownload,
} from "../hooks/useImageBoardController";
import { ColorHuntingInfoPopup } from "./ColorHuntingInfoPopup";
import "../designSystem/styles.css";
import "./ImageBoardPage.css";

export type {
  BoardExportDescriptor,
  CreateImageFromFile,
  ExportBoardImage,
  SaveBoardState,
  TriggerBoardDownload,
} from "../hooks/useImageBoardController";

export type ImageBoardPageProps = {
  createImageFromFile?: CreateImageFromFile;
  exportBoardImage?: ExportBoardImage;
  onBoardChange?: (state: ColorDeterminedAppState) => void;
  onResetFlow?: (state: ColorDeterminedAppState) => void;
  saveBoardState?: SaveBoardState;
  state: AppState;
  triggerDownload?: TriggerBoardDownload;
};

export function ImageBoardPage({
  createImageFromFile = (file) => createBoardImageFromFile(file),
  exportBoardImage = defaultExportBoardImage,
  onBoardChange,
  onResetFlow,
  saveBoardState = noopSaveBoardState,
  state,
  triggerDownload = triggerBoardDownload,
}: ImageBoardPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    boardError,
    closeInfo,
    colorLabel,
    currentState,
    downloadBoard,
    downloadSheetState,
    downloadStatus,
    isBoardBusy,
    isInfoOpen,
    isSavingBoard,
    openInfo,
    reorderImages,
    removeSelectedImage,
    selectImage,
    themeTextColor,
  } = useImageBoardController({
    createImageFromFile,
    exportBoardImage,
    onBoardChange,
    saveBoardState,
    state,
    triggerDownload,
  });

  const handleLogoClick = useCallback(() => {
    if (onResetFlow === undefined || currentState === null) {
      return;
    }

    onResetFlow(currentState);
  }, [currentState, onResetFlow]);

  if (currentState === null) {
    return null;
  }

  const pageStyle: ImageBoardPageStyle = {
    "--image-board-theme-color": currentState.color.hex,
    "--image-board-theme-text-color": themeTextColor,
  };

  return (
    <main
      aria-labelledby="image-board-title"
      className="ds-mobile-app-page image-board-page"
      style={pageStyle}
    >
      <section className="ds-mobile-app-frame image-board-shell">
        <header className="image-board-header">
          <Logo
            as="button"
            aria-label="Choose current color again"
            className="image-board-logo"
            onClick={handleLogoClick}
          />
          <h1 className="image-board-title" id="image-board-title">
            {colorLabel}
          </h1>
          <InfoButton
            className="image-board-info-button"
            label="컬러헌팅 정보 열기"
            onClick={openInfo}
          />
        </header>

        <div className="image-board-content">
          <ImageBoard
            accept={BOARD_IMAGE_FILE_ACCEPT}
            className="image-board-grid"
            disabled={isBoardBusy}
            images={currentState.images}
            onImageSelect={(slotIndex, file) => void selectImage(slotIndex, file)}
            onRemoveImage={(slotIndex) => void removeSelectedImage(slotIndex)}
            onReorderImages={reorderImages}
            variant="poster"
          />
          {boardError ? (
            <p className="image-board-error" role="alert">
              {boardError}
            </p>
          ) : null}
        </div>

        <footer className="image-board-footer">
          <motion.div
            animate={{ opacity: downloadStatus === "loading" ? 0.72 : 1, y: 0 }}
            className="image-board-download-motion"
            initial={false}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <DownloadBottomSheet
              buttonProps={{
                "aria-label":
                  downloadStatus === "loading" ? "보드 이미지 다운로드 준비 중" : "DOWNLOAD",
                onClick: () => void downloadBoard(),
                status: downloadStatus === "loading" ? "loading" : "idle",
              }}
              disabled={isSavingBoard}
              state={downloadSheetState}
            />
          </motion.div>
        </footer>
      </section>

      <ColorHuntingInfoPopup onClose={closeInfo} open={isInfoOpen} />
    </main>
  );
}

type ImageBoardPageStyle = CSSProperties & {
  "--image-board-theme-color": string;
  "--image-board-theme-text-color": string;
};

async function defaultExportBoardImage(
  images: readonly BoardSlot[],
  _descriptor: BoardExportDescriptor,
): Promise<Blob> {
  return await composeBoardImage(images);
}

function triggerBoardDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = objectUrl;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function noopSaveBoardState() {}
