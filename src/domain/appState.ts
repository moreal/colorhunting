import { normalizeHexColor } from "./color";

export const BOARD_SLOT_COUNT = 9;
export const MAX_IMAGE_DATA_URL_LENGTH = 1_500_000;

export type Color = {
  hex: string;
};

export type Image = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  altText: string;
};

export type BoardSlot = Image | null;

export type Board = [
  BoardSlot,
  BoardSlot,
  BoardSlot,
  BoardSlot,
  BoardSlot,
  BoardSlot,
  BoardSlot,
  BoardSlot,
  BoardSlot,
];

export type NoColorAppState = {
  state: "NO_COLOR";
};

export type ColorDeterminedAppState = {
  state: "COLOR_DETERMINED";
  color: Color;
  images: Board;
};

export type AppState = NoColorAppState | ColorDeterminedAppState;

export function createColor(input: string): Color | null {
  const normalizedColor = normalizeHexColor(input);

  if (normalizedColor === null) {
    return null;
  }

  return { hex: normalizedColor };
}

export function createImage(input: unknown): Image | null {
  return parseImage(input);
}

export function createEmptyBoard(): Board {
  return [null, null, null, null, null, null, null, null, null];
}

export function hasValidBoardLength(images: readonly unknown[]): boolean {
  return images.length === BOARD_SLOT_COUNT;
}

export function selectColor(color: Color): ColorDeterminedAppState {
  const normalizedColor = parseColor(color);

  if (normalizedColor === null) {
    throw new Error("Cannot select an invalid color.");
  }

  return {
    state: "COLOR_DETERMINED",
    color: normalizedColor,
    images: createEmptyBoard(),
  };
}

export function resetToNoColor(): NoColorAppState {
  return { state: "NO_COLOR" };
}

export function addImage(state: AppState, slotIndex: number, image: Image): AppState {
  if (state.state !== "COLOR_DETERMINED" || !isValidSlotIndex(slotIndex)) {
    return state;
  }

  const nextImage = parseImage(image);

  if (nextImage === null) {
    return state;
  }

  const nextImages = parseBoard(state.images);

  if (nextImages === null) {
    return state;
  }

  nextImages[slotIndex] = nextImage;

  return {
    ...state,
    images: nextImages,
  };
}

export function removeImage(state: AppState, slotIndex: number): AppState {
  if (state.state !== "COLOR_DETERMINED" || !isValidSlotIndex(slotIndex)) {
    return state;
  }

  const nextImages = parseBoard(state.images);

  if (nextImages === null) {
    return state;
  }

  nextImages[slotIndex] = null;

  return {
    ...state,
    images: nextImages,
  };
}

export function replaceBoard(state: AppState, images: readonly BoardSlot[]): AppState {
  if (state.state !== "COLOR_DETERMINED") {
    return state;
  }

  const nextImages = parseBoard(images);

  if (nextImages === null) {
    return state;
  }

  return {
    ...state,
    images: nextImages,
  };
}

export function validateAppState(value: unknown): AppState | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.state === "NO_COLOR") {
    return resetToNoColor();
  }

  if (value.state !== "COLOR_DETERMINED") {
    return null;
  }

  const color = parseColor(value.color);
  const images = parseBoard(value.images);

  if (color === null || images === null) {
    return null;
  }

  return {
    state: "COLOR_DETERMINED",
    color,
    images,
  };
}

function isValidSlotIndex(slotIndex: number): boolean {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < BOARD_SLOT_COUNT;
}

function parseColor(value: unknown): Color | null {
  if (!isRecord(value) || typeof value.hex !== "string") {
    return null;
  }

  return createColor(value.hex);
}

function parseBoard(value: unknown): Board | null {
  if (!Array.isArray(value) || !hasValidBoardLength(value)) {
    return null;
  }

  const images: BoardSlot[] = [];

  for (const slot of value) {
    if (slot === null) {
      images.push(null);
      continue;
    }

    const image = parseImage(slot);

    if (image === null) {
      return null;
    }

    images.push(image);
  }

  return images as Board;
}

function parseImage(value: unknown): Image | null {
  if (!isRecord(value)) {
    return null;
  }

  const { altText, dataUrl, id, mimeType, name } = value;

  if (
    typeof id !== "string" ||
    id.trim() === "" ||
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof mimeType !== "string" ||
    !mimeType.startsWith("image/") ||
    typeof dataUrl !== "string" ||
    !dataUrl.startsWith("data:image/") ||
    dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH ||
    typeof altText !== "string" ||
    altText.trim() === ""
  ) {
    return null;
  }

  return {
    altText,
    id,
    name,
    mimeType,
    dataUrl,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
