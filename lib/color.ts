export type Rgba = { red: number; green: number; blue: number; alpha: number };

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;
const RGBA_PATTERN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

export function parseColor(color: string): Rgba {
  const hexMatch = HEX_PATTERN.exec(color);

  if (hexMatch) {
    const value = parseInt(hexMatch[1], 16);

    return { red: (value >> 16) & 255, green: (value >> 8) & 255, blue: value & 255, alpha: 1 };
  }

  const rgbaMatch = RGBA_PATTERN.exec(color);

  if (rgbaMatch) {
    return {
      red: Number(rgbaMatch[1]),
      green: Number(rgbaMatch[2]),
      blue: Number(rgbaMatch[3]),
      alpha: rgbaMatch[4] === undefined ? 1 : Number(rgbaMatch[4]),
    };
  }

  throw new Error(`Unsupported color: ${color}`);
}

function toHexChannel(channel: number) {
  return Math.round(Math.min(255, Math.max(0, channel)))
    .toString(16)
    .padStart(2, '0');
}

export function toHex({ red, green, blue }: Rgba) {
  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`.toUpperCase();
}

export function withAlpha(color: string, alpha: number) {
  const { red, green, blue } = parseColor(color);

  return `rgba(${red},${green},${blue},${alpha})`;
}

export function mix(from: string, to: string, amount: number) {
  const start = parseColor(from);
  const end = parseColor(to);
  const blend = (startChannel: number, endChannel: number) =>
    startChannel + (endChannel - startChannel) * amount;

  return toHex({
    red: blend(start.red, end.red),
    green: blend(start.green, end.green),
    blue: blend(start.blue, end.blue),
    alpha: 1,
  });
}

export function composite(foreground: string, background: string): Rgba {
  const top = parseColor(foreground);
  const bottom = parseColor(background);
  const blend = (topChannel: number, bottomChannel: number) =>
    topChannel * top.alpha + bottomChannel * (1 - top.alpha);

  return {
    red: blend(top.red, bottom.red),
    green: blend(top.green, bottom.green),
    blue: blend(top.blue, bottom.blue),
    alpha: 1,
  };
}

function linearChannel(channel: number) {
  const fraction = channel / 255;

  return fraction <= 0.03928 ? fraction / 12.92 : ((fraction + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string) {
  const { red, green, blue } = parseColor(color);

  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

export function contrastRatio(foreground: string, background: string) {
  const solidForeground = toHex(composite(foreground, background));
  const lighter = Math.max(relativeLuminance(solidForeground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(solidForeground), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
}

export function isLightColor(color: string) {
  return relativeLuminance(color) > 0.4;
}
