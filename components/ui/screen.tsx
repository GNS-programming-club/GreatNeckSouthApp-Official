import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useTabBarClearance } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  header?: React.ReactNode;
};

export default function Screen({ children, scroll = true, header }: ScreenProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bottomClearance = { paddingBottom: useTabBarClearance() };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, bottomClearance]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, bottomClearance]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
  });
