import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { BottomActionBar } from "./BottomActionBar";
import { CloseButton } from "./CloseButton";
import { ConfirmButton } from "./ConfirmButton";
import { DownloadButton } from "./DownloadButton";
import { InfoButton } from "./InfoButton";
import { RemoveButton } from "./RemoveButton";
import { ResetButton } from "./ResetButton";

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

export const ConfirmAndReset: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  render: () => (
    <div
      style={{
        background: "#242526",
        display: "grid",
        gap: "48px",
        padding: "32px",
      }}
    >
      <StoryButtonExample label="Btn_confirm">
        <ConfirmButton />
      </StoryButtonExample>
      <StoryButtonExample label="Btn_Reset">
        <ResetButton />
      </StoryButtonExample>
    </div>
  ),
};

export const ConfirmCustomColor: Story = {
  render: () => <ConfirmButton color="#34C759" />,
};

export const ResetEnabled: Story = {
  render: () => <ResetButton />,
};

export const DownloadEnabled: Story = {
  render: () => <DownloadButton />,
};

export const DownloadDisabled: Story = {
  render: () => <DownloadButton disabled />,
};

export const DownloadLoading: Story = {
  render: () => <DownloadButton status="loading" />,
};

export const RemoveEnabled: Story = {
  render: () => <RemoveButton />,
};

export const RemovePressed: Story = {
  render: () => <RemoveButton pressed />,
};

function StoryButtonExample({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div style={{ display: "grid", gap: "16px", justifyItems: "start" }}>
      <span
        style={{
          color: "#d7b9ff",
          fontFamily: "var(--ds-font-family-display)",
          fontSize: "18px",
          lineHeight: 1,
        }}
      >
        ◆ {label}
      </span>
      {children}
    </div>
  );
}
