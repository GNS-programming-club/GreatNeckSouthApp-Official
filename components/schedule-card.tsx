import { Colors } from '@/constants/theme';
import { useDayStatus } from '@/contexts/school-data-context';
import { useTheme } from '@/contexts/theme-context';
import { toIsoDate } from '@/lib/day-letters';
import { buildSearchIndex, filterSearchIndex } from '@/lib/search-index';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StaggerItem } from '@/components/ui/stagger';
import courses from '../assets/data/coursesHomepage.json';

interface Course {
  id: string;
  dept: string;
  code: string;
  title: string;
}

const courseSearchIndex = buildSearchIndex(courses as Course[], (course) => [
  course.title,
  course.id,
  course.dept,
  course.code,
]);

const STORAGE_KEY = 'userSchedule_v1';
const LIST_ENTRANCE_ITEM_COUNT = 14;

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

export default function ScheduleCard({
  periods = 9,
  day,
  style,
}: {
  periods?: number;
  day?: 'A' | 'B';
  style?: any;
}) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const todayStatus = useDayStatus(toIsoDate(new Date()));
  const todayLetter = todayStatus.kind === 'school' ? todayStatus.letter : '—';

  const storageKey = day ? `${STORAGE_KEY}_${day}` : STORAGE_KEY;
  const [schedule, setSchedule] = useState<(string | null)[]>(() => Array(periods).fill(null));
  const [isHydrated, setIsHydrated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [nowMinutes, setNowMinutes] = useState(() => nowMinutesLocal());
  const [hasShownListEntrance, setHasShownListEntrance] = useState(false);

  useEffect(() => {
    (async () => {
      setIsHydrated(false);
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as (string | null)[];
          if (Array.isArray(parsed)) {
            if (parsed.length === periods) setSchedule(parsed);
            else
              setSchedule(
                [...parsed]
                  .slice(0, periods)
                  .concat(Array(Math.max(0, periods - parsed.length)).fill(null))
              );
          }
        } else {
          setSchedule(Array(periods).fill(null));
        }
      } catch {
        setSchedule(Array(periods).fill(null));
      } finally {
        setIsHydrated(true);
      }
    })();
  }, [periods, storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(schedule))
      .then(() => setSavedAt(Date.now()))
      .catch(() => {});
  }, [isHydrated, schedule, storageKey]);

  useEffect(() => {
    const tick = () => setNowMinutes(nowMinutesLocal());
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, []);

  const times = useMemo(() => computePeriodTimes(periods), [periods]);

  const activePeriodIndex = useMemo(() => {
    for (let i = 0; i < times.length; i++) {
      const start = parse24hToMinutes(times[i].start);
      const end = parse24hToMinutes(times[i].end);
      if (start == null || end == null) continue;
      if (nowMinutes >= start && nowMinutes < end) return i;
    }
    return null;
  }, [nowMinutes, times]);

  const dayProgress = useMemo(() => {
    const firstStart = times[0] ? parse24hToMinutes(times[0].start) : null;
    const lastEnd = times[times.length - 1] ? parse24hToMinutes(times[times.length - 1].end) : null;
    if (firstStart == null || lastEnd == null || lastEnd <= firstStart) return 0;
    const raw = (nowMinutes - firstStart) / (lastEnd - firstStart);
    return Math.max(0, Math.min(1, raw));
  }, [nowMinutes, times]);

  const hasDayStarted = useMemo(() => {
    const firstStart = times[0] ? parse24hToMinutes(times[0].start) : null;
    if (firstStart == null) return false;
    return nowMinutes >= firstStart;
  }, [nowMinutes, times]);

  function openPickerFor(index: number) {
    setSelectedPeriod(index);
    setSearchQuery('');
    setModalVisible(true);
  }

  function closePicker() {
    setModalVisible(false);
    setHasShownListEntrance(true);
    setSelectedPeriod(null);
    setSearchQuery('');
  }

  function searchCourses(query: string) {
    setSearchQuery(query);
    setHasShownListEntrance(true);
  }

  function assignCourseToPeriod(courseId: string) {
    if (selectedPeriod == null) return;
    const next = [...schedule];
    next[selectedPeriod] = courseId;
    setSchedule(next);
    closePicker();
  }

  function removeCourseFromPeriod(index: number) {
    const next = [...schedule];
    next[index] = null;
    setSchedule(next);
  }

  function clearAll() {
    const next = Array(periods).fill(null) as (string | null)[];
    setSchedule(next);
  }

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const filtered = useMemo(
    () => filterSearchIndex(courseSearchIndex, deferredSearchQuery),
    [deferredSearchQuery]
  );

  function getCourse(courseId: string | null) {
    if (!courseId) return null;
    return (courses as Course[]).find((c) => c.id === courseId) || null;
  }

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>Schedule — Day {day ?? todayLetter}</Text>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.listWrap}>
          <View style={styles.timelineAbsolute} pointerEvents="none">
            <View style={styles.timelineTrack} />
            <View style={[styles.timelineFill, { height: `${Math.round(dayProgress * 100)}%` }]} />
            <View
              style={[
                styles.timelineTopDot,
                hasDayStarted ? styles.timelineTopDotActive : undefined,
              ]}
            />
            <View style={[styles.timelineDot, { top: `${Math.round(dayProgress * 100)}%` }]} />
          </View>

          {times.map((t, idx) => {
            const courseId = schedule[idx];
            const course = getCourse(courseId);
            const isActive = activePeriodIndex === idx;
            return (
              <StaggerItem key={idx} index={idx}>
                <Pressable
                  onPress={() => openPickerFor(idx)}
                  onLongPress={() => removeCourseFromPeriod(idx)}
                  style={styles.row}
                >
                  <View style={styles.left}>
                    <View
                      style={[styles.periodBadge, isActive ? styles.periodBadgeActive : undefined]}
                    >
                      <Text
                        style={[
                          styles.periodNumber,
                          isActive ? styles.periodNumberActive : undefined,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={styles.time}>
                      {t.start} — {t.end}
                    </Text>
                  </View>

                  <View style={styles.timelineSpacer} />

                  <View style={styles.right}>
                    {course ? (
                      <View style={styles.courseContainer}>
                        <Text style={styles.courseTitle}>{course.title}</Text>
                        <View style={styles.metaLine}>
                          <Text style={styles.courseMeta}>{course.dept}</Text>
                          <View style={styles.metaDivider} />
                          <Text style={styles.courseMeta}>{course.code}</Text>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={styles.addIconWrap}
                        accessibilityRole="button"
                        accessibilityLabel="Add course"
                      >
                        <Feather name="plus" size={22} color={colors.primary} />
                      </View>
                    )}
                  </View>
                </Pressable>
              </StaggerItem>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.savedText}>
          Saved {savedAt ? new Date(savedAt).toLocaleTimeString() : '—'}
        </Text>
        <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="none" onRequestClose={closePicker}>
        <View style={styles.pickerContainer}>
          <SafeAreaView style={styles.pickerSafeTop} edges={['top', 'left', 'right']}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeaderRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={closePicker}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Feather name="arrow-left" size={25} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.pickerTitle}>Pick a course</Text>
              <Text style={styles.pickerSubtitle}>
                {selectedPeriod != null ? `Period ${selectedPeriod + 1}` : 'Select a period'}
              </Text>
            </View>
          </SafeAreaView>

          <KeyboardAvoidingView
            style={styles.pickerBody}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalSearch}>
              <TextInput
                placeholder="Search courses..."
                placeholderTextColor={colors.mutedText}
                value={searchQuery}
                onChangeText={searchCourses}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filtered}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.courseList}
              renderItem={({ item, index }) => {
                const row = (
                  <Pressable style={styles.courseRow} onPress={() => assignCourseToPeriod(item.id)}>
                    <View style={styles.courseRowInner}>
                      <View style={styles.courseRowText}>
                        <Text style={styles.courseTitleRow}>{item.title}</Text>
                        <View style={styles.metaLine}>
                          <Text style={styles.courseMetaRow}>{item.dept}</Text>
                          <View style={styles.metaDivider} />
                          <Text style={styles.courseMetaRow}>{item.code}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );

                if (index >= LIST_ENTRANCE_ITEM_COUNT) return row;

                return (
                  <StaggerItem index={index} skipEntrance={hasShownListEntrance}>
                    {row}
                  </StaggerItem>
                );
              }}
            />
          </KeyboardAvoidingView>

          {selectedPeriod != null && schedule[selectedPeriod] != null ? (
            <SafeAreaView style={styles.modalFooter} edges={['bottom', 'left', 'right']}>
              <TouchableOpacity
                onPress={() => {
                  removeCourseFromPeriod(selectedPeriod);
                  closePicker();
                }}
                style={styles.clearBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.clearText}>Remove from period</Text>
              </TouchableOpacity>
            </SafeAreaView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: typeof Colors.light) {
  return StyleSheet.create({
    card: {
      backgroundColor: 'transparent',
      borderRadius: 16,
      padding: 0,
      shadowColor: colors.shadow,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
      minWidth: 0,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 10,
      color: colors.text,
    },
    content: {
      paddingBottom: 8,
    },
    listWrap: {
      position: 'relative',
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: 'transparent',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      minHeight: 78,
    },
    left: {
      width: 84,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    periodBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodBadgeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    periodNumber: {
      color: colors.text,
      fontWeight: '800',
    },
    periodNumberActive: {
      color: colors.primaryText,
    },
    timelineSpacer: {
      width: 24,
    },
    timelineAbsolute: {
      position: 'absolute',
      top: 5,
      bottom: 0,
      width: 3,
      left: '50%',
      alignItems: 'center',
    },
    timelineTrack: {
      position: 'absolute',
      top: 5,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 1,
      backgroundColor: colors.border,
      opacity: 0.4,
    },
    timelineFill: {
      position: 'absolute',
      top: 5,
      left: 0,
      right: 0,
      borderRadius: 1,
      backgroundColor: colors.primary,
    },
    timelineDot: {
      position: 'absolute',
      top: 5,
      width: 15,
      height: 15,
      borderRadius: 5,
      backgroundColor: colors.primary,
      transform: [{ translateY: -5 }],
    },
    timelineTopDot: {
      position: 'absolute',
      top: 5,
      width: 15,
      height: 15,
      borderRadius: 5,
      backgroundColor: colors.border,
      transform: [{ translateY: -10 }],
    },
    timelineTopDotActive: {
      backgroundColor: colors.primary,
    },
    right: {
      flex: 1,
      minWidth: 0,
    },
    time: {
      color: colors.mutedText,
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
    },
    addIconWrap: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minHeight: 24,
    },
    courseContainer: {
      alignItems: 'flex-end',
    },
    courseTitle: {
      fontWeight: '700',
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      width: 100,
      textAlign: 'right',
      flexShrink: 1,
      ...(Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as any) : null),
    },
    courseMeta: {
      color: colors.mutedText,
      fontSize: 12,
      marginTop: 6,
      textAlign: 'right',
      flexShrink: 1,
    },
    metaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 6,
    },
    metaDivider: {
      width: 1,
      height: 11,
      backgroundColor: colors.border,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      paddingHorizontal: 6,
    },
    savedText: {
      color: colors.mutedText,
      fontSize: 12,
    },
    clearAllBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    clearAllText: {
      color: colors.primary,
      fontWeight: '600',
    },
    pickerContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pickerSafeTop: {
      backgroundColor: colors.background,
    },
    pickerHeader: {
      justifyContent: 'center',
      alignContent: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    pickerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    backButton: {
      alignSelf: 'flex-start',
      height: 36,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerTitle: {
      marginTop: 6,
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    pickerSubtitle: {
      marginTop: 6,
      color: colors.mutedText,
      fontSize: 13,
      fontWeight: '600',
    },
    pickerBody: {
      flex: 1,
    },
    modalSearch: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceAlt,
      color: colors.text,
    },
    courseList: {
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    courseRow: {
      marginBottom: 12,
    },
    courseRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
      gap: 12,
    },
    courseRowText: {
      flex: 1,
      minWidth: 0,
    },
    courseTitleRow: {
      fontWeight: '700',
      color: colors.text,
      fontSize: 15,
      flexShrink: 1,
      ...(Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as any) : null),
    },
    courseMetaRow: {
      color: colors.mutedText,
      fontSize: 12,
      marginTop: 6,
    },
    modalFooter: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    clearBtn: {
      padding: 12,
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
