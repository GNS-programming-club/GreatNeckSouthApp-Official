import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  Colors,
  IconSize,
  Radii,
  type RadiusScale,
  Spacing,
  Tracking,
  Type,
} from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type SearchBarProps = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  resultCount?: number;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  resultCount,
}: SearchBarProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Feather name="search" size={IconSize.md} color={colors.mutedText} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 ? (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10}>
            <Feather name="x" size={IconSize.md} color={colors.mutedText} />
          </TouchableOpacity>
        ) : null}
      </View>
      {typeof resultCount === 'number' ? (
        <Text style={styles.count}>
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    wrap: {
      gap: Spacing.sm,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
      padding: 0,
    },
    count: {
      color: colors.mutedText,
      fontSize: Type.caption.fontSize,
      fontWeight: Type.caption.fontWeight,
      letterSpacing: Tracking.uppercase,
      paddingLeft: Spacing.xs,
    },
  });
