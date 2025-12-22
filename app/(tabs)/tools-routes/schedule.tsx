import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const scheduleData = require('../../../assets/data/schedule.json');

const { width } = Dimensions.get('window');

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
    const hour = Number(parts.find(p => p.type === 'hour')?.value);
    const minute = Number(parts.find(p => p.type === 'minute')?.value);
    const second = Number(parts.find(p => p.type === 'second')?.value);
    if (Number.isFinite(hour) && Number.isFinite(minute) && Number.isFinite(second)) {
      return hour * 3600 + minute * 60 + second;
    }
  } catch {
    // TODO: fallback to local timezone (if anything)
  }

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
  const periodAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const hasAnimatedOnce = useRef(false);
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

  const getOrCreateAnim = useCallback((key: string) => {
    if (!periodAnims.has(key)) {
      periodAnims.set(key, new Animated.Value(0));
    }
    return periodAnims.get(key)!;
  }, [periodAnims]);

  useEffect(() => {
    if (hasAnimatedOnce.current) return;
    hasAnimatedOnce.current = true;

    const animations: Animated.CompositeAnimation[] = [];

    periods.forEach((period) => {
      const anim = getOrCreateAnim(period.id);
      anim.stopAnimation();
      anim.setValue(0);
      animations.push(
        Animated.timing(anim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        })
      );
    });

    const sequence = Animated.stagger(70, animations);
    sequence.start();
    return () => sequence.stop();
  }, [getOrCreateAnim, periods]);

  /*
  useEffect(() => {
    periodAnims.forEach(anim => anim.setValue(0));

    Animated.stagger(
      70,
      periods.map((period) =>
        Animated.timing(getOrCreateAnim(period.id), {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods.length]);
  */

  const renderPeriodCard = (period: Period, index: number) => {
    const isEven = index % 2 === 0;
    const anim = getOrCreateAnim(period.id);
    const startSeconds = parseTimeToSeconds(period.start);
    const endSeconds = parseTimeToSeconds(period.end);
    const isValidRange = startSeconds !== null && endSeconds !== null && endSeconds > startSeconds;
    const isActive = isValidRange && nowSecondsET >= startSeconds! && nowSecondsET < endSeconds!;
    const isCompleted = isValidRange && nowSecondsET >= endSeconds!;
    const progress = isValidRange
      ? isCompleted
        ? 1
        : isActive
          ? Math.min(1, Math.max(0, (nowSecondsET - startSeconds!) / (endSeconds! - startSeconds!)))
          : 0
      : 0;
    
    return (
      <Animated.View
        key={period.id}
        style={[
          styles.periodCard,
          isEven ? styles.periodCardEven : styles.periodCardOdd,
          isActive ? styles.periodCardActive : undefined,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.periodHeader}>
          <Text style={[styles.periodTitle, isActive ? styles.periodTitleActive : undefined]}>{period.period}</Text>
          <View style={[styles.timeBadge, isActive ? styles.timeBadgeActive : undefined]}>
            <Text style={[styles.durationText, isActive ? styles.durationTextActive : undefined]}>
              {period.duration}
            </Text>
          </View>
        </View>
        
        <View style={styles.timeContainer}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{period.start}</Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
          
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue}>{period.end}</Text>
          </View>
        </View>
        
        <View style={styles.timelineContainer}>
          <View style={styles.timeline}>
            <View style={[styles.timelineFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.periodNumber}>{period.id}</Text>
        </View>
      </Animated.View>
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/tools')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Schedule</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>School Day Overview</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Periods</Text>
              <Text style={styles.summaryValue}>{periods.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>School Day</Text>
              <Text style={styles.summaryValue}>{schedule.totalSchoolDay}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Duration</Text>
              <Text style={styles.summaryValue}>{schedule.totalDuration}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Daily Schedule</Text>
          
          {periods.map((period, index) => (
            <View key={period.id}>
              {renderPeriodCard(period, index)}
              
              {index < periods.length - 1 && (
                <View style={styles.breakContainer}>
                  <View style={styles.breakLine} />
                  <Text style={styles.breakText}>
                    {calculateTimeBetween(period.end, periods[index + 1].start)} transition
                  </Text>
                  <View style={styles.breakLine} />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Schedule Notes</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.infoText}>Each period is approximately 40 minutes</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.infoText}>4-minute passing time between classes</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.infoText}>Schedule may vary on special days</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.infoText}>Period 2 is slightly longer (43 minutes)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      paddingBottom: 75,
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      justifyContent: 'center',
      alignContent: 'center',
      paddingHorizontal: 16,
      paddingTop: 25,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      alignSelf: 'flex-start',
      height: 36,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: 10,
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    summaryItem: {
      width: (width - 32 - 40) / 3,
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.mutedText,
      marginBottom: 4,
      textAlign: 'center',
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    timelineSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    periodCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodCardEven: {
      backgroundColor: colors.surface,
    },
    periodCardOdd: {
      backgroundColor: colors.surface,
    },
    periodCardActive: {
      borderColor: colors.primary,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 6,
    },
    periodHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    periodTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    periodTitleActive: {
      color: colors.primary,
    },
    timeBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    timeBadgeActive: {
      backgroundColor: colors.primary,
    },
    durationText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    durationTextActive: {
      color: colors.primaryText,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    timeColumn: {
      flex: 1,
      alignItems: 'center',
    },
    timeLabel: {
      fontSize: 12,
      color: colors.mutedText,
      marginBottom: 4,
    },
    timeValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    arrowContainer: {
      paddingHorizontal: 20,
    },
    arrow: {
      fontSize: 20,
      color: colors.mutedText,
      fontWeight: 'bold',
    },
    timelineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeline: {
      flex: 1,
      height: 3,
      backgroundColor: colors.border,
      borderRadius: 1.5,
      overflow: 'hidden',
    },
    timelineFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    periodNumber: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.mutedText,
      marginLeft: 12,
    },
    breakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
      paddingHorizontal: 8,
    },
    breakLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    breakText: {
      fontSize: 11,
      color: colors.mutedText,
      paddingHorizontal: 12,
      fontStyle: 'italic',
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    infoList: {
      gap: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 6,
      marginRight: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

export default SchedulePage;
