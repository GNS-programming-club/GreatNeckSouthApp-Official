import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getMenuItemsForDay } from '@/api/daily-menu';
import DayAgenda from '@/components/calendar/day-agenda';
import MonthCalendar from '@/components/calendar/month-calendar';
import { useMonthMenu } from '@/components/calendar/use-month-menu';
import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { dayLetterFor } from '@/constants/schedule';
import { Colors, Elevation, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const ON_HERO = '#FFFFFF';
const ON_HERO_MUTED = 'rgba(255,255,255,0.78)';
const PILL_BG = 'rgba(255,255,255,0.18)';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatLocalISODate(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());

  return d.toISOString().split('T')[0];
}

function parseLocalDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

export default function CalendarScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => formatLocalISODate(today), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => ({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }));

  const { menu } = useMonthMenu(viewMonth.year, viewMonth.month);

  const selectedDateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);

  const menuItems = useMemo<string[] | null>(() => {
    const selectedMonth = selectedDateObj.getMonth() + 1;
    const selectedYear = selectedDateObj.getFullYear();

    if (!menu || menu.month !== selectedMonth || menu.year !== selectedYear) {
      return null;
    }

    return getMenuItemsForDay(menu, selectedDateObj.getDate());
  }, [menu, selectedDateObj]);

  const handleDayPress = useCallback((dateString: string) => {
    setSelectedDate((current) => (current === dateString ? current : dateString));
  }, []);

  const handleMonthChange = useCallback((year: number, month: number) => {
    setViewMonth({ year, month });
  }, []);

  const heroLetter = dayLetterFor(today);
  const heroDate = `${MONTHS_SHORT[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <Screen>
      <Stagger>
        <View style={styles.hero}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Today</Text>
          </View>
          <View style={styles.heroRow}>
            <Text style={styles.heroLetter}>{heroLetter}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaLabel}>Day letter</Text>
              <Text style={styles.heroDate}>{heroDate}</Text>
            </View>
          </View>
        </View>

        <MonthCalendar
          selectedDate={selectedDate}
          today={todayISO}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
        />

        <DayAgenda date={selectedDateObj} menuItems={menuItems} />
      </Stagger>
    </Screen>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    hero: {
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
    heroPill: {
      alignSelf: 'flex-start',
      backgroundColor: PILL_BG,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.xs + 1,
      paddingHorizontal: Spacing.md,
    },
    heroPillText: {
      color: ON_HERO,
      fontSize: Type.caption.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    heroLetter: {
      color: ON_HERO,
      fontSize: 56,
      fontWeight: '800',
      letterSpacing: -1.5,
      lineHeight: 58,
    },
    heroMeta: {
      flex: 1,
      gap: Spacing.xs,
    },
    heroMetaLabel: {
      color: ON_HERO_MUTED,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    heroDate: {
      color: ON_HERO,
      fontSize: Type.heading.fontSize,
      fontWeight: '700',
    },
  });
