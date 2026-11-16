import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Radii, type RadiusScale, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type PageDotsProps = {
  pageCount: number;
  activeIndex: number;
};

export default function PageDots({ pageCount, activeIndex }: PageDotsProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Step ${activeIndex + 1} of ${pageCount}`}
    >
      {Array.from({ length: pageCount }, (_, index) => (
        <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]} />
      ))}
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    dot: {
      width: Spacing.sm,
      height: Spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.text,
    },
    activeDot: {
      width: Spacing.xl,
      backgroundColor: colors.text,
    },
  });
