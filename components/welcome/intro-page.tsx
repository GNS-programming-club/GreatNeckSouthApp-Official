import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import RiseIn from '@/components/welcome/rise-in';
import { Colors, LineHeight, Spacing, Tracking, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type IntroPageProps = {
  width: number;
  isActive: boolean;
};

const TITLE_LINES = ['Great Neck', 'South'];

export default function IntroPage({ width, isActive }: IntroPageProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.page, { width }]}>
      <RiseIn isActive={isActive} order={0}>
        <Text style={styles.eyebrow}>WELCOME TO</Text>
      </RiseIn>
      <RiseIn isActive={isActive} order={1}>
        <Text style={styles.title} accessibilityRole="header">
          {TITLE_LINES.join('\n')}
        </Text>
      </RiseIn>
      <RiseIn isActive={isActive} order={2}>
        <Text style={styles.summary}>
          Today&apos;s schedule, the lunch menu, and school events, all in one place.
        </Text>
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
    eyebrow: {
      ...Type.caption,
      letterSpacing: Tracking.uppercase,
      color: colors.text,
    },
    title: {
      ...Type.hero,
      color: colors.text,
    },
    summary: {
      ...Type.body,
      lineHeight: LineHeight.relaxed,
      color: colors.text,
    },
  });
