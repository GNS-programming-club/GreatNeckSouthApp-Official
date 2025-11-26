import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as AppThemeProvider } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <AppThemeProvider>
      <NavigationThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </AppThemeProvider>
  );
}