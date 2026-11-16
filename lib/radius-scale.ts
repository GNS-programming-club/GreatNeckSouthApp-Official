export const Radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export type RadiusScale = { [Size in keyof typeof Radius]: number } & {
  custom: (size: number) => number;
};

const ROUNDED_RADII: RadiusScale = { ...Radius, custom: (size) => size };

const SQUARE_RADII: RadiusScale = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  xxl: 0,
  pill: 0,
  custom: () => 0,
};

export function radiusScaleFor(shapeRadius: number) {
  return shapeRadius === 0 ? SQUARE_RADII : ROUNDED_RADII;
}
