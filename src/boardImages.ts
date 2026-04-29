import { MAX_IMAGE_DATA_URL_LENGTH, createImage, type Image } from "./appState";

export const ACCEPTED_BOARD_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const BOARD_IMAGE_FILE_ACCEPT = ACCEPTED_BOARD_IMAGE_MIME_TYPES.join(",");
export const MAX_BOARD_IMAGE_FILE_SIZE_BYTES = Math.floor((MAX_IMAGE_DATA_URL_LENGTH - 64) * 0.75);

export type AcceptedBoardImageMimeType = (typeof ACCEPTED_BOARD_IMAGE_MIME_TYPES)[number];

export type CreateBoardImageFromFileOptions = {
  idFactory?: () => string;
};

const ACCEPTED_BOARD_IMAGE_MIME_TYPE_SET = new Set<string>(ACCEPTED_BOARD_IMAGE_MIME_TYPES);

export async function createBoardImageFromFile(
  file: File,
  options: CreateBoardImageFromFileOptions = {},
): Promise<Image> {
  if (!isAcceptedBoardImageFile(file)) {
    throw new Error("Only PNG, JPEG, and WebP images can be added to the board.");
  }

  if (file.size > MAX_BOARD_IMAGE_FILE_SIZE_BYTES) {
    throw new Error("The selected image is too large to store.");
  }

  const image = createImage({
    altText: createImageAltText(file),
    dataUrl: await readFileAsDataUrl(file),
    id: options.idFactory?.() ?? createImageId(),
    mimeType: file.type,
    name: file.name.trim() || "image",
  });

  if (image === null) {
    throw new Error("The selected image cannot be stored.");
  }

  return image;
}

export function isAcceptedBoardImageFile(file: File): file is File & {
  type: AcceptedBoardImageMimeType;
} {
  return ACCEPTED_BOARD_IMAGE_MIME_TYPE_SET.has(file.type);
}

function createImageAltText(file: File): string {
  const fileName = file.name.trim();

  return fileName === "" ? "Uploaded board image" : `Uploaded board image ${fileName}`;
}

function createImageId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image file."));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The image file did not produce a data URL."));
    };

    reader.readAsDataURL(file);
  });
}
