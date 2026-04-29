const HEX_COLOR_PATTERN = /^#?([\da-f]{3}|[\da-f]{6})$/i;
const DARK_TEXT_COLOR = "#050608";
const LIGHT_TEXT_COLOR = "#ffffff";

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

export function normalizeHexColor(input: string): string | null {
  const value = input.trim();
  const match = HEX_COLOR_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const color = match[1].toLowerCase();

  if (color.length === 3) {
    return `#${color
      .split("")
      .map((character) => character + character)
      .join("")}`;
  }

  return `#${color}`;
}

export function getReadableTextColor(
  input: string,
): typeof DARK_TEXT_COLOR | typeof LIGHT_TEXT_COLOR {
  const normalizedColor = normalizeHexColor(input);

  if (normalizedColor === null) {
    throw new Error(`Invalid hex color: ${input}`);
  }

  return getContrastRatio(DARK_TEXT_COLOR, normalizedColor) >=
    getContrastRatio(LIGHT_TEXT_COLOR, normalizedColor)
    ? DARK_TEXT_COLOR
    : LIGHT_TEXT_COLOR;
}

function getContrastRatio(firstColor: string, secondColor: string): number {
  const firstLuminance = getRelativeLuminance(hexToRgb(firstColor));
  const secondLuminance = getRelativeLuminance(hexToRgb(secondColor));
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance({ blue, green, red }: RgbColor): number {
  return (
    0.2126 * toLinearRgbChannel(red) +
    0.7152 * toLinearRgbChannel(green) +
    0.0722 * toLinearRgbChannel(blue)
  );
}

function toLinearRgbChannel(channel: number): number {
  const ratio = channel / 255;

  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(hex: string): RgbColor {
  return {
    blue: Number.parseInt(hex.slice(5, 7), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    red: Number.parseInt(hex.slice(1, 3), 16),
  };
}
