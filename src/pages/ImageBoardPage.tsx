import { useCallback, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AppState, BoardSlot, ColorDeterminedAppState } from "../domain/appState";
import { composeBoardImage } from "../domain/boardExport";
import { BOARD_IMAGE_FILE_ACCEPT, createBoardImageFromFile } from "../domain/boardImages";
import {
  DownloadBottomSheet,
  ImageBoard,
  InfoButton,
  InfoPopup,
  PageLogo,
  type ImageBoardDragStatus,
} from "../components";
import { designTokens } from "../designSystem/tokens";
import { useBrowserChromeTheme } from "../hooks/useBrowserChromeTheme";
import {
  useImageBoardController,
  type BoardExportDescriptor,
  type CreateImageFromFile,
  type ExportBoardImage,
  type SaveBoardState,
  type TriggerBoardDownload,
} from "../hooks/useImageBoardController";
import { triggerBoardDownload } from "./boardDownload";
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
  const removeDropTargetRef = useRef<HTMLDivElement | null>(null);
  const [imageBoardDragStatus, setImageBoardDragStatus] = useState<ImageBoardDragStatus>({
    active: false,
    overRemoveTarget: false,
  });
  const {
    boardError,
    closeManualDownload,
    closeInfo,
    colorLabel,
    currentState,
    downloadBoard,
    downloadSheetState,
    downloadStatus,
    isBoardBusy,
    isInfoOpen,
    isSavingBoard,
    manualDownload,
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
  useBrowserChromeTheme(currentState?.color.hex ?? null);

  const handleLogoClick = useCallback(() => {
    if (onResetFlow === undefined || currentState === null) {
      return;
    }

    onResetFlow(currentState);
  }, [currentState, onResetFlow]);

  const getRemoveDropTargetRect = useCallback(() => {
    return removeDropTargetRef.current?.getBoundingClientRect() ?? null;
  }, []);

  if (currentState === null) {
    return null;
  }

  const pageStyle: ImageBoardPageStyle = {
    "--ds-mobile-app-page-background": currentState.color.hex,
    "--ds-page-logo-height": designTokens.component.pageLogo.height,
    "--ds-page-logo-width": designTokens.component.pageLogo.width,
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
          <PageLogo
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
            getRemoveDropTargetRect={getRemoveDropTargetRect}
            images={currentState.images}
            onDragStatusChange={setImageBoardDragStatus}
            onImageSelect={(slotIndex, file) => void selectImage(slotIndex, file)}
            onRemoveImage={removeSelectedImage}
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
            ref={removeDropTargetRef}
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
              mode={imageBoardDragStatus.active ? "remove" : "download"}
              removeTargetActive={imageBoardDragStatus.overRemoveTarget}
              state={downloadSheetState}
            />
          </motion.div>
        </footer>
      </section>

      <ColorHuntingInfoPopup onClose={closeInfo} open={isInfoOpen} />
      <BoardManualSaveDialog manualDownload={manualDownload} onClose={closeManualDownload} />
    </main>
  );
}

type BoardManualSaveDialogProps = {
  manualDownload: {
    fileName: string;
    objectUrl: string;
  } | null;
  onClose: () => void;
};

function BoardManualSaveDialog({ manualDownload, onClose }: BoardManualSaveDialogProps) {
  return (
    <InfoPopup
      className="image-board-manual-save-dialog"
      closeLabel="저장 안내 닫기"
      onClose={onClose}
      open={manualDownload !== null}
      title="보드 이미지 저장"
    >
      {manualDownload === null ? null : (
        <div className="image-board-manual-save-content">
          <img
            alt="저장할 보드 이미지"
            className="image-board-manual-save-preview"
            src={manualDownload.objectUrl}
          />
          <p className="image-board-manual-save-message">이미지를 길게 눌러 저장하세요.</p>
          <a
            className="image-board-manual-save-link ds-pixel-corner"
            download={manualDownload.fileName}
            href={manualDownload.objectUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            이미지 열기
          </a>
        </div>
      )}
    </InfoPopup>
  );
}

type ImageBoardPageStyle = CSSProperties & {
  "--ds-mobile-app-page-background": string;
  "--ds-page-logo-height": string;
  "--ds-page-logo-width": string;
  "--image-board-theme-color": string;
  "--image-board-theme-text-color": string;
};

async function defaultExportBoardImage(
  images: readonly BoardSlot[],
  _descriptor: BoardExportDescriptor,
): Promise<Blob> {
  return await composeBoardImage(images);
}

async function noopSaveBoardState() {}
