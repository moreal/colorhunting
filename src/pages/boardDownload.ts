import type { BoardDownloadResult } from "../domain/imageBoard";

type BoardFileShareData = {
  files: File[];
  title: string;
};

type BoardFileShareNavigator = Navigator & {
  canShare?: (data: BoardFileShareData) => boolean;
  share?: (data: BoardFileShareData) => Promise<void>;
};

export async function triggerBoardDownload(
  blob: Blob,
  fileName: string,
): Promise<BoardDownloadResult> {
  const shareData = createBoardFileShareData(blob, fileName);

  if (shareData !== null && canShareBoardFile(shareData)) {
    await shareBoardFile(shareData);
    return { type: "completed" };
  }

  if (shouldUseManualSaveFallback(navigator.userAgent)) {
    return createManualBoardDownload(blob, fileName);
  }

  triggerAnchorDownload(blob, fileName);
  return { type: "completed" };
}

function createBoardFileShareData(blob: Blob, fileName: string): BoardFileShareData | null {
  if (typeof File !== "function") {
    return null;
  }

  return {
    files: [new File([blob], fileName, { type: blob.type || "image/png" })],
    title: fileName,
  };
}

function canShareBoardFile(shareData: BoardFileShareData): boolean {
  const shareNavigator = navigator as BoardFileShareNavigator;

  if (typeof shareNavigator.canShare !== "function" || typeof shareNavigator.share !== "function") {
    return false;
  }

  try {
    return shareNavigator.canShare(shareData);
  } catch {
    return false;
  }
}

async function shareBoardFile(shareData: BoardFileShareData): Promise<void> {
  const shareNavigator = navigator as BoardFileShareNavigator;

  await shareNavigator.share?.(shareData);
}

function isLikelyAndroidWebView(userAgent: string): boolean {
  if (!/Android/i.test(userAgent)) {
    return false;
  }

  return /\bwv\b|Version\/4\.0|KAKAOTALK|GSA\//i.test(userAgent);
}

function shouldUseManualSaveFallback(userAgent: string): boolean {
  return isManualSaveModeForced() || isLikelyAndroidWebView(userAgent);
}

function isManualSaveModeForced(): boolean {
  const params = new URLSearchParams(window.location.search);

  return params.get("e2e") === "1" && params.get("e2eDownload") === "manual-save";
}

function createManualBoardDownload(blob: Blob, fileName: string): BoardDownloadResult {
  return {
    fileName,
    mimeType: blob.type || "image/png",
    objectUrl: URL.createObjectURL(blob),
    type: "manual-save",
  };
}

function triggerAnchorDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = objectUrl;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
