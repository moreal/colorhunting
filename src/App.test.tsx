import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("색상 선택 페이지를 앱의 첫 화면으로 렌더링한다", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Colorhunting home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });
});
