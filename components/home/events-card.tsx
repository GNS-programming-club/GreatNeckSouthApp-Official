import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import EventRow from '@/components/calendar/event-row';
import Card from '@/components/ui/card';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useSchoolData } from '@/contexts/school-data-context';
import { useTheme } from '@/contexts/theme-context';
import { fromIsoDate } from '@/lib/day-letters';
import { eventsOnDate, formatUpdatedAgo, nextEventAfter } from '@/lib/school-data';

function shortDate(isoDate: string): string {
  return fromIsoDate(isoDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function EventsCard({ todayIso }: { todayIso: string }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { calendar, status } = useSchoolData();

  const events = useMemo(() => calendar?.events ?? [], [calendar]);
  const todayEvents = useMemo(() => eventsOnDate(events, todayIso), [events, todayIso]);
  const nextEvent = useMemo(() => nextEventAfter(events, todayIso), [events, todayIso]);

  const footer = calendar
    ? formatUpdatedAgo(calendar.generatedAt, new Date())
    : status === 'loading'
      ? 'Loading…'
      : "Couldn't load school events";

  return (
    <Card
      style={styles.card}
      onPress={() => router.push({ pathname: '/calendar', params: { date: todayIso } })}
    >
      <View style={styles.labelRow}>
        <Feather name="flag" size={18} color={colors.primary} />
        <Text style={styles.label}>Today&apos;s events</Text>
      </View>

      {todayEvents.length > 0 ? (
        <View style={styles.list}>
          {todayEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </View>
      ) : calendar ? (
        <View style={styles.list}>
          <Text style={styles.empty}>Nothing on the calendar today</Text>
          {nextEvent ? (
            <Text style={styles.next} numberOfLines={2}>
              Next: {nextEvent.title} · {shortDate(nextEvent.start.slice(0, 10))}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.footer}>{footer}</Text>
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
    empty: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
    },
    next: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
    },
    footer: {
      color: colors.mutedText,
      fontSize: Type.caption.fontSize,
      fontWeight: '600',
    },
  });
