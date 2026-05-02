import type { Meta, StoryObj } from "@storybook/react-vite";
import { COLOR_SELECTION_OPTIONS, ColorSelectionPage } from "./ColorSelectionPage";

const meta = {
  component: ColorSelectionPage,
  parameters: {
    layout: "fullscreen",
  },
  title: "Pages/ColorSelectionPage",
} satisfies Meta<typeof ColorSelectionPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Navy: Story = {
  args: {
    initialColor: getColorOption("NAVY"),
    pickColorOption: () => getColorOption("BLUE"),
    saveConfirmedState: async () => {},
  },
};

function getColorOption(label: string) {
  const option = COLOR_SELECTION_OPTIONS.find((colorOption) => colorOption.label === label);

  if (option === undefined) {
    throw new Error(`Missing color option: ${label}`);
  }

  return option;
}
