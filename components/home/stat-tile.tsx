import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Colors, Elevation, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type StatTileProps = {
  field?: string;
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
};

export default function StatTile({
  field,
  label,
  children,
  onPress,
  style,
  accent,
  icon,
}: StatTileProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tileBackground = field ?? colors.surface;
  const iconColor = accent ?? colors.primary;

  const content = (
    <>
      <View style={styles.labelRow}>
        {icon ? <Feather name={icon} size={18} color={iconColor} /> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[styles.tile, { backgroundColor: tileBackground }, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.tile, { backgroundColor: tileBackground }, style]}>{content}</View>;
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    tile: {
      ...Elevation.raised,
      shadowColor: colors.shadow,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
      overflow: 'hidden',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    label: {
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    body: {
      gap: Spacing.xs,
    },
  });
