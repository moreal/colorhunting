import {
  BOARD_SLOT_COUNT,
  type AppState,
  type BoardSlot,
  type ColorDeterminedAppState,
} from "./appState";
import { normalizeHexColor } from "./color";
import { COLOR_HUNTING_COLOR_HEX } from "./colorHuntingTheme";

export type BoardDownloadStatus = "completed" | "idle" | "loading" | "manualSaveReady";
export type ImageBoardDownloadState =
  | "DOWNLOAD_COMPLETED"
  | "ENOUGH_IMAGES"
  | "MANUAL_SAVE_READY"
  | "NON_ENOUGH_IMAGES";
export type ManualBoardDownload = {
  fileName: string;
  mimeType: string;
  objectUrl: string;
  type: "manual-save";
};
export type CompletedBoardDownload = {
  type: "completed";
};
export type BoardDownloadResult = CompletedBoardDownload | ManualBoardDownload;

const COLOR_LABELS_BY_HEX = createColorLabelsByHex(COLOR_HUNTING_COLOR_HEX);

export function getColorDeterminedState(state: AppState): ColorDeterminedAppState | null {
  return state.state === "COLOR_DETERMINED" ? state : null;
}

export function countFilledBoardImages(images: readonly BoardSlot[]): number {
  return images.filter(Boolean).length;
}

export function hasEnoughBoardImages(filledImageCount: number): boolean {
  return filledImageCount >= BOARD_SLOT_COUNT;
}

export function getImageBoardDownloadState(
  filledImageCount: number,
  downloadStatus: BoardDownloadStatus,
): ImageBoardDownloadState {
  if (!hasEnoughBoardImages(filledImageCount)) {
    return "NON_ENOUGH_IMAGES";
  }

  if (downloadStatus === "manualSaveReady") {
    return "MANUAL_SAVE_READY";
  }

  if (downloadStatus === "completed") {
    return "DOWNLOAD_COMPLETED";
  }

  return "ENOUGH_IMAGES";
}

export function isManualBoardDownloadResult(
  result: BoardDownloadResult | null | undefined | void,
): result is ManualBoardDownload {
  return result?.type === "manual-save";
}

export function getColorLabel(hex: string | undefined): string {
  const normalizedHex = normalizeHexColor(hex ?? "");

  if (normalizedHex === null) {
    return "COLOR";
  }

  return COLOR_LABELS_BY_HEX[normalizedHex] ?? normalizedHex.toUpperCase();
}

export function createBoardDownloadFileName(colorLabel: string, date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);

  return `colorhunting-${colorLabel.toLowerCase()}-${isoDate}.png`;
}

function createColorLabelsByHex(colorsByName: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(colorsByName).map(([label, hex]) => [hex.toLowerCase(), label.toUpperCase()]),
  );
}
