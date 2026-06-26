import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/card';
import { Colors, Radius, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type ToolTileProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  meta?: string;
  onPress: () => void;
  full?: boolean;
};

export default function ToolTile({ icon, label, meta, onPress, full = false }: ToolTileProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card onPress={onPress} style={[styles.tile, full ? styles.full : styles.half]}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    tile: {
      minHeight: 116,
      justifyContent: 'space-between',
    },
    half: {
      flex: 1,
    },
    full: {
      width: '100%',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      gap: 2,
    },
    label: {
      color: colors.text,
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
    },
    meta: {
      color: colors.mutedText,
      fontSize: Type.caption.fontSize,
      fontWeight: Type.caption.fontWeight,
    },
  });
