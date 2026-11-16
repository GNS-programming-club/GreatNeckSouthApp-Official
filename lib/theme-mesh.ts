import { composite, contrastRatio, mix, toHex } from './color.ts';
import type { Palette, ThemeDefinition } from './theme-catalog.ts';

export type MeshColors = [string, string, string, string];

const READABLE_CONTRAST = 4.5;
const MAXIMUM_ACCENT_SHARE = 0.7;
const ACCENT_SHARE_STEP = 0.02;
const SOFT_GLOW_RATIO = 0.5;

type ReadabilityCheck = (color: string, palette: Palette) => boolean;

function meetsContrast(pairs: string[][], minimum: number) {
  return pairs.every(
    ([foreground, background]) => contrastRatio(foreground, background) >= minimum
  );
}

const isReadableOnScreen: ReadabilityCheck = (color, palette) => {
  const tintedChip = toHex(composite(palette.accentSoft, color));

  return meetsContrast(
    [
      [palette.text, color],
      [palette.mutedText, color],
      [palette.primary, color],
      [palette.primary, tintedChip],
    ],
    READABLE_CONTRAST
  );
};

function strongestReadableShare(base: string, palette: Palette, isReadable: ReadabilityCheck) {
  for (let share = MAXIMUM_ACCENT_SHARE; share > 0; share -= ACCENT_SHARE_STEP) {
    if (isReadable(mix(base, palette.primaryFill, share), palette)) {
      return share;
    }
  }

  return 0;
}

const SWATCH_GLOW_SHARE = 0.5;

function canvasEndsOf({ palette, traits }: ThemeDefinition) {
  const solidStops = (traits.backdrop?.gradient?.colors ?? []).map((color) =>
    toHex(composite(color, palette.background))
  );

  return {
    base: solidStops[0] ?? palette.background,
    counterpart:
      solidStops[solidStops.length - 1] ?? toHex(composite(palette.surface, palette.background)),
  };
}

export function swatchColorsFor(theme: ThemeDefinition): MeshColors {
  const { base, counterpart } = canvasEndsOf(theme);
  const accent = theme.palette.primaryFill;

  return [base, accent, counterpart, mix(counterpart, accent, SWATCH_GLOW_SHARE)];
}

function softMeshColors(theme: ThemeDefinition, isReadable: ReadabilityCheck): MeshColors {
  const { palette } = theme;
  const { base, counterpart } = canvasEndsOf(theme);
  const accentShare = strongestReadableShare(base, palette, isReadable);
  const softShare = strongestReadableShare(counterpart, palette, isReadable) * SOFT_GLOW_RATIO;

  return [
    base,
    mix(base, palette.primaryFill, accentShare),
    counterpart,
    mix(counterpart, palette.primaryFill, softShare),
  ];
}

export function meshColorsFor(theme: ThemeDefinition): MeshColors {
  return softMeshColors(theme, isReadableOnScreen);
}
