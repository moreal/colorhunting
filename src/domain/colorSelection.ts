import { createColor, selectColor, type Color, type ColorDeterminedAppState } from "./appState";
import { COLOR_HUNTING_COLOR_HEX, getColorHuntingThemeTextColor } from "./colorHuntingTheme";

export type ColorSelectionOption = {
  color: Color;
  label: string;
};

export type PickColorOption = (
  currentColor: ColorSelectionOption | null,
  options: readonly ColorSelectionOption[],
) => ColorSelectionOption;

export const COLOR_SELECTION_OPTIONS: readonly ColorSelectionOption[] = [
  createColorOption("PINK", COLOR_HUNTING_COLOR_HEX.pink),
  createColorOption("PURPLE", COLOR_HUNTING_COLOR_HEX.purple),
  createColorOption("NAVY", COLOR_HUNTING_COLOR_HEX.navy),
  createColorOption("BLUE", COLOR_HUNTING_COLOR_HEX.blue),
  createColorOption("GREEN", COLOR_HUNTING_COLOR_HEX.green),
  createColorOption("YELLOW", COLOR_HUNTING_COLOR_HEX.yellow),
  createColorOption("ORANGE", COLOR_HUNTING_COLOR_HEX.orange),
  createColorOption("RED", COLOR_HUNTING_COLOR_HEX.red),
];

export function pickRandomColorOption(
  currentColor: ColorSelectionOption | null,
  options: readonly ColorSelectionOption[] = COLOR_SELECTION_OPTIONS,
): ColorSelectionOption {
  const selectableOptions =
    currentColor === null
      ? options
      : options.filter((option) => option.color.hex !== currentColor.color.hex);
  const fallbackOptions = selectableOptions.length > 0 ? selectableOptions : options;
  const randomIndex = Math.floor(Math.random() * fallbackOptions.length);

  return fallbackOptions[randomIndex] ?? COLOR_SELECTION_OPTIONS[0];
}

export function createConfirmedColorState(option: ColorSelectionOption): ColorDeterminedAppState {
  return selectColor(option.color);
}

export function findColorSelectionOption(color: Color): ColorSelectionOption | null {
  return (
    COLOR_SELECTION_OPTIONS.find(
      (option) => option.color.hex.toLowerCase() === color.hex.toLowerCase(),
    ) ?? null
  );
}

export function getColorSelectionConfirmTextColor(option: ColorSelectionOption): string {
  return getColorHuntingThemeTextColor(option.color.hex);
}

function createColorOption(label: string, hex: string): ColorSelectionOption {
  const color = createColor(hex);

  if (color === null) {
    throw new Error(`Invalid color option: ${label}`);
  }

  return { color, label };
}
