import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import Card from '@/components/ui/card';
import { Colors, Radii, type RadiusScale } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type MonthCalendarProps = {
  selectedDate: string;
  today: string;
  onDayPress: (dateString: string) => void;
  onMonthChange: (year: number, month: number) => void;
};

export default function MonthCalendar({
  selectedDate,
  today,
  onDayPress,
  onMonthChange,
}: MonthCalendarProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {
      [selectedDate]: {
        selected: true,
        selectedColor: colors.primaryFill,
        selectedTextColor: colors.primaryText,
      },
    };

    if (today !== selectedDate) {
      marks[today] = {
        marked: true,
        dotColor: colors.primary,
      };
    }

    return marks;
  }, [colors.primary, colors.primaryFill, colors.primaryText, selectedDate, today]);

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: colors.surface,
      backgroundColor: colors.surface,
      selectedDayBackgroundColor: colors.primaryFill,
      selectedDayTextColor: colors.primaryText,
      todayTextColor: colors.primary,
      arrowColor: colors.primary,
      disabledArrowColor: colors.mutedText,
      textSectionTitleColor: colors.mutedText,
      dayTextColor: colors.text,
      textDisabledColor: colors.mutedText,
      monthTextColor: colors.text,
      dotColor: colors.primary,
      selectedDotColor: colors.primaryText,
      indicatorColor: colors.primary,
      textMonthFontWeight: '700' as const,
      textDayFontWeight: '600' as const,
      textDayHeaderFontWeight: '700' as const,
      textDayHeaderFontSize: 12,
      textDayFontSize: 15,
      textMonthFontSize: 16,
      'stylesheet.day.basic': {
        selected: {
          borderRadius: radius.md,
          borderCurve: 'continuous',
        },
      },
    }),
    [colors, radius.md]
  );

  return (
    <Card>
      <View style={styles.calendarWrapper}>
        <Calendar
          key={actualTheme}
          current={selectedDate}
          markedDates={markedDates}
          onDayPress={(day: { dateString: string }) => onDayPress(day.dateString)}
          onMonthChange={(month: { year: number; month: number }) =>
            onMonthChange(month.year, month.month)
          }
          theme={calendarTheme}
          style={styles.calendar}
        />
      </View>
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    calendarWrapper: {
      borderRadius: radius.md,
      borderCurve: 'continuous',
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    calendar: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
  });
