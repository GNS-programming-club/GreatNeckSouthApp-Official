import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ThemeDial from '@/components/theme-dial';
import IconBadge from '@/components/welcome/icon-badge';
import RiseIn from '@/components/welcome/rise-in';
import { Colors, LineHeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type ThemePageProps = {
  width: number;
  isActive: boolean;
};

export default function ThemePage({ width, isActive }: ThemePageProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.page, { width }]}>
      <RiseIn isActive={isActive} order={0}>
        <IconBadge icon="droplet" />
      </RiseIn>
      <RiseIn isActive={isActive} order={1}>
        <Text style={styles.title} accessibilityRole="header">
          Make it yours
        </Text>
      </RiseIn>
      <RiseIn isActive={isActive} order={2}>
        <Text style={styles.description}>
          Spin the dial to pick a theme. You can change the theme any time in Settings.
        </Text>
      </RiseIn>
      <RiseIn isActive={isActive} order={3}>
        <ThemeDial gutter={Spacing.xl} isOnWelcomeGlow />
      </RiseIn>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    page: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    title: {
      ...Type.display,
      color: colors.text,
    },
    description: {
      ...Type.body,
      lineHeight: LineHeight.relaxed,
      color: colors.text,
    },
  });
