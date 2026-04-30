import { describe, expect, it } from "vitest";
import { createColor, createEmptyBoard, type Image } from "./appState";
import {
  countFilledBoardImages,
  createBoardDownloadFileName,
  getColorDeterminedState,
  getColorLabel,
  getImageBoardDownloadState,
} from "./imageBoard";

describe("imageBoard", () => {
  it("색상이 확정된 앱 상태만 이미지 보드 상태로 다룬다", () => {
    const color = createColor("#ef4b4b");

    if (color === null) {
      throw new Error("Test color must be valid.");
    }

    const boardState = {
      color,
      images: createEmptyBoard(),
      state: "COLOR_DETERMINED" as const,
    };

    expect(getColorDeterminedState({ state: "NO_COLOR" })).toBeNull();
    expect(getColorDeterminedState(boardState)).toBe(boardState);
  });

  it("보드의 채운 이미지 수와 다운로드 바 상태를 계산한다", () => {
    const board = createEmptyBoard();
    board[0] = createSampleImage(1);
    board[4] = createSampleImage(4);

    expect(countFilledBoardImages(board)).toBe(2);
    expect(getImageBoardDownloadState(0, "idle")).toBe("NON_ENOUGH_IMAGES");
    expect(getImageBoardDownloadState(2, "idle")).toBe("ENOUGH_IMAGES");
    expect(getImageBoardDownloadState(2, "completed")).toBe("DOWNLOAD_COMPLETED");
  });

  it("제품 색상은 라벨로, 임의 색상은 정규화된 hex로 표시한다", () => {
    expect(getColorLabel(undefined)).toBe("COLOR");
    expect(getColorLabel("#EF4B4B")).toBe("RED");
    expect(getColorLabel("#abc")).toBe("#AABBCC");
  });

  it("다운로드 파일명은 색상 라벨과 날짜로 만든다", () => {
    expect(createBoardDownloadFileName("RED", new Date("2026-04-30T12:34:56.000Z"))).toBe(
      "colorhunting-red-2026-04-30.png",
    );
  });
});

function createSampleImage(index: number): Image {
  return {
    altText: `Sample image ${index}`,
    dataUrl: `data:image/png;base64,${index}`,
    id: `image-${index}`,
    mimeType: "image/png",
    name: `image-${index}.png`,
  };
}
