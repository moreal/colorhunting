import {
  BOARD_SLOT_COUNT,
  createImage,
  type BoardSlot,
  type Image as BoardImage,
} from "./appState";

export const BOARD_EXPORT_WIDTH = 3024;
export const BOARD_EXPORT_HEIGHT = 4032;
export const BOARD_EXPORT_MIME_TYPE = "image/png";

const BOARD_EXPORT_COLUMNS = 3;
const BOARD_EXPORT_ROWS = 3;
const BOARD_EXPORT_ASPECT_WIDTH = 3;
const BOARD_EXPORT_ASPECT_HEIGHT = 4;

export type BoardExportMimeType = "image/png" | "image/jpeg" | "image/webp";

export type BoardCanvasFactory = (width: number, height: number) => HTMLCanvasElement;
export type BoardImageLoader = (image: BoardImage) => Promise<CanvasImageSource>;
export type BoardCanvasExporter = (
  canvas: HTMLCanvasElement,
  mimeType: BoardExportMimeType,
  quality?: number,
) => Promise<Blob>;

export type ComposeBoardImageOptions = {
  createCanvas?: BoardCanvasFactory;
  exportCanvas?: BoardCanvasExporter;
  height?: number;
  loadImage?: BoardImageLoader;
  mimeType?: BoardExportMimeType;
  quality?: number;
  width?: number;
};

type BoardExportLayout = {
  cellHeight: number;
  cellWidth: number;
  height: number;
  width: number;
};

export async function composeBoardImage(
  images: readonly BoardSlot[],
  options: ComposeBoardImageOptions = {},
): Promise<Blob> {
  const board = validateBoardImages(images);
  const layout = createBoardExportLayout(options);
  const canvas = (options.createCanvas ?? createBrowserCanvas)(layout.width, layout.height);
  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Cannot export the board without a 2D canvas context.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const loadImage = options.loadImage ?? loadBrowserImage;
  const loadedImages = await Promise.all(
    board.map((image) => (image === null ? Promise.resolve(null) : loadImage(image))),
  );

  drawBoardSlots(context, layout, loadedImages);

  return await (options.exportCanvas ?? exportBrowserCanvas)(
    canvas,
    options.mimeType ?? BOARD_EXPORT_MIME_TYPE,
    options.quality,
  );
}

function validateBoardImages(images: readonly BoardSlot[]): BoardSlot[] {
  if (images.length !== BOARD_SLOT_COUNT) {
    throw new Error("A board export requires exactly 9 image slots.");
  }

  const board = images.map((image) => {
    if (image === null) {
      return null;
    }

    const validImage = createImage(image);

    if (validImage === null) {
      throw new Error("A board export contains an invalid image slot.");
    }

    return validImage;
  });

  if (board.every((image) => image === null)) {
    throw new Error("Cannot export an empty image board.");
  }

  return board;
}

function createBoardExportLayout(options: ComposeBoardImageOptions): BoardExportLayout {
  const width =
    options.width ??
    Math.round(
      ((options.height ?? BOARD_EXPORT_HEIGHT) * BOARD_EXPORT_ASPECT_WIDTH) /
        BOARD_EXPORT_ASPECT_HEIGHT,
    );
  const height =
    options.height ?? Math.round((width * BOARD_EXPORT_ASPECT_HEIGHT) / BOARD_EXPORT_ASPECT_WIDTH);

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * BOARD_EXPORT_ASPECT_HEIGHT !== height * BOARD_EXPORT_ASPECT_WIDTH
  ) {
    throw new Error("Board export dimensions must be positive 3:4 integers.");
  }

  return {
    cellHeight: height / BOARD_EXPORT_ROWS,
    cellWidth: width / BOARD_EXPORT_COLUMNS,
    height,
    width,
  };
}

function drawBoardSlots(
  context: CanvasRenderingContext2D,
  layout: BoardExportLayout,
  images: readonly (CanvasImageSource | null)[],
) {
  for (let slotIndex = 0; slotIndex < BOARD_SLOT_COUNT; slotIndex += 1) {
    const column = slotIndex % BOARD_EXPORT_COLUMNS;
    const row = Math.floor(slotIndex / BOARD_EXPORT_COLUMNS);
    const x = column * layout.cellWidth;
    const y = row * layout.cellHeight;
    const image = images[slotIndex];

    drawEmptySlot(context, x, y, layout.cellWidth, layout.cellHeight);

    if (image !== null) {
      drawCoverImage(context, image, x, y, layout.cellWidth, layout.cellHeight);
    }
  }
}

function drawEmptySlot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const checkerSize = Math.min(width, height) / 12;
  const columns = Math.ceil(width / checkerSize);
  const rows = Math.ceil(height / checkerSize);

  context.fillStyle = "#ffffff";
  context.fillRect(x, y, width, height);

  context.fillStyle = "#efefef";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if ((row + column) % 2 === 0) {
        const checkerX = x + column * checkerSize;
        const checkerY = y + row * checkerSize;
        const checkerWidth = Math.min(checkerSize, x + width - checkerX);
        const checkerHeight = Math.min(checkerSize, y + height - checkerY);

        context.fillRect(checkerX, checkerY, checkerWidth, checkerHeight);
      }
    }
  }

  context.strokeStyle = "rgba(0, 0, 0, 0.08)";
  context.lineWidth = Math.max(2, Math.min(width, height) * 0.006);
  context.strokeRect(x, y, width, height);
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceSize = getImageSourceSize(image);
  const scale = Math.max(width / sourceSize.width, height / sourceSize.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (sourceSize.width - sourceWidth) / 2;
  const sourceY = (sourceSize.height - sourceHeight) / 2;

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function getImageSourceSize(image: CanvasImageSource): {
  height: number;
  width: number;
} {
  const imageLike = image as {
    height?: number;
    naturalHeight?: number;
    naturalWidth?: number;
    videoHeight?: number;
    videoWidth?: number;
    width?: number;
  };
  const width = imageLike.naturalWidth ?? imageLike.videoWidth ?? imageLike.width;
  const height = imageLike.naturalHeight ?? imageLike.videoHeight ?? imageLike.height;

  if (typeof width !== "number" || typeof height !== "number" || width <= 0 || height <= 0) {
    throw new Error("A board image has no drawable dimensions.");
  }

  return { height, width };
}

function createBrowserCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("Board export requires a browser document.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  return canvas;
}

function loadBrowserImage(image: BoardImage): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const imageElement = new globalThis.Image();

    imageElement.decoding = "async";
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error(`Could not load board image: ${image.name}`));
    imageElement.src = image.dataUrl;
  });
}

function exportBrowserCanvas(
  canvas: HTMLCanvasElement,
  mimeType: BoardExportMimeType,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("Could not export the board image."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}
