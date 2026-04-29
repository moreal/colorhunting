export const designTokens = {
  color: {
    canvas: "#f5f7f1",
    surface: "#ffffff",
    panel: "#16212b",
    panelMuted: "#263642",
    text: "#172033",
    mutedText: "#5f6f7e",
    invertedText: "#f8fbf7",
    border: "#d5dde2",
    borderStrong: "#9ba8b2",
    primary: "#0f766e",
    primaryHover: "#0b5f59",
    primaryText: "#ffffff",
    danger: "#b4233a",
    dangerHover: "#931a2d",
    success: "#2d7f5e",
    warning: "#9a6b15",
    disabledSurface: "#e8edf0",
    disabledText: "#778492",
    focus: "#2563eb",
    slotBackground: "#eef3ef",
    colorCard: {
      pink: "#FEB9DE",
      purple: "#AE7BFF",
      navy: "#000080",
      blue: "#76D1FF",
      green: "#34C759",
      yellow: "#FFE44B",
      orange: "#FE931B",
      red: "#EF4B4B",
    },
  },
  font: {
    display:
      '"NeoDunggeunmo Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    family:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    pixel:
      '"Press Start 2P", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  component: {
    actionButton: {
      cornerSize: "2px",
    },
    colorCard: {
      maxWidth: "146.61px",
      maxHeight: "174px",
      swatchSize: "120.83px",
      labelFontSize: "18px",
      glowSize: "174px",
      glowOpacity: "0.5",
      glowBlur: "60px",
    },
  },
  motion: {
    durationFast: "120ms",
    durationNormal: "180ms",
    durationSlow: "240ms",
    easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
  },
  radius: {
    small: "4px",
    medium: "8px",
    round: "999px",
  },
  space: {
    xSmall: "4px",
    small: "8px",
    medium: "12px",
    large: "16px",
    xLarge: "24px",
    xxLarge: "32px",
  },
} as const;

export type DesignTokens = typeof designTokens;
