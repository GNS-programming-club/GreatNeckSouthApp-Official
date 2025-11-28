import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

interface TodayInfo {
  date: string;
  dayLetter: string;
  lunchMenu: string[];
  holidays: string[];
  clubEvents: Array<{ name: string; time: string }>;
}

interface TodayResponse {
  lunchMenu?: string[];
  holidays?: string[];
  clubEvents?: Array<{ name: string; time: string }>;
}

const CalendarScreen = () => {
  const navigation = useNavigation();
  const isMountedRef = useRef(true);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const eventsAnim = useRef(new Animated.Value(0)).current;
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [todayInfo, setTodayInfo] = useState<TodayInfo>({
    date: '',
    dayLetter: '',
    lunchMenu: [],
    holidays: [],
    clubEvents: [],
  });

  const getDayLetter = useCallback((date: Date): string => {
    // TODO: replace placeholder with real day calculation
    return 'A';
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const animations = [
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 550,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.spring(heroAnim, {
        toValue: 1,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(calendarAnim, {
        toValue: 1,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(eventsAnim, {
        toValue: 1,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }),
    ];

    Animated.stagger(90, animations).start();

    return () => {
      isMountedRef.current = false;
    };
  }, [fadeIn, heroAnim, calendarAnim, eventsAnim]);

  useEffect(() => {
    let cancelled = false;

    const loadTodayInfo = async () => {
      try {
        const response = await axios.get<TodayResponse>(`/api/today/${selectedDate}`);

        if (cancelled || !isMountedRef.current) return;

        const dateObj = new Date(selectedDate);

        setTodayInfo({
          date: dateObj.toLocaleDateString(),
          dayLetter: getDayLetter(dateObj),
          lunchMenu: response.data?.lunchMenu || [],
          holidays: response.data?.holidays || [],
          clubEvents: response.data?.clubEvents || [],
        });
      } catch (error) {
        if (cancelled || !isMountedRef.current) return;

        console.error("Failed to load today's info:", error);

        const dateObj = new Date(selectedDate);
        setTodayInfo({
          date: dateObj.toLocaleDateString(),
          dayLetter: getDayLetter(dateObj),
          lunchMenu: [],
          holidays: [],
          clubEvents: [],
        });
      }
    };

    loadTodayInfo();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, getDayLetter]);

  const markedDates = useMemo(
    () => ({
      [selectedDate]: {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: colors.primaryText,
      },
    }),
    [colors.primary, colors.primaryText, selectedDate],
  );

  const handleDayPress = useCallback((day: { dateString: string }) => {
    setSelectedDate((current) => (current === day.dateString ? current : day.dateString));
  }, []);

  const handleAddEvent = useCallback(() => {
    navigation.navigate('SubmitClubEvent' as never);
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeIn }}
      >
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Today</Text>
            </View>
            <Text style={styles.heroDate}>{todayInfo.date || 'Loading...'}</Text>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Day</Text>
              <Text style={styles.heroPillValue}>{todayInfo.dayLetter || '-'}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Events</Text>
              <Text style={styles.heroPillValue}>{todayInfo.clubEvents.length}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Holidays</Text>
              <Text style={styles.heroPillValue}>{todayInfo.holidays.length}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: calendarAnim,
              transform: [
                {
                  translateY: calendarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              calendarBackground: colors.surface,
              backgroundColor: colors.surface,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.primaryText,
              todayTextColor: colors.accent,
              todayBackgroundColor: colors.surfaceAlt,
              arrowColor: colors.primary,
              textSectionTitleColor: colors.mutedText,
              dayTextColor: colors.text,
              textDisabledColor: colors.mutedText,
              monthTextColor: colors.text,
              textMonthFontWeight: '700',
              textDayFontWeight: '500',
              textDayHeaderFontWeight: '600',
            }}
            style={styles.calendar}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: eventsAnim,
              transform: [
                {
                  translateY: eventsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.sectionTitle}>Today&apos;s Club Events</Text>

          {todayInfo.clubEvents && todayInfo.clubEvents.length > 0 ? (
            todayInfo.clubEvents.map((event, index) => (
              <View key={`${event.name}-${index}`} style={styles.eventRow}>
                <View style={styles.eventDot} />
                <View style={styles.eventText}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No club events scheduled for this day.</Text>
          )}
        </Animated.View>

        <Pressable onPress={handleAddEvent} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add New Club Event</Text>
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 120,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
      gap: 12,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    heroBadgeText: {
      color: colors.primaryText,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    heroDate: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    heroRow: {
      flexDirection: 'row',
      gap: 10,
    },
    heroPill: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroPillLabel: {
      color: colors.mutedText,
      fontSize: 12,
    },
    heroPillValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.2,
    },
    calendar: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    eventDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    eventText: {
      flex: 1,
      gap: 2,
    },
    eventName: {
      color: colors.text,
      fontWeight: '600',
    },
    eventTime: {
      color: colors.mutedText,
      fontSize: 13,
    },
    emptyText: {
      color: colors.mutedText,
      paddingVertical: 4,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 14,
      marginBottom: 24,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    addButtonText: {
      color: colors.primaryText,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });

export default CalendarScreen;
