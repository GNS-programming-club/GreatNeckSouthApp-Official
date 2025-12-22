import ScheduleCard from '@/components/schedule-card';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const STORAGE_KEY = 'userSchedule_v1';

function formatMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = h % 24;
  return `${hh}:${m.toString().padStart(2, '0')}`;
}

function computePeriodTimes(count: number, startMinutes = 7 * 60 + 59, lessonLen = 40, breakLen = 4) {
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

export default function HomeScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sectionAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const router = useRouter();
  const [todaySchedule, setTodaySchedule] = useState<(string | null)[] | null>(null);

  const getDayLetter = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDifference = Math.round((targetDate.getTime() - today.getTime()) / msPerDay);

    const dayCycle = ['B', 'A'];
    const dayIndex = ((daysDifference % dayCycle.length) + dayCycle.length) % dayCycle.length;

    return dayCycle[dayIndex];
  };

  const today = useMemo(() => new Date(), []);
  const todayLetter = getDayLetter(today);
  const dateLabel = useMemo(() => {
    const weekday = today.toLocaleDateString(undefined, { weekday: 'long' });
    const monthDay = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    return `${weekday}, ${monthDay}`;
  }, [today]);

  const bulletinItems = useMemo(() => {
    const weekday = today.getDay(); // 0=sunday
    const base = [
      'Check the Tools tab for schedules and maps.',
    ];

    const byDay: Record<number, string[]> = {
      1: ['Monday reset: plan your week and check deadlines.', ...base],
      2: ['Tuesday: check announcements for clubs & activities.', ...base],
      3: ['Midweek check-in: stay on top of quizzes and homework.', ...base],
      4: ['Thursday: review notes early to reduce stress tomorrow.', ...base],
      5: ['Friday: wrap up assignments before the weekend.', ...base],
    };

    return (byDay[weekday] ?? base).slice(0, 3);
  }, [today]);

  useEffect(() => {
    const key = `${STORAGE_KEY}_${todayLetter}`;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) {
          setTodaySchedule(null);
          return;
        }
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setTodaySchedule(parsed as (string | null)[]);
        } else {
          setTodaySchedule(null);
        }
      })
      .catch(() => setTodaySchedule(null));
  }, [todayLetter]);

  const [nowLabel, setNowLabel] = useState(() =>
    new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );

  useEffect(() => {
    const tick = () => setNowLabel(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, []);

  const nextUp = useMemo(() => {
    const periods = 9;
    const times = computePeriodTimes(periods);
    const nowMin = nowMinutesLocal();

    for (let i = 0; i < times.length; i++) {
      const start = parse24hToMinutes(times[i].start);
      const end = parse24hToMinutes(times[i].end);
      if (start == null || end == null) continue;

      const isIn = nowMin >= start && nowMin < end;
      const isNext = nowMin < start;
      if (!isIn && !isNext) continue;

      const courseId = todaySchedule?.[i] ?? null;
      return {
        kind: isIn ? ('current' as const) : ('next' as const),
        periodIndex: i,
        start: times[i].start,
        end: times[i].end,
        courseId,
      };
    }

    return null;
  }, [todaySchedule]);

  useEffect(() => {
    sectionAnims.forEach((a) => {
      a.stopAnimation();
      a.setValue(0);
    });

    const sequence = Animated.stagger(
      90,
      sectionAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        })
      )
    );

    sequence.start();
    return () => sequence.stop();
  }, [sectionAnims]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={{
            opacity: sectionAnims[0],
            transform: [
              {
                translateY: sectionAnims[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to GNSHS!</Text>
            <Text style={styles.subTitle}>{dateLabel}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnims[1],
            transform: [
              {
                translateY: sectionAnims[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}
        >
          <View style={[styles.card, styles.todayCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Today</Text>
              <View style={styles.dayPill}>
                <Text style={styles.dayPillLabel}>Day</Text>
                <Text style={styles.dayPillValue}>{todayLetter}</Text>
              </View>
            </View>

            <View style={styles.todayRow}>
              <View style={styles.todayItem}>
                <Text style={styles.todayLabel}>Now</Text>
                <Text style={styles.todayValue}>{nowLabel}</Text>
              </View>
              <View style={styles.todayItem}>
                <Text style={styles.todayLabel}>{nextUp?.kind === 'current' ? 'Current' : 'Next up'}</Text>
                <Text style={styles.todayValue}>
                  {nextUp
                    ? `Period ${nextUp.periodIndex + 1} · ${nextUp.start}–${nextUp.end}`
                    : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.bulletinList}>
              {bulletinItems.map((item) => (
                <View key={item} style={styles.bulletinItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnims[2],
            transform: [
              {
                translateY: sectionAnims[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/tools' as any)} activeOpacity={0.8}>
              <View style={styles.quickArrow}>
                <Feather name="arrow-right" size={22} color={colors.mutedText} />
              </View>
              <Text style={styles.quickTitle}>Tools Page</Text>
              <Text style={styles.quickSub} numberOfLines={1}>Schedule, busses, maps, and more</Text>
            </TouchableOpacity>
          </View>

          <ScheduleCard day={todayLetter as 'A' | 'B'} style={{ width: '100%' }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
      gap: 16,
    },
    header: {
      paddingTop: 8,
      paddingBottom: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.3,
    },
    subTitle: {
      marginTop: 6,
      color: colors.mutedText,
      fontSize: 14,
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      gap: 8,
    },
    todayCard: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
      padding: 0,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dayPill: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'baseline',
    },
    dayPillLabel: {
      color: colors.mutedText,
      fontSize: 12,
      fontWeight: '700',
    },
    dayPillValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    todayRow: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 12,
    },
    todayItem: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    todayLabel: {
      color: colors.mutedText,
      fontSize: 12,
      fontWeight: '700',
    },
    todayValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      flexShrink: 1,
    },
    bulletinList: {
      gap: 10,
      marginTop: 2,
    },
    bulletinItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 7,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.mutedText,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickAction: {
      width: '100%',
      marginBottom: 15,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      paddingRight: 46,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
      gap: 6,
      justifyContent: 'center',
    },
    quickArrow: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 14,
      justifyContent: 'center',
    },
    quickTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    quickSub: {
      color: colors.mutedText,
      fontSize: 12,
      fontWeight: '600',
    },
  });
