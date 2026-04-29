import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorCard } from "./ColorCard";

const meta = {
  component: ColorCard,
  parameters: {
    layout: "centered",
  },
  title: "Design System/ColorCard",
} satisfies Meta<typeof ColorCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: {
    color: { hex: "#0f766e" },
    description: "A ready color can be confirmed or reset by the page.",
    status: "available",
  },
};

export const Selected: Story = {
  args: {
    color: { hex: "#b4233a" },
    description: "The selected state is used after the user confirms a color.",
    status: "selected",
  },
};

export const Loading: Story = {
  args: {
    color: { hex: "#9a6b15" },
    description: "The loading state keeps the card stable while the page chooses a new color.",
    status: "loading",
  },
};
