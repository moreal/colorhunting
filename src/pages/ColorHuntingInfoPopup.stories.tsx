import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorHuntingInfoPopup } from "./ColorHuntingInfoPopup";

const meta = {
  args: {
    onClose: () => undefined,
    open: true,
  },
  component: ColorHuntingInfoPopup,
  parameters: {
    layout: "fullscreen",
  },
  title: "Pages/ColorHuntingInfoPopup",
} satisfies Meta<typeof ColorHuntingInfoPopup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: (args) => <ColorHuntingInfoPopup {...args} />,
};
