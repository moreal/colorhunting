import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerBoardDownload } from "./boardDownload";

type BoardFileShareData = {
  files: File[];
  title: string;
};

type CanShareBoardFile = (data: BoardFileShareData) => boolean;
type ShareBoardFile = (data: BoardFileShareData) => Promise<void>;

const ORIGINAL_NAVIGATOR_DESCRIPTORS = {
  canShare: Object.getOwnPropertyDescriptor(navigator, "canShare"),
  share: Object.getOwnPropertyDescriptor(navigator, "share"),
};
const ORIGINAL_URL_DESCRIPTORS = {
  createObjectURL: Object.getOwnPropertyDescriptor(URL, "createObjectURL"),
  revokeObjectURL: Object.getOwnPropertyDescriptor(URL, "revokeObjectURL"),
};

describe("boardDownload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    restoreProperty(navigator, "canShare", ORIGINAL_NAVIGATOR_DESCRIPTORS.canShare);
    restoreProperty(navigator, "share", ORIGINAL_NAVIGATOR_DESCRIPTORS.share);
    restoreProperty(URL, "createObjectURL", ORIGINAL_URL_DESCRIPTORS.createObjectURL);
    restoreProperty(URL, "revokeObjectURL", ORIGINAL_URL_DESCRIPTORS.revokeObjectURL);
  });

  it("navigator.canShare가 보드 파일 공유를 지원하면 Web Share API를 사용한다", async () => {
    const fileName = "colorhunting-red-2026-05-24.png";
    const blob = new Blob(["board"], { type: "image/png" });
    const { canShare, share } = mockNavigatorFileShare({ canShareResult: true });
    const { createObjectURL } = mockObjectUrl();

    await triggerBoardDownload(blob, fileName);

    expect(canShare).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledOnce();
    expect(createObjectURL).not.toHaveBeenCalled();

    const shareData = share.mock.calls[0]?.[0];
    expect(shareData).toBe(canShare.mock.calls[0]?.[0]);
    expect(shareData).toMatchObject({
      title: fileName,
    });
    expect(shareData?.files).toHaveLength(1);

    const [sharedFile] = shareData?.files ?? [];
    expect(sharedFile).toBeInstanceOf(File);
    expect(sharedFile.name).toBe(fileName);
    expect(sharedFile.size).toBe(blob.size);
    expect(sharedFile.type).toBe("image/png");
  });

  it("navigator.canShare가 보드 파일 공유를 지원하지 않으면 anchor 다운로드를 사용한다", async () => {
    vi.useFakeTimers();
    const fileName = "colorhunting-red-2026-05-24.png";
    const blob = new Blob(["board"], { type: "image/png" });
    const { canShare, share } = mockNavigatorFileShare({ canShareResult: false });
    const { createObjectURL, revokeObjectURL } = mockObjectUrl();
    const clickedLinks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function clickAnchor(this: HTMLAnchorElement) {
        clickedLinks.push(this);
      },
    );

    await triggerBoardDownload(blob, fileName);

    expect(canShare).toHaveBeenCalledOnce();
    expect(share).not.toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0]).toMatchObject({
      download: fileName,
      href: "blob:colorhunting-board",
      rel: "noopener",
    });
    expect(clickedLinks[0]?.isConnected).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:colorhunting-board");
  });
});

function mockNavigatorFileShare(options: { canShareResult: boolean }) {
  const canShare = vi.fn<CanShareBoardFile>(() => options.canShareResult);
  const share = vi.fn<ShareBoardFile>(async () => {});

  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: canShare,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });

  return { canShare, share };
}

function mockObjectUrl() {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:colorhunting-board");
  const revokeObjectURL = vi.fn<(objectUrl: string) => void>();

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });

  return { createObjectURL, revokeObjectURL };
}

function restoreProperty<T extends object, K extends PropertyKey>(
  target: T,
  property: K,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor === undefined) {
    delete (target as Record<K, unknown>)[property];
    return;
  }

  Object.defineProperty(target, property, descriptor);
}
