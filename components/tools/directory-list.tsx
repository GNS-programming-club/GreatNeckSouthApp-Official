import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import SearchBar from '@/components/tools/search-bar';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type DirectoryListProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  searchKeys: (item: T) => string[];
  renderRow: (item: T) => React.ReactNode;
  onItemPress: (item: T) => void;
  placeholder: string;
  header?: React.ReactNode;
  emptyLabel?: string;
};

export default function DirectoryList<T>({
  data,
  keyExtractor,
  searchKeys,
  renderRow,
  onItemPress,
  placeholder,
  header,
  emptyLabel = 'Nothing found',
}: DirectoryListProps<T>) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return data;
    }

    return data.filter((item) => searchKeys(item).some((s) => s.toLowerCase().includes(q)));
  }, [data, query, searchKeys]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            resultCount={filtered.length}
          />
          {header}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{emptyLabel}</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.85} onPress={() => onItemPress(item)}>
          {renderRow(item)}
        </TouchableOpacity>
      )}
    />
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    content: {
      padding: Spacing.lg,
      paddingBottom: 120,
      gap: Spacing.md,
    },
    headerWrap: {
      gap: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    empty: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
  });
