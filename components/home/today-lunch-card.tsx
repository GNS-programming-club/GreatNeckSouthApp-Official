import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getMenuItemsForDay, getParsedMenuForMonth } from '@/api/daily-menu';
import Card from '@/components/ui/card';
import Section from '@/components/ui/section';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const MAX_ITEMS = 4;

export function useTodayLunch() {
  const [items, setItems] = useState<string[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLunch = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      try {
        const parsedMenu = await getParsedMenuForMonth(year, month);

        if (cancelled) return;

        if (!parsedMenu) {
          setItems([]);
          setHasError(false);

          return;
        }

        setItems(getMenuItemsForDay(parsedMenu, day));
        setHasError(false);
      } catch {
        if (cancelled) return;

        setHasError(true);
      }
    };

    loadLunch();

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, hasError };
}

export default function TodayLunchCard() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const { items, hasError } = useTodayLunch();

  const visibleItems = items ? items.slice(0, MAX_ITEMS) : [];

  return (
    <Card style={styles.card}>
      <Section title="Today's lunch">
        {hasError ? (
          <Text style={styles.muted}>Lunch menu unavailable</Text>
        ) : items === null ? (
          <Text style={styles.muted}>Loading lunch…</Text>
        ) : visibleItems.length === 0 ? (
          <Text style={styles.muted}>Lunch menu unavailable</Text>
        ) : (
          <View style={styles.list}>
            {visibleItems.map((name, index) => (
              <View key={`${name}-${index}`} style={styles.row}>
                <View style={styles.dot} />
                <Text style={styles.itemText}>{name}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/calendar')}>
          <Text style={styles.link}>See calendar</Text>
        </TouchableOpacity>
      </Section>
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderCurve: 'continuous',
    },
    muted: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
    list: {
      gap: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    itemText: {
      flex: 1,
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
    link: {
      marginTop: Spacing.xs,
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
    },
  });
