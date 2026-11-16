import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Text, useColorScheme as useDeviceColorScheme } from 'react-native';

import { ThemeCrossfade, type ThemeCrossfadeHandle } from '@/components/theme-crossfade';
import { Colors } from '@/constants/theme';
import { isThemeMode, resolveTheme, type ResolvedTheme, type ThemeMode } from '@/lib/theme-modes';

interface ThemeContextType {
  themeMode: ThemeMode;
  actualTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

let baseTextDefaultStyle: unknown = undefined;
let appliedTextTheme: ResolvedTheme | undefined = undefined;

const applyDefaultTextColor = (theme: ResolvedTheme) => {
  if (appliedTextTheme === theme) {
    return;
  }

  const themedText = Text as typeof Text & { defaultProps?: { style?: unknown } };

  if (baseTextDefaultStyle === undefined) {
    baseTextDefaultStyle = themedText.defaultProps?.style;
  }

  const base = baseTextDefaultStyle;
  const baseArray = Array.isArray(base) ? base : base ? [base] : [];

  themedText.defaultProps = themedText.defaultProps ?? {};
  themedText.defaultProps.style = [{ color: Colors[theme].text }, ...baseArray];
  appliedTextTheme = theme;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const crossfadeRef = useRef<ThemeCrossfadeHandle>(null);

  const actualTheme: ResolvedTheme = resolveTheme(themeMode, deviceColorScheme);

  applyDefaultTextColor(actualTheme);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (isThemeMode(savedTheme)) {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    const applyMode = () => setThemeModeState(mode);
    const crossfade = crossfadeRef.current;

    if (crossfade && resolveTheme(mode, deviceColorScheme) !== actualTheme) {
      crossfade.crossfadeInto(applyMode);
    } else {
      applyMode();
    }

    AsyncStorage.setItem('themeMode', mode).catch((error) => {
      console.error('Error saving theme preference:', error);
    });
  };

  if (!isThemeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, actualTheme, setThemeMode }}>
      <ThemeCrossfade ref={crossfadeRef}>{children}</ThemeCrossfade>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
