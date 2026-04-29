import { normalizeHexColor } from "./color";
import { designTokens } from "./designSystem/tokens";

const DARK_THEME_TEXT_COLOR = "#000000";
const LIGHT_THEME_TEXT_COLOR = "#ffffff";
const YELLOW_THEME_COLOR = normalizeRequiredHexColor(designTokens.color.colorCard.yellow);

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
