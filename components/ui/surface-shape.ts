import type { ViewStyle } from 'react-native';

import { Elevation } from '@/constants/theme';
import type { Palette, Shape } from '@/lib/theme-catalog';

export function surfaceShapeStyle(
  shape: Shape,
  colors: Palette,
  elevation: keyof typeof Elevation,
  radius: number = shape.radius
): ViewStyle {
  const base: ViewStyle = {
    borderRadius: radius,
    borderCurve: 'continuous',
    borderWidth: shape.borderWidth,
    borderColor: colors.border,
  };

  switch (shape.cardStyle) {
    case 'bevel':
      return {
        ...base,
        ...Elevation.flat,
        borderTopColor: shape.bevel?.highlight ?? colors.border,
        borderLeftColor: shape.bevel?.highlight ?? colors.border,
        borderBottomColor: shape.bevel?.shade ?? colors.border,
        borderRightColor: shape.bevel?.shade ?? colors.border,
      };

    default:
      return { ...base, ...Elevation[elevation], shadowColor: colors.shadow };
  }
}
