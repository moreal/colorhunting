type BoardFileShareData = {
  files: File[];
  title: string;
};

type BoardFileShareNavigator = Navigator & {
  canShare?: (data: BoardFileShareData) => boolean;
  share?: (data: BoardFileShareData) => Promise<void>;
};

export async function triggerBoardDownload(blob: Blob, fileName: string): Promise<void> {
  const shareData = createBoardFileShareData(blob, fileName);

  if (shareData !== null && canShareBoardFile(shareData)) {
    await shareBoardFile(shareData);
    return;
  }

  triggerAnchorDownload(blob, fileName);
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
