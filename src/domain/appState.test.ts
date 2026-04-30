import { describe, expect, it } from "vitest";
import {
  BOARD_SLOT_COUNT,
  MAX_IMAGE_DATA_URL_LENGTH,
  addImage,
  createColor,
  createEmptyBoard,
  createImage,
  hasValidBoardLength,
  removeImage,
  replaceBoard,
  resetToNoColor,
  selectColor,
  validateAppState,
  type AppState,
  type Board,
  type ColorDeterminedAppState,
  type Image,
} from "./appState";

const testImage: Image = {
  id: "image-1",
  name: "sample.png",
  mimeType: "image/png",
  dataUrl: "data:image/png;base64,abc123",
  altText: "Sample image",
};

const secondTestImage: Image = {
  id: "image-2",
  name: "second.png",
  mimeType: "image/png",
  dataUrl: "data:image/png;base64,def456",
  altText: "Second image",
};

describe("appState", () => {
  it("빈 보드는 항상 9개의 비어 있는 슬롯으로 만들어진다", () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(BOARD_SLOT_COUNT);
    expect(board.every((slot) => slot === null)).toBe(true);
    expect(createEmptyBoard()).not.toBe(board);
    expect(hasValidBoardLength(board)).toBe(true);
  });

  it("색상을 선택하면 정규화된 색상과 빈 이미지 보드를 가진 상태가 된다", () => {
    const color = createColor("#ABC");

    expect(color).toEqual({ hex: "#aabbcc" });
    expect(selectColor(color!)).toEqual({
      state: "COLOR_DETERMINED",
      color: { hex: "#aabbcc" },
      images: createEmptyBoard(),
    });
  });

  it("올바르지 않은 색상은 선택할 수 없다", () => {
    expect(createColor("blue")).toBeNull();
    expect(() => selectColor({ hex: "blue" })).toThrow("Cannot select an invalid color.");
  });

  it("이미지 슬롯 데이터는 저장 가능한 이미지 형식일 때만 만들어진다", () => {
    expect(createImage(testImage)).toEqual(testImage);
    expect(createImage({ ...testImage, id: "" })).toBeNull();
    expect(createImage({ ...testImage, name: "" })).toBeNull();
    expect(createImage({ ...testImage, mimeType: "text/plain" })).toBeNull();
    expect(createImage({ ...testImage, dataUrl: "https://example.com/sample.png" })).toBeNull();
    expect(
      createImage({
        ...testImage,
        dataUrl: `data:image/png;base64,${"a".repeat(MAX_IMAGE_DATA_URL_LENGTH)}`,
      }),
    ).toBeNull();
    expect(createImage({ ...testImage, altText: "" })).toBeNull();
    expect(createImage({ ...testImage, altText: 1 })).toBeNull();
  });

  it("색상을 초기화하면 이미지 보드가 없는 시작 상태로 돌아간다", () => {
    expect(resetToNoColor()).toEqual({ state: "NO_COLOR" });
  });

  it("이미지를 지정한 슬롯에 추가해도 기존 상태와 보드 배열은 변경하지 않는다", () => {
    const initialState = selectColor(createColor("#ff0000")!);
    const withImage = addImage(initialState, 2, testImage);

    assertColorDetermined(withImage);

    expect(withImage).toEqual({
      state: "COLOR_DETERMINED",
      color: initialState.color,
      images: boardWithImages([[2, testImage]]),
    });
    expect(initialState.images.every((slot) => slot === null)).toBe(true);
    expect(withImage).not.toBe(initialState);
    expect(withImage.images).not.toBe(initialState.images);
  });

  it("이미지를 제거하면 요청한 슬롯만 비우고 다른 이미지는 유지한다", () => {
    const initialState = selectColor(createColor("#ff0000")!);
    const withImages = replaceBoard(
      initialState,
      boardWithImages([
        [2, testImage],
        [5, secondTestImage],
      ]),
    );
    const withoutImage = removeImage(withImages, 2);

    assertColorDetermined(withImages);
    assertColorDetermined(withoutImage);

    expect(withImages.images).toEqual(
      boardWithImages([
        [2, testImage],
        [5, secondTestImage],
      ]),
    );
    expect(withoutImage.images).toEqual(boardWithImages([[5, secondTestImage]]));
  });

  it("잘못된 슬롯 번호는 이미지 보드를 바꾸지 않는다", () => {
    const state = selectColor(createColor("#00ff00")!);

    expect(addImage(state, -1, testImage)).toBe(state);
    expect(addImage(state, BOARD_SLOT_COUNT, testImage)).toBe(state);
    expect(addImage(state, 1.5, testImage)).toBe(state);
    expect(removeImage(state, -1)).toBe(state);
    expect(removeImage(state, BOARD_SLOT_COUNT)).toBe(state);
    expect(removeImage(state, 1.5)).toBe(state);
  });

  it("전체 보드는 9개 슬롯일 때만 교체된다", () => {
    const state = selectColor(createColor("#0000ff")!);
    const nextBoard = createEmptyBoard();
    nextBoard[0] = testImage;

    expect(replaceBoard(state, nextBoard)).toMatchObject({
      state: "COLOR_DETERMINED",
      images: nextBoard,
    });
    expect(replaceBoard(state, [testImage])).toBe(state);
    expect(replaceBoard(resetToNoColor(), nextBoard)).toEqual(resetToNoColor());
  });

  it("저장된 상태는 유효한 색상과 정확히 9개의 이미지 슬롯이 있을 때만 받아들인다", () => {
    const validState = {
      state: "COLOR_DETERMINED",
      color: { hex: "#ABC" },
      images: [testImage, ...createEmptyBoard().slice(1)],
    };

    expect(validateAppState(validState)).toEqual({
      state: "COLOR_DETERMINED",
      color: { hex: "#aabbcc" },
      images: [testImage, ...createEmptyBoard().slice(1)],
    });
    expect(
      validateAppState({ state: "COLOR_DETERMINED", color: { hex: "blue" }, images: [] }),
    ).toBeNull();
    expect(validateAppState({ state: "UNKNOWN" })).toBeNull();
    expect(validateAppState("corrupt")).toBeNull();
  });

  it("저장된 이미지 슬롯 데이터가 이미지 계약을 어기면 상태를 거부한다", () => {
    const invalidImages = [
      { ...testImage, id: "" },
      { ...testImage, name: "" },
      { ...testImage, mimeType: "text/plain" },
      { ...testImage, dataUrl: "data:text/plain;base64,abc123" },
      { ...testImage, altText: "" },
      "not-an-image",
    ];

    for (const invalidImage of invalidImages) {
      expect(
        validateAppState({
          state: "COLOR_DETERMINED",
          color: { hex: "#123456" },
          images: [invalidImage, ...createEmptyBoard().slice(1)],
        }),
      ).toBeNull();
    }
  });
});

function assertColorDetermined(state: AppState): asserts state is ColorDeterminedAppState {
  expect(state.state).toBe("COLOR_DETERMINED");
}

function boardWithImages(entries: Array<[number, Image]>): Board {
  const board = createEmptyBoard();

  for (const [slotIndex, image] of entries) {
    board[slotIndex] = image;
  }

  return board;
}
