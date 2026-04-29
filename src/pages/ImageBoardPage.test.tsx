import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createColor,
  createEmptyBoard,
  type Board,
  type ColorDeterminedAppState,
  type Image,
} from "../appState";
import { designTokens } from "../designSystem/tokens";
import { ImageBoardPage, type ExportBoardImage, type TriggerBoardDownload } from "./ImageBoardPage";

describe("ImageBoardPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("확정된 색상 상태가 아니면 보드 페이지를 렌더링하지 않는다", () => {
    render(<ImageBoardPage state={{ state: "NO_COLOR" }} />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "DOWNLOAD" })).not.toBeInTheDocument();
  });

  it("빈 보드는 9개 슬롯과 비활성 다운로드 상태를 보여준다", () => {
    render(<ImageBoardPage state={createBoardState()} />);

    const board = screen.getByRole("group", { name: "Image board, 0 of 9 slots filled" });

    expect(within(board).getAllByRole("group")).toHaveLength(9);
    expect(screen.getByRole("heading", { name: "RED" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
    expect(screen.getByText("아직 비어있어요...")).toBeVisible();
  });

  it("부분적으로 채운 보드는 다운로드를 활성화한다", () => {
    render(
      <ImageBoardPage
        state={createBoardState({ images: createBoard([[0, createSampleImage(1)]]) })}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Image board, 1 of 9 slots filled" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeEnabled();
    expect(screen.queryByText("아직 비어있어요...")).not.toBeInTheDocument();
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
    const onBoardChange = vi.fn<(state: ColorDeterminedAppState) => void>();
    render(
      <ImageBoardPage
        createImageFromFile={createImageFromFile}
        onBoardChange={onBoardChange}
        saveBoardState={saveBoardState}
        state={createBoardState()}
      />,
    );

    const file = new File(["image"], "red.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Upload image to slot 1"), file);

    const expectedState = createBoardState({
      images: createBoard([[0, image]]),
    });

    expect(createImageFromFile).toHaveBeenCalledWith(file, 0);
    await waitFor(() => expect(saveBoardState).toHaveBeenCalledWith(expectedState));
    expect(onBoardChange).toHaveBeenCalledWith(expectedState);
    expect(await screen.findByRole("img", { name: "Sample image 1" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeEnabled());
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
      "이미지를 추가하지 못했어요. PNG, JPG, WebP 파일을 사용해주세요.",
    );
    expect(onBoardChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("img", { name: "Sample image 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
  });

  it("저장 중에는 오래된 보드를 다운로드하지 못하게 막는다", async () => {
    const user = userEvent.setup();
    const saveDeferred = createDeferred<void>();
    const createImageFromFile = vi.fn<(file: File, slotIndex: number) => Promise<Image>>(async () =>
      createSampleImage(2),
    );
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(
      () => saveDeferred.promise,
    );
    const exportBoardImage = vi.fn<ExportBoardImage>(
      async () => new Blob(["board"], { type: "image/png" }),
    );
    render(
      <ImageBoardPage
        createImageFromFile={createImageFromFile}
        exportBoardImage={exportBoardImage}
        saveBoardState={saveBoardState}
        state={createBoardState({ images: createBoard([[0, createSampleImage(1)]]) })}
      />,
    );

    await user.upload(
      screen.getByLabelText("Upload image to slot 2"),
      new File(["image"], "green.png", { type: "image/png" }),
    );

    await waitFor(() => expect(saveBoardState).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "DOWNLOAD" }));
    expect(exportBoardImage).not.toHaveBeenCalled();

    saveDeferred.resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeEnabled());
  });

  it("이미지를 제거하면 요청한 슬롯만 비우고 저장한다", async () => {
    const user = userEvent.setup();
    const saveBoardState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(async () => {});
    const firstImage = createSampleImage(1);
    const secondImage = createSampleImage(2);
    render(
      <ImageBoardPage
        saveBoardState={saveBoardState}
        state={createBoardState({
          images: createBoard([
            [0, firstImage],
            [1, secondImage],
          ]),
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove image from slot 1" }));

    await waitFor(() =>
      expect(saveBoardState).toHaveBeenCalledWith(
        createBoardState({
          images: createBoard([[1, secondImage]]),
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("img", { name: "Sample image 1" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("img", { name: "Sample image 2" })).toBeInTheDocument();
  });

  it("다운로드를 실행하면 보드 Blob을 내려받고 완료 상태를 보여준다", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["board"], { type: "image/png" });
    const exportBoardImage = vi.fn<ExportBoardImage>(async () => blob);
    const triggerDownload = vi.fn<TriggerBoardDownload>();
    const state = createBoardState({ images: createBoard([[0, createSampleImage(1)]]) });
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
        state={createBoardState({ images: createBoard([[0, createSampleImage(1)]]) })}
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

  it("밝은 노란색 테마는 화면 설계서처럼 검정 텍스트를 사용한다", () => {
    render(
      <ImageBoardPage
        state={createBoardState({
          color: designTokens.color.colorCard.yellow,
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "YELLOW" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveStyle("--image-board-theme-text-color: #050608");
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

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
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
