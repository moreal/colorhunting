import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { DownloadBottomSheet, type DownloadBottomSheetState } from "./DownloadBottomSheet";
import { RemoveButton } from "./RemoveButton";

const meta = {
  component: DownloadBottomSheet,
  parameters: {
    layout: "fullscreen",
  },
  title: "Design System/BottomSheet",
} satisfies Meta<typeof DownloadBottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

const downloadStates: Array<{
  label: string;
  state: DownloadBottomSheetState;
}> = [
  { label: "ENOUGH_IMAGES", state: "ENOUGH_IMAGES" },
  { label: "DOWNLOAD_COMPLETED", state: "DOWNLOAD_COMPLETED" },
  { label: "NON_ENOUGH_IMAGES", state: "NON_ENOUGH_IMAGES" },
];

export const DownloadStates: Story = {
  args: {
    state: "ENOUGH_IMAGES",
  },
  render: () => (
    <BottomSheetStage>
      <div style={{ display: "grid", gap: "48px", width: "min(100%, 796px)" }}>
        {downloadStates.map((item) => (
          <div key={item.state} style={{ display: "grid", gap: "16px" }}>
            <span
              style={{
                color: "#d2a6ff",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              {item.label}
            </span>
            <DownloadBottomSheet state={item.state} />
          </div>
        ))}
      </div>
    </BottomSheetStage>
  ),
};

export const RemoveStates: Story = {
  args: {
    state: "ENOUGH_IMAGES",
  },
  render: () => (
    <BottomSheetStage>
      <div style={{ display: "grid", gap: "16px", justifyItems: "center" }}>
        <span
          style={{
            color: "#d2a6ff",
            fontSize: "18px",
            fontWeight: 700,
            justifySelf: "start",
          }}
        >
          Btn_Remove
        </span>
        <div style={{ display: "grid", gap: "24px", justifyItems: "center" }}>
          <RemoveButton />
          <RemoveButton pressed />
        </div>
        <p
          style={{
            color: "#ffffff",
            fontFamily: "var(--ds-font-family-display)",
            fontSize: "22px",
            lineHeight: 1.4,
            margin: "12px 0 0",
            textAlign: "center",
          }}
        >
          삭제하려면 끌어다 놓으세요
        </p>
      </div>
    </BottomSheetStage>
  ),
};

export const FullPreview: Story = {
  args: {
    state: "ENOUGH_IMAGES",
  },
  render: () => (
    <BottomSheetStage>
      <div style={{ display: "grid", gap: "88px", width: "min(100%, 796px)" }}>
        <div style={{ display: "grid", gap: "16px" }}>
          <span
            style={{
              color: "#d2a6ff",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Btn_DOWNLOAD
          </span>
          <DownloadBottomSheet state="ENOUGH_IMAGES" />
          <DownloadBottomSheet state="DOWNLOAD_COMPLETED" />
          <DownloadBottomSheet state="NON_ENOUGH_IMAGES" />
        </div>
        <div style={{ display: "grid", gap: "20px", justifyItems: "center" }}>
          <span
            style={{
              color: "#d2a6ff",
              fontSize: "18px",
              fontWeight: 700,
              justifySelf: "start",
            }}
          >
            Btn_Remove
          </span>
          <RemoveButton />
          <p
            style={{
              color: "#ffffff",
              fontFamily: "var(--ds-font-family-display)",
              fontSize: "22px",
              lineHeight: 1.4,
              margin: 0,
              textAlign: "center",
            }}
          >
            삭제하려면 끌어다 놓으세요
          </p>
        </div>
      </div>
    </BottomSheetStage>
  ),
};

function BottomSheetStage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        alignItems: "start",
        background: "#292a2c",
        boxSizing: "border-box",
        display: "grid",
        minHeight: "100vh",
        padding: "88px min(9vw, 128px)",
        placeItems: "start center",
      }}
    >
      {children}
    </div>
  );
}
