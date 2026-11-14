import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type PillTone = 'neutral' | 'success' | 'warn';

type PillProps = {
  label: string;
  value?: string;
  tone?: PillTone;
};

export default function Pill({ label, value, tone = 'neutral' }: PillProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toneColor =
    tone === 'success' ? colors.primary : tone === 'warn' ? colors.mutedText : colors.mutedText;

  return (
    <View style={[styles.pill, tone === 'success' && styles.pillSuccess]}>
      <Text style={[styles.label, { color: toneColor }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.xs + 2,
      paddingHorizontal: Spacing.md,
    },
    pillSuccess: {
      backgroundColor: colors.accentSoft,
    },
    label: {
      fontSize: Type.caption.fontSize,
      fontWeight: Type.caption.fontWeight,
    },
    value: {
      color: colors.text,
      fontSize: Type.label.fontSize,
      fontWeight: FontWeight.heavy,
    },
  });
