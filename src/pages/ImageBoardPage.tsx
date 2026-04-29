import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { motion } from "motion/react";
import {
  addImage,
  removeImage,
  type AppState,
  type BoardSlot,
  type ColorDeterminedAppState,
  type Image,
} from "../appState";
import { saveAppState } from "../appStorage";
import { composeBoardImage } from "../boardExport";
import { BOARD_IMAGE_FILE_ACCEPT, createBoardImageFromFile } from "../boardImages";
import {
  DownloadBottomSheet,
  ImageBoard,
  InfoButton,
  InfoPopup,
  Logo,
  type DownloadBottomSheetState,
} from "../components";
import { getReadableTextColor, normalizeHexColor } from "../color";
import { designTokens } from "../designSystem/tokens";
import "../designSystem/styles.css";
import "./ImageBoardPage.css";

export type CreateImageFromFile = (file: File, slotIndex: number) => Promise<Image>;
export type SaveBoardState = (state: ColorDeterminedAppState) => Promise<void> | void;
export type BoardExportDescriptor = {
  color: string;
  colorLabel: string;
};
export type ExportBoardImage = (
  images: readonly BoardSlot[],
  descriptor: BoardExportDescriptor,
) => Promise<Blob>;
export type TriggerBoardDownload = (blob: Blob, fileName: string) => void;

export type ImageBoardPageProps = {
  createImageFromFile?: CreateImageFromFile;
  exportBoardImage?: ExportBoardImage;
  onBoardChange?: (state: ColorDeterminedAppState) => void;
  onResetFlow?: () => void;
  saveBoardState?: SaveBoardState;
  state: AppState;
  triggerDownload?: TriggerBoardDownload;
};

const COLOR_LABELS_BY_HEX = createColorLabelsByHex();

export function ImageBoardPage({
  createImageFromFile = (file) => createBoardImageFromFile(file),
  exportBoardImage = defaultExportBoardImage,
  onBoardChange,
  onResetFlow,
  saveBoardState = saveAppState,
  state,
  triggerDownload = triggerBoardDownload,
}: ImageBoardPageProps) {
  const [currentState, setCurrentState] = useState<ColorDeterminedAppState | null>(() =>
    getColorDeterminedState(state),
  );
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"completed" | "idle" | "loading">("idle");
  const [boardError, setBoardError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentState(getColorDeterminedState(state));
    setDownloadStatus("idle");
    setBoardError(null);
  }, [state]);

  const colorLabel = useMemo(
    () => getColorLabel(currentState?.color.hex),
    [currentState?.color.hex],
  );
  const themeTextColor = useMemo(
    () => getReadableTextColor(currentState?.color.hex ?? designTokens.color.colorCard.red),
    [currentState?.color.hex],
  );
  const pageStyle = useMemo(
    () =>
      ({
        "--image-board-theme-color": currentState?.color.hex ?? designTokens.color.colorCard.red,
        "--image-board-theme-text-color": themeTextColor,
      }) as CSSProperties,
    [currentState?.color.hex, themeTextColor],
  );

  const filledImageCount = currentState?.images.filter(Boolean).length ?? 0;
  const isBoardBusy = isSavingBoard || downloadStatus === "loading";
  const downloadSheetState = getDownloadSheetState(filledImageCount, downloadStatus);

  const persistNextState = useCallback(
    async (nextState: ColorDeterminedAppState) => {
      await saveBoardState(nextState);
      setCurrentState(nextState);
      onBoardChange?.(nextState);
    },
    [onBoardChange, saveBoardState],
  );

  const handleImageSelect = useCallback(
    async (slotIndex: number, file: File) => {
      if (currentState === null || isBoardBusy) {
        return;
      }

      setIsSavingBoard(true);
      setBoardError(null);

      try {
        const image = await createImageFromFile(file, slotIndex);
        const nextState = addImage(currentState, slotIndex, image);

        if (nextState.state !== "COLOR_DETERMINED") {
          throw new Error("Image slot update did not produce a board state.");
        }

        await persistNextState(nextState);
        setDownloadStatus("idle");
      } catch {
        setBoardError("이미지를 추가하지 못했어요. PNG, JPG, WebP 파일을 사용해주세요.");
      } finally {
        setIsSavingBoard(false);
      }
    },
    [createImageFromFile, currentState, isBoardBusy, persistNextState],
  );

  const handleRemoveImage = useCallback(
    async (slotIndex: number) => {
      if (currentState === null || isBoardBusy) {
        return;
      }

      setIsSavingBoard(true);
      setBoardError(null);

      try {
        const nextState = removeImage(currentState, slotIndex);

        if (nextState.state !== "COLOR_DETERMINED") {
          throw new Error("Image removal did not produce a board state.");
        }

        await persistNextState(nextState);
        setDownloadStatus("idle");
      } catch {
        setBoardError("이미지를 삭제하지 못했어요. 다시 시도해주세요.");
      } finally {
        setIsSavingBoard(false);
      }
    },
    [currentState, isBoardBusy, persistNextState],
  );

  const handleDownload = useCallback(async () => {
    if (currentState === null || filledImageCount === 0 || isBoardBusy) {
      return;
    }

    setDownloadStatus("loading");
    setBoardError(null);

    try {
      const blob = await exportBoardImage(currentState.images, {
        color: currentState.color.hex,
        colorLabel,
      });

      triggerDownload(blob, createBoardDownloadFileName(colorLabel));
      setDownloadStatus("completed");
    } catch {
      setDownloadStatus("idle");
      setBoardError("보드 이미지를 만들지 못했어요. 다시 시도해주세요.");
    }
  }, [colorLabel, currentState, exportBoardImage, filledImageCount, isBoardBusy, triggerDownload]);

  const handleLogoClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (onResetFlow === undefined) {
        return;
      }

      event.preventDefault();
      onResetFlow();
    },
    [onResetFlow],
  );

  if (currentState === null) {
    return null;
  }

  return (
    <main aria-labelledby="image-board-title" className="image-board-page" style={pageStyle}>
      <section className="image-board-shell">
        <header className="image-board-header">
          <Logo className="image-board-logo" onClick={handleLogoClick} />
          <h1 className="image-board-title" id="image-board-title">
            {colorLabel}
          </h1>
          <InfoButton
            className="image-board-info-button"
            label="컬러헌팅 정보 열기"
            onClick={() => setIsInfoOpen(true)}
          />
        </header>

        <div className="image-board-content">
          <ImageBoard
            accept={BOARD_IMAGE_FILE_ACCEPT}
            className="image-board-grid"
            disabled={isBoardBusy}
            images={currentState.images}
            onImageSelect={(slotIndex, file) => void handleImageSelect(slotIndex, file)}
            onRemoveImage={(slotIndex) => void handleRemoveImage(slotIndex)}
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
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <DownloadBottomSheet
              buttonProps={{
                "aria-label":
                  downloadStatus === "loading" ? "보드 이미지 다운로드 준비 중" : "DOWNLOAD",
                onClick: () => void handleDownload(),
                status: downloadStatus === "loading" ? "loading" : "idle",
              }}
              disabled={isSavingBoard}
              state={downloadSheetState}
            />
          </motion.div>
        </footer>
      </section>

      <InfoPopup
        closeLabel="컬러헌팅 정보 닫기"
        onClose={() => setIsInfoOpen(false)}
        open={isInfoOpen}
        title="컬러헌팅(Color Hunting)"
      >
        <div className="image-board-info-content">
          <p>
            특정한 색상을 정해 일상이나 자연 속에서 보물찾기하듯 찾고, 사진으로 기록하며 주변 환경을
            새롭게 관찰하는 활동입니다.
          </p>
          <p>사진은 외부로 업로드되지 않고 사용 중인 기기 안에서만 저장됩니다. 삭제하지 마세요!</p>
        </div>
      </InfoPopup>
    </main>
  );
}

async function defaultExportBoardImage(
  images: readonly BoardSlot[],
  descriptor: BoardExportDescriptor,
): Promise<Blob> {
  return await composeBoardImage(images, descriptor);
}

function getColorDeterminedState(state: AppState): ColorDeterminedAppState | null {
  return state.state === "COLOR_DETERMINED" ? state : null;
}

function getDownloadSheetState(
  filledImageCount: number,
  downloadStatus: "completed" | "idle" | "loading",
): DownloadBottomSheetState {
  if (filledImageCount === 0) {
    return "NON_ENOUGH_IMAGES";
  }

  if (downloadStatus === "completed") {
    return "DOWNLOAD_COMPLETED";
  }

  return "ENOUGH_IMAGES";
}

function getColorLabel(hex: string | undefined): string {
  const normalizedHex = normalizeHexColor(hex ?? "");

  if (normalizedHex === null) {
    return "COLOR";
  }

  return COLOR_LABELS_BY_HEX[normalizedHex] ?? normalizedHex.toUpperCase();
}

function createBoardDownloadFileName(colorLabel: string): string {
  const date = new Date().toISOString().slice(0, 10);

  return `colorhunting-${colorLabel.toLowerCase()}-${date}.png`;
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

function createColorLabelsByHex(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(designTokens.color.colorCard).map(([label, hex]) => [
      hex.toLowerCase(),
      label.toUpperCase(),
    ]),
  );
}
