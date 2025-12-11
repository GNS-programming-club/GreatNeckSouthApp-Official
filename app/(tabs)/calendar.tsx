
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMenuItemsForDay, getParsedMenu, type ParsedMenu } from '@/api/daily-menu';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

interface TodayInfo {
  date: string;
  dayLetter: string;
  lunchMenu: string[];
  holidays: string[];
  clubEvents: { name: string; time: string }[];
}

interface TodayResponse {
  lunchMenu?: string[];
  holidays?: string[];
  clubEvents?: { name: string; time: string }[];
}

const CalendarScreen = () => {
  const isMountedRef = useRef(true);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const eventsAnim = useRef(new Animated.Value(0)).current;
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const formatLocalISODate = useCallback((date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  }, []);

  const parseLocalDate = useCallback((dateString: string) => {
    return new Date(`${dateString}T00:00:00`);
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(formatLocalISODate(new Date()));
  const [todayInfo, setTodayInfo] = useState<TodayInfo>({
    date: '',
    dayLetter: '',
    lunchMenu: [],
    holidays: [],
    clubEvents: [],
  });
  const [menuData, setMenuData] = useState<ParsedMenu | null>(null);
  const menuItemAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const holidayAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const eventAnims = useRef<Map<string, Animated.Value>>(new Map()).current;

  const getDayLetter = useCallback((date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDifference = Math.round((targetDate.getTime() - today.getTime()) / msPerDay);

    const dayCycle = ['B', 'A'];
    const dayIndex = ((daysDifference % dayCycle.length) + dayCycle.length) % dayCycle.length;

    return dayCycle[dayIndex];
  }, []);

  const getOrCreateAnim = useCallback((map: Map<string, Animated.Value>, key: string) => {
    if (!map.has(key)) {
      map.set(key, new Animated.Value(0));
    }
    return map.get(key)!;
  }, []);

  useEffect(() => {
    menuItemAnims.forEach(anim => anim.setValue(0));
    holidayAnims.forEach(anim => anim.setValue(0));
    eventAnims.forEach(anim => anim.setValue(0));

    const animations: Animated.CompositeAnimation[] = [];

    todayInfo.lunchMenu.forEach((item, index) => {
      const anim = getOrCreateAnim(menuItemAnims, `menu-${item}-${index}`);
      anim.setValue(0);
      animations.push(
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        })
      );
    });

    todayInfo.holidays.forEach((holiday, index) => {
      const anim = getOrCreateAnim(holidayAnims, `holiday-${holiday}-${index}`);
      anim.setValue(0);
      animations.push(
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: (todayInfo.lunchMenu.length * 50) + (index * 50),
          useNativeDriver: true,
        })
      );
    });

    todayInfo.clubEvents.forEach((event, index) => {
      const anim = getOrCreateAnim(eventAnims, `event-${event.name}-${index}`);
      anim.setValue(0);
      animations.push(
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        })
      );
    });

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [todayInfo.lunchMenu, todayInfo.holidays, todayInfo.clubEvents, menuItemAnims, holidayAnims, eventAnims, getOrCreateAnim]);

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

    const loadMenuData = async () => {
      if (menuData) return;

      try {
        const parsedMenu = await getParsedMenu();
        if (cancelled || !isMountedRef.current) return;
        setMenuData(parsedMenu);
      } catch (error) {
        if (cancelled || !isMountedRef.current) return;
        console.error("Failed to load menu data:", error);
      }
    };

    loadMenuData();

    return () => {
      cancelled = true;
    };
  }, [menuData]);

  useEffect(() => {
    let cancelled = false;

    const loadTodayInfo = async () => {
      try {
        const response = await axios.get<TodayResponse>(`/api/today/${selectedDate}`);

        if (cancelled || !isMountedRef.current) return;

        const dateObj = parseLocalDate(selectedDate);
        const dayOfMonth = dateObj.getDate();

        let lunchMenuItems: string[] = [];
        if (menuData) {
          lunchMenuItems = getMenuItemsForDay(menuData, dayOfMonth);
        }

        setTodayInfo({
          date: dateObj.toLocaleDateString(),
          dayLetter: getDayLetter(dateObj),
          lunchMenu: lunchMenuItems.length > 0 ? lunchMenuItems : (response.data?.lunchMenu || []),
          holidays: response.data?.holidays || [],
          clubEvents: response.data?.clubEvents || [],
        });
      } catch (error) {
        if (cancelled || !isMountedRef.current) return;

        console.error("Failed to load today's info:", error);

        const dateObj = parseLocalDate(selectedDate);
        const dayOfMonth = dateObj.getDate();

        let lunchMenuItems: string[] = [];
        if (menuData) {
          lunchMenuItems = getMenuItemsForDay(menuData, dayOfMonth);
        }

        setTodayInfo({
          date: dateObj.toLocaleDateString(),
          dayLetter: getDayLetter(dateObj),
          lunchMenu: lunchMenuItems,
          holidays: [],
          clubEvents: [],
        });
      }
    };

    loadTodayInfo();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, getDayLetter, menuData, parseLocalDate]);

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
              textMonthFontWeight: '800',
              textDayFontWeight: '600',
              textDayHeaderFontWeight: '700',
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
          <Text style={styles.sectionTitle}>Today&apos;s Information</Text>

          {todayInfo.lunchMenu && todayInfo.lunchMenu.length > 0 ? (
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Lunch Menu</Text>
              {todayInfo.lunchMenu.map((item, index) => {
                const anim = getOrCreateAnim(menuItemAnims, `menu-${item}-${index}`);
                return (
                  <Animated.View
                    key={`menu-${index}`}
                    style={[
                      styles.menuItem,
                      {
                        opacity: anim,
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [8, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <View style={styles.menuDot} />
                    <Text style={styles.menuItemText}>{item}</Text>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No menu available for this day.</Text>
          )}

          {todayInfo.holidays && todayInfo.holidays.length > 0 && (
            <View style={styles.holidaySection}>
              <Text style={styles.menuSectionTitle}>Holidays</Text>
              {todayInfo.holidays.map((holiday, index) => {
                const anim = getOrCreateAnim(holidayAnims, `holiday-${holiday}-${index}`);
                return (
                  <Animated.View
                    key={`holiday-${index}`}
                    style={[
                      styles.menuItem,
                      {
                        opacity: anim,
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [8, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <View style={styles.menuDot} />
                    <Text style={styles.menuItemText}>{holiday}</Text>
                  </Animated.View>
                );
              })}
            </View>
          )}
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
            todayInfo.clubEvents.map((event, index) => {
              const anim = getOrCreateAnim(eventAnims, `event-${event.name}-${index}`);
              return (
                <Animated.View
                  key={`${event.name}-${index}`}
                  style={[
                    styles.eventRow,
                    {
                      opacity: anim,
                      transform: [
                        {
                          translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventText}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventTime}>{event.time}</Text>
                  </View>
                </Animated.View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No club events scheduled for this day.</Text>
          )}
        </Animated.View>


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
    menuSection: {
      marginTop: 8,
      marginBottom: 12,
    },
    menuSectionTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    menuDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginTop: 6,
    },
    menuItemText: {
      color: colors.text,
      fontSize: 14,
      flex: 1,
    },
    holidaySection: {
      marginTop: 12,
    },

  });

export default CalendarScreen;
