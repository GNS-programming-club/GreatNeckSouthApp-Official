import { ToastProvider } from '@/components/ui/toast';
import { RemindersProvider } from '@/contexts/reminders-context';
import { SchoolDataProvider } from '@/contexts/school-data-context';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/theme-context';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router/react-navigation';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const unstable_settings = {
  anchor: '(tabs)',
};

function ThemedNavigation() {
  const { actualTheme } = useTheme();
  const navigationTheme = actualTheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <BottomSheetModalProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </BottomSheetModalProvider>
      <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <SchoolDataProvider>
          <RemindersProvider>
            <SafeAreaProvider>
              <ToastProvider>
                <ThemedNavigation />
              </ToastProvider>
            </SafeAreaProvider>
          </RemindersProvider>
        </SchoolDataProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
