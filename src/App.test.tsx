import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createColor,
  createEmptyBoard,
  type AppState,
  type Board,
  type ColorDeterminedAppState,
} from "./domain/appState";
import type { AppStateStorage } from "./appStorage";
import App from "./App";
import { designTokens } from "./designSystem/tokens";
import {
  beginLongPressSlotDragWithRealTimer,
  dropSlotDragAtPoint,
  getImageBoardSlotFrames,
  mockElementRect,
  mockImageBoardSlotRects,
  moveSlotDragToPoint,
  waitForSlotDragSettle,
} from "./test/imageBoardDrag";

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("저장된 상태를 읽는 동안 선택 화면을 먼저 보여주지 않는다", () => {
    const loadDeferred = createDeferred<AppState>();
    const storage = createMemoryStorage({
      loadAppState: () => loadDeferred.promise,
    });

    render(<App storage={storage} />);

    expect(screen.getByText("Colorhunting 불러오는 중")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
  });

  it("저장된 상태가 없으면 색상 선택 화면에서 시작한다", async () => {
    render(<App storage={createMemoryStorage({ initialState: { state: "NO_COLOR" } })} />);

    expect(await screen.findByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("페이지 상태 전환은 별도 레이아웃 애니메이션 wrapper를 만들지 않는다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <App storage={createMemoryStorage({ initialState: { state: "NO_COLOR" } })} />,
    );

    expect(await screen.findByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(container.firstElementChild).toBe(screen.getByRole("main"));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
    expect(container.firstElementChild).toBe(screen.getByRole("main"));
  });

  it("저장된 색상 보드 상태가 있으면 이미지 보드 화면에서 시작한다", async () => {
    render(<App storage={createMemoryStorage({ initialState: createBoardState() })} />);

    expect(await screen.findByRole("heading", { name: "RED" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Image board, 0 of 9 slots filled" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
  });

  it("저장된 상태를 불러오지 못하면 안내를 보여주고 색상 선택으로 복구한다", async () => {
    const storage = createMemoryStorage({
      loadAppState: async () => {
        throw new Error("storage failed");
      },
    });

    render(<App storage={storage} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "저장된 상태를 불러오지 못해 새로 시작합니다.",
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("색상을 확정하면 상태를 저장하고 이미지 보드로 이동한다", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ initialState: { state: "NO_COLOR" } });
    render(<App storage={storage} />);

    await user.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
    expect(storage.saveAppState).toHaveBeenCalledWith({
      state: "COLOR_DETERMINED",
      color: expect.objectContaining({ hex: expect.stringMatching(/^#[0-9a-f]{6}$/) }),
      images: createEmptyBoard(),
    });
    expect(
      screen.getByRole("group", { name: "Image board, 0 of 9 slots filled" }),
    ).toBeInTheDocument();
  });

  it("색상 저장에 실패하면 선택 화면을 유지하고 보드로 이동하지 않는다", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({
      initialState: { state: "NO_COLOR" },
      saveAppState: async () => {
        throw new Error("storage failed");
      },
    });
    render(<App storage={storage} />);

    await user.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "색상을 저장하지 못했어요. 다시 시도해주세요.",
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "DOWNLOAD" })).not.toBeInTheDocument();
  });

  it("새 앱 인스턴스는 이전에 확정해 저장한 보드 상태를 다시 불러온다", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ initialState: { state: "NO_COLOR" } });
    const firstRender = render(<App storage={storage} />);

    await user.click(await screen.findByRole("button", { name: "Confirm" }));
    await screen.findByRole("button", { name: "DOWNLOAD" });

    firstRender.unmount();
    render(<App storage={storage} />);

    expect(await screen.findByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
    expect(
      screen.getByRole("group", { name: "Image board, 0 of 9 slots filled" }),
    ).toBeInTheDocument();
  });

  it("앱에서 추가하고 삭제한 이미지는 저장된 보드 상태로 다시 불러온다", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ initialState: createBoardState() });
    const firstRender = render(<App storage={storage} />);

    await user.upload(
      await screen.findByLabelText("Upload image to slot 1"),
      new File(["image"], "red.png", { type: "image/png" }),
    );

    expect(
      await screen.findByRole("img", { name: "Uploaded board image red.png" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(storage.saveAppState).toHaveBeenCalledWith(
        expect.objectContaining({
          images: expect.arrayContaining([
            expect.objectContaining({
              altText: "Uploaded board image red.png",
              mimeType: "image/png",
              name: "red.png",
            }),
          ]),
          state: "COLOR_DETERMINED",
        }),
      ),
    );

    firstRender.unmount();
    render(<App storage={storage} />);

    expect(
      await screen.findByRole("img", { name: "Uploaded board image red.png" }),
    ).toBeInTheDocument();

    const dropPoint = mockDownloadSheetDropTargetRect();
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);
    await beginLongPressSlotDragWithRealTimer(slotFrames, 0);
    moveSlotDragToPoint(slotFrames, 0, dropPoint);
    dropSlotDragAtPoint(slotFrames, 0, dropPoint);
    await act(async () => {});
    await waitForSlotDragSettle();

    await waitFor(() =>
      expect(
        screen.queryByRole("img", { name: "Uploaded board image red.png" }),
      ).not.toBeInTheDocument(),
    );
    expect(storage.saveAppState).toHaveBeenCalledWith(createBoardState());
  });

  it("로고를 누르면 저장된 보드를 지우고 현재 색상으로 색상 선택에 돌아간다", async () => {
    const user = userEvent.setup();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const storage = createMemoryStorage({
      initialState: createBoardState({ color: designTokens.color.colorCard.blue }),
    });
    render(<App storage={storage} />);

    await user.click(await screen.findByRole("button", { name: "Choose current color again" }));

    expect(storage.clearAppState).toHaveBeenCalledOnce();
    expect(await screen.findByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "BLUE #76d1ff" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "DOWNLOAD" })).not.toBeInTheDocument();
    expect(randomSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it("보드 초기화 저장에 실패하면 현재 보드를 유지하고 오류를 보여준다", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({
      clearAppState: async () => {
        throw new Error("clear failed");
      },
      initialState: createBoardState(),
    });
    render(<App storage={storage} />);

    await user.click(await screen.findByRole("button", { name: "Choose current color again" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "저장된 보드를 지우지 못했어요. 다시 시도해주세요.",
    );
    expect(screen.getByRole("button", { name: "DOWNLOAD" })).toBeDisabled();
  });
});

type MemoryStorageOptions = {
  clearAppState?: () => Promise<void>;
  initialState?: AppState;
  loadAppState?: () => Promise<AppState>;
  saveAppState?: (state: AppState) => Promise<void>;
};

function createMemoryStorage(options: MemoryStorageOptions = {}): AppStateStorage {
  let storedState = options.initialState ?? { state: "NO_COLOR" };

  return {
    clearAppState: vi.fn<() => Promise<void>>(async () => {
      if (options.clearAppState !== undefined) {
        await options.clearAppState();
        return;
      }

      storedState = { state: "NO_COLOR" };
    }),
    loadAppState: vi.fn<() => Promise<AppState>>(async () => {
      if (options.loadAppState !== undefined) {
        return await options.loadAppState();
      }

      return storedState;
    }),
    saveAppState: vi.fn<(state: AppState) => Promise<void>>(async (state) => {
      if (options.saveAppState !== undefined) {
        await options.saveAppState(state);
      }

      storedState = state;
    }),
  };
}

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

function mockDownloadSheetDropTargetRect() {
  const downloadButton = screen.getByRole("button", { name: "DOWNLOAD" });
  const dropTarget = downloadButton.closest(".image-board-download-motion");

  if (!(dropTarget instanceof HTMLElement)) {
    throw new Error("Download bottom sheet drop target must be rendered.");
  }

  mockElementRect(dropTarget, 0, 320, 390, 140);

  return { x: 195, y: 370 };
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
