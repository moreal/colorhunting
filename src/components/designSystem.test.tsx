import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Image } from "../domain/appState";
import { designTokens } from "../designSystem/tokens";
import {
  beginLongPressSlotDrag,
  cancelSlotDrag,
  dropSlotDragAt,
  dropSlotDragOutside,
  getImageBoardSlotFrames,
  getImageBoardSlotGroups,
  mockImageBoardSlotRects,
  movePressedSlotBy,
  moveSlotDragOutside,
  moveSlotDragTo,
  startSlotPress,
} from "../test/imageBoardDrag";
import { BottomActionBar } from "./BottomActionBar";
import { CloseButton } from "./CloseButton";
import { ColorCard } from "./ColorCard";
import { ConfirmButton } from "./ConfirmButton";
import { DownloadBottomSheet } from "./DownloadBottomSheet";
import { DownloadButton } from "./DownloadButton";
import { ImageBoard } from "./ImageBoard";
import { ImageSlot } from "./ImageSlot";
import { InfoButton } from "./InfoButton";
import { InfoPopup } from "./InfoPopup";
import { Logo } from "./Logo";
import { RemoveButton } from "./RemoveButton";
import { ResetButton } from "./ResetButton";

describe("design system components", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

  it("다운로드 버튼은 활성 상태에서 다운로드 실행을 알린다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<DownloadButton onClick={onClick} />);

    const button = screen.getByRole("button", { name: "DOWNLOAD" });
    const icon = button.querySelector(".ds-download-button-icon");

    expect(button).toHaveAttribute("data-state", "enabled");
    expect(button).not.toBeDisabled();
    expect(icon).toHaveAttribute("width", "12");
    expect(icon).toHaveAttribute("height", "14");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("다운로드 버튼은 비활성 상태에서 실행되지 않는다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<DownloadButton disabled onClick={onClick} />);

    const button = screen.getByRole("button", { name: "DOWNLOAD" });

    expect(button).toHaveAttribute("data-state", "disabled");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("다운로드 버튼은 준비 중 상태에서 바쁜 상태를 알리고 실행되지 않는다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<DownloadButton onClick={onClick} status="loading" />);

    const button = screen.getByRole("button", { name: "Preparing download" });

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("확인 버튼은 색상 prop을 배경색 변수로 전달하고 클릭을 실행한다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<ConfirmButton color="#34C759" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Confirm" });

    expect(button).toHaveClass("ds-confirm-button");
    expect(button).toHaveStyle("--ds-confirm-button-background: #34C759");
    expect(button.querySelector(".ds-action-button-icon")).toHaveAttribute("aria-hidden", "true");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("리셋 버튼은 명시적인 이름과 비활성 상태를 제공한다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<ResetButton disabled onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Reset" });

    expect(button).toHaveClass("ds-reset-button");
    expect(button).toBeDisabled();
    expect(button.querySelector(".ds-action-button-icon")).toHaveAttribute("aria-hidden", "true");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("다운로드 바텀시트는 이미지가 부족하면 버튼을 막고 빈 상태 메시지를 보여준다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<DownloadBottomSheet buttonProps={{ onClick }} state="NON_ENOUGH_IMAGES" />);

    const button = screen.getByRole("button", { name: "DOWNLOAD" });

    expect(button).toBeDisabled();
    expect(screen.getByText("아직 비어있어요...")).toBeVisible();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("다운로드 바텀시트는 이미지가 충분하면 버튼만 활성화하고 클릭을 전달한다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<DownloadBottomSheet buttonProps={{ onClick }} state="ENOUGH_IMAGES" />);

    const button = screen.getByRole("button", { name: "DOWNLOAD" });

    expect(button).toHaveAttribute("data-state", "enabled");
    expect(screen.queryByText("아직 비어있어요...")).not.toBeInTheDocument();
    expect(screen.queryByText("다운로드 완료했어요!")).not.toBeInTheDocument();
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("다운로드 바텀시트는 완료 후 성공 메시지를 보여준다", () => {
    render(<DownloadBottomSheet state="DOWNLOAD_COMPLETED" />);

    expect(screen.getByRole("button", { name: "DOWNLOAD" })).not.toBeDisabled();
    expect(screen.getByText("다운로드 완료했어요!")).toBeVisible();
  });

  it("삭제 버튼은 기본 상태와 드래그 오버 상태를 구분한다", () => {
    render(
      <>
        <RemoveButton label="Remove first image" />
        <RemoveButton label="Remove hovered image" pressed />
      </>,
    );

    expect(screen.getByRole("button", { name: "Remove first image" })).toHaveAttribute(
      "data-state",
      "enabled",
    );
    expect(
      screen.getByRole("button", { name: "Remove first image" }).querySelector("svg"),
    ).toHaveAttribute("width", "20");
    expect(
      screen.getByRole("button", { name: "Remove first image" }).querySelector("svg"),
    ).toHaveAttribute("height", "24");
    expect(screen.getByRole("button", { name: "Remove hovered image" })).toHaveAttribute(
      "data-state",
      "pressed",
    );
  });

  it("삭제 버튼은 비활성 상태가 드래그 오버보다 우선하고 실행되지 않는다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    render(<RemoveButton disabled label="Remove disabled image" onClick={onClick} pressed />);

    const button = screen.getByRole("button", { name: "Remove disabled image" });

    expect(button).toHaveAttribute("data-state", "disabled");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("디자인 토큰은 컬러 카드 팔레트와 픽셀 표시 폰트를 제공한다", () => {
    expect(designTokens.font.display).toContain("NeoDunggeunmo Pro");
    expect(designTokens.font.pixel).toContain("Press Start 2P");
    expect(designTokens.component.actionButton).toEqual({
      cornerSize: "2px",
    });
    expect(designTokens.component.pixelCorner).toEqual({
      depth: "2px",
    });
    expect(designTokens.component.colorCard).toEqual({
      glowBlur: "60px",
      glowOpacity: "0.5",
      glowSize: "174px",
      labelFontSize: "18px",
      maxHeight: "174px",
      maxWidth: "146.61px",
      swatchSize: "120.83px",
    });
    expect(designTokens.component.colorSelection).toMatchObject({
      cardFlipDurationSeconds: 0.16,
      copyFontSize: "20px",
      logoHeight: "69px",
      logoWidth: "337px",
    });
    expect(designTokens.color.colorCard).toEqual({
      blue: "#76D1FF",
      green: "#34C759",
      navy: "#000080",
      orange: "#FE931B",
      pink: "#FEB9DE",
      purple: "#AE7BFF",
      red: "#EF4B4B",
      yellow: "#FFE44B",
    });
  });

  it("색상 카드는 색상 라벨과 색상 값을 접근 가능한 이름으로 제공한다", () => {
    render(<ColorCard color={{ hex: designTokens.color.colorCard.green }} title="GREEN" />);

    const card = screen.getByRole("article", { name: "GREEN #34C759" });

    expect(card).not.toHaveAttribute("data-status");
    expect(card).not.toHaveAttribute("aria-busy");
    expect(screen.getByText("GREEN")).toBeVisible();
  });

  it("색상 카드의 glow 레이어는 카드 article 밖에서 분리된다", () => {
    render(<ColorCard color={{ hex: designTokens.color.colorCard.red }} title="RED" />);

    const card = screen.getByRole("article", { name: "RED #EF4B4B" });
    const root = card.parentElement;

    expect(root).toHaveClass("ds-color-card-root");
    expect(root?.querySelector(".ds-color-card-glow")).toHaveAttribute("aria-hidden", "true");
    expect(card.querySelector(".ds-color-card-glow")).not.toBeInTheDocument();
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
    expect(getImageBoardSlotFrames()[0]).not.toHaveAttribute("data-draggable");
    expect(screen.queryByRole("button", { name: /Move image in slot/ })).not.toBeInTheDocument();
  });

  it("이미지 보드는 길게 누른 슬롯을 다른 슬롯 위치로 옮기도록 요청한다", async () => {
    vi.useFakeTimers();
    const onReorderImages = vi.fn<(fromIndex: number, toIndex: number) => boolean>(() => true);
    render(
      <ImageBoard
        images={[createSampleImage(1), createSampleImage(2), createSampleImage(3)]}
        onReorderImages={onReorderImages}
      />,
    );
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 0);
    moveSlotDragTo(slotFrames, 0, 2);

    expect(
      within(getImageBoardSlotGroups()[0]).getByRole("img", { name: "Sample image 2" }),
    ).toBeInTheDocument();
    expect(getImageBoardSlotFrames()[2]).toHaveAttribute("data-drag-state", "dragging");

    dropSlotDragAt(slotFrames, 0, 2);
    await act(async () => {});

    expect(onReorderImages).toHaveBeenCalledWith(0, 2);
    expect(screen.getByRole("group", { name: /Image board/ })).toHaveAttribute(
      "data-reordering",
      "settling",
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole("group", { name: /Image board/ })).not.toHaveAttribute(
      "data-reordering",
    );
  });

  it("이미지 보드는 보드 슬롯 밖에서 드래그를 끝내면 재배치를 요청하지 않고 원래 순서로 복구한다", () => {
    vi.useFakeTimers();
    const onReorderImages = vi.fn<(fromIndex: number, toIndex: number) => boolean>(() => true);
    render(
      <ImageBoard
        images={[createSampleImage(1), createSampleImage(2), createSampleImage(3)]}
        onReorderImages={onReorderImages}
      />,
    );
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 0);
    moveSlotDragTo(slotFrames, 0, 2);
    moveSlotDragOutside(slotFrames, 0);
    dropSlotDragOutside(slotFrames, 0);

    expect(onReorderImages).not.toHaveBeenCalled();
    expect(
      within(getImageBoardSlotGroups()[0]).getByRole("img", { name: "Sample image 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Image board/ })).toHaveAttribute(
      "data-reordering",
      "returning",
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole("group", { name: /Image board/ })).not.toHaveAttribute(
      "data-reordering",
    );
  });

  it("이미지 보드는 길게 누르기 전에 놓거나 움직이면 재배치를 시작하지 않는다", () => {
    vi.useFakeTimers();
    const onReorderImages = vi.fn<(fromIndex: number, toIndex: number) => boolean>(() => true);
    render(
      <ImageBoard
        images={[createSampleImage(1), createSampleImage(2)]}
        onReorderImages={onReorderImages}
      />,
    );
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    startSlotPress(slotFrames, 0);
    dropSlotDragAt(slotFrames, 0, 1);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onReorderImages).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: /Image board/ })).not.toHaveAttribute(
      "data-reordering",
    );

    startSlotPress(slotFrames, 0);
    movePressedSlotBy(slotFrames, 0, 20, 0);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    dropSlotDragAt(slotFrames, 0, 1);
    expect(onReorderImages).not.toHaveBeenCalled();
  });

  it("이미지 보드는 pointer cancel이 발생하면 저장하지 않고 원래 순서로 복구한다", () => {
    vi.useFakeTimers();
    const onReorderImages = vi.fn<(fromIndex: number, toIndex: number) => boolean>(() => true);
    render(
      <ImageBoard
        images={[createSampleImage(1), createSampleImage(2), createSampleImage(3)]}
        onReorderImages={onReorderImages}
      />,
    );
    const slotFrames = getImageBoardSlotFrames();
    mockImageBoardSlotRects(slotFrames);

    beginLongPressSlotDrag(slotFrames, 0);
    moveSlotDragTo(slotFrames, 0, 2);
    cancelSlotDrag(slotFrames, 0);

    expect(onReorderImages).not.toHaveBeenCalled();
    expect(
      within(getImageBoardSlotGroups()[0]).getByRole("img", { name: "Sample image 1" }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole("group", { name: /Image board/ })).not.toHaveAttribute(
      "data-reordering",
    );
  });

  it("이미지 보드는 키보드로 이미지 위치를 한 칸씩 옮기도록 요청한다", async () => {
    const user = userEvent.setup();
    const onReorderImages = vi.fn<(fromIndex: number, toIndex: number) => boolean>(() => true);
    render(
      <ImageBoard
        images={[createSampleImage(1), createSampleImage(2)]}
        onReorderImages={onReorderImages}
      />,
    );

    screen.getByRole("button", { name: "Move image in slot 1 forward" }).focus();
    await user.keyboard("{Enter}");

    expect(onReorderImages).toHaveBeenCalledWith(0, 1);
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

  it("정보 팝업은 Tab 포커스를 대화상자 안에 가둔다", async () => {
    const user = userEvent.setup();
    render(<InfoPopupHarness />);

    await user.click(screen.getByRole("button", { name: "Open details" }));

    const closeButton = screen.getByRole("button", { name: "Close information" });
    const contentButton = screen.getByRole("button", { name: "Read details" });

    expect(closeButton).toHaveFocus();
    await user.tab();
    expect(contentButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(contentButton).toHaveFocus();
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
        <button type="button">Read details</button>
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
