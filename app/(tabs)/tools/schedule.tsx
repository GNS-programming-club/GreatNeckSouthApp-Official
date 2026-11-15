import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import PageHeader, { PageLargeTitle, useHeaderCollapse } from '@/components/tools/page-header';
import RollingNumber from '@/components/ui/rolling-number';
import Stagger from '@/components/ui/stagger';
import {
  Colors,
  Elevation,
  FontWeight,
  Opacity,
  Radius,
  Spacing,
  Tracking,
  Type,
} from '@/constants/theme';
import { useTabBarClearance } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import { parseClockToSeconds, useNowSeconds } from '@/hooks/use-live-period';

const scheduleData = require('../../../assets/data/schedule.json');

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

function withoutMeridiem(timeRange: string) {
  return timeRange.replace(/\s?[AP]M/g, '');
}

const SchedulePage = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nowSecondsET = useNowSeconds();
  const collapse = useHeaderCollapse();
  const bottomClearance = { paddingBottom: useTabBarClearance() };

  const schedule = scheduleData as ScheduleData;
  const periods: Period[] = schedule.periods;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PageHeader title="Schedule" collapse={collapse} />
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, bottomClearance]}
        onScroll={collapse.onScroll}
        scrollEventThrottle={16}
      >
        <PageLargeTitle title="Schedule" collapse={collapse} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.statValue}>{periods.length}</Text>
            <Text style={styles.statLabel}>Periods</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {withoutMeridiem(schedule.totalSchoolDay)}
            </Text>
            <Text style={styles.statLabel}>School day</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.statValue}>{schedule.totalDuration}</Text>
            <Text style={styles.statLabel}>In class</Text>
          </View>
        </View>

        <Stagger>
          {periods.map((period, index) => {
            const startSeconds = parseClockToSeconds(period.start);
            const endSeconds = parseClockToSeconds(period.end);
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
                        <RollingNumber value={minutesLeft} style={styles.numeral} />
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
                    <Text style={styles.itemSub}>
                      {state === 'done' ? 'Done' : period.duration}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Stagger>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const NODE_SIZE = 14;
const RAIL_WIDTH = 26;
const TIME_WIDTH = 74;

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.lg,
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
      opacity: Opacity.faint,
    },
    segDone: {
      backgroundColor: colors.mutedText,
      opacity: Opacity.dim,
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
      marginTop: Spacing.xxs,
      marginLeft: TIME_WIDTH + Spacing.md,
    },
    itemMuted: {
      color: colors.mutedText,
    },
    activeCard: {
      backgroundColor: colors.primaryFill,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      ...Elevation.raised,
      shadowColor: colors.shadow,
    },
    activePill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.onPrimarySoft,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
    activePillText: {
      color: colors.primaryText,
      ...Type.caption,
      textTransform: 'uppercase',
      letterSpacing: Tracking.uppercase,
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
      ...Type.label,
      textTransform: 'uppercase',
      letterSpacing: Tracking.uppercase,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    metaName: {
      color: colors.primaryText,
      ...Type.body,
      fontWeight: FontWeight.bold,
    },
    metaDivider: {
      width: 1,
      height: 13,
      backgroundColor: colors.onPrimaryHairline,
    },
    metaRange: {
      color: colors.onPrimaryMuted,
      ...Type.body,
      fontWeight: FontWeight.semibold,
    },
    track: {
      height: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.onPrimaryTrack,
      overflow: 'hidden',
    },
    fill: {
      height: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.primaryText,
    },
  });

export default SchedulePage;
