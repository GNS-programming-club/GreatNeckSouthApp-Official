import { THEME_IDS, type ThemeId } from './theme-catalog.ts';

export type ResolvedTheme = ThemeId;

export type ThemeMode = 'auto' | ResolvedTheme;

export const THEME_MODES: readonly ThemeMode[] = ['auto', ...THEME_IDS];

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

export function resolveTheme(
  mode: ThemeMode,
  deviceColorScheme: string | null | undefined
): ResolvedTheme {
  if (mode === 'auto') {
    return deviceColorScheme === 'dark' ? 'dark' : 'light';
  }

  return mode;
}
