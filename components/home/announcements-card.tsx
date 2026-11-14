import Feather from '@expo/vector-icons/Feather';
import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '@/components/ui/card';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useSchoolData } from '@/contexts/school-data-context';
import { useTheme } from '@/contexts/theme-context';
import { formatUpdatedAgo } from '@/lib/school-data';

const COLLAPSED_COUNT = 3;

export default function AnnouncementsCard() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { announcements, status } = useSchoolData();
  const [isExpanded, setIsExpanded] = useState(false);

  const items = announcements?.items ?? [];
  const visibleItems = isExpanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hiddenCount = items.length - COLLAPSED_COUNT;
  const deckUrl = announcements?.deckUrl ?? null;

  return (
    <Card style={styles.card}>
      <View style={styles.labelRow}>
        <Feather name="message-square" size={18} color={colors.primary} />
        <Text style={styles.label}>Announcements</Text>
      </View>

      {!announcements ? (
        <Text style={styles.muted}>
          {status === 'loading' ? 'Loading…' : "Couldn't load announcements"}
        </Text>
      ) : items.length === 0 ? (
        <Text style={styles.muted}>No announcements right now</Text>
      ) : (
        <View style={styles.list}>
          {visibleItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.dot} />
              <View style={styles.itemBody}>
                {item.club ? <Text style={styles.club}>{item.club}</Text> : null}
                {item.title ? <Text style={styles.itemTitle}>{item.title}</Text> : null}
                <Text style={styles.itemText} numberOfLines={isExpanded ? undefined : 3}>
                  {item.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {hiddenCount > 0 ? (
        <TouchableOpacity
          onPress={() => setIsExpanded((value) => !value)}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.toggle}>
            {isExpanded ? 'Show less' : `Show all (${items.length})`}
          </Text>
        </TouchableOpacity>
      ) : null}

      {announcements ? (
        <View style={styles.footerRow}>
          <Text style={styles.footer}>
            {formatUpdatedAgo(announcements.generatedAt, new Date())}
          </Text>
          {deckUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(deckUrl)}
              hitSlop={8}
              accessibilityRole="link"
              style={styles.deckLink}
            >
              <Text style={styles.toggle}>Open full deck</Text>
              <Feather name="external-link" size={14} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      gap: Spacing.md,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    label: {
      color: colors.text,
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
    },
    list: {
      gap: Spacing.md,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 7,
    },
    itemBody: {
      flex: 1,
      gap: Spacing.xs,
    },
    club: {
      color: colors.primary,
      fontSize: Type.caption.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    itemTitle: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: '700',
    },
    itemText: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
    muted: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
    },
    toggle: {
      color: colors.primary,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    deckLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    footer: {
      color: colors.mutedText,
      fontSize: Type.caption.fontSize,
      fontWeight: '600',
    },
  });
