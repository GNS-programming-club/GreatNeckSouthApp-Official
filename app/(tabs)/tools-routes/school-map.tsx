import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DetailSheet, { type DetailSheetHandle } from '@/components/tools/detail-sheet';
import DirectoryList from '@/components/tools/directory-list';
import Card from '@/components/ui/card';
import Section from '@/components/ui/section';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import mapData from '@/assets/data/map-rooms.json';

type SectionInfo = { dept: string; area: string; level: string };

type RawPlace = {
  id: string;
  label: string;
  sub: string;
  section: string;
  area: string;
  keywords: string[];
};

type RawRoom = { id: string; label: string; sub: string; section: string };

type MapFile = {
  sections: Record<string, SectionInfo>;
  places: RawPlace[];
  rooms: RawRoom[];
};

type Entry = {
  id: string;
  label: string;
  sub: string;
  dept: string;
  area: string;
  level: string;
  keywords: string[];
};

const file = mapData as MapFile;

const ENTRIES: Entry[] = [
  ...file.places.map((p) => ({
    id: p.id,
    label: p.label,
    sub: p.sub,
    dept: file.sections[p.section].dept,
    area: p.area,
    level: file.sections[p.section].level,
    keywords: [...p.keywords, p.label, p.sub, file.sections[p.section].dept],
  })),
  ...file.rooms.map((r) => ({
    id: r.id,
    label: r.label,
    sub: r.sub,
    dept: file.sections[r.section].dept,
    area: file.sections[r.section].area,
    level: file.sections[r.section].level,
    keywords: [r.label, r.section, file.sections[r.section].dept],
  })),
];

function EntryRow({ entry }: { entry: Entry }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card>
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {entry.label}
          {entry.sub ? <Text style={styles.rowSub}> · {entry.sub}</Text> : null}
        </Text>
        <View style={styles.levelPill}>
          <Text style={styles.levelText}>{entry.level}</Text>
        </View>
      </View>
      <Text style={styles.rowDept} numberOfLines={1}>
        {entry.dept}
      </Text>
      <View style={styles.rowAreaWrap}>
        <Feather name="map-pin" size={12} color={colors.mutedText} />
        <Text style={styles.rowArea} numberOfLines={1}>
          {entry.area}
        </Text>
      </View>
    </Card>
  );
}

function EntryDetailBody({ entry, onViewMap }: { entry: Entry; onViewMap: () => void }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.detailBody}>
      <Text style={styles.detailTitle}>
        {entry.label}
        {entry.sub ? <Text style={styles.detailSub}> · {entry.sub}</Text> : null}
      </Text>

      <Section title="Where to find it">
        <View style={styles.rowAreaWrap}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={styles.bodyText}>{entry.area}</Text>
        </View>
      </Section>

      <Section title="Department">
        <Text style={styles.bodyText}>{entry.dept}</Text>
      </Section>

      <Section title="Level">
        <Text style={styles.bodyText}>{entry.level}</Text>
      </Section>

      <TouchableOpacity style={styles.mapButton} onPress={onViewMap} activeOpacity={0.85}>
        <Feather name="map" size={18} color={colors.primaryText} />
        <Text style={styles.mapButtonText}>View on full map</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SchoolMap() {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const detailRef = useRef<DetailSheetHandle>(null);
  const [selected, setSelected] = useState<Entry | null>(null);

  const openFullMap = () => router.push('/tools-routes/school-map-full');

  const listHeader = (
    <TouchableOpacity style={styles.mapCard} onPress={openFullMap} activeOpacity={0.85}>
      <View style={styles.mapCardIcon}>
        <Feather name="map" size={20} color={colors.primary} />
      </View>
      <View style={styles.mapCardText}>
        <Text style={styles.mapCardTitle}>View full map</Text>
        <Text style={styles.mapCardSub}>See the whole building schematic</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.mutedText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find a Room</Text>
        </View>

        <DirectoryList<Entry>
          data={ENTRIES}
          keyExtractor={(e) => e.id}
          searchKeys={(e) => e.keywords}
          renderRow={(e) => <EntryRow entry={e} />}
          onItemPress={(e) => {
            setSelected(e);
            detailRef.current?.present();
          }}
          placeholder="Search a room or place"
          header={listHeader}
          emptyLabel="No rooms match that search"
        />

        <DetailSheet ref={detailRef}>
          {selected ? (
            <EntryDetailBody
              entry={selected}
              onViewMap={() => {
                detailRef.current?.dismiss();
                openFullMap();
              }}
            />
          ) : null}
        </DetailSheet>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    headerTitle: {
      marginTop: Spacing.sm,
      ...Type.display,
      color: colors.text,
    },
    mapCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    mapCardIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
    },
    mapCardText: {
      flex: 1,
      gap: 2,
    },
    mapCardTitle: {
      ...Type.heading,
      color: colors.text,
    },
    mapCardSub: {
      ...Type.label,
      fontWeight: '500',
      color: colors.mutedText,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    rowTitle: {
      flex: 1,
      ...Type.heading,
      color: colors.text,
    },
    rowSub: {
      ...Type.body,
      fontWeight: '600',
      color: colors.mutedText,
    },
    levelPill: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      backgroundColor: colors.accentSoft,
    },
    levelText: {
      ...Type.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    rowDept: {
      ...Type.label,
      fontWeight: '500',
      color: colors.mutedText,
    },
    rowAreaWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
    },
    rowArea: {
      flex: 1,
      ...Type.label,
      fontWeight: '500',
      color: colors.mutedText,
    },
    detailBody: {
      gap: Spacing.xl,
    },
    detailTitle: {
      ...Type.title,
      color: colors.text,
    },
    detailSub: {
      ...Type.heading,
      fontWeight: '600',
      color: colors.mutedText,
    },
    bodyText: {
      ...Type.body,
      color: colors.mutedText,
      lineHeight: Type.body.fontSize * 1.6,
    },
    mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      backgroundColor: colors.primary,
    },
    mapButtonText: {
      ...Type.body,
      fontWeight: '700',
      color: colors.primaryText,
    },
  });
