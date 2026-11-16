import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { entryTitle, type MapEntry } from '@/components/map/map-entries';
import {
  Colors,
  Elevation,
  FontWeight,
  IconSize,
  Radii,
  type RadiusScale,
  Spacing,
  Tracking,
  Type,
} from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const MAX_LIST_HEIGHT = 216;

type ResultPanelProps = {
  results: MapEntry[];
  spotlightId: string | null;
  onSelect: (entry: MapEntry) => void;
};

function ResultRow({
  entry,
  isSpotlit,
  onSelect,
}: {
  entry: MapEntry;
  isSpotlit: boolean;
  onSelect: (entry: MapEntry) => void;
}) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <Pressable
      onPress={() => onSelect(entry)}
      accessibilityRole="button"
      accessibilityLabel={`${entryTitle(entry)}, ${entry.level} level, ${entry.area}`}
      accessibilityState={{ selected: isSpotlit }}
      style={({ pressed }) => [
        styles.row,
        isSpotlit ? styles.rowSpotlit : null,
        pressed && !isSpotlit ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.rowTop}>
        <Text
          style={[styles.rowTitle, isSpotlit ? styles.rowTitleSpotlit : null]}
          numberOfLines={1}
        >
          {entryTitle(entry)}
        </Text>
        <Text style={styles.rowLevel}>{entry.level}</Text>
      </View>
      <View style={styles.rowAreaWrap}>
        <Feather name="map-pin" size={IconSize.sm} color={colors.mutedText} />
        <Text style={styles.rowArea} numberOfLines={1}>
          {entry.area}
        </Text>
      </View>
      {isSpotlit ? (
        <Text style={styles.rowDept} numberOfLines={2}>
          {entry.dept}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function ResultPanel({ results, spotlightId, onSelect }: ResultPanelProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <Animated.View style={styles.panel} entering={FadeIn} exiting={FadeOut}>
      <Text style={styles.count}>
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </Text>
      {results.length === 0 ? (
        <Text style={styles.empty}>No rooms match that search</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(entry) => entry.id}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => (
            <ResultRow entry={item} isSpotlit={item.id === spotlightId} onSelect={onSelect} />
          )}
        />
      )}
    </Animated.View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    panel: {
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: radius.xl,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...Elevation.floating,
    },
    count: {
      ...Type.caption,
      color: colors.mutedText,
      letterSpacing: Tracking.uppercase,
      textTransform: 'uppercase',
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    empty: {
      ...Type.body,
      color: colors.mutedText,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.md,
    },
    list: {
      maxHeight: MAX_LIST_HEIGHT,
    },
    row: {
      gap: Spacing.xxs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderRadius: radius.sm,
      borderCurve: 'continuous',
    },
    rowSpotlit: {
      backgroundColor: colors.accentSoft,
    },
    rowPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    rowTitle: {
      flex: 1,
      ...Type.body,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    rowTitleSpotlit: {
      color: colors.primary,
    },
    rowLevel: {
      ...Type.caption,
      color: colors.mutedText,
    },
    rowAreaWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
    },
    rowArea: {
      flex: 1,
      ...Type.label,
      fontWeight: FontWeight.medium,
      color: colors.mutedText,
    },
    rowDept: {
      ...Type.caption,
      color: colors.mutedText,
      paddingLeft: IconSize.sm + Spacing.xs + 2,
    },
  });
