import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/card';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type LiveNowCardProps = {
  todaySchedule: (string | null)[] | null;
  todayLetter: string;
};

function formatMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = h % 24;

  return `${hh}:${m.toString().padStart(2, '0')}`;
}

function computePeriodTimes(
  count: number,
  startMinutes = 7 * 60 + 59,
  lessonLen = 40,
  breakLen = 4
) {
  const times: { start: string; end: string }[] = [];

  for (let i = 0; i < count; i++) {
    const start = startMinutes + i * (lessonLen + breakLen);
    const end = start + lessonLen;
    times.push({ start: formatMinutes(start), end: formatMinutes(end) });
  }

  return times;
}

function parse24hToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return h * 60 + m;
}

function nowMinutesLocal() {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
}

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
    const times = computePeriodTimes(9);
    const nowMin = tick;

    for (let i = 0; i < times.length; i++) {
      const start = parse24hToMinutes(times[i].start);
      const end = parse24hToMinutes(times[i].end);

      if (start == null || end == null) continue;

      const isIn = nowMin >= start && nowMin < end;
      const isNext = nowMin < start;

      if (!isIn && !isNext) continue;

      return {
        kind: isIn ? ('current' as const) : ('next' as const),
        periodIndex: i,
        start: times[i].start,
        end: times[i].end,
        minutesToBell: isIn ? end - nowMin : start - nowMin,
        courseId: todaySchedule?.[i] ?? null,
      };
    }

    return null;
  }, [tick, todaySchedule]);

  const bellColor = live?.kind === 'current' ? colors.successText : colors.warnText;
  const bellLabel = live
    ? live.kind === 'current'
      ? `ends in ${live.minutesToBell} min`
      : `starts in ${live.minutesToBell} min`
    : 'No more periods today';

  return (
    <Card elevation="floating" onPress={() => router.push('/tools-routes/schedule')}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>{live?.kind === 'current' ? 'In class' : 'Up next'}</Text>
        <Text style={styles.dayLabel}>Day {todayLetter}</Text>
      </View>

      {live ? (
        <>
          <Text style={styles.period}>Period {live.periodIndex + 1}</Text>
          <Text style={styles.range}>
            {live.start} – {live.end}
          </Text>
          <Text style={[styles.bell, { color: bellColor }]}>{bellLabel}</Text>
        </>
      ) : (
        <Text style={styles.bell}>{bellLabel}</Text>
      )}
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eyebrow: {
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: Type.label.fontWeight,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    dayLabel: {
      color: colors.text,
      fontSize: Type.label.fontSize,
      fontWeight: '800',
    },
    period: {
      color: colors.text,
      fontSize: Type.title.fontSize,
      fontWeight: Type.title.fontWeight,
      letterSpacing: Type.title.letterSpacing,
    },
    range: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
    bell: {
      marginTop: Spacing.xs,
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
    },
  });
