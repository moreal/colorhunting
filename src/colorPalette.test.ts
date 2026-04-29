import { describe, expect, it } from "vitest";
import { createPalette, normalizeHexColor } from "./colorPalette";

describe("normalizeHexColor", () => {
  it("짧은 헥스 색상과 전체 헥스 색상을 정규화한다", () => {
    expect(normalizeHexColor("abc")).toBe("#aabbcc");
    expect(normalizeHexColor("#A1B2C3")).toBe("#a1b2c3");
  });

  it("올바르지 않은 헥스 색상을 거부한다", () => {
    expect(normalizeHexColor("")).toBeNull();
    expect(normalizeHexColor("#12")).toBeNull();
    expect(normalizeHexColor("not-a-color")).toBeNull();
  });
});

describe("createPalette", () => {
  it("예측 가능한 보색을 포함한 올바른 팔레트를 만든다", () => {
    const palette = createPalette("#ff0000");

    expect(palette).toHaveLength(5);
    expect(palette[0]).toMatchObject({ id: "base", hex: "#ff0000" });
    expect(palette[1]).toMatchObject({
      id: "complement",
      hex: "#00ffff",
    });
    expect(palette.every((color) => /^#[\da-f]{6}$/.test(color.hex))).toBe(true);
  });

  it("올바르지 않은 입력으로 팔레트를 만들면 예외를 던진다", () => {
    expect(() => createPalette("blue")).toThrow("Invalid hex color");
  });
});
