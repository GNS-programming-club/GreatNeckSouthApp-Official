import React, { useDeferredValue, useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader, { PageLargeTitle, useHeaderCollapse } from '@/components/tools/page-header';
import Pill from '@/components/ui/pill';
import Section from '@/components/ui/section';
import DetailSheet, { type DetailSheetHandle } from '@/components/tools/detail-sheet';
import SearchBar from '@/components/tools/search-bar';
import { Colors, FontWeight, Spacing, Tracking, Type } from '@/constants/theme';
import { useTabBarClearance } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import { appClock } from '@/lib/clock';
import { buildSearchIndex, filterSearchIndex } from '@/lib/search-index';

import busData from '@/assets/data/bus.json';

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

interface RouteSection {
  title: string;
  data: BusRoute[];
  sortKey: number;
  upcoming: boolean;
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

const parseStopTimeToMinutes = (time: string, departureTime: string): number | null => {
  const periodMatch = departureTime.match(/([AaPp][Mm])/);
  const period = periodMatch ? periodMatch[1].toUpperCase() : '';
  return parseTimeToMinutes(period ? `${time} ${period}` : time);
};

const parseRouteTitle = (title: string) => {
  const match = title.match(/^Bus\s+(\d+)\s*([–-])\s*(.*)$/i);
  if (!match) return { busLabel: null, separator: '', rest: title.trim() };
  return { busLabel: `Bus ${match[1]}`, separator: ` ${match[2]} `, rest: match[3].trim() };
};

const routes = busData as BusRoute[];

const routeSearchIndex = buildSearchIndex(routes, (route) => [
  route.title,
  route.vehicle,
  ...route.stops.map((stop) => stop.location),
]);

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<BusRoute, RouteSection>);

function StopsBody({ route }: { route: BusRoute }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.sheetBody}>
      <Text style={styles.sheetTitle}>{route.title}</Text>
      <View style={styles.sheetMetaRow}>
        <Text style={styles.sheetMeta}>{route.vehicle}</Text>
        <View style={styles.sheetMetaDivider} />
        <Text style={styles.sheetMeta}>{route.departureTime}</Text>
      </View>
      <Section title="Stops" style={styles.stopsSection}>
        {route.stops.map((stop) => (
          <View key={stop.stop} style={styles.stopRow}>
            <Text style={[styles.stopTime, { color: colors.primary }]}>{stop.time}</Text>
            <Text style={[styles.stopLocation, { color: colors.text }]}>{stop.location}</Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

export default function Bus() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bottomClearance = useTabBarClearance();
  const detailRef = useRef<DetailSheetHandle>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<BusRoute | null>(null);
  const collapse = useHeaderCollapse();

  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => filterSearchIndex(routeSearchIndex, deferredQuery),
    [deferredQuery]
  );

  const sections = useMemo<RouteSection[]>(() => {
    const now = appClock.now();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const byTime = new Map<string, BusRoute[]>();

    filtered.forEach((route) => {
      const key = route.departureTime || 'Unknown';
      if (!byTime.has(key)) byTime.set(key, []);
      byTime.get(key)!.push(route);
    });

    return Array.from(byTime.entries())
      .map(([title, data]) => {
        const upcoming = data.some((route) =>
          route.stops.some((stop) => {
            const mins = parseStopTimeToMinutes(stop.time, route.departureTime);
            return mins !== null && mins >= nowMinutes;
          })
        );
        return {
          title,
          data,
          sortKey: parseTimeToMinutes(title) ?? Number.MAX_SAFE_INTEGER,
          upcoming,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [filtered]);

  const filteredCount = filtered.length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={{ flex: 1 }}>
        <PageHeader title="Bus Routes" collapse={collapse} />

        <AnimatedSectionList
          sections={sections}
          onScroll={collapse.onScroll}
          scrollEventThrottle={16}
          keyExtractor={(r) => r.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomClearance }]}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <PageLargeTitle title="Bus Routes" collapse={collapse} />
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Search routes, vehicle, or stop"
                resultCount={query.length > 0 ? filteredCount : undefined}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No routes match"
              message="Try a bus number, vehicle, or stop name."
            />
          }
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                styles.sectionHeader,
                { color: section.upcoming ? colors.primary : colors.mutedText },
              ]}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const { busLabel, separator, rest } = parseRouteTitle(item.title);
            return (
              <Card
                onPress={() => {
                  setSelected(item);
                  detailRef.current?.present();
                }}
                style={styles.cardGap}
              >
                <Text style={[styles.routeTitle, { color: colors.text }]}>
                  {busLabel ? (
                    <Text style={{ color: colors.primary, fontWeight: FontWeight.heavy }}>
                      {busLabel}
                    </Text>
                  ) : null}
                  {busLabel ? separator : ''}
                  {rest}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.vehicleText, { color: colors.mutedText }]}>
                    {item.vehicle}
                  </Text>
                  <Pill label={item.departureTime} />
                </View>
              </Card>
            );
          }}
        />

        <DetailSheet ref={detailRef}>
          {selected ? <StopsBody route={selected} /> : null}
        </DetailSheet>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    listHeader: {
      gap: Spacing.lg,
    },
    sectionHeader: {
      fontSize: Type.heading.fontSize,
      fontWeight: FontWeight.bold,
      letterSpacing: Tracking.snug,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    cardGap: {
      gap: Spacing.xs,
    },
    routeTitle: {
      fontSize: Type.heading.fontSize,
      fontWeight: FontWeight.bold,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    vehicleText: {
      fontSize: Type.caption.fontSize,
      fontWeight: Type.caption.fontWeight,
    },
    sheetBody: {
      gap: Spacing.sm,
    },
    sheetTitle: {
      fontSize: Type.title.fontSize,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    sheetMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    sheetMeta: {
      fontSize: Type.body.fontSize,
      color: colors.mutedText,
    },
    sheetMetaDivider: {
      width: 1,
      height: 13,
      backgroundColor: colors.border,
    },
    stopsSection: {
      marginTop: Spacing.sm,
    },
    stopRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stopTime: {
      width: 64,
      fontWeight: FontWeight.bold,
      fontSize: Type.body.fontSize,
    },
    stopLocation: {
      flex: 1,
      fontSize: Type.body.fontSize,
    },
  });
