/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const palette = {
  blue: '#1e3a8a',
  blueBright: '#3b82f6',
  blueSoft: '#dbeafe',
  navy: '#020617',
  deepNavy: '#0a1628',
  midNavy: '#0f1d32',
  orange: '#f97316',
  orangeSoft: '#fff7ed',
  white: '#ffffff',
  offWhite: '#f8fafc',
  slate: '#0f172a',
  slateMuted: '#64748b',
  borderLight: '#cbd5e1',
  borderDark: '#1e3a5f',
};

export const Colors = {
  light: {
    text: palette.slate,
    mutedText: palette.slateMuted,
    background: palette.offWhite,
    surface: palette.white,
    surfaceAlt: '#e2e8f0',
    border: palette.borderLight,
    primary: palette.blueBright,
    primaryText: palette.white,
    accent: palette.orange,
    accentSoft: palette.orangeSoft,
    icon: '#475569',
    tint: palette.blueBright,
    tabIconDefault: '#64748b',
    tabIconSelected: palette.blueBright,
    shadow: 'rgba(15, 23, 42, 0.1)',
    successText: '#15803d',
    warnText: '#b45309',
  },
  dark: {
    text: '#f1f5f9',
    mutedText: '#94a3b8',
    background: palette.navy,
    surface: palette.deepNavy,
    surfaceAlt: palette.midNavy,
    border: palette.borderDark,
    primary: '#3b82f6',
    primaryText: '#ffffff',
    accent: '#f97316',
    accentSoft: '#1c1917',
    icon: '#94a3b8',
    tint: '#3b82f6',
    tabIconDefault: '#64748b',
    tabIconSelected: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.5)',
    successText: '#4ade80',
    warnText: '#fbbf24',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

type TypeRole = {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  letterSpacing?: number;
};

export const Type: Record<
  'display' | 'title' | 'heading' | 'body' | 'label' | 'caption',
  TypeRole
> = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  heading: { fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  body: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600' },
};

type ElevationStyle = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

export const Elevation: Record<'flat' | 'raised' | 'floating', ElevationStyle> = {
  flat: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  raised: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
