import type { AppProps } from "./App";
import {
  createColor,
  createEmptyBoard,
  resetToNoColor,
  type AppState,
  type Board,
  type Image,
} from "./domain/appState";
import { COLOR_HUNTING_COLOR_HEX } from "./domain/colorHuntingTheme";
import type { AppStateStorage } from "./appStorage";

const E2E_IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

export function createRuntimeAppProps(
  location: Pick<Location, "search"> = window.location,
): AppProps {
  const e2eState = createE2eAppState(location.search);

  if (e2eState === null) {
    return {};
  }

  return {
    storage: createMemoryAppStateStorage(e2eState),
  };
}

export function createE2eAppState(search: string): AppState | null {
  const params = new URLSearchParams(search);

  if (params.get("e2e") !== "1") {
    return null;
  }

  const colorHex = getE2eColorHex(params.get("e2eColor"));
  const color = createColor(colorHex);

  if (color === null) {
    return null;
  }

  return {
    color,
    images: createFilledE2eBoard(),
    state: "COLOR_DETERMINED",
  };
}

function getE2eColorHex(colorLabel: string | null): string {
  if (colorLabel === null) {
    return COLOR_HUNTING_COLOR_HEX.red;
  }

  const colorKey = colorLabel.trim().toLowerCase() as keyof typeof COLOR_HUNTING_COLOR_HEX;

  return COLOR_HUNTING_COLOR_HEX[colorKey] ?? COLOR_HUNTING_COLOR_HEX.red;
}

function createFilledE2eBoard(): Board {
  const board = createEmptyBoard();

  for (let slotIndex = 0; slotIndex < board.length; slotIndex += 1) {
    board[slotIndex] = createE2eImage(slotIndex);
  }

  return board;
}

function createE2eImage(slotIndex: number): Image {
  return {
    altText: `E2E board image ${slotIndex + 1}`,
    dataUrl: E2E_IMAGE_DATA_URL,
    id: `e2e-image-${slotIndex + 1}`,
    mimeType: "image/png",
    name: `e2e-image-${slotIndex + 1}.png`,
  };
}

function createMemoryAppStateStorage(initialState: AppState): AppStateStorage {
  let appState = initialState;

  return {
    clearAppState: async () => {
      appState = resetToNoColor();
    },
    loadAppState: async () => appState,
    saveAppState: async (nextState) => {
      appState = nextState;
    },
  };
}
