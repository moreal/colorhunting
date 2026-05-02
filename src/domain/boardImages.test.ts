import { describe, expect, it } from "vitest";
import {
  BOARD_IMAGE_FILE_ACCEPT,
  BoardImageFileSizeError,
  MAX_BOARD_IMAGE_FILE_SIZE_BYTES,
  MAX_BOARD_IMAGE_FILE_SIZE_LABEL,
  createBoardImageFromFile,
  isAcceptedBoardImageFile,
} from "./boardImages";

describe("boardImages", () => {
  it("이미지 파일 크기는 10MB까지 허용한다", () => {
    expect(MAX_BOARD_IMAGE_FILE_SIZE_BYTES).toBe(10_000_000);
    expect(MAX_BOARD_IMAGE_FILE_SIZE_LABEL).toBe("10MB");
  });

  it("PNG JPEG WebP HEIF HEIC 파일만 보드 입력으로 허용한다", () => {
    expect(BOARD_IMAGE_FILE_ACCEPT).toBe(
      "image/png,image/jpeg,image/webp,image/heif,image/heic,.png,.jpg,.jpeg,.webp,.heif,.heic",
    );
    expect(isAcceptedBoardImageFile(new File(["image"], "sample.png", { type: "image/png" }))).toBe(
      true,
    );
    expect(
      isAcceptedBoardImageFile(new File(["image"], "sample.jpg", { type: "image/jpeg" })),
    ).toBe(true);
    expect(
      isAcceptedBoardImageFile(new File(["image"], "sample.webp", { type: "image/webp" })),
    ).toBe(true);
    expect(
      isAcceptedBoardImageFile(new File(["image"], "sample.heif", { type: "image/heif" })),
    ).toBe(true);
    expect(
      isAcceptedBoardImageFile(new File(["image"], "sample.heic", { type: "image/heic" })),
    ).toBe(true);
    expect(isAcceptedBoardImageFile(new File(["image"], "sample.HEIC"))).toBe(true);
    expect(isAcceptedBoardImageFile(new File(["image"], "sample.gif", { type: "image/gif" }))).toBe(
      false,
    );
  });

  it("허용된 파일은 저장 가능한 이미지 상태로 변환한다", async () => {
    const image = await createBoardImageFromFile(
      new File(["image"], "palette.png", { type: "image/png" }),
      {
        idFactory: () => "fixed-image-id",
      },
    );

    expect(image).toMatchObject({
      altText: "Uploaded board image palette.png",
      id: "fixed-image-id",
      mimeType: "image/png",
      name: "palette.png",
    });
    expect(image.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("10MB 파일은 data URL로 변환해도 저장 가능한 이미지 상태를 만든다", async () => {
    const image = await createBoardImageFromFile(
      new File([new Uint8Array(MAX_BOARD_IMAGE_FILE_SIZE_BYTES)], "max.png", {
        type: "image/png",
      }),
      {
        idFactory: () => "fixed-image-id",
      },
    );

    expect(image.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("HEIF 계열 파일은 브라우저 MIME이 비어 있어도 확장자로 저장 가능한 이미지 상태를 만든다", async () => {
    const image = await createBoardImageFromFile(new File(["image"], "photo.HEIC"), {
      idFactory: () => "fixed-image-id",
    });

    expect(image).toMatchObject({
      altText: "Uploaded board image photo.HEIC",
      id: "fixed-image-id",
      mimeType: "image/heic",
      name: "photo.HEIC",
    });
    expect(image.dataUrl).toMatch(/^data:image\/heic;base64,/);
  });

  it("명확한 미지원 MIME이 있으면 확장자만으로 허용하지 않는다", async () => {
    await expect(
      createBoardImageFromFile(new File(["image"], "renamed.heic", { type: "image/gif" })),
    ).rejects.toThrow("Only PNG, JPEG, WebP, and HEIF/HEIC images can be added to the board.");
  });

  it("허용되지 않은 파일은 이미지 상태로 변환하지 않는다", async () => {
    await expect(
      createBoardImageFromFile(new File(["image"], "palette.gif", { type: "image/gif" })),
    ).rejects.toThrow("Only PNG, JPEG, WebP, and HEIF/HEIC images can be added to the board.");
  });

  it("저장 한계를 넘는 큰 파일은 읽기 전에 거부한다", async () => {
    const largeFile = new File([new Uint8Array(MAX_BOARD_IMAGE_FILE_SIZE_BYTES + 1)], "large.png", {
      type: "image/png",
    });
    const createImage = createBoardImageFromFile(largeFile);

    await expect(createImage).rejects.toBeInstanceOf(BoardImageFileSizeError);
    await expect(createImage).rejects.toMatchObject({
      fileSize: MAX_BOARD_IMAGE_FILE_SIZE_BYTES + 1,
      maxFileSize: MAX_BOARD_IMAGE_FILE_SIZE_BYTES,
    });
  });

  it("파일을 읽어도 저장 계약을 만족하지 못하면 이미지 상태를 만들지 않는다", async () => {
    await expect(
      createBoardImageFromFile(new File(["image"], "palette.png", { type: "image/png" }), {
        idFactory: () => "",
      }),
    ).rejects.toThrow("The selected image cannot be stored.");
  });
});
