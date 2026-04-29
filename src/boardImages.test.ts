import { describe, expect, it } from "vitest";
import {
  BOARD_IMAGE_FILE_ACCEPT,
  createBoardImageFromFile,
  isAcceptedBoardImageFile,
} from "./boardImages";

describe("boardImages", () => {
  it("PNG JPEG WebP 파일만 보드 입력으로 허용한다", () => {
    expect(BOARD_IMAGE_FILE_ACCEPT).toBe("image/png,image/jpeg,image/webp");
    expect(isAcceptedBoardImageFile(new File(["image"], "sample.png", { type: "image/png" }))).toBe(
      true,
    );
    expect(
      isAcceptedBoardImageFile(new File(["image"], "sample.jpg", { type: "image/jpeg" })),
    ).toBe(true);
    expect(
      isAcceptedBoardImageFile(new File(["image"], "sample.webp", { type: "image/webp" })),
    ).toBe(true);
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

  it("허용되지 않은 파일은 이미지 상태로 변환하지 않는다", async () => {
    await expect(
      createBoardImageFromFile(new File(["image"], "palette.gif", { type: "image/gif" })),
    ).rejects.toThrow("Only PNG, JPEG, and WebP images can be added to the board.");
  });

  it("파일을 읽어도 저장 계약을 만족하지 못하면 이미지 상태를 만들지 않는다", async () => {
    await expect(
      createBoardImageFromFile(new File(["image"], "palette.png", { type: "image/png" }), {
        idFactory: () => "",
      }),
    ).rejects.toThrow("The selected image cannot be stored.");
  });
});
