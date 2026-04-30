import {
  BOARD_SLOT_COUNT,
  type AppState,
  type BoardSlot,
  type ColorDeterminedAppState,
} from "./appState";
import { normalizeHexColor } from "./color";
import { COLOR_HUNTING_COLOR_HEX } from "./colorHuntingTheme";

export type BoardDownloadStatus = "completed" | "idle" | "loading";
export type ImageBoardDownloadState = "DOWNLOAD_COMPLETED" | "ENOUGH_IMAGES" | "NON_ENOUGH_IMAGES";

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

  if (downloadStatus === "completed") {
    return "DOWNLOAD_COMPLETED";
  }

  return "ENOUGH_IMAGES";
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
