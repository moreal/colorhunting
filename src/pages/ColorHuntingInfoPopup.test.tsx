import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ColorHuntingInfoPopup } from "./ColorHuntingInfoPopup";

describe("ColorHuntingInfoPopup", () => {
  afterEach(() => {
    cleanup();
  });

  it("공통 설명, 개인정보 안내, 프로필 링크를 보여준다", () => {
    render(<ColorHuntingInfoPopup onClose={vi.fn<() => void>()} open />);

    const dialog = screen.getByRole("dialog", { name: "컬러헌팅(Color Hunting)" });

    expect(within(dialog).getByText(/컬러헌팅\(Color Hunting\)이란/)).toBeInTheDocument();
    expect(within(dialog).getByText(/보물찾기하듯 찾고/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "(p.s. 사진은 외부로 업로드되지 않고 사용 중인 기기 안에서만 처리됩니다! 걱정하지 마세요!)",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "@OYOUNG" })).toHaveAttribute(
      "href",
      "https://www.behance.net/Oyoung50",
    );
    expect(within(dialog).getByRole("link", { name: "@moreal" })).toHaveAttribute(
      "href",
      "https://github.com/moreal",
    );
  });
});
