import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Elevation, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { useLivePeriod } from '@/hooks/use-live-period';
import { fromIsoDate, type DayLetter, type DayStatus } from '@/lib/day-letters';

type LiveNowCardProps = {
  todaySchedule: (string | null)[] | null;
  todayStatus: DayStatus;
  nextSchoolDay: { date: string; letter: DayLetter } | null;
};

const ON_HERO = '#FFFFFF';
const ON_HERO_MUTED = 'rgba(255,255,255,0.78)';
const PILL_BG = 'rgba(255,255,255,0.18)';
const TRACK = 'rgba(255,255,255,0.28)';

function nextSchoolDayLabel(nextSchoolDay: LiveNowCardProps['nextSchoolDay']): string | null {
  if (!nextSchoolDay) {
    return null;
  }

  const weekday = fromIsoDate(nextSchoolDay.date).toLocaleDateString(undefined, {
    weekday: 'short',
  });

  return `Next: ${nextSchoolDay.letter} day, ${weekday}`;
}

export default function LiveNowCard({
  todaySchedule,
  todayStatus,
  nextSchoolDay,
}: LiveNowCardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const { live: livePeriod } = useLivePeriod();
  const weekday = new Date().getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const isNoSchool =
    todayStatus.kind === 'no-school' || (todayStatus.kind === 'unknown' && isWeekend);
  const live = isNoSchool ? null : livePeriod;
  const todayLetter = todayStatus.kind === 'school' ? todayStatus.letter : '—';
  const nextLabel = nextSchoolDayLabel(nextSchoolDay);
  const courseId = live ? (todaySchedule?.[live.index] ?? null) : null;

  const isCurrent = live?.kind === 'current';
  const pillLead = isNoSchool
    ? 'Today'
    : live
      ? isCurrent
        ? 'NOW'
        : 'NEXT'
      : `Day ${todayLetter}`;
  const pillTrail = isNoSchool ? 'Off' : live ? `Period ${live.index + 1}` : 'Done';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/tools-routes/schedule')}
      style={styles.field}
    >
      <View style={styles.pill}>
        <Text style={styles.pillText}>
          {pillLead} <Text style={styles.pillTextSoft}>{pillTrail}</Text>
        </Text>
      </View>

      {live ? (
        <>
          <View style={styles.numeralRow}>
            <Text style={styles.numeral}>{live.minutesToBell}</Text>
            <Text style={styles.numeralLabel}>min to {isCurrent ? 'bell' : 'start'}</Text>
          </View>

          {courseId ? (
            <View style={styles.rangeRow}>
              <Text style={styles.rangeCourse}>{courseId}</Text>
              <View style={styles.rangeDivider} />
              <Text style={styles.range}>
                {live.period.start} – {live.period.end}
              </Text>
            </View>
          ) : (
            <Text style={styles.range}>
              {live.period.start} – {live.period.end}
            </Text>
          )}

          {isCurrent ? (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${live.elapsedFraction * 100}%` }]} />
            </View>
          ) : (
            <Text style={styles.between}>Starts in {live.minutesToBell} min</Text>
          )}
        </>
      ) : isNoSchool ? (
        <>
          <Text style={styles.doneText}>No school today</Text>
          {nextLabel ? <Text style={styles.range}>{nextLabel}</Text> : null}
        </>
      ) : (
        <>
          <Text style={styles.doneText}>No more periods</Text>
          <Text style={styles.range}>{nextLabel ?? 'See you tomorrow'}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    field: {
      ...Elevation.raised,
      shadowColor: colors.shadow,
      backgroundColor: colors.primary,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
      overflow: 'hidden',
    },
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: PILL_BG,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.xs + 1,
      paddingHorizontal: Spacing.md,
    },
    pillText: {
      color: ON_HERO,
      fontSize: Type.caption.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    pillTextSoft: {
      color: ON_HERO_MUTED,
      fontWeight: '600',
    },
    numeralRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.sm,
    },
    numeral: {
      color: ON_HERO,
      fontSize: 64,
      fontWeight: '800',
      letterSpacing: -1.5,
    },
    numeralLabel: {
      color: ON_HERO_MUTED,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    range: {
      color: ON_HERO_MUTED,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
    },
    rangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    rangeCourse: {
      color: ON_HERO,
      fontSize: Type.body.fontSize,
      fontWeight: '700',
    },
    rangeDivider: {
      width: 1,
      height: 13,
      backgroundColor: TRACK,
    },
    track: {
      height: 6,
      borderRadius: Radius.pill,
      backgroundColor: TRACK,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      borderRadius: Radius.pill,
      backgroundColor: ON_HERO,
    },
    between: {
      color: ON_HERO_MUTED,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
    },
    doneText: {
      color: ON_HERO,
      fontSize: Type.title.fontSize,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
  });
