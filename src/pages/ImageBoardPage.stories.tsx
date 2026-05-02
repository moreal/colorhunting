import type { Meta, StoryObj } from "@storybook/react-vite";
import { createColor, createEmptyBoard, type ColorDeterminedAppState } from "../domain/appState";
import { designTokens } from "../designSystem/tokens";
import { ImageBoardPage } from "./ImageBoardPage";

const meta = {
  component: ImageBoardPage,
  parameters: {
    layout: "fullscreen",
  },
  title: "Pages/ImageBoardPage",
} satisfies Meta<typeof ImageBoardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BlueEmpty: Story = {
  args: {
    saveBoardState: async () => {},
    state: createBoardState(designTokens.color.colorCard.blue),
  },
};

export const NavyEmpty: Story = {
  args: {
    saveBoardState: async () => {},
    state: createBoardState(designTokens.color.colorCard.navy),
  },
};

export const YellowEmpty: Story = {
  args: {
    saveBoardState: async () => {},
    state: createBoardState(designTokens.color.colorCard.yellow),
  },
};

function createBoardState(colorHex: string): ColorDeterminedAppState {
  const color = createColor(colorHex);

  if (color === null) {
    throw new Error("Story color must be valid.");
  }

  return {
    color,
    images: createEmptyBoard(),
    state: "COLOR_DETERMINED",
  };
}
