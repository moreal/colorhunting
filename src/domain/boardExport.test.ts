import { describe, expect, it, vi } from "vitest";
import { createEmptyBoard, type Board, type Image } from "./appState";
import {
  BOARD_EXPORT_HEIGHT,
  BOARD_EXPORT_MIME_TYPE,
  BOARD_EXPORT_WIDTH,
  composeBoardImage,
} from "./boardExport";

describe("boardExport", () => {
  it("부분적으로 채운 보드를 컴팩트한 3x3 PNG 이미지로 합성한다", async () => {
    const image = createSampleImage(1);
    const board = createBoard([[0, image]]);
    const { canvas, context, createCanvas } = createFakeCanvas();
    const loadImage = vi.fn<() => Promise<CanvasImageSource>>(
      async () => ({ height: 80, width: 120 }) as CanvasImageSource,
    );

    const blob = await composeBoardImage(board, {
      createCanvas,
      loadImage,
    });

    expect(createCanvas).toHaveBeenCalledWith(BOARD_EXPORT_WIDTH, BOARD_EXPORT_HEIGHT);
    expect(canvas.width).toBe(BOARD_EXPORT_WIDTH);
    expect(canvas.height).toBe(BOARD_EXPORT_HEIGHT);
    expect(loadImage).toHaveBeenCalledWith(image);
    expect(context.drawImage).toHaveBeenCalledOnce();
    expect(context.fillText).not.toHaveBeenCalled();
    expect(blob.type).toBe(BOARD_EXPORT_MIME_TYPE);
  });

  it("가득 채운 보드는 모든 이미지를 불러와 슬롯마다 그린다", async () => {
    const board = createBoard(
      Array.from({ length: 9 }, (_, index) => [index, createSampleImage(index)] as [number, Image]),
    );
    const { context, createCanvas } = createFakeCanvas();
    const loadImage = vi.fn<() => Promise<CanvasImageSource>>(
      async () => ({ height: 100, width: 100 }) as CanvasImageSource,
    );

    await composeBoardImage(board, {
      createCanvas,
      loadImage,
    });

    expect(loadImage).toHaveBeenCalledTimes(9);
    expect(context.drawImage).toHaveBeenCalledTimes(9);
  });

  it("이미지를 슬롯 위치에 맞춰 가운데 크롭하고 빈 슬롯 배경도 그린다", async () => {
    const board = createBoard([[4, createSampleImage(4)]]);
    const { context, createCanvas } = createFakeCanvas();
    const loadedImage = { height: 100, width: 200 } as CanvasImageSource;

    await composeBoardImage(board, {
      createCanvas,
      height: 300,
      loadImage: vi.fn<() => Promise<CanvasImageSource>>(async () => loadedImage),
      width: 300,
    });

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(context.drawImage).toHaveBeenCalledWith(
      loadedImage,
      50,
      0,
      100,
      100,
      100,
      100,
      100,
      100,
    );
  });

  it("빈 보드는 다운로드 이미지로 만들지 않는다", async () => {
    await expect(composeBoardImage(createEmptyBoard())).rejects.toThrow(
      "Cannot export an empty image board.",
    );
  });

  it("9칸이 아니거나 잘못된 이미지가 포함된 보드는 거부한다", async () => {
    await expect(composeBoardImage([createSampleImage(1)])).rejects.toThrow(
      "A board export requires exactly 9 image slots.",
    );
    await expect(
      composeBoardImage(createBoard([[0, { ...createSampleImage(1), dataUrl: "broken" }]])),
    ).rejects.toThrow("A board export contains an invalid image slot.");
  });

  it("잘못된 export 크기와 그릴 수 없는 이미지는 거부한다", async () => {
    const board = createBoard([[0, createSampleImage(1)]]);
    const { createCanvas } = createFakeCanvas();

    await expect(
      composeBoardImage(board, { createCanvas, height: 400, width: 300 }),
    ).rejects.toThrow("Board export dimensions must be positive square integers.");
    await expect(
      composeBoardImage(board, {
        createCanvas,
        loadImage: vi.fn<() => Promise<CanvasImageSource>>(
          async () => ({ height: 0, width: 100 }) as CanvasImageSource,
        ),
      }),
    ).rejects.toThrow("A board image has no drawable dimensions.");
  });

  it("캔버스 컨텍스트나 Blob 생성에 실패하면 export를 중단한다", async () => {
    const board = createBoard([[0, createSampleImage(1)]]);
    const canvasWithoutContext = {
      getContext: vi.fn<() => null>(() => null),
      height: 0,
      width: 0,
    } as unknown as HTMLCanvasElement;

    await expect(
      composeBoardImage(board, {
        createCanvas: vi.fn<() => HTMLCanvasElement>(() => canvasWithoutContext),
      }),
    ).rejects.toThrow("Cannot export the board without a 2D canvas context.");

    await expect(
      composeBoardImage(board, {
        createCanvas: createFakeCanvas().createCanvas,
        exportCanvas: vi.fn<() => Promise<Blob>>(async () => {
          throw new Error("Could not export the board image.");
        }),
        loadImage: vi.fn<() => Promise<CanvasImageSource>>(
          async () => ({ height: 100, width: 100 }) as CanvasImageSource,
        ),
      }),
    ).rejects.toThrow("Could not export the board image.");
  });
});

function createFakeCanvas() {
  const textDraws: Array<{
    fillStyle: string;
    text: string;
  }> = [];
  let fillStyle = "";
  const context = {
    drawImage: vi.fn<(...args: unknown[]) => void>(),
    fillRect: vi.fn<(...args: unknown[]) => void>(),
    fillText: vi.fn<(text: string) => void>((text) => {
      textDraws.push({ fillStyle, text });
    }),
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      fillStyle = String(value);
    },
    restore: vi.fn<() => void>(),
    save: vi.fn<() => void>(),
    strokeRect: vi.fn<(...args: unknown[]) => void>(),
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    getContext: vi.fn<() => CanvasRenderingContext2D>(() => context),
    height: 0,
    toBlob: vi.fn<(callback: BlobCallback, type?: string) => void>((callback, type) => {
      callback(new Blob(["board"], { type }));
    }),
    width: 0,
  } as unknown as HTMLCanvasElement;
  const createCanvas = vi.fn<(width: number, height: number) => HTMLCanvasElement>(
    (width, height) => {
      canvas.width = width;
      canvas.height = height;

      return canvas;
    },
  );

  return { canvas, context, createCanvas, textDraws };
}

function createBoard(entries: Array<[number, Image]> = []): Board {
  const board = createEmptyBoard();

  for (const [slotIndex, image] of entries) {
    board[slotIndex] = image;
  }

  return board;
}

function createSampleImage(index: number): Image {
  return {
    altText: `Sample image ${index}`,
    dataUrl: `data:image/png;base64,${index}`,
    id: `image-${index}`,
    mimeType: "image/png",
    name: `image-${index}.png`,
  };
}
