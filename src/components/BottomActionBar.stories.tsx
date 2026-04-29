import type { Meta, StoryObj } from "@storybook/react-vite";
import { BottomActionBar } from "./BottomActionBar";
import { DownloadButton } from "./DownloadButton";
import { InfoButton } from "./InfoButton";

const meta = {
  component: BottomActionBar,
  parameters: {
    layout: "centered",
  },
  title: "Design System/BottomActionBar",
} satisfies Meta<typeof BottomActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SpaceBetween: Story = {
  args: {
    align: "space-between",
    children: (
      <>
        <InfoButton />
        <DownloadButton />
      </>
    ),
  },
};

export const EndAligned: Story = {
  args: {
    align: "end",
    children: <DownloadButton />,
  },
};
