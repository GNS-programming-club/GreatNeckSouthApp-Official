import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/card';
import Pill from '@/components/ui/pill';
import Section from '@/components/ui/section';
import DetailSheet, { DetailSheetHandle } from '@/components/tools/detail-sheet';
import DirectoryList from '@/components/tools/directory-list';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import coursesData from '@/assets/data/courses.json';

interface Course {
  id: string;
  dept: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  prerequisite: string;
  grade_levels: string[];
  ap_flag: boolean;
  level?: string;
  repeatable: boolean;
  additional_notes: string;
  source_page: number;
}

interface FilterOptions {
  departments: string[];
  credits: number[];
  gradeLevels: string[];
  levels: string[];
  apOnly: boolean;
  repeatableOnly: boolean;
  sortBy: 'code' | 'title' | 'dept' | 'credits';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: FilterOptions = {
  departments: [],
  credits: [],
  gradeLevels: [],
  levels: [],
  apOnly: false,
  repeatableOnly: false,
  sortBy: 'code',
  sortOrder: 'asc',
};

const allCourses: Course[] = (coursesData as unknown as Course[]).map((c) => ({
  ...c,
  source_page: typeof c.source_page === 'number' ? c.source_page : -1,
}));

function applyFilters(data: Course[], f: FilterOptions): Course[] {
  const filtered = data.filter((c) => {
    const deptMatch = f.departments.length === 0 || f.departments.includes(c.dept);
    const creditMatch = f.credits.length === 0 || f.credits.includes(c.credits);
    const gradeMatch =
      f.gradeLevels.length === 0 || c.grade_levels.some((g) => f.gradeLevels.includes(g));
    const levelMatch = f.levels.length === 0 || (!!c.level && f.levels.includes(c.level));
    const apMatch = !f.apOnly || c.ap_flag;
    const repeatableMatch = !f.repeatableOnly || c.repeatable;
    return deptMatch && creditMatch && gradeMatch && levelMatch && apMatch && repeatableMatch;
  });

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (f.sortBy) {
      case 'code':
        cmp = a.code.toLowerCase().localeCompare(b.code.toLowerCase());
        break;
      case 'title':
        cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        break;
      case 'dept':
        cmp = a.dept.toLowerCase().localeCompare(b.dept.toLowerCase());
        break;
      case 'credits':
        cmp = a.credits - b.credits;
        break;
    }
    return f.sortOrder === 'asc' ? cmp : -cmp;
  });

  return filtered;
}

function countActiveFilters(f: FilterOptions): number {
  let n = 0;
  if (f.departments.length > 0) n++;
  if (f.credits.length > 0) n++;
  if (f.gradeLevels.length > 0) n++;
  if (f.levels.length > 0) n++;
  if (f.apOnly) n++;
  if (f.repeatableOnly) n++;
  if (f.sortBy !== 'code' || f.sortOrder !== 'asc') n++;
  return n;
}

type ThemeColors = (typeof Colors)['light'];

function FilterChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        chipStyles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceAlt,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[chipStyles.chipText, { color: selected ? colors.primaryText : colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Type.label.fontSize,
    fontWeight: Type.label.fontWeight,
  },
});

function CourseRow({ course, colors }: { course: Course; colors: ThemeColors }) {
  return (
    <Card elevation="raised">
      <Text style={{ fontSize: Type.label.fontSize, fontWeight: '800', color: colors.primary }}>
        {course.code}
      </Text>
      <Text
        style={{
          fontSize: Type.heading.fontSize,
          fontWeight: Type.heading.fontWeight,
          color: colors.text,
        }}
      >
        {course.title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <Pill label={`${course.credits} cr`} />
        {course.grade_levels.length > 0 && <Pill label={`Gr ${course.grade_levels[0]}`} />}
        {course.ap_flag && <Pill label="AP" tone="success" />}
      </View>
    </Card>
  );
}

function CourseDetailBody({ course, colors }: { course: Course; colors: ThemeColors }) {
  return (
    <View style={{ gap: Spacing.xl }}>
      <View style={{ gap: Spacing.sm }}>
        <Text
          style={{
            fontSize: Type.title.fontSize,
            fontWeight: Type.title.fontWeight,
            color: colors.text,
          }}
        >
          {course.title}
        </Text>
        <Text style={{ fontSize: Type.label.fontSize, fontWeight: '800', color: colors.primary }}>
          {course.code}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Spacing.sm,
            paddingTop: Spacing.xs,
          }}
        >
          <Pill label={`${course.credits} credit${course.credits === 1 ? '' : 's'}`} />
          {course.grade_levels.length > 0 && (
            <Pill label={`Grades ${course.grade_levels.join(', ')}`} />
          )}
          {course.level ? <Pill label={course.level} /> : null}
          {course.ap_flag && <Pill label="AP Course" tone="success" />}
          {course.repeatable && <Pill label="Repeatable" />}
        </View>
      </View>

      <Section title="Description">
        <Text
          style={{
            fontSize: Type.body.fontSize,
            fontWeight: Type.body.fontWeight,
            color: colors.mutedText,
            lineHeight: 22,
          }}
        >
          {course.description}
        </Text>
      </Section>

      {!!course.prerequisite && course.prerequisite.trim().length > 0 && (
        <Section title="Prerequisite">
          <Text
            style={{
              fontSize: Type.body.fontSize,
              fontWeight: Type.body.fontWeight,
              color: colors.mutedText,
              lineHeight: 22,
            }}
          >
            {course.prerequisite}
          </Text>
        </Section>
      )}

      {!!course.additional_notes && course.additional_notes.trim().length > 0 && (
        <Section title="Notes">
          <Text
            style={{
              fontSize: Type.body.fontSize,
              fontWeight: Type.body.fontWeight,
              color: colors.mutedText,
              lineHeight: 22,
            }}
          >
            {course.additional_notes}
          </Text>
        </Section>
      )}
    </View>
  );
}

function FilterBar({
  activeCount,
  onOpen,
  colors,
}: {
  activeCount: number;
  onOpen: () => void;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity
      onPress={onOpen}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: activeCount > 0 ? colors.primary : colors.surfaceAlt,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: activeCount > 0 ? colors.primary : colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
      }}
    >
      <Feather
        name="sliders"
        size={14}
        color={activeCount > 0 ? colors.primaryText : colors.icon}
      />
      <Text
        style={{
          fontSize: Type.label.fontSize,
          fontWeight: Type.label.fontWeight,
          color: activeCount > 0 ? colors.primaryText : colors.text,
        }}
      >
        {activeCount > 0 ? `Filters (${activeCount})` : 'Filters'}
      </Text>
    </TouchableOpacity>
  );
}

function FilterControls({
  filters,
  onChange,
  onDone,
  colors,
}: {
  filters: FilterOptions;
  onChange: (f: FilterOptions) => void;
  onDone: () => void;
  colors: ThemeColors;
}) {
  const departments = useMemo(() => Array.from(new Set(allCourses.map((c) => c.dept))).sort(), []);
  const creditOptions = useMemo(
    () => Array.from(new Set(allCourses.map((c) => c.credits))).sort((a, b) => a - b),
    []
  );
  const levelOptions = useMemo(
    () => Array.from(new Set(allCourses.map((c) => c.level).filter(Boolean) as string[])).sort(),
    []
  );
  const gradeLevels = useMemo(() => {
    const set: string[] = [];
    allCourses.forEach((c) =>
      c.grade_levels.forEach((g) => {
        if (!set.includes(g)) set.push(g);
      })
    );
    return set.sort((a, b) => Number(a) - Number(b));
  }, []);

  const sortOptions: { value: FilterOptions['sortBy']; label: string }[] = [
    { value: 'code', label: 'Code' },
    { value: 'title', label: 'Title' },
    { value: 'dept', label: 'Dept' },
    { value: 'credits', label: 'Credits' },
  ];

  const sectionLabel = {
    fontSize: Type.caption.fontSize,
    fontWeight: '700' as const,
    color: colors.mutedText,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  };

  const chipRow = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm };

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  return (
    <View style={{ gap: Spacing.xl }}>
      <View>
        <Text style={sectionLabel}>Sort By</Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={[chipRow, { flex: 1 }]}>
            {sortOptions.map((o) => (
              <FilterChip
                key={o.value}
                label={o.label}
                selected={filters.sortBy === o.value}
                onPress={() => onChange({ ...filters, sortBy: o.value })}
                colors={colors}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={() =>
              onChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
            }
            style={{
              backgroundColor: colors.surfaceAlt,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              marginLeft: Spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: Type.label.fontSize,
                fontWeight: Type.label.fontWeight,
                color: colors.text,
              }}
            >
              {filters.sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <Text style={sectionLabel}>Quick Filters</Text>
        <View style={chipRow}>
          <FilterChip
            label="AP Only"
            selected={filters.apOnly}
            onPress={() => onChange({ ...filters, apOnly: !filters.apOnly })}
            colors={colors}
          />
          <FilterChip
            label="Repeatable"
            selected={filters.repeatableOnly}
            onPress={() => onChange({ ...filters, repeatableOnly: !filters.repeatableOnly })}
            colors={colors}
          />
        </View>
      </View>

      <View>
        <Text style={sectionLabel}>Grade Levels</Text>
        <View style={chipRow}>
          {gradeLevels.map((g) => (
            <FilterChip
              key={g}
              label={`Grade ${g}`}
              selected={filters.gradeLevels.includes(g)}
              onPress={() => onChange({ ...filters, gradeLevels: toggle(filters.gradeLevels, g) })}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View>
        <Text style={sectionLabel}>Credits</Text>
        <View style={chipRow}>
          {creditOptions.map((c) => (
            <FilterChip
              key={c}
              label={`${c} credit`}
              selected={filters.credits.includes(c)}
              onPress={() => onChange({ ...filters, credits: toggle(filters.credits, c) })}
              colors={colors}
            />
          ))}
        </View>
      </View>

      {levelOptions.length > 0 && (
        <View>
          <Text style={sectionLabel}>Course Level</Text>
          <View style={chipRow}>
            {levelOptions.map((l) => (
              <FilterChip
                key={l}
                label={l}
                selected={filters.levels.includes(l)}
                onPress={() => onChange({ ...filters, levels: toggle(filters.levels, l) })}
                colors={colors}
              />
            ))}
          </View>
        </View>
      )}

      <View>
        <Text style={sectionLabel}>Departments</Text>
        <View style={chipRow}>
          {departments.map((d) => (
            <FilterChip
              key={d}
              label={d}
              selected={filters.departments.includes(d)}
              onPress={() => onChange({ ...filters, departments: toggle(filters.departments, d) })}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => onChange(DEFAULT_FILTERS)}
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{ fontSize: Type.body.fontSize, fontWeight: '600', color: colors.mutedText }}
          >
            Reset
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDone}
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            borderRadius: Radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
          }}
        >
          <Text
            style={{ fontSize: Type.body.fontSize, fontWeight: '700', color: colors.primaryText }}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Courses() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const router = useRouter();

  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Course | null>(null);

  const detailRef = useRef<DetailSheetHandle>(null);
  const filterRef = useRef<DetailSheetHandle>(null);

  const visible = useMemo(() => applyFilters(allCourses, filters), [filters]);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background, paddingBottom: 75 }}
      edges={['top', 'left', 'right']}
    >
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.xl,
          paddingBottom: Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            alignSelf: 'flex-start',
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="chevron-left" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            marginTop: Spacing.sm,
            fontSize: Type.display.fontSize,
            fontWeight: Type.display.fontWeight,
            letterSpacing: Type.display.letterSpacing,
            color: colors.text,
          }}
        >
          Courses
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <DirectoryList<Course>
          data={visible}
          keyExtractor={(c) => c.id}
          searchKeys={(c) => [c.code, c.title, c.dept, c.description]}
          renderRow={(c) => <CourseRow course={c} colors={colors} />}
          onItemPress={(c) => {
            setSelected(c);
            detailRef.current?.present();
          }}
          placeholder="Search courses, codes, departments…"
          emptyLabel="No courses match"
          header={
            <FilterBar
              activeCount={activeCount}
              onOpen={() => filterRef.current?.present()}
              colors={colors}
            />
          }
        />

        <DetailSheet ref={detailRef}>
          {selected ? <CourseDetailBody course={selected} colors={colors} /> : null}
        </DetailSheet>

        <DetailSheet ref={filterRef}>
          <FilterControls
            filters={filters}
            onChange={setFilters}
            onDone={() => filterRef.current?.dismiss()}
            colors={colors}
          />
        </DetailSheet>
      </View>
    </SafeAreaView>
  );
}
