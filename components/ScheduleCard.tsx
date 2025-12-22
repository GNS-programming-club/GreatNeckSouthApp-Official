import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState, } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import courses from "../assets/data/courses.json";


interface Course {
  id: string;
  dept: string;
  code: string;
  title: string;
}

const STORAGE_KEY = "userSchedule_v1";



function formatMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = h % 24;
  return `${hh}:${m.toString().padStart(2, "0")}`;
} 

function computePeriodTimes(count: number, startMinutes = 7 * 60 + 59, lessonLen = 40, breakLen = 4) {
  const times: { start: string; end: string }[] = [];
  for (let i = 0; i < count; i++) {
    const start = startMinutes + i * (lessonLen + breakLen);
    const end = start + lessonLen;
    times.push({ start: formatMinutes(start), end: formatMinutes(end) });
  }
  return times;
}// get time of each period
function getDayLetter(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDifference = Math.round((targetDate.getTime() - today.getTime()) / msPerDay);

    const dayCycle = ['B', 'A'];
    const dayIndex = ((daysDifference % dayCycle.length) + dayCycle.length) % dayCycle.length;

    return dayCycle[dayIndex];
} 

export default function ScheduleCard({ periods = 9, day, style }: { periods?: number; day?: 'A' | 'B'; style?: any }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const storageKey = day ? `${STORAGE_KEY}_${day}` : STORAGE_KEY;
  const [schedule, setSchedule] = useState<(string | null)[]>(() => Array(periods).fill(null));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);// get data from storage for the given day
        if (raw) {
          const parsed = JSON.parse(raw) as (string | null)[];
          if (Array.isArray(parsed)) {
            if (parsed.length === periods) setSchedule(parsed);
            else setSchedule([...parsed].slice(0, periods).concat(Array(Math.max(0, periods - parsed.length)).fill(null)));
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    })();
  }, [periods, storageKey]);

  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(schedule))
      .then(() => setSavedAt(Date.now()))
      .catch(() => {});
  }, [schedule, storageKey]);

  const times = useMemo(() => computePeriodTimes(periods), [periods]);

  function openPickerFor(index: number) {
    setSelectedPeriod(index);
    setSearchQuery("");
    setModalVisible(true);
  }

  function assignCourseToPeriod(courseId: string) {
    if (selectedPeriod == null) return;
    const next = [...schedule];
    next[selectedPeriod] = courseId;
    setSchedule(next);
    setModalVisible(false);
    setSelectedPeriod(null);
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

  const filtered = (courses as Course[]).filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.dept && c.dept.toLowerCase().includes(q)) ||
      (c.code && c.code.toString().toLowerCase().includes(q))
    );
  });

  function getCourse(courseId: string | null) {
    if (!courseId) return null;
    return (courses as Course[]).find((c) => c.id === courseId) || null;
  }

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>Schedule — Day {day ?? getDayLetter(new Date())}</Text>
      <ScrollView contentContainerStyle={styles.content}>
        {times.map((t, idx) => {
          const courseId = schedule[idx];
          const course = getCourse(courseId);
          return (
            <Pressable
              key={idx}
              onPress={() => openPickerFor(idx)}
              onLongPress={() => removeCourseFromPeriod(idx)}
              style={styles.row}
            >
              <View style={styles.left}>
                <View style={styles.periodBadge}>
                  <Text style={styles.periodNumber}>{idx + 1}</Text>
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.period}>Period {idx + 1}</Text>
                  <Text style={styles.time}>{t.start} — {t.end}</Text>
                </View>
              </View>

              <View style={styles.right}>
                {course ? (
                  <View style={styles.courseContainer}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseMeta}>{course.dept} · {course.code}</Text>
                  </View>
                ) : (
                  <Text style={styles.addText}>Tap to add a course</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.savedText}>Saved {savedAt ? new Date(savedAt).toLocaleTimeString() : "—"}</Text>
        <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pick a course</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalSearch}>
          <TextInput
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.courseRow} onPress={() => assignCourseToPeriod(item.id)}>
              <View>
                <Text style={styles.courseTitleRow}>{item.title}</Text>
                <Text style={styles.courseMetaRow}>{item.dept} · {item.code}</Text>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />

        <View style={styles.modalFooter}>
          <TouchableOpacity
            onPress={() => {
              if (selectedPeriod != null) {
                removeCourseFromPeriod(selectedPeriod);
                setModalVisible(false);
              }
            }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>Remove from period</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: typeof Colors.light) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 6,
      margin: 8,
      minWidth: 0,
    },
    cardTitle: {
      fontSize: 25,
      fontWeight: "800",
      marginBottom: 12,
      color: colors.text,
    },
    content: {
      gap: 10,
      paddingBottom: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
    },
    periodBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    periodNumber: {
      color: colors.primaryText,
      fontWeight: "700",
    },
    right: {
      maxWidth: "60%",
    },
    period: {
      fontWeight: "700",
      color: colors.text,
    },
    time: {
      color: colors.mutedText,
      fontSize: 12,
    },
    addText: {
      color: colors.primary,
      fontWeight: "600",
    },
    courseContainer: {},
    courseTitle: {
      fontWeight: "700",
    },
    courseMeta: {
      color: colors.mutedText,
      fontSize: 12,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearAllText: {
      color: colors.accent,
      fontWeight: "600",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    closeBtn: {},
    closeText: {
      color: colors.primary,
      fontWeight: "600",
    },
    modalSearch: {
      padding: 12,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 8,
      backgroundColor: colors.surfaceAlt,
      color: colors.text,
    },
    courseRow: {
      padding: 12,
    },
    courseTitleRow: {
      fontWeight: "700",
    },
    courseMetaRow: {
      color: colors.mutedText,
      fontSize: 12,
    },
    sep: {
      height: 1,
      backgroundColor: colors.surfaceAlt,
    },
    modalFooter: {
      padding: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    clearBtn: {
      padding: 12,
      alignItems: "center",
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearText: {
      color: colors.accent,
      fontWeight: "600",
    },
  });
}