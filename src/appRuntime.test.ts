import { describe, expect, it } from "vitest";
import { createE2eAppState, createRuntimeAppProps } from "./appRuntime";

describe("appRuntime", () => {
  it("일반 URL에서는 기본 App props를 사용한다", () => {
    expect(createRuntimeAppProps({ search: "" })).toEqual({});
  });

  it("e2e URL에서는 이미지가 채워진 보드 상태를 주입한다", async () => {
    const props = createRuntimeAppProps({ search: "?e2e=1&e2eColor=BLUE" });
    const appState = await props.storage?.loadAppState();

    expect(appState).toMatchObject({
      color: { hex: "#76d1ff" },
      state: "COLOR_DETERMINED",
    });

    if (appState?.state !== "COLOR_DETERMINED") {
      throw new Error("E2E runtime should create a board state.");
    }

    expect(appState.images.filter(Boolean)).toHaveLength(9);
  });

  it("지원하지 않는 e2e 색상은 빨간색 보드로 대체한다", () => {
    expect(createE2eAppState("?e2e=1&e2eColor=unknown")).toMatchObject({
      color: { hex: "#ef4b4b" },
      state: "COLOR_DETERMINED",
    });
  });
});
