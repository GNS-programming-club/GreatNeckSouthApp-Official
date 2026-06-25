import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import busData from '../../../assets/data/bus.json';

interface BusStop {
  stop: number;
  time: string;
  students: number;
  location: string;
}

interface BusRoute {
  id: string;
  title: string;
  vehicle: string;
  departureTime: string;
  stops: BusStop[];
}

interface FilterOptions {
  searchTerm: string;
}

interface RouteSection {
  title: string;
  data: BusRoute[];
  sortKey: number;
}

const parseTimeToMinutes = (value: string): number | null => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minutes;
};

const parseStopTimeToMinutes = (time: string, departureTime: string) => {
  const periodMatch = departureTime.match(/([AaPp][Mm])/);
  const period = periodMatch ? periodMatch[1].toUpperCase() : '';
  return parseTimeToMinutes(period ? `${time} ${period}` : time);
};

const filterRoutes = (routes: BusRoute[], filters: FilterOptions) => {
  if (!filters.searchTerm) return routes;

  const term = filters.searchTerm.toLowerCase();

  return routes.filter(
    (route) =>
      route.vehicle.toLowerCase().includes(term) ||
      route.title.toLowerCase().includes(term) ||
      route.stops.some((stop) => stop.location.toLowerCase().includes(term))
  );
};

const parseRouteTitle = (title: string) => {
  const match = title.match(/^Bus\s+(\d+)\s*([–-])\s*(.*)$/i);
  if (!match) {
    return {
      busLabel: null,
      separator: '',
      rest: title.trim(),
    };
  }
  return {
    busLabel: `Bus ${match[1]}`,
    separator: ` ${match[2]} `,
    rest: match[3].trim(),
  };
};

const Bus: React.FC = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();

  const routes: BusRoute[] = busData as BusRoute[];

  const [filters, setFilters] = useState<FilterOptions>({ searchTerm: '' });
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);

  const filteredRoutes = filterRoutes(routes, filters);

  const pageFade = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pageFade, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [pageFade]);

  const groupedRoutes = useMemo<RouteSection[]>(() => {
    const byTime = new Map<string, BusRoute[]>();
    filteredRoutes.forEach((route) => {
      const key = route.departureTime || 'Unknown';
      if (!byTime.has(key)) byTime.set(key, []);
      byTime.get(key)!.push(route);
    });

    return Array.from(byTime.entries())
      .map(([title, data]) => ({
        title,
        data,
        sortKey: parseTimeToMinutes(title) ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredRoutes]);

  const highlightedDepartureTimes = useMemo(() => {
    if (groupedRoutes.length === 0) return new Set<string>();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const active = new Set<string>();

    groupedRoutes.forEach((section) => {
      const hasUpcomingStop = section.data.some((route) =>
        route.stops.some((stop) => {
          const minutes = parseStopTimeToMinutes(stop.time, route.departureTime);
          return minutes !== null && minutes >= nowMinutes;
        })
      );
      if (hasUpcomingStop) active.add(section.title);
    });

    return active;
  }, [groupedRoutes]);

  const RouteCard = ({ route }: { route: BusRoute }) => {
    const { busLabel, separator, rest } = parseRouteTitle(route.title);
    return (
      <TouchableOpacity style={styles.routeCard} onPress={() => setSelectedRoute(route)}>
        <Text style={styles.routeTitle}>
          {busLabel ? <Text style={styles.busHighlight}>{busLabel}</Text> : null}
          {busLabel ? separator : ''}
          {rest}
        </Text>
        <Text style={styles.metaText}>{route.stops.length} stops</Text>
      </TouchableOpacity>
    );
  };

  if (selectedRoute) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { padding: 0 }]}>
          <View style={[styles.header, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedRoute(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Feather name="arrow-left" size={25} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Route Details</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.detailContent, { paddingHorizontal: 16 }]}
          >
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                {selectedRoute.title}
              </Text>
              <Text style={{ color: colors.mutedText, marginTop: 4 }}>
                {selectedRoute.vehicle} • {selectedRoute.departureTime}
              </Text>
            </View>

            {selectedRoute.stops.map((stop) => (
              <View key={stop.stop} style={styles.stopRow}>
                <Text style={styles.stopTime}>{stop.time}</Text>
                <Text style={styles.stopLocation}>{stop.location}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: pageFade }]}>
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
          <Text style={styles.title}>Bus Routes</Text>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search bus, route, or stop…"
            placeholderTextColor={colors.mutedText}
            value={filters.searchTerm}
            onChangeText={(text) => setFilters({ searchTerm: text })}
          />
        </View>

        <SectionList
          sections={groupedRoutes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RouteCard route={item} />}
          renderSectionHeader={({ section }) => {
            const isActive = highlightedDepartureTimes.has(section.title);
            return (
              <View style={[styles.sectionHeader, isActive && styles.sectionHeaderActive]}>
                <Text
                  style={[styles.sectionHeaderText, isActive && styles.sectionHeaderTextActive]}
                >
                  {section.title}
                </Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
      paddingBottom: 56,
    },
    header: {
      justifyContent: 'center',
      alignContent: 'center',
      paddingHorizontal: 16,
      paddingTop: 25,
      paddingBottom: 16,
      marginBottom: 16,
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
    searchWrapper: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    searchInput: {
      height: 48,
      color: colors.text,
    },
    listContent: {
      paddingBottom: 24,
    },
    sectionHeader: {
      paddingHorizontal: 4,
      paddingBottom: 6,
      marginTop: 4,
    },
    sectionHeaderActive: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 8,
      marginBottom: 6,
    },
    sectionHeaderText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.mutedText,
    },
    sectionHeaderTextActive: {
      color: colors.primary,
      fontWeight: '800',
      fontSize: 18,
    },
    routeCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    busHighlight: {
      color: colors.primary,
      fontWeight: '800',
    },
    routeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    metaText: {
      color: colors.mutedText,
      fontSize: 13,
    },
    detailContent: {
      paddingBottom: 24,
    },
    detailTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 6,
      color: colors.text,
    },
    detailMeta: {
      marginBottom: 16,
      color: colors.mutedText,
    },
    stopRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stopTime: {
      width: 60,
      fontWeight: '700',
      color: colors.text,
    },
    stopLocation: {
      flex: 1,
      color: colors.text,
    },
  });

export default Bus;
