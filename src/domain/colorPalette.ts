import { normalizeHexColor } from "./color";

export { normalizeHexColor } from "./color";

export const DEFAULT_COLOR = "#4f46e5";

type PaletteColorId = "base" | "complement" | "accent" | "tint" | "shade";

export type PaletteColor = {
  id: PaletteColorId;
  label: string;
  hex: string;
};

type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

type HslColor = {
  hue: number;
  saturation: number;
  lightness: number;
};

export function createPalette(input: string): PaletteColor[] {
  const normalizedColor = normalizeHexColor(input);

  if (normalizedColor === null) {
    throw new Error(`Invalid hex color: ${input}`);
  }

  const base = hexToHsl(normalizedColor);

  return [
    {
      id: "base",
      label: "Base",
      hex: normalizedColor,
    },
    {
      id: "complement",
      label: "Complement",
      hex: hslToHex({
        ...base,
        hue: rotateHue(base.hue, 180),
      }),
    },
    {
      id: "accent",
      label: "Accent",
      hex: hslToHex({
        hue: rotateHue(base.hue, 32),
        saturation: clamp(base.saturation + 8, 0, 100),
        lightness: clamp(base.lightness + 6, 0, 100),
      }),
    },
    {
      id: "tint",
      label: "Tint",
      hex: hslToHex({
        ...base,
        saturation: clamp(base.saturation - 20, 0, 100),
        lightness: clamp(base.lightness + 24, 0, 100),
      }),
    },
    {
      id: "shade",
      label: "Shade",
      hex: hslToHex({
        ...base,
        saturation: clamp(base.saturation + 6, 0, 100),
        lightness: clamp(base.lightness - 22, 0, 100),
      }),
    },
  ];
}

function hexToHsl(hex: string): HslColor {
  const { red, green, blue } = hexToRgb(hex);
  const redRatio = red / 255;
  const greenRatio = green / 255;
  const blueRatio = blue / 255;
  const max = Math.max(redRatio, greenRatio, blueRatio);
  const min = Math.min(redRatio, greenRatio, blueRatio);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness: Math.round(lightness * 100) };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue = calculateHue(redRatio, greenRatio, blueRatio, max, delta);

  return {
    hue: Math.round(hue),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
}

function hexToRgb(hex: string): RgbColor {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function calculateHue(red: number, green: number, blue: number, max: number, delta: number) {
  if (max === red) {
    return ((green - blue) / delta + (green < blue ? 6 : 0)) * 60;
  }

  if (max === green) {
    return ((blue - red) / delta + 2) * 60;
  }

  return ((red - green) / delta + 4) * 60;
}

function hslToHex({ hue, saturation, lightness }: HslColor) {
  const rgb = hslToRgb({
    hue: normalizeHue(hue),
    saturation: clamp(saturation, 0, 100),
    lightness: clamp(lightness, 0, 100),
  });

  return `#${toHexChannel(rgb.red)}${toHexChannel(rgb.green)}${toHexChannel(rgb.blue)}`;
}

function hslToRgb({ hue, saturation, lightness }: HslColor): RgbColor {
  const saturationRatio = saturation / 100;
  const lightnessRatio = lightness / 100;
  const chroma = (1 - Math.abs(2 * lightnessRatio - 1)) * saturationRatio;
  const hueSector = hue / 60;
  const x = chroma * (1 - Math.abs((hueSector % 2) - 1));
  const [red, green, blue] = getRgbRatios(hueSector, chroma, x);
  const match = lightnessRatio - chroma / 2;

  return {
    red: Math.round((red + match) * 255),
    green: Math.round((green + match) * 255),
    blue: Math.round((blue + match) * 255),
  };
}

function getRgbRatios(hueSector: number, chroma: number, x: number) {
  if (hueSector < 1) {
    return [chroma, x, 0];
  }

  if (hueSector < 2) {
    return [x, chroma, 0];
  }

  if (hueSector < 3) {
    return [0, chroma, x];
  }

  if (hueSector < 4) {
    return [0, x, chroma];
  }

  if (hueSector < 5) {
    return [x, 0, chroma];
  }

  return [chroma, 0, x];
}

function toHexChannel(value: number) {
  return value.toString(16).padStart(2, "0");
}

function rotateHue(hue: number, degrees: number) {
  return normalizeHue(hue + degrees);
}

function normalizeHue(hue: number) {
  return ((hue % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
