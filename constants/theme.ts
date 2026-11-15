import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0B0D',
    mutedText: '#5B6472',
    background: '#FFFFFF',
    surface: '#F4F6F9',
    surfaceAlt: '#EBEEF3',
    border: '#E2E6EC',
    primary: '#2158DA',
    primaryFill: '#1D4ED8',
    primaryText: '#FFFFFF',
    onPrimaryMuted: 'rgba(255,255,255,0.78)',
    onPrimarySoft: 'rgba(0,0,0,0.2)',
    onPrimaryTrack: 'rgba(0,0,0,0.2)',
    onPrimaryHairline: 'rgba(255,255,255,0.35)',
    accentSoft: '#E8EEFF',
    shadow: 'rgba(10,11,13,0.12)',
  },
  dark: {
    text: '#F5F7FA',
    mutedText: '#8A93A3',
    background: '#0A0B0D',
    surface: '#14161A',
    surfaceAlt: '#1C1F26',
    border: '#23262E',
    primary: '#3B82F6',
    primaryFill: '#1D4ED8',
    primaryText: '#FFFFFF',
    onPrimaryMuted: 'rgba(255,255,255,0.78)',
    onPrimarySoft: 'rgba(0,0,0,0.2)',
    onPrimaryTrack: 'rgba(0,0,0,0.2)',
    onPrimaryHairline: 'rgba(255,255,255,0.35)',
    accentSoft: '#0D1B3A',
    shadow: 'rgba(0,0,0,0.6)',
  },
};

export const Spacing = {
  xxs: 2,
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
  xxl: 24,
  pill: 999,
} as const;

export const FontWeight = {
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const Tracking = {
  hero: -1.5,
  tight: -0.5,
  snug: 0.2,
  wide: 0.3,
  uppercase: 0.6,
} as const;

export const LineHeight = {
  compact: 18,
  relaxed: 22,
} as const;

export const IconSize = {
  sm: 14,
  md: 18,
  lg: 20,
  xl: 24,
} as const;

export const Opacity = {
  faint: 0.28,
  dim: 0.45,
} as const;

export const Motion = {
  duration: { quick: 220, base: 320 },
  easeOutCurve: [0.32, 0.72, 0, 1],
  staggerStep: 50,
  riseDistance: Spacing.md,
  pressSpring: { stiffness: 439, damping: 42, mass: 1 },
  settleSpring: { stiffness: 158, damping: 25, mass: 1 },
} as const;

type TypeRole = {
  fontSize: number;
  fontWeight: (typeof FontWeight)[keyof typeof FontWeight];
  letterSpacing?: number;
  lineHeight?: number;
};

export const Type: Record<
  'hero' | 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'micro',
  TypeRole
> = {
  hero: {
    fontSize: 56,
    fontWeight: FontWeight.heavy,
    letterSpacing: Tracking.hero,
    lineHeight: 58,
  },
  display: { fontSize: 28, fontWeight: FontWeight.heavy, letterSpacing: Tracking.wide },
  title: { fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: Tracking.snug },
  heading: { fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: Tracking.snug },
  body: { fontSize: 15, fontWeight: FontWeight.medium },
  label: { fontSize: 13, fontWeight: FontWeight.semibold },
  caption: { fontSize: 12, fontWeight: FontWeight.semibold },
  micro: { fontSize: 11, fontWeight: FontWeight.semibold },
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
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
