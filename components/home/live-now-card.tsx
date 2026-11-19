import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MetalRim from '@/components/ui/metal-rim';
import RollingNumber from '@/components/ui/rolling-number';
import {
  Colors,
  Elevation,
  FontWeight,
  Radii,
  type RadiusScale,
  Spacing,
  ThemeTraits,
  Tracking,
  Type,
} from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { useLivePeriod } from '@/hooks/use-live-period';
import { appClock } from '@/lib/clock';
import { fromIsoDate, type DayLetter, type DayStatus } from '@/lib/day-letters';

const METAL_RIM_WIDTH = 3;

type LiveNowCardProps = {
  todayStatus: DayStatus;
  nextSchoolDay: { date: string; letter: DayLetter } | null;
};

function nextSchoolDayLabel(nextSchoolDay: LiveNowCardProps['nextSchoolDay']): string | null {
  if (!nextSchoolDay) {
    return null;
  }

  const weekday = fromIsoDate(nextSchoolDay.date).toLocaleDateString(undefined, {
    weekday: 'short',
  });

  return `Next: ${nextSchoolDay.letter} day, ${weekday}`;
}

export default function LiveNowCard({ todayStatus, nextSchoolDay }: LiveNowCardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const router = useRouter();

  const { live: livePeriod } = useLivePeriod();
  const weekday = appClock.now().getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const isNoSchool =
    todayStatus.kind === 'no-school' || (todayStatus.kind === 'unknown' && isWeekend);
  const live = isNoSchool ? null : livePeriod;
  const todayLetter = todayStatus.kind === 'school' ? todayStatus.letter : '—';
  const nextLabel = nextSchoolDayLabel(nextSchoolDay);

  const isCurrent = live?.kind === 'current';
  const pillLead = isNoSchool
    ? 'Today'
    : live
      ? isCurrent
        ? 'NOW'
        : 'NEXT'
      : `Day ${todayLetter}`;
  const pillTrail = isNoSchool ? 'Off' : live ? `Period ${live.index + 1}` : 'Done';

  const card = (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/tools/schedule')}
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
            <RollingNumber value={live.minutesToBell} style={styles.numeral} />
            <Text style={styles.numeralLabel}>min to {isCurrent ? 'bell' : 'start'}</Text>
          </View>

          <Text style={styles.range}>
            {live.period.start} – {live.period.end}
          </Text>

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

  const metalRimColors = ThemeTraits[actualTheme].metalRim;

  if (metalRimColors) {
    return (
      <MetalRim colors={metalRimColors} borderWidth={METAL_RIM_WIDTH} borderRadius={radius.lg}>
        {card}
      </MetalRim>
    );
  }

  return card;
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    field: {
      ...Elevation.raised,
      shadowColor: colors.shadow,
      backgroundColor: colors.primaryFill,
      borderRadius: radius.lg,
      borderCurve: 'continuous',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
      overflow: 'hidden',
    },
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.onPrimarySoft,
      borderRadius: radius.pill,
      paddingVertical: Spacing.xs + 1,
      paddingHorizontal: Spacing.md,
    },
    pillText: {
      color: colors.primaryText,
      fontSize: Type.caption.fontSize,
      fontWeight: FontWeight.bold,
      textTransform: 'uppercase',
      letterSpacing: Tracking.uppercase,
    },
    pillTextSoft: {
      color: colors.onPrimaryMuted,
      fontWeight: FontWeight.semibold,
    },
    numeralRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.sm,
    },
    numeral: {
      color: colors.primaryText,
      ...Type.hero,
    },
    numeralLabel: {
      color: colors.onPrimaryMuted,
      fontSize: Type.label.fontSize,
      fontWeight: FontWeight.bold,
      textTransform: 'uppercase',
      letterSpacing: Tracking.uppercase,
    },
    range: {
      color: colors.onPrimaryMuted,
      fontSize: Type.body.fontSize,
      fontWeight: FontWeight.semibold,
    },
    track: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.onPrimaryTrack,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryText,
    },
    between: {
      color: colors.onPrimaryMuted,
      fontSize: Type.label.fontSize,
      fontWeight: FontWeight.bold,
    },
    doneText: {
      color: colors.primaryText,
      fontSize: Type.title.fontSize,
      fontWeight: FontWeight.heavy,
      letterSpacing: Tracking.tight,
    },
  });
