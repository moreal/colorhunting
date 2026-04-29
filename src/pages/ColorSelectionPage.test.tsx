import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createEmptyBoard, type ColorDeterminedAppState } from "../appState";
import {
  COLOR_SELECTION_OPTIONS,
  ColorSelectionPage,
  type ColorSelectionOption,
  type PickColorOption,
} from "./ColorSelectionPage";
import { designTokens } from "../designSystem/tokens";

const redOption = findColorOption("RED");
const yellowOption = findColorOption("YELLOW");
const greenOption = findColorOption("GREEN");

describe("ColorSelectionPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("선택된 색상과 화면 설계서의 기본 액션을 보여준다", () => {
    render(
      <ColorSelectionPage
        initialColor={redOption}
        saveConfirmedState={vi.fn<() => Promise<void>>()}
      />,
    );

    expect(screen.getByRole("link", { name: "Colorhunting home" })).toBeInTheDocument();
    expect(screen.getByText(/오늘의 컬러를 발견하고/)).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "RED #ef4b4b" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "컬러헌팅 정보 열기" })).toBeEnabled();
    expect(screen.getByRole("main")).toHaveStyle({
      "--color-selection-copy-font-size": designTokens.component.colorSelection.copyFontSize,
      "--color-selection-logo-height": designTokens.component.colorSelection.logoHeight,
      "--color-selection-logo-width": designTokens.component.colorSelection.logoWidth,
    });
  });

  it("리셋하면 새 색상을 다시 뽑고 카드가 갱신된다", async () => {
    const user = userEvent.setup();
    const pickColorOption = vi.fn<PickColorOption>(() => greenOption);
    render(
      <ColorSelectionPage
        initialColor={redOption}
        pickColorOption={pickColorOption}
        saveConfirmedState={vi.fn<() => Promise<void>>()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(pickColorOption).toHaveBeenCalledWith(redOption, COLOR_SELECTION_OPTIONS);
    expect(await screen.findByRole("article", { name: "GREEN #34c759" })).toBeInTheDocument();
  });

  it("확정하면 선택한 색상과 빈 보드 상태를 저장하고 상위로 전달한다", async () => {
    const user = userEvent.setup();
    const saveConfirmedState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(
      async () => {},
    );
    const onColorConfirmed = vi.fn<(state: ColorDeterminedAppState) => void>();
    render(
      <ColorSelectionPage
        initialColor={redOption}
        onColorConfirmed={onColorConfirmed}
        saveConfirmedState={saveConfirmedState}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    const expectedState: ColorDeterminedAppState = {
      state: "COLOR_DETERMINED",
      color: { hex: "#ef4b4b" },
      images: createEmptyBoard(),
    };

    await waitFor(() => expect(saveConfirmedState).toHaveBeenCalledWith(expectedState));
    expect(onColorConfirmed).toHaveBeenCalledWith(expectedState);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("저장에 실패하면 확정 상태를 전달하지 않고 오류를 보여준다", async () => {
    const user = userEvent.setup();
    const saveConfirmedState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(
      async () => {
        throw new Error("storage failed");
      },
    );
    const onColorConfirmed = vi.fn<(state: ColorDeterminedAppState) => void>();
    render(
      <ColorSelectionPage
        initialColor={redOption}
        onColorConfirmed={onColorConfirmed}
        saveConfirmedState={saveConfirmedState}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "색상을 저장하지 못했어요. 다시 시도해주세요.",
    );
    expect(onColorConfirmed).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("밝은 색상은 확정 버튼 글자를 검정색으로 보여준다", () => {
    render(
      <ColorSelectionPage
        initialColor={yellowOption}
        saveConfirmedState={vi.fn<() => Promise<void>>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toHaveStyle("color: #050608");
  });

  it("정보 팝업은 열기 버튼에서 열리고 닫기 버튼과 Escape로 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <ColorSelectionPage
        initialColor={redOption}
        saveConfirmedState={vi.fn<() => Promise<void>>()}
      />,
    );

    const opener = screen.getByRole("button", { name: "컬러헌팅 정보 열기" });
    await user.click(opener);

    expect(screen.getByRole("dialog", { name: "컬러헌팅(Color Hunting)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "컬러헌팅 정보 닫기" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "컬러헌팅 정보 닫기" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "컬러헌팅(Color Hunting)" }),
      ).not.toBeInTheDocument();
    });

    await user.click(opener);
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "컬러헌팅(Color Hunting)" }),
      ).not.toBeInTheDocument();
    });
  });

  it("키보드로 리셋과 확정 액션을 실행할 수 있다", async () => {
    const user = userEvent.setup();
    const pickColorOption = vi.fn<PickColorOption>(() => greenOption);
    const saveConfirmedState = vi.fn<(state: ColorDeterminedAppState) => Promise<void>>(
      async () => {},
    );
    render(
      <ColorSelectionPage
        initialColor={redOption}
        pickColorOption={pickColorOption}
        saveConfirmedState={saveConfirmedState}
      />,
    );

    screen.getByRole("button", { name: "Reset" }).focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("article", { name: "GREEN #34c759" })).toBeInTheDocument();

    screen.getByRole("button", { name: "Confirm" }).focus();
    await user.keyboard(" ");

    await waitFor(() => {
      expect(saveConfirmedState).toHaveBeenCalledWith({
        state: "COLOR_DETERMINED",
        color: { hex: "#34c759" },
        images: createEmptyBoard(),
      });
    });
  });
});

function findColorOption(label: string): ColorSelectionOption {
  const option = COLOR_SELECTION_OPTIONS.find((colorOption) => colorOption.label === label);

  if (option === undefined) {
    throw new Error(`Missing test color option: ${label}`);
  }

  return option;
}
