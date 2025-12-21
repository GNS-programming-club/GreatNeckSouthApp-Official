import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

const Bus_Schedule = require("../../../assets/pdf/bus.pdf");

type MapLocation = {
  id: string;
  label: string;
  keywords: string[];
};

const LOCATIONS: MapLocation[] = [
  {
    id: "main-entrance",
    label: "Main Entrance",
    keywords: ["entrance", "front", "main"],
  },
  { id: "gym", label: "Gym", keywords: ["gym", "pe"] },
  {
    id: "cafeteria",
    label: "Cafeteria",
    keywords: ["cafe", "cafeteria", "lunch"],
  },
  {
    id: "auditorium",
    label: "Auditorium",
    keywords: ["auditorium", "theater"],
  },
];

export default function SchoolMap() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results =
    normalizedQuery.length === 0
      ? []
      : LOCATIONS.filter((loc) => {
          if (loc.label.toLowerCase().includes(normalizedQuery)) return true;
          return loc.keywords.some((k) => k.includes(normalizedQuery));
        }).slice(0, 8);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/tools")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Schedule</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.mutedText} />
        <TextInput
         
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Feather name="x" size={16} color={colors.mutedText} />
          </TouchableOpacity>
        )}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsCard}>
          {results.map((r, idx) => (
            <View
              key={r.id}
              style={[
                styles.resultRow,
                idx === results.length - 1 ? styles.resultRowLast : null,
              ]}
            >
              <Text style={styles.resultText}>{r.label}</Text>
              <Text style={styles.resultHint}>Map highlight coming soon</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.mapOuter}
        contentContainerStyle={styles.mapOuterContent}
        maximumZoomScale={Platform.OS === "ios" ? 4 : undefined}
        minimumZoomScale={Platform.OS === "ios" ? 1 : undefined}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.mapFrame}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapHint}>Pinch-zoom to inspect the schedule</Text>
          </View>
          <Image
            source={Bus_Schedule}
            contentFit="contain"
            style={styles.mapImage}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      paddingBottom: 75,
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      justifyContent: "center",
      alignContent: "center",
      paddingHorizontal: 16,
      paddingTop: 25,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      alignSelf: "flex-start",
      height: 36,
      width: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      marginTop: 10,
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
    },
    searchWrap: {
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    resultsCard: {
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    resultRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    resultRowLast: {
      borderBottomWidth: 0,
    },
    resultText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    resultHint: {
      color: colors.mutedText,
      fontSize: 12,
    },
    mapOuter: {
      flex: 1,
    },
    mapOuterContent: {
      padding: 16,
    },
    mapFrame: {
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    mapPlaceholder: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    mapHint: {
      color: colors.mutedText,
      fontSize: 12,
      lineHeight: 16,
    },
    mapImage: {
      width: "100%",
      aspectRatio: 600 / 792,
      backgroundColor: colors.surface,
    },
  });