import { createImage, type Image } from "./appState";

export const ACCEPTED_BOARD_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heif",
  "image/heic",
] as const;
export const ACCEPTED_BOARD_IMAGE_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".heif",
  ".heic",
] as const;
export const BOARD_IMAGE_FILE_ACCEPT = [
  ...ACCEPTED_BOARD_IMAGE_MIME_TYPES,
  ...ACCEPTED_BOARD_IMAGE_FILE_EXTENSIONS,
].join(",");
export const MAX_BOARD_IMAGE_FILE_SIZE_BYTES = 3_000_000;
export const MAX_BOARD_IMAGE_FILE_SIZE_LABEL = "3MB";

export type AcceptedBoardImageMimeType = (typeof ACCEPTED_BOARD_IMAGE_MIME_TYPES)[number];

export type CreateBoardImageFromFileOptions = {
  idFactory?: () => string;
};

export class BoardImageFileSizeError extends Error {
  constructor(
    readonly fileSize: number,
    readonly maxFileSize: number = MAX_BOARD_IMAGE_FILE_SIZE_BYTES,
  ) {
    super(`Image file size must be ${maxFileSize} bytes or less.`);
    this.name = "BoardImageFileSizeError";
  }
}

const ACCEPTED_BOARD_IMAGE_MIME_TYPE_SET = new Set<string>(ACCEPTED_BOARD_IMAGE_MIME_TYPES);
const GENERIC_FILE_MIME_TYPES = new Set(["", "application/octet-stream"]);
const BOARD_IMAGE_MIME_TYPE_BY_EXTENSION = new Map<string, AcceptedBoardImageMimeType>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".heif", "image/heif"],
  [".heic", "image/heic"],
]);

export async function createBoardImageFromFile(
  file: File,
  options: CreateBoardImageFromFileOptions = {},
): Promise<Image> {
  const mimeType = getAcceptedBoardImageMimeType(file);

  if (mimeType === null) {
    throw new Error("Only PNG, JPEG, WebP, and HEIF/HEIC images can be added to the board.");
  }

  if (file.size > MAX_BOARD_IMAGE_FILE_SIZE_BYTES) {
    throw new BoardImageFileSizeError(file.size);
  }

  const image = createImage({
    altText: createImageAltText(file),
    dataUrl: normalizeDataUrlMimeType(await readFileAsDataUrl(file), mimeType),
    id: options.idFactory?.() ?? createImageId(),
    mimeType,
    name: file.name.trim() || "image",
  });

  if (image === null) {
    throw new Error("The selected image cannot be stored.");
  }

  return image;
}

export function isAcceptedBoardImageFile(file: File): boolean {
  return getAcceptedBoardImageMimeType(file) !== null;
}

function getAcceptedBoardImageMimeType(file: File): AcceptedBoardImageMimeType | null {
  const mimeType = file.type.trim().toLowerCase();

  if (ACCEPTED_BOARD_IMAGE_MIME_TYPE_SET.has(mimeType)) {
    return mimeType as AcceptedBoardImageMimeType;
  }

  if (!GENERIC_FILE_MIME_TYPES.has(mimeType)) {
    return null;
  }

  return getAcceptedBoardImageMimeTypeByExtension(file.name);
}

function getAcceptedBoardImageMimeTypeByExtension(
  fileName: string,
): AcceptedBoardImageMimeType | null {
  const extension = getFileExtension(fileName);

  if (extension === null) {
    return null;
  }

  return BOARD_IMAGE_MIME_TYPE_BY_EXTENSION.get(extension) ?? null;
}

function getFileExtension(fileName: string): string | null {
  const trimmedFileName = fileName.trim();
  const extensionStartIndex = trimmedFileName.lastIndexOf(".");

  if (extensionStartIndex < 0) {
    return null;
  }

  return trimmedFileName.slice(extensionStartIndex).toLowerCase();
}

function normalizeDataUrlMimeType(dataUrl: string, mimeType: AcceptedBoardImageMimeType): string {
  const dataSeparatorIndex = dataUrl.indexOf(",");

  if (!dataUrl.startsWith("data:") || dataSeparatorIndex < 0) {
    return dataUrl;
  }

  const metadata = dataUrl.slice("data:".length, dataSeparatorIndex);
  const parameters = metadata.split(";").slice(1);
  const parameterSuffix = parameters.length > 0 ? `;${parameters.join(";")}` : "";

  return `data:${mimeType}${parameterSuffix}${dataUrl.slice(dataSeparatorIndex)}`;
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
