/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0B0D',
    mutedText: '#5B6472',
    background: '#FFFFFF',
    surface: '#F4F6F9',
    surfaceAlt: '#EBEEF3',
    border: '#E2E6EC',
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    accent: '#2563EB',
    accentSoft: '#E8EEFF',
    icon: '#5B6472',
    tint: '#2563EB',
    tabIconDefault: '#9AA3B2',
    tabIconSelected: '#2563EB',
    shadow: 'rgba(10,11,13,0.12)',
    successText: '#2563EB',
    warnText: '#5B6472',
  },
  dark: {
    text: '#F5F7FA',
    mutedText: '#8A93A3',
    background: '#0A0B0D',
    surface: '#14161A',
    surfaceAlt: '#1C1F26',
    border: '#23262E',
    primary: '#3B82F6',
    primaryText: '#FFFFFF',
    accent: '#3B82F6',
    accentSoft: '#0D1B3A',
    icon: '#8A93A3',
    tint: '#3B82F6',
    tabIconDefault: '#5B6472',
    tabIconSelected: '#3B82F6',
    shadow: 'rgba(0,0,0,0.6)',
    successText: '#3B82F6',
    warnText: '#8A93A3',
  },
};

export const Fields = {
  hero: '#0D1B3A',
  heroAccent: '#3B82F6',
  card: '#14161A',
  cardInset: '#1C1F26',
  hairline: 'rgba(255,255,255,0.08)',
  onField: '#F5F7FA',
  onFieldMuted: '#94A0B4',
  accent: '#3B82F6',
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

export const Elevation: Record<'flat' | 'raised' | 'floating' | 'glow', ElevationStyle> = {
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
  glow: {
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
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
