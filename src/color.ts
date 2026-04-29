const HEX_COLOR_PATTERN = /^#?([\da-f]{3}|[\da-f]{6})$/i;

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
