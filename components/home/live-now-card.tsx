import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  PERIOD_COUNT,
  computePeriodTimes,
  nowMinutesLocal,
  parse24hToMinutes,
} from '@/constants/schedule';
import { Colors, Elevation, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type LiveNowCardProps = {
  todaySchedule: (string | null)[] | null;
  todayLetter: string;
};

const ON_HERO = '#FFFFFF';
const ON_HERO_MUTED = 'rgba(255,255,255,0.78)';
const PILL_BG = 'rgba(255,255,255,0.18)';
const TRACK = 'rgba(255,255,255,0.28)';

export default function LiveNowCard({ todaySchedule, todayLetter }: LiveNowCardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [tick, setTick] = useState(() => nowMinutesLocal());

  useEffect(() => {
    const interval = setInterval(() => setTick(nowMinutesLocal()), 30_000);

    return () => clearInterval(interval);
  }, []);

  const live = useMemo(() => {
    const times = computePeriodTimes(PERIOD_COUNT);
    const nowMin = tick;

    for (let i = 0; i < times.length; i++) {
      const start = parse24hToMinutes(times[i].start);
      const end = parse24hToMinutes(times[i].end);

      if (start == null || end == null) continue;

      const isIn = nowMin >= start && nowMin < end;
      const isNext = nowMin < start;

      if (!isIn && !isNext) continue;

      const elapsed = isIn ? (nowMin - start) / (end - start) : 0;

      return {
        kind: isIn ? ('current' as const) : ('next' as const),
        periodIndex: i,
        start: times[i].start,
        end: times[i].end,
        minutesToBell: isIn ? end - nowMin : start - nowMin,
        elapsedFraction: Math.min(1, Math.max(0, elapsed)),
        courseId: todaySchedule?.[i] ?? null,
      };
    }

    return null;
  }, [tick, todaySchedule]);

  const isCurrent = live?.kind === 'current';
  const pillLead = live ? (isCurrent ? 'NOW' : 'NEXT') : `Day ${todayLetter}`;
  const pillTrail = live ? `Period ${live.periodIndex + 1}` : 'Done';

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

          {live.courseId ? (
            <View style={styles.rangeRow}>
              <Text style={styles.rangeCourse}>{live.courseId}</Text>
              <View style={styles.rangeDivider} />
              <Text style={styles.range}>
                {live.start} – {live.end}
              </Text>
            </View>
          ) : (
            <Text style={styles.range}>
              {live.start} – {live.end}
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
      ) : (
        <>
          <Text style={styles.doneText}>No more periods</Text>
          <Text style={styles.range}>See you tomorrow</Text>
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
