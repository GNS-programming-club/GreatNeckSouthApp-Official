import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const scheduleData = require('../../../assets/data/schedule.json');

const ON_HERO = '#FFFFFF';
const ON_HERO_MUTED = 'rgba(255,255,255,0.78)';
const PILL_BG = 'rgba(255,255,255,0.18)';
const TRACK = 'rgba(255,255,255,0.28)';
const HAIRLINE = 'rgba(255,255,255,0.35)';

function getEasternSeconds() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    const second = Number(parts.find((p) => p.type === 'second')?.value);

    if (Number.isFinite(hour) && Number.isFinite(minute) && Number.isFinite(second)) {
      return hour * 3600 + minute * 60 + second;
    }
  } catch {}

  const now = new Date();

  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

interface Period {
  id: string;
  period: string;
  start: string;
  end: string;
  duration: string;
}

interface ScheduleData {
  periods: Period[];
  totalSchoolDay: string;
  totalDuration: string;
}

type PeriodState = 'done' | 'active' | 'upcoming';

const SchedulePage = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [nowSecondsET, setNowSecondsET] = useState<number>(() => getEasternSeconds());

  const schedule = scheduleData as ScheduleData;
  const periods: Period[] = schedule.periods;

  const parseTimeToSeconds = useCallback((timeString: string) => {
    const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!match) return null;

    const [, hourRaw, minuteRaw, ampmRaw] = match;
    let hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    const ampm = ampmRaw.toUpperCase();

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

    if (ampm === 'AM') {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }

    return hour * 3600 + minute * 60;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowSecondsET(getEasternSeconds()), 1000);

    return () => clearInterval(interval);
  }, []);

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Feather name="chevron-left" size={26} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Schedule</Text>
    </View>
  );

  return (
    <Screen scroll header={header}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.statValue}>{periods.length}</Text>
          <Text style={styles.statLabel}>Periods</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.statValue}>{schedule.totalSchoolDay}</Text>
          <Text style={styles.statLabel}>School day</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.statValue}>{schedule.totalDuration}</Text>
          <Text style={styles.statLabel}>In class</Text>
        </View>
      </View>

      <Stagger delay={60} duration={360} translateY={10}>
        {periods.map((period, index) => {
          const startSeconds = parseTimeToSeconds(period.start);
          const endSeconds = parseTimeToSeconds(period.end);
          const isValidRange =
            startSeconds !== null && endSeconds !== null && endSeconds > startSeconds;
          const isActive =
            isValidRange && nowSecondsET >= startSeconds! && nowSecondsET < endSeconds!;
          const isCompleted = isValidRange && nowSecondsET >= endSeconds!;
          const state: PeriodState = isActive ? 'active' : isCompleted ? 'done' : 'upcoming';
          const progress =
            isValidRange && isActive
              ? Math.min(
                  1,
                  Math.max(0, (nowSecondsET - startSeconds!) / (endSeconds! - startSeconds!))
                )
              : 0;
          const minutesLeft =
            isActive && endSeconds !== null
              ? Math.max(1, Math.ceil((endSeconds - nowSecondsET) / 60))
              : 0;

          const isFirst = index === 0;
          const isLast = index === periods.length - 1;
          const segColor = state === 'done' ? styles.segDone : styles.segIdle;

          return (
            <View key={period.id} style={styles.row}>
              <View style={styles.rail}>
                <View style={[styles.seg, isFirst ? styles.segHidden : segColor]} />
                <View
                  style={[
                    styles.dot,
                    state === 'done' && styles.dotDone,
                    state === 'active' && styles.dotActive,
                    state === 'upcoming' && styles.dotUpcoming,
                  ]}
                />
                <View style={[styles.seg, isLast ? styles.segHidden : segColor]} />
              </View>

              {isActive ? (
                <View style={styles.content}>
                  <View style={styles.activeCard}>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>NOW</Text>
                    </View>

                    <View style={styles.numeralRow}>
                      <Text style={styles.numeral}>{minutesLeft}</Text>
                      <Text style={styles.numeralLabel}>min left</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaName}>{period.period}</Text>
                      <View style={styles.metaDivider} />
                      <Text style={styles.metaRange}>
                        {period.start} → {period.end}
                      </Text>
                    </View>

                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.content}>
                  <View style={styles.itemHead}>
                    <Text
                      style={[styles.itemTime, state === 'done' && styles.itemMuted]}
                      numberOfLines={1}
                    >
                      {period.start}
                    </Text>
                    <Text style={[styles.itemName, state === 'done' && styles.itemMuted]}>
                      {period.period}
                    </Text>
                  </View>
                  <Text style={styles.itemSub}>{state === 'done' ? 'Done' : period.duration}</Text>
                </View>
              )}
            </View>
          );
        })}
      </Stagger>
    </Screen>
  );
};

const NODE_SIZE = 14;
const RAIL_WIDTH = 26;
const TIME_WIDTH = 74;

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      alignSelf: 'flex-start',
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    title: {
      ...Type.display,
      color: colors.text,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.lg,
    },
    summaryCol: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
    },
    statValue: {
      ...Type.heading,
      color: colors.text,
    },
    statLabel: {
      ...Type.caption,
      color: colors.mutedText,
      marginTop: Spacing.xs,
    },
    row: {
      flexDirection: 'row',
      columnGap: Spacing.md,
      alignItems: 'stretch',
    },
    rail: {
      width: RAIL_WIDTH,
      alignItems: 'center',
    },
    seg: {
      width: 2,
      flex: 1,
    },
    segHidden: {
      backgroundColor: 'transparent',
    },
    segIdle: {
      backgroundColor: colors.mutedText,
      opacity: 0.28,
    },
    segDone: {
      backgroundColor: colors.mutedText,
      opacity: 0.45,
    },
    dot: {
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_SIZE / 2,
      borderWidth: 2,
    },
    dotDone: {
      backgroundColor: colors.mutedText,
      borderColor: colors.mutedText,
    },
    dotActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dotUpcoming: {
      backgroundColor: colors.background,
      borderColor: colors.mutedText,
    },
    content: {
      flex: 1,
      paddingVertical: Spacing.md,
    },
    itemHead: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: Spacing.md,
    },
    itemTime: {
      ...Type.label,
      color: colors.text,
      width: TIME_WIDTH,
    },
    itemName: {
      ...Type.heading,
      color: colors.text,
    },
    itemSub: {
      ...Type.caption,
      color: colors.mutedText,
      marginTop: 2,
      marginLeft: TIME_WIDTH + Spacing.md,
    },
    itemMuted: {
      color: colors.mutedText,
    },
    activeCard: {
      backgroundColor: colors.primary,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    activePill: {
      alignSelf: 'flex-start',
      backgroundColor: PILL_BG,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
    activePillText: {
      color: ON_HERO,
      ...Type.caption,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    numeralRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.sm,
    },
    numeral: {
      color: ON_HERO,
      fontSize: 52,
      fontWeight: '800',
      letterSpacing: -1.5,
    },
    numeralLabel: {
      color: ON_HERO_MUTED,
      ...Type.label,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    metaName: {
      color: ON_HERO,
      ...Type.body,
      fontWeight: '700',
    },
    metaDivider: {
      width: 1,
      height: 13,
      backgroundColor: HAIRLINE,
    },
    metaRange: {
      color: ON_HERO_MUTED,
      ...Type.body,
      fontWeight: '600',
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
  });

export default SchedulePage;
