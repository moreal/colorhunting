import { describe, expect, it } from "vitest";
import { getColorHuntingThemeTextColor } from "./colorHuntingTheme";
import { designTokens } from "./designSystem/tokens";

describe("getColorHuntingThemeTextColor", () => {
  it("컬러헌팅 팔레트에서는 노란색만 검정 텍스트를 사용한다", () => {
    for (const [label, color] of Object.entries(designTokens.color.colorCard)) {
      const expectedTextColor = label === "yellow" ? "#000000" : "#ffffff";

      expect(getColorHuntingThemeTextColor(color)).toBe(expectedTextColor);
    }
  });

  it("올바르지 않은 색상에는 테마 텍스트 색상을 만들지 않는다", () => {
    expect(() => getColorHuntingThemeTextColor("yellow")).toThrow("Invalid hex color");
  });
});
