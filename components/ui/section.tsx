import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type SectionProps = {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Section({ title, children, style }: SectionProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    section: {
      gap: Spacing.sm,
    },
    title: {
      color: colors.text,
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
    },
  });
