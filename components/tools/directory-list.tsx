import React, { useDeferredValue, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { type HeaderCollapse, PageLargeTitle } from '@/components/tools/page-header';
import SearchBar from '@/components/tools/search-bar';
import EmptyState from '@/components/ui/empty-state';
import { Spacing } from '@/constants/theme';
import { useTabBarClearance } from '@/contexts/tab-bar-context';
import { buildSearchIndex, filterSearchIndex } from '@/lib/search-index';

type DirectoryListProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  searchKeys: (item: T) => string[];
  renderRow: (item: T) => React.ReactNode;
  onItemPress?: (item: T) => void;
  placeholder: string;
  header?: React.ReactNode;
  emptyLabel?: string;
  emptyMessage?: string;
  title?: string;
  collapse?: HeaderCollapse;
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
  emptyMessage = 'Try a different search.',
  title,
  collapse,
}: DirectoryListProps<T>) {
  const [query, setQuery] = useState('');
  const bottomClearance = useTabBarClearance();
  const showsLargeTitle = Boolean(title && collapse);

  const deferredQuery = useDeferredValue(query);
  const searchIndex = useMemo(() => buildSearchIndex(data, searchKeys), [data, searchKeys]);
  const filtered = useMemo(
    () => filterSearchIndex(searchIndex, deferredQuery),
    [searchIndex, deferredQuery]
  );

  return (
    <Animated.FlatList
      data={filtered}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      onScroll={collapse?.onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        styles.content,
        showsLargeTitle && styles.contentUnderLargeTitle,
        { paddingBottom: bottomClearance },
      ]}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {title && collapse ? <PageLargeTitle title={title} collapse={collapse} /> : null}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            resultCount={filtered.length}
          />
          {header}
        </View>
      }
      ListEmptyComponent={<EmptyState icon="search" title={emptyLabel} message={emptyMessage} />}
      renderItem={({ item }) =>
        onItemPress ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => onItemPress(item)}>
            {renderRow(item)}
          </TouchableOpacity>
        ) : (
          <>{renderRow(item)}</>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  contentUnderLargeTitle: {
    paddingTop: 0,
  },
  headerWrap: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
});
