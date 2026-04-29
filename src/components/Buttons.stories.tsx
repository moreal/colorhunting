import type { Meta, StoryObj } from "@storybook/react-vite";
import { BottomActionBar } from "./BottomActionBar";
import { CloseButton } from "./CloseButton";
import { DownloadButton } from "./DownloadButton";
import { InfoButton } from "./InfoButton";
import { RemoveButton } from "./RemoveButton";

const meta = {
  parameters: {
    layout: "centered",
  },
  title: "Design System/Buttons",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const UtilityButtons: Story = {
  render: () => (
    <BottomActionBar align="end" label="Utility button examples">
      <InfoButton />
      <CloseButton />
      <RemoveButton />
    </BottomActionBar>
  ),
};

export const DownloadEnabled: Story = {
  render: () => <DownloadButton />,
};

export const DownloadCompleted: Story = {
  render: () => <DownloadButton status="completed" />,
};

export const DownloadDisabled: Story = {
  render: () => <DownloadButton disabled />,
};

export const DownloadLoading: Story = {
  render: () => <DownloadButton status="loading" />,
};
