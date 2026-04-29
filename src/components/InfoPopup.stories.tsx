import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoButton } from "./InfoButton";
import { InfoPopup } from "./InfoPopup";

const meta = {
  args: {
    children: <p>Colorhunting creates a small visual board from one confirmed color.</p>,
    onClose: () => undefined,
    open: true,
    title: "About Colorhunting",
  },
  component: InfoPopup,
  parameters: {
    layout: "centered",
  },
  title: "Design System/InfoPopup",
} satisfies Meta<typeof InfoPopup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: (args) => <InfoPopup {...args} />,
};

export const Closed: Story = {
  args: {
    open: false,
  },
  render: (args) => <InfoPopup {...args} />,
};

export const Interactive: Story = {
  args: {
    open: false,
  },
  render: () => <InteractivePopupExample />,
};

function InteractivePopupExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <InfoButton onClick={() => setOpen(true)} />
      <InfoPopup onClose={() => setOpen(false)} open={open} title="About Colorhunting">
        <p>Use this popup for concise product guidance without leaving the current flow.</p>
      </InfoPopup>
    </>
  );
}
