import type { Meta, StoryObj } from "@storybook/react-vite";
import { Logo } from "./Logo";
import { PageLogo } from "./PageLogo";

const meta = {
  component: Logo,
  parameters: {
    layout: "centered",
  },
  title: "Design System/Logo",
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PageHeader: Story = {
  render: () => <PageLogo inert />,
};
