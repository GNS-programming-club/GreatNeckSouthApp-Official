/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const palette = {
  blue: '#1e3a8a',
  blueBright: '#2563eb',
  blueSoft: '#e6eeff',
  navy: '#0b1533',
  orange: '#f97316',
  orangeSoft: '#ffe8d9',
  white: '#ffffff',
  offWhite: '#f5f7fb',
  slate: '#0f172a',
  slateMuted: '#475569',
  borderLight: '#d6deed',
  borderDark: '#1f2a44',
};

export const Colors = {
  light: {
    text: palette.slate,
    mutedText: palette.slateMuted,
    background: palette.offWhite,
    surface: palette.white,
    surfaceAlt: '#edf2fb',
    border: palette.borderLight,
    primary: palette.blueBright,
    primaryText: palette.white,
    accent: palette.orange,
    accentSoft: palette.orangeSoft,
    icon: '#4b5563',
    tint: palette.blueBright,
    tabIconDefault: '#8ea0c5',
    tabIconSelected: palette.blueBright,
    shadow: 'rgba(30, 58, 138, 0.12)',
  },
  dark: {
    text: '#e2e8f0',
    mutedText: '#cbd5e1',
    background: '#0a1020',
    surface: '#111a2e',
    surfaceAlt: '#15203a',
    border: palette.borderDark,
    primary: '#60a5fa',
    primaryText: palette.navy,
    accent: '#fb923c',
    accentSoft: '#3b1f0a',
    icon: '#cbd5e1',
    tint: '#60a5fa',
    tabIconDefault: '#8ea0c5',
    tabIconSelected: '#60a5fa',
    shadow: 'rgba(0, 0, 0, 0.35)',
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
