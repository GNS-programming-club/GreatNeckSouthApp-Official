import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import Card from '@/components/ui/card';
import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const scheduleData = require('../../../assets/data/schedule.json');

const ON_HERO = '#FFFFFF';
const ON_HERO_MUTED = 'rgba(255,255,255,0.78)';
const PILL_BG = 'rgba(255,255,255,0.18)';
const TRACK = 'rgba(255,255,255,0.28)';

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

  const calculateTimeBetween = (currentEnd: string, nextStart: string) => {
    const endSeconds = parseTimeToSeconds(currentEnd);
    const startSeconds = parseTimeToSeconds(nextStart);
    if (endSeconds == null || startSeconds == null) return '—';

    let deltaSeconds = startSeconds - endSeconds;
    if (deltaSeconds < 0) {
      deltaSeconds += 24 * 3600;
    }

    const minutes = Math.max(0, Math.round(deltaSeconds / 60));
    return `${minutes} min`;
  };

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
      <Card>
        <Text style={styles.summaryLabel}>School Day Overview</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.statValue}>{periods.length}</Text>
            <Text style={styles.statLabel}>Periods</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.statValue}>{schedule.totalSchoolDay}</Text>
            <Text style={styles.statLabel}>School Day</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.statValue}>{schedule.totalDuration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>
      </Card>

      <Stagger delay={70} duration={380} translateY={10}>
        {periods.map((period, index) => {
          const startSeconds = parseTimeToSeconds(period.start);
          const endSeconds = parseTimeToSeconds(period.end);
          const isValidRange =
            startSeconds !== null && endSeconds !== null && endSeconds > startSeconds;
          const isActive =
            isValidRange && nowSecondsET >= startSeconds! && nowSecondsET < endSeconds!;
          const isCompleted = isValidRange && nowSecondsET >= endSeconds!;
          const progress = isValidRange
            ? isCompleted
              ? 1
              : isActive
                ? Math.min(
                    1,
                    Math.max(0, (nowSecondsET - startSeconds!) / (endSeconds! - startSeconds!))
                  )
                : 0
            : 0;

          return (
            <View key={period.id}>
              {isActive ? (
                <View style={styles.activeCard}>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>NOW · {period.period.toUpperCase()}</Text>
                  </View>

                  <View style={styles.activeTimeRow}>
                    <Text style={styles.activeTimeValue}>{period.start}</Text>
                    <Text style={styles.activeArrow}>→</Text>
                    <Text style={styles.activeTimeValue}>{period.end}</Text>
                  </View>

                  <Text style={styles.activeDuration}>{period.duration}</Text>

                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                </View>
              ) : (
                <Card style={styles.periodCardOverride}>
                  <View style={styles.periodRow}>
                    <Text style={[styles.periodName, isCompleted && styles.periodNameDone]}>
                      {period.period}
                    </Text>
                    <Text style={styles.periodDuration}>{period.duration}</Text>
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={[styles.timeVal, isCompleted && styles.timeValDone]}>
                      {period.start}
                    </Text>
                    <Text style={styles.timeArrow}>→</Text>
                    <Text style={[styles.timeVal, isCompleted && styles.timeValDone]}>
                      {period.end}
                    </Text>
                  </View>

                  {isCompleted && (
                    <View style={styles.progressTrack}>
                      <View style={styles.progressFill} />
                    </View>
                  )}
                </Card>
              )}

              {index < periods.length - 1 && (
                <View style={styles.breakRow}>
                  <View style={styles.breakLine} />
                  <Text style={styles.breakLabel}>
                    {calculateTimeBetween(period.end, periods[index + 1].start)} passing
                  </Text>
                  <View style={styles.breakLine} />
                </View>
              )}
            </View>
          );
        })}
      </Stagger>
    </Screen>
  );
};

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
    summaryLabel: {
      ...Type.label,
      color: colors.mutedText,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryCol: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      height: 32,
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
    activeCard: {
      backgroundColor: colors.primary,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xl,
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
    activeTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    activeTimeValue: {
      color: ON_HERO,
      ...Type.title,
    },
    activeArrow: {
      color: ON_HERO_MUTED,
      ...Type.body,
    },
    activeDuration: {
      color: ON_HERO_MUTED,
      ...Type.label,
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
    periodCardOverride: {
      gap: Spacing.sm,
    },
    periodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    periodName: {
      ...Type.heading,
      color: colors.text,
    },
    periodNameDone: {
      color: colors.mutedText,
    },
    periodDuration: {
      ...Type.label,
      color: colors.primary,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    timeVal: {
      ...Type.body,
      color: colors.text,
      fontWeight: '700',
    },
    timeValDone: {
      color: colors.mutedText,
    },
    timeArrow: {
      ...Type.body,
      color: colors.mutedText,
    },
    progressTrack: {
      height: 3,
      borderRadius: Radius.pill,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: 3,
      width: '100%',
      borderRadius: Radius.pill,
      backgroundColor: colors.primary,
      opacity: 0.35,
    },
    breakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    breakLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    breakLabel: {
      ...Type.caption,
      color: colors.mutedText,
      paddingHorizontal: Spacing.md,
    },
  });

export default SchedulePage;
