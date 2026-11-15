export type SearchIndexEntry<T> = {
  item: T;
  searchableFields: string[];
};

export type SearchIndex<T> = SearchIndexEntry<T>[];

export function buildSearchIndex<T>(
  items: readonly T[],
  getSearchableFields: (item: T) => string[]
): SearchIndex<T> {
  return items.map((item) => ({
    item,
    searchableFields: getSearchableFields(item).map((field) => field.toLowerCase()),
  }));
}

export function filterSearchIndex<T>(index: SearchIndex<T>, query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return index.map((entry) => entry.item);
  }

  return index
    .filter((entry) => entry.searchableFields.some((field) => field.includes(normalizedQuery)))
    .map((entry) => entry.item);
}
