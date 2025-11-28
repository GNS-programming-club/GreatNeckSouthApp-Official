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
