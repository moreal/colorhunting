import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createColor,
  createEmptyBoard,
  type Board,
  type ColorDeterminedAppState,
  type Image,
} from "../domain/appState";
import { BoardImageFileSizeError, MAX_BOARD_IMAGE_FILE_SIZE_BYTES } from "../domain/boardImages";
import { designTokens } from "../designSystem/tokens";
import {
  beginLongPressSlotDrag,
  dropSlotDragAt,
  dropSlotDragAtPoint,
  getImageBoardSlotFrames,
  mockElementRect,
  mockImageBoardSlotRects,
  moveSlotDragTo,
  moveSlotDragToPoint,
} from "../test/imageBoardDrag";
import { ImageBoardPage, type ExportBoardImage, type TriggerBoardDownload } from "./ImageBoardPage";

describe("ImageBoardPage", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("확정된 색상 상태가 아니면 보드 페이지를 렌더링하지 않는다", () => {
    render(<ImageBoardPage state={{ state: "NO_COLOR" }} />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "DOWNLOAD" })).not.toBeInTheDocument();
  });

  it("빈 보드는 9개 슬롯과 비활성 다운로드 상태를 보여준다", () => {
    render(<ImageBoardPage state={createBoardState()} />);

    const board = screen.getByRole("group", { name: "Image board, 0 of 9 slots filled" });

    expect(board).toHaveAttribute("data-variant", "poster");
    expect(within(board).getAllByRole("group")).toHaveLength(9);
    expect(screen.getByRole("heading", { name: "RED" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
    expect(screen.getByText("아직 비어있어요...")).toBeVisible();
  });

  it("헤더 로고와 제목은 고정 헤더의 패딩 안쪽에 맞는 크기 규칙을 가진다", () => {
    render(
      <ImageBoardPage
        state={createBoardState({
          color: designTokens.color.colorCard.blue,
        })}
      />,
    );

    const logo = screen.getByRole("button", { name: "Choose current color again" });
    const logoImage = logo.querySelector(".ds-logo-image");

    if (!(logoImage instanceof HTMLImageElement)) {
      throw new Error("Image board logo image must be rendered.");
    }

    expect(logo).toHaveClass("ds-page-logo");
    expect(screen.getByRole("main")).toHaveStyle({
      "--ds-page-logo-height": designTokens.component.pageLogo.height,
      "--ds-page-logo-width": designTokens.component.pageLogo.width,
    });
    expect(getCssRuleStyle(".ds-page-logo").getPropertyValue("width")).toBe(
      "min(100%, var(--ds-page-logo-width, 377px))",
    );
    expect(getCssRuleStyle(".ds-page-logo").getPropertyValue("height")).toBe(
      "var(--ds-page-logo-height, 69px)",
    );
    expect(getCssRuleStyle(".ds-page-logo .ds-logo-image").getPropertyValue("width")).toBe("100%");
    expect(getCssRuleStyle(".image-board-header").getPropertyValue("grid-template-columns")).toBe(
      "40px minmax(0, 1fr) 40px",
    );
    expect(getCssRuleStyle(".image-board-header").getPropertyValue("padding")).toBe(
      "24px 6px 11px",
    );
    expect(getCssRuleStyle(".image-board-logo").getPropertyValue("max-width")).toBe("100%");
    expect(getCssRuleStyle(".image-board-info-button").getPropertyValue("grid-column")).toBe("3");
    expect(getCssRuleStyle(".image-board-title").getPropertyValue("line-height")).toBe("1.25");
  });

  it("로고 버튼은 현재 보드 상태로 색상 선택 복귀를 요청한다", async () => {
    const user = userEvent.setup();
    const onResetFlow = vi.fn<(state: ColorDeterminedAppState) => void>();
    const state = createBoardState({
      color: designTokens.color.colorCard.blue,
    });
    render(<ImageBoardPage onResetFlow={onResetFlow} state={state} />);

    await user.click(screen.getByRole("button", { name: "Choose current color again" }));

    expect(onResetFlow).toHaveBeenCalledWith(state);
    expect(
      screen.queryByRole("link", { name: "Choose current color again" }),
    ).not.toBeInTheDocument();
  });

  it("부분적으로 채운 보드는 다운로드를 막는다", async () => {
    const user = userEvent.setup();
    const exportBoardImage = vi.fn<ExportBoardImage>(async () => new Blob(["board"]));
    render(
      <ImageBoardPage
        exportBoardImage={exportBoardImage}
        state={createBoardState({ images: createBoard([[0, createSampleImage(1)]]) })}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Image board, 1 of 9 slots filled" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
    expect(screen.getByText("아직 비어있어요...")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "DOWNLOAD" }));

    expect(exportBoardImage).not.toHaveBeenCalled();
  });

  it("가득 채운 보드는 모든 슬롯을 채운 상태로 읽힌다", () => {
    render(
      <ImageBoardPage
        state={createBoardState({
          images: createBoard(
            Array.from(
              { length: 9 },
              (_, index) => [index, createSampleImage(index)] as [number, Image],
            ),
          ),
        })}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Image board, 9 of 9 slots filled" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeEnabled();
  });

  it("이미지를 추가하면 슬롯을 채우고 변경된 보드 상태를 저장한다", async () => {
    const user = userEvent.setup();
    const image = createSampleImage(1);
    const createImageFromFile = vi.fn<(file: File, slotIndex: number) => Promise<Image>>(
      async () => image,
    );
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {});
    render(
      <ControlledImageBoardPage
        createImageFromFile={createImageFromFile}
        saveBoardState={saveBoardState}
      />,
    );

    const file = new File(["image"], "red.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Upload image to slot 1"), file);

    const expectedState = createBoardState({
      images: createBoard([[0, image]]),
    });

    expect(createImageFromFile).toHaveBeenCalledWith(file, 0);
    await waitFor(() => expect(saveBoardState).toHaveBeenCalledWith(expectedState));
    expect(await screen.findByRole("img", { name: "Sample image 1" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Image board, 1 of 9 slots filled" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
  });

  it("이미지 저장에 실패하면 보드를 바꾸지 않고 오류를 보여준다", async () => {
    const user = userEvent.setup();
    const image = createSampleImage(1);
    const createImageFromFile = vi.fn<(file: File, slotIndex: number) => Promise<Image>>(
      async () => image,
    );
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {
      throw new Error("storage failed");
    });
    const onBoardChange = vi.fn<(state: ColorDeterminedAppState) => void>();
    render(
      <ImageBoardPage
        createImageFromFile={createImageFromFile}
        onBoardChange={onBoardChange}
        saveBoardState={saveBoardState}
        state={createBoardState()}
      />,
    );

    await user.upload(
      screen.getByLabelText("Upload image to slot 1"),
      new File(["image"], "red.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이미지를 추가하지 못했어요. PNG, JPG, WebP, HEIF/HEIC 파일을 사용해주세요.",
    );
    expect(onBoardChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("img", { name: "Sample image 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
  });

  it("파일 크기 제한으로 이미지 추가가 실패하면 크기 안내를 보여준다", async () => {
    const user = userEvent.setup();
    const createImageFromFile = vi.fn<(file: File, slotIndex: number) => Promise<Image>>(
      async () => {
        throw new BoardImageFileSizeError(MAX_BOARD_IMAGE_FILE_SIZE_BYTES + 1);
      },
    );
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {});
    render(
      <ImageBoardPage
        createImageFromFile={createImageFromFile}
        saveBoardState={saveBoardState}
        state={createBoardState()}
      />,
    );

    const file = new File(["image"], "large.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Upload image to slot 1"), file);

    expect(createImageFromFile).toHaveBeenCalledWith(file, 0);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이미지 파일이 너무 커요. 10MB 이하의 이미지를 선택해주세요.",
    );
    expect(saveBoardState).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("img", { name: "Uploaded board image large.png" }),
    ).not.toBeInTheDocument();
  });

  it("저장 중에는 오래된 보드를 다운로드하지 못하게 막는다", async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    const saveDeferred = createDeferred<void>();
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(
      () => saveDeferred.promise,
    );
    const exportBoardImage = vi.fn<ExportBoardImage>(
      async () => new Blob(["board"], { type: "image/png" }),
    );
    render(
      <ControlledImageBoardPage
        exportBoardImage={exportBoardImage}
        saveBoardState={saveBoardState}
        initialState={createBoardState({ images: createFilledBoard() })}
      />,
    );
    const dropPoint = mockDownloadSheetDropTargetRect();
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 1);
    moveSlotDragToPoint(slotFrames, 1, dropPoint);
    dropSlotDragAtPoint(slotFrames, 1, dropPoint);
    await act(async () => {});
    vi.useRealTimers();

    await waitFor(() => expect(saveBoardState).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "DOWNLOAD" }));
    expect(exportBoardImage).not.toHaveBeenCalled();

    saveDeferred.resolve();
    await waitFor(() =>
      expect(
        screen.getByRole("group", { name: "Image board, 8 of 9 slots filled" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
  });

  it("이미지를 제거하면 요청한 슬롯만 비우고 저장한다", async () => {
    vi.useFakeTimers();
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {});
    const firstImage = createSampleImage(1);
    const secondImage = createSampleImage(2);
    render(
      <ControlledImageBoardPage
        initialState={createBoardState({
          images: createBoard([
            [0, firstImage],
            [1, secondImage],
          ]),
        })}
        saveBoardState={saveBoardState}
      />,
    );
    const dropPoint = mockDownloadSheetDropTargetRect();
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 0);

    expect(screen.queryByRole("button", { name: "DOWNLOAD" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("삭제하려면 끌어다 놓으세요");

    moveSlotDragToPoint(slotFrames, 0, dropPoint);
    dropSlotDragAtPoint(slotFrames, 0, dropPoint);
    await act(async () => {});

    expect(saveBoardState).toHaveBeenCalledWith(
      createBoardState({
        images: createBoard([[1, secondImage]]),
      }),
    );
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    vi.useRealTimers();
    await waitFor(() =>
      expect(screen.queryByRole("img", { name: "Sample image 1" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("img", { name: "Sample image 2" })).toBeInTheDocument();
  });

  it("이미지 슬롯을 길게 눌러 옮기면 재배치된 보드를 저장한다", async () => {
    vi.useFakeTimers();
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {});
    const firstImage = createSampleImage(1);
    const secondImage = createSampleImage(2);
    const thirdImage = createSampleImage(3);
    render(
      <ControlledImageBoardPage
        initialState={createBoardState({
          images: createBoard([
            [0, firstImage],
            [1, secondImage],
            [2, thirdImage],
          ]),
        })}
        saveBoardState={saveBoardState}
      />,
    );
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 0);
    moveSlotDragTo(slotFrames, 0, 2);
    dropSlotDragAt(slotFrames, 0, 2);
    await act(async () => {});

    expect(saveBoardState).toHaveBeenCalledWith(
      createBoardState({
        images: createBoard([
          [0, secondImage],
          [1, thirdImage],
          [2, firstImage],
        ]),
      }),
    );
    expect(screen.getByRole("img", { name: "Sample image 1" })).toBeInTheDocument();
  });

  it("이미지 슬롯 재배치 저장에 실패하면 원래 보드를 유지하고 오류를 보여준다", async () => {
    vi.useFakeTimers();
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {
      throw new Error("storage failed");
    });
    const onBoardChange = vi.fn<(state: ColorDeterminedAppState) => void>();
    const firstImage = createSampleImage(1);
    const secondImage = createSampleImage(2);
    render(
      <ImageBoardPage
        onBoardChange={onBoardChange}
        saveBoardState={saveBoardState}
        state={createBoardState({
          images: createBoard([
            [0, firstImage],
            [1, secondImage],
          ]),
        })}
      />,
    );
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 0);
    moveSlotDragTo(slotFrames, 0, 1);
    dropSlotDragAt(slotFrames, 0, 1);
    await act(async () => {});

    expect(saveBoardState).toHaveBeenCalledWith(
      createBoardState({
        images: createBoard([
          [0, secondImage],
          [1, firstImage],
        ]),
      }),
    );
    expect(onBoardChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "이미지 위치를 바꾸지 못했어요. 다시 시도해주세요.",
    );
    expect(screen.getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual([
      "Sample image 1",
      "Sample image 2",
    ]);
    expect(screen.getByRole("group", { name: /Image board/ })).toHaveAttribute(
      "data-reordering",
      "returning",
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole("group", { name: /Image board/ })).not.toHaveAttribute(
      "data-reordering",
    );
  });

  it("다운로드를 실행하면 보드 Blob을 내려받고 완료 상태를 보여준다", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["board"], { type: "image/png" });
    const exportBoardImage = vi.fn<ExportBoardImage>(async () => blob);
    const triggerDownload = vi.fn<TriggerBoardDownload>();
    const state = createBoardState({ images: createFilledBoard() });
    render(
      <ImageBoardPage
        exportBoardImage={exportBoardImage}
        state={state}
        triggerDownload={triggerDownload}
      />,
    );

    await user.click(screen.getByRole("button", { name: "DOWNLOAD" }));

    await waitFor(() =>
      expect(exportBoardImage).toHaveBeenCalledWith(state.images, {
        color: "#ef4b4b",
        colorLabel: "RED",
      }),
    );
    expect(triggerDownload).toHaveBeenCalledWith(
      blob,
      expect.stringMatching(/^colorhunting-red-\d{4}-\d{2}-\d{2}\.png$/),
    );
    expect(await screen.findByText("다운로드 완료했어요!")).toBeVisible();
  });

  it("다운로드 export가 실패하면 파일 저장을 실행하지 않고 오류를 보여준다", async () => {
    const user = userEvent.setup();
    const exportBoardImage = vi.fn<ExportBoardImage>(async () => {
      throw new Error("export failed");
    });
    const triggerDownload = vi.fn<TriggerBoardDownload>();
    render(
      <ImageBoardPage
        exportBoardImage={exportBoardImage}
        state={createBoardState({ images: createFilledBoard() })}
        triggerDownload={triggerDownload}
      />,
    );

    await user.click(screen.getByRole("button", { name: "DOWNLOAD" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "보드 이미지를 만들지 못했어요. 다시 시도해주세요.",
    );
    expect(triggerDownload).not.toHaveBeenCalled();
    expect(screen.queryByText("다운로드 완료했어요!")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeEnabled();
  });

  it("색상명은 노란색만 검정 텍스트를 사용한다", () => {
    const { rerender } = render(<ImageBoardPage state={createBoardState()} />);

    expect(screen.getByRole("main")).toHaveStyle("--image-board-theme-text-color: #ffffff");

    rerender(
      <ImageBoardPage
        state={createBoardState({
          color: designTokens.color.colorCard.yellow,
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "YELLOW" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveStyle("--image-board-theme-text-color: #000000");
  });

  it("정보 팝업은 열기 버튼에서 열린다", async () => {
    const user = userEvent.setup();
    render(
      <ImageBoardPage
        state={createBoardState({
          color: designTokens.color.colorCard.blue,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "컬러헌팅 정보 열기" }));

    expect(screen.getByRole("dialog", { name: "컬러헌팅(Color Hunting)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "컬러헌팅 정보 닫기" })).toHaveFocus();
  });
});

function createBoardState(
  options: {
    color?: string;
    images?: Board;
  } = {},
): ColorDeterminedAppState {
  const color = createColor(options.color ?? designTokens.color.colorCard.red);

  if (color === null) {
    throw new Error("Test color must be valid.");
  }

  return {
    color,
    images: options.images ?? createEmptyBoard(),
    state: "COLOR_DETERMINED",
  };
}

type ControlledImageBoardPageProps = Omit<
  Parameters<typeof ImageBoardPage>[0],
  "onBoardChange" | "state"
> & {
  initialState?: ColorDeterminedAppState;
};

function ControlledImageBoardPage({
  initialState = createBoardState(),
  ...props
}: ControlledImageBoardPageProps) {
  const [state, setState] = useState<ColorDeterminedAppState>(initialState);

  return <ImageBoardPage {...props} onBoardChange={setState} state={state} />;
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

function mockDownloadSheetDropTargetRect() {
  const downloadButton = screen.getByRole("button", { name: "DOWNLOAD" });
  const dropTarget = downloadButton.closest(".image-board-download-motion");

  if (!(dropTarget instanceof HTMLElement)) {
    throw new Error("Download bottom sheet drop target must be rendered.");
  }

  mockElementRect(dropTarget, 0, 320, 390, 140);

  return { x: 195, y: 370 };
}

function createBoard(entries: Array<[number, Image]> = []): Board {
  const board = createEmptyBoard();

  for (const [slotIndex, image] of entries) {
    board[slotIndex] = image;
  }

  return board;
}

function createFilledBoard(): Board {
  return createBoard(
    Array.from({ length: 9 }, (_, index) => [index, createSampleImage(index)] as [number, Image]),
  );
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

function getCssRuleStyle(selectorText: string): CSSStyleDeclaration {
  for (const styleSheet of document.styleSheets) {
    for (const rule of Array.from(styleSheet.cssRules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText === selectorText) {
        return rule.style;
      }
    }
  }

  throw new Error(`Expected CSS rule for ${selectorText}.`);
}
