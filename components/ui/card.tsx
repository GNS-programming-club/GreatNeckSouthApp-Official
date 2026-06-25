import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Colors, Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: keyof typeof Elevation;
  onPress?: () => void;
};

export default function Card({ children, style, elevation = 'raised', onPress }: CardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const elevationStyle = {
    ...Elevation[elevation],
    shadowColor: colors.shadow,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.card, elevationStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, elevationStyle, style]}>{children}</View>;
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
  });
