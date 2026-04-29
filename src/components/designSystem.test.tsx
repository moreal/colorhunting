import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Image } from "../appState";
import { BottomActionBar } from "./BottomActionBar";
import { CloseButton } from "./CloseButton";
import { ColorCard } from "./ColorCard";
import { DownloadButton } from "./DownloadButton";
import { ImageBoard } from "./ImageBoard";
import { ImageSlot } from "./ImageSlot";
import { InfoButton } from "./InfoButton";
import { InfoPopup } from "./InfoPopup";
import { Logo } from "./Logo";

describe("design system components", () => {
  afterEach(() => {
    cleanup();
  });

  it("로고는 홈 링크로 읽히는 제품 이름을 제공한다", () => {
    render(<Logo />);

    expect(screen.getByRole("link", { name: "Colorhunting home" })).toHaveTextContent(
      "Colorhunting",
    );
  });

  it("정보 버튼은 키보드로 실행할 수 있다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<InfoButton onClick={onClick} />);

    screen.getByRole("button", { name: "Open information" }).focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("닫기 버튼은 명시적인 접근 가능한 이름을 가진다", () => {
    render(<CloseButton label="Close popup" />);

    expect(screen.getByRole("button", { name: "Close popup" })).toBeInTheDocument();
  });

  it("다운로드 버튼은 비활성 상태에서 실행되지 않는다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<DownloadButton disabled onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Download unavailable" });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("다운로드 버튼은 완료 상태를 이름과 상태 속성으로 보여준다", () => {
    render(<DownloadButton status="completed" />);

    expect(screen.getByRole("button", { name: "Downloaded" })).toHaveAttribute(
      "data-status",
      "completed",
    );
  });

  it("색상 카드는 현재 색상과 선택 상태를 표시한다", () => {
    render(<ColorCard color={{ hex: "#0f766e" }} status="selected" />);

    expect(screen.getByRole("article", { name: "Theme color #0f766e" })).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("빈 이미지 슬롯은 슬롯 번호가 포함된 파일 입력을 제공한다", () => {
    render(<ImageSlot image={null} slotIndex={2} />);

    expect(screen.getByRole("group", { name: "Add image to slot 3" })).toBeInTheDocument();
    expect(screen.getByLabelText("Upload image to slot 3")).toHaveAttribute(
      "accept",
      "image/png,image/jpeg,image/webp",
    );
  });

  it("이미지 슬롯은 선택한 파일과 슬롯 번호를 상위로 전달한다", async () => {
    const user = userEvent.setup();
    const onImageSelect = vi.fn<(slotIndex: number, file: File) => void>();
    const file = new File(["image"], "palette.png", { type: "image/png" });
    render(<ImageSlot image={null} onImageSelect={onImageSelect} slotIndex={0} />);

    await user.upload(screen.getByLabelText("Upload image to slot 1"), file);

    expect(onImageSelect).toHaveBeenCalledWith(0, file);
  });

  it("채워진 이미지 슬롯은 이미지와 슬롯별 제거 버튼을 보여준다", async () => {
    const user = userEvent.setup();
    const onRemoveImage = vi.fn<(slotIndex: number) => void>();
    render(<ImageSlot image={createSampleImage(1)} onRemoveImage={onRemoveImage} slotIndex={0} />);

    expect(screen.getByRole("img", { name: "Sample image 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove image from slot 1" }));

    expect(onRemoveImage).toHaveBeenCalledWith(0);
  });

  it("이미지 보드는 항상 아홉 개의 슬롯을 렌더링한다", () => {
    render(<ImageBoard images={[createSampleImage(1)]} />);

    const board = screen.getByRole("group", { name: "Image board, 1 of 9 slots filled" });
    const slots = within(board).getAllByRole("group");

    expect(slots).toHaveLength(9);
  });

  it("하단 액션 바는 툴바 역할과 이름으로 액션 묶음을 표현한다", () => {
    render(
      <BottomActionBar label="Board actions">
        <DownloadButton />
      </BottomActionBar>,
    );

    expect(screen.getByRole("toolbar", { name: "Board actions" })).toBeInTheDocument();
  });

  it("정보 팝업은 열릴 때 포커스를 닫기 버튼으로 보내고 Escape로 닫힌다", async () => {
    const user = userEvent.setup();
    render(<InfoPopupHarness />);

    const opener = screen.getByRole("button", { name: "Open details" });
    await user.click(opener);

    expect(screen.getByRole("dialog", { name: "About Colorhunting" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close information" })).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "About Colorhunting" })).not.toBeInTheDocument();
    });
    expect(opener).toHaveFocus();
  });
});

function InfoPopupHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Open details
      </button>
      <InfoPopup onClose={() => setOpen(false)} open={open} title="About Colorhunting">
        <p>Colorhunting keeps palette and image-board decisions in one flow.</p>
      </InfoPopup>
    </>
  );
}

function createSampleImage(index: number): Image {
  return {
    altText: `Sample image ${index}`,
    dataUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%230f766e'/%3E%3C/svg%3E",
    id: `sample-${index}`,
    mimeType: "image/svg+xml",
    name: `sample-${index}.svg`,
  };
}
