import { normalizeHexColor } from "./color";

const DARK_THEME_TEXT_COLOR = "#000000";
const LIGHT_THEME_TEXT_COLOR = "#ffffff";

export const COLOR_HUNTING_COLOR_HEX = {
  pink: "#FEB9DE",
  purple: "#AE7BFF",
  navy: "#000080",
  blue: "#76D1FF",
  green: "#34C759",
  yellow: "#FFE44B",
  orange: "#FE931B",
  red: "#EF4B4B",
} as const;

const YELLOW_THEME_COLOR = normalizeRequiredHexColor(COLOR_HUNTING_COLOR_HEX.yellow);

export function getColorHuntingThemeTextColor(
  input: string,
): typeof DARK_THEME_TEXT_COLOR | typeof LIGHT_THEME_TEXT_COLOR {
  const normalizedColor = normalizeHexColor(input);

  if (normalizedColor === null) {
    throw new Error(`Invalid hex color: ${input}`);
  }

  return normalizedColor === YELLOW_THEME_COLOR ? DARK_THEME_TEXT_COLOR : LIGHT_THEME_TEXT_COLOR;
}

function normalizeRequiredHexColor(input: string): string {
  const normalizedColor = normalizeHexColor(input);

  if (normalizedColor === null) {
    throw new Error(`Invalid Colorhunting theme color: ${input}`);
  }

  return normalizedColor;
}
