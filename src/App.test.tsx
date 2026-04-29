import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    render(<App />);
  });

  afterEach(() => {
    cleanup();
  });

  it("기본 색상으로 생성된 팔레트를 보여준다", () => {
    expect(screen.getByRole("heading", { name: "Colorhunting" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Generated palette" })).toBeInTheDocument();
    expect(screen.getByText("#4f46e5")).toBeInTheDocument();
  });

  it("사용자가 올바른 헥스 색상을 입력하면 팔레트를 갱신한다", async () => {
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Base color"));
    await user.type(screen.getByLabelText("Base color"), "#ff0000");

    expect(screen.getByText("#ff0000")).toBeInTheDocument();
    expect(screen.getByText("#00ffff")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("올바르지 않은 헥스 입력에는 검증 메시지를 보여준다", async () => {
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Base color"));
    await user.type(screen.getByLabelText("Base color"), "blue");

    expect(screen.getByRole("alert")).toHaveTextContent("Use a 3 or 6 digit hex color.");
  });
});
