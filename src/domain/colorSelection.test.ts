import { describe, expect, it } from "vitest";
import { createEmptyBoard } from "./appState";
import {
  COLOR_SELECTION_OPTIONS,
  createConfirmedColorState,
  findColorSelectionOption,
  getColorSelectionConfirmTextColor,
  pickRandomColorOption,
} from "./colorSelection";

describe("colorSelection", () => {
  it("제품 색상 후보를 선택 가능한 도메인 옵션으로 제공한다", () => {
    expect(COLOR_SELECTION_OPTIONS.map((option) => option.label)).toEqual([
      "PINK",
      "PURPLE",
      "NAVY",
      "BLUE",
      "GREEN",
      "YELLOW",
      "ORANGE",
      "RED",
    ]);
    expect(COLOR_SELECTION_OPTIONS.at(-1)).toMatchObject({
      color: { hex: "#ef4b4b" },
      label: "RED",
    });
  });

  it("리셋할 때 현재 색상은 다시 뽑지 않는다", () => {
    const [redOption, greenOption] = [
      COLOR_SELECTION_OPTIONS.find((option) => option.label === "RED"),
      COLOR_SELECTION_OPTIONS.find((option) => option.label === "GREEN"),
    ];

    if (redOption === undefined || greenOption === undefined) {
      throw new Error("Missing color selection fixture.");
    }

    expect(pickRandomColorOption(redOption, [redOption, greenOption])).toBe(greenOption);
    expect(pickRandomColorOption(redOption, [redOption])).toBe(redOption);
  });

  it("색상을 확정하면 빈 이미지 보드를 가진 앱 상태를 만든다", () => {
    const redOption = COLOR_SELECTION_OPTIONS.find((option) => option.label === "RED");

    if (redOption === undefined) {
      throw new Error("Missing red option fixture.");
    }

    expect(createConfirmedColorState(redOption)).toEqual({
      color: { hex: "#ef4b4b" },
      images: createEmptyBoard(),
      state: "COLOR_DETERMINED",
    });
  });

  it("확정된 앱 색상에서 선택 옵션을 다시 찾는다", () => {
    expect(findColorSelectionOption({ hex: "#EF4B4B" })).toMatchObject({
      color: { hex: "#ef4b4b" },
      label: "RED",
    });
    expect(findColorSelectionOption({ hex: "#123456" })).toBeNull();
  });

  it("확정 버튼 텍스트 색상은 노란색만 검정색을 사용한다", () => {
    const redOption = COLOR_SELECTION_OPTIONS.find((option) => option.label === "RED");
    const yellowOption = COLOR_SELECTION_OPTIONS.find((option) => option.label === "YELLOW");

    if (redOption === undefined || yellowOption === undefined) {
      throw new Error("Missing text color fixtures.");
    }

    expect(getColorSelectionConfirmTextColor(redOption)).toBe("#ffffff");
    expect(getColorSelectionConfirmTextColor(yellowOption)).toBe("#000000");
  });
});
