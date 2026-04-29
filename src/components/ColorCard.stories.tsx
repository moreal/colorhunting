import type { Meta, StoryObj } from "@storybook/react-vite";
import { designTokens } from "../designSystem/tokens";
import { ColorCard } from "./ColorCard";

const meta = {
  argTypes: {
    color: {
      control: false,
    },
  },
  component: ColorCard,
  parameters: {
    layout: "centered",
  },
  title: "Design System/ColorCard",
} satisfies Meta<typeof ColorCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const colorCardTokens = designTokens.color.colorCard;

const colorList = [
  { color: { hex: colorCardTokens.red }, title: "RED" },
  { color: { hex: colorCardTokens.orange }, title: "ORANGE" },
  { color: { hex: colorCardTokens.yellow }, title: "YELLOW" },
  { color: { hex: colorCardTokens.green }, title: "GREEN" },
  { color: { hex: colorCardTokens.blue }, title: "BLUE" },
  { color: { hex: colorCardTokens.navy }, title: "NAVY" },
  { color: { hex: colorCardTokens.purple }, title: "PURPLE" },
  { color: { hex: colorCardTokens.pink }, title: "PINK" },
];

export const Green: Story = {
  args: {
    color: { hex: colorCardTokens.green },
    title: "GREEN",
  },
};

export const Red: Story = {
  args: {
    color: { hex: colorCardTokens.red },
    title: "RED",
  },
};

export const Pink: Story = {
  args: {
    color: { hex: colorCardTokens.pink },
    title: "PINK",
  },
};

export const ColorList: Story = {
  args: {
    color: { hex: colorCardTokens.green },
    title: "GREEN",
  },
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      style={{
        alignItems: "center",
        background: "#292a2c",
        boxSizing: "border-box",
        display: "flex",
        gap: "64px",
        minHeight: "100vh",
        overflowX: "auto",
        padding: "72px 88px",
      }}
    >
      {colorList.map((item) => (
        <ColorCard color={item.color} key={`${item.title}-${item.color.hex}`} title={item.title} />
      ))}
    </div>
  ),
};
