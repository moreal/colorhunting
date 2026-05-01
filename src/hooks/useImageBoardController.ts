import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  addImage,
  removeImage,
  reorderBoardImages,
  type AppState,
  type BoardSlot,
  type ColorDeterminedAppState,
  type Image,
} from "../domain/appState";
import {
  COLOR_HUNTING_COLOR_HEX,
  getColorHuntingThemeTextColor,
} from "../domain/colorHuntingTheme";
import { BoardImageFileSizeError, MAX_BOARD_IMAGE_FILE_SIZE_LABEL } from "../domain/boardImages";
import {
  countFilledBoardImages,
  createBoardDownloadFileName,
  getColorDeterminedState,
  getColorLabel,
  getImageBoardDownloadState,
  hasEnoughBoardImages,
  type BoardDownloadStatus,
} from "../domain/imageBoard";

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

export type ImageBoardControllerOptions = {
  createImageFromFile: CreateImageFromFile;
  exportBoardImage: ExportBoardImage;
  onBoardChange?: (state: ColorDeterminedAppState) => void;
  saveBoardState: SaveBoardState;
  state: AppState;
  triggerDownload: TriggerBoardDownload;
};

type ImageBoardInteractionState = {
  boardError: string | null;
  downloadStatus: BoardDownloadStatus;
  isInfoOpen: boolean;
  isSavingBoard: boolean;
};

type ImageBoardAction =
  | { type: "boardStateChanged" }
  | { type: "downloadCompleted" }
  | { type: "downloadFailed"; error: string }
  | { type: "downloadStarted" }
  | { type: "infoClosed" }
  | { type: "infoOpened" }
  | { type: "saveFailed"; error: string }
  | { type: "saveStarted" }
  | { type: "saveSucceeded" };

const ADD_IMAGE_ERROR =
  "이미지를 추가하지 못했어요. PNG, JPG, WebP, HEIF/HEIC 파일을 사용해주세요.";
const ADD_IMAGE_FILE_SIZE_ERROR = `이미지 파일이 너무 커요. ${MAX_BOARD_IMAGE_FILE_SIZE_LABEL} 이하의 이미지를 선택해주세요.`;
const REMOVE_IMAGE_ERROR = "이미지를 삭제하지 못했어요. 다시 시도해주세요.";
const REORDER_IMAGE_ERROR = "이미지 위치를 바꾸지 못했어요. 다시 시도해주세요.";
const DOWNLOAD_ERROR = "보드 이미지를 만들지 못했어요. 다시 시도해주세요.";

const INITIAL_IMAGE_BOARD_INTERACTION_STATE: ImageBoardInteractionState = {
  boardError: null,
  downloadStatus: "idle",
  isInfoOpen: false,
  isSavingBoard: false,
};

export function useImageBoardController({
  createImageFromFile,
  exportBoardImage,
  onBoardChange,
  saveBoardState,
  state,
  triggerDownload,
}: ImageBoardControllerOptions) {
  const currentState = useMemo(() => getColorDeterminedState(state), [state]);
  const [interactionState, dispatch] = useReducer(
    imageBoardInteractionReducer,
    INITIAL_IMAGE_BOARD_INTERACTION_STATE,
  );

  useEffect(() => {
    dispatch({ type: "boardStateChanged" });
  }, [state]);

  const colorLabel = useMemo(
    () => getColorLabel(currentState?.color.hex),
    [currentState?.color.hex],
  );
  const themeTextColor = useMemo(
    () => getColorHuntingThemeTextColor(currentState?.color.hex ?? COLOR_HUNTING_COLOR_HEX.red),
    [currentState?.color.hex],
  );
  const filledImageCount = useMemo(
    () => (currentState === null ? 0 : countFilledBoardImages(currentState.images)),
    [currentState],
  );
  const isBoardBusy =
    interactionState.isSavingBoard || interactionState.downloadStatus === "loading";
  const downloadSheetState = getImageBoardDownloadState(
    filledImageCount,
    interactionState.downloadStatus,
  );

  const persistNextState = useCallback(
    async (nextState: ColorDeterminedAppState) => {
      await saveBoardState(nextState);
      onBoardChange?.(nextState);
    },
    [onBoardChange, saveBoardState],
  );

  const openInfo = useCallback(() => {
    dispatch({ type: "infoOpened" });
  }, []);

  const closeInfo = useCallback(() => {
    dispatch({ type: "infoClosed" });
  }, []);

  const selectImage = useCallback(
    async (slotIndex: number, file: File) => {
      if (currentState === null || isBoardBusy) {
        return;
      }

      dispatch({ type: "saveStarted" });

      try {
        const image = await createImageFromFile(file, slotIndex);
        const nextState = addImage(currentState, slotIndex, image);

        if (nextState.state !== "COLOR_DETERMINED") {
          throw new Error("Image slot update did not produce a board state.");
        }

        await persistNextState(nextState);
        dispatch({ type: "saveSucceeded" });
      } catch (error) {
        dispatch({ error: getAddImageErrorMessage(error), type: "saveFailed" });
      }
    },
    [createImageFromFile, currentState, isBoardBusy, persistNextState],
  );

  const removeSelectedImage = useCallback(
    async (slotIndex: number) => {
      if (currentState === null || isBoardBusy) {
        return false;
      }

      dispatch({ type: "saveStarted" });

      try {
        const nextState = removeImage(currentState, slotIndex);

        if (nextState.state !== "COLOR_DETERMINED") {
          throw new Error("Image removal did not produce a board state.");
        }

        await persistNextState(nextState);
        dispatch({ type: "saveSucceeded" });
        return true;
      } catch {
        dispatch({ error: REMOVE_IMAGE_ERROR, type: "saveFailed" });
        return false;
      }
    },
    [currentState, isBoardBusy, persistNextState],
  );

  const reorderImages = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (
        currentState === null ||
        isBoardBusy ||
        fromIndex === toIndex ||
        currentState.images[fromIndex] === null
      ) {
        return false;
      }

      const nextState = reorderBoardImages(currentState, fromIndex, toIndex);

      if (nextState === currentState || nextState.state !== "COLOR_DETERMINED") {
        return false;
      }

      dispatch({ type: "saveStarted" });

      try {
        await persistNextState(nextState);
        dispatch({ type: "saveSucceeded" });
        return true;
      } catch {
        dispatch({ error: REORDER_IMAGE_ERROR, type: "saveFailed" });
        return false;
      }
    },
    [currentState, isBoardBusy, persistNextState],
  );

  const downloadBoard = useCallback(async () => {
    if (currentState === null || !hasEnoughBoardImages(filledImageCount) || isBoardBusy) {
      return;
    }

    dispatch({ type: "downloadStarted" });

    try {
      const blob = await exportBoardImage(currentState.images, {
        color: currentState.color.hex,
        colorLabel,
      });

      triggerDownload(blob, createBoardDownloadFileName(colorLabel));
      dispatch({ type: "downloadCompleted" });
    } catch {
      dispatch({ error: DOWNLOAD_ERROR, type: "downloadFailed" });
    }
  }, [colorLabel, currentState, exportBoardImage, filledImageCount, isBoardBusy, triggerDownload]);

  return {
    boardError: interactionState.boardError,
    closeInfo,
    colorLabel,
    currentState,
    downloadBoard,
    downloadSheetState,
    downloadStatus: interactionState.downloadStatus,
    isBoardBusy,
    isInfoOpen: interactionState.isInfoOpen,
    isSavingBoard: interactionState.isSavingBoard,
    openInfo,
    reorderImages,
    removeSelectedImage,
    selectImage,
    themeTextColor,
  };
}

function imageBoardInteractionReducer(
  state: ImageBoardInteractionState,
  action: ImageBoardAction,
): ImageBoardInteractionState {
  switch (action.type) {
    case "boardStateChanged":
      return {
        ...state,
        boardError: null,
        downloadStatus: "idle",
      };
    case "downloadCompleted":
      return {
        ...state,
        boardError: null,
        downloadStatus: "completed",
      };
    case "downloadFailed":
      return {
        ...state,
        boardError: action.error,
        downloadStatus: "idle",
      };
    case "downloadStarted":
      return {
        ...state,
        boardError: null,
        downloadStatus: "loading",
      };
    case "infoClosed":
      return {
        ...state,
        isInfoOpen: false,
      };
    case "infoOpened":
      return {
        ...state,
        isInfoOpen: true,
      };
    case "saveFailed":
      return {
        ...state,
        boardError: action.error,
        isSavingBoard: false,
      };
    case "saveStarted":
      return {
        ...state,
        boardError: null,
        isSavingBoard: true,
      };
    case "saveSucceeded":
      return {
        ...state,
        boardError: null,
        downloadStatus: "idle",
        isSavingBoard: false,
      };
  }
}

function getAddImageErrorMessage(error: unknown): string {
  if (isBoardImageFileSizeError(error)) {
    return ADD_IMAGE_FILE_SIZE_ERROR;
  }

  return ADD_IMAGE_ERROR;
}

function isBoardImageFileSizeError(error: unknown): boolean {
  return (
    error instanceof BoardImageFileSizeError ||
    (error instanceof Error && error.name === "BoardImageFileSizeError")
  );
}
