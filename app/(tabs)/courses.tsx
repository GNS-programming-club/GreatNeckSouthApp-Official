import React, { useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

import { SafeAreaView } from 'react-native-safe-area-context';
import coursesData from '../../assets/data/courses.json';

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

type ThemeColors = (typeof Colors)['light'];
type ThemedStyles = ReturnType<typeof createStyles>;

interface FilterOptions {
  searchTerm: string;
  departments: string[];
  credits: number[];
  gradeLevels: string[];
  levels: string[];
  apOnly: boolean;
  repeatableOnly: boolean;
  sortBy: 'code' | 'title' | 'dept' | 'credits';
  sortOrder: 'asc' | 'desc';
}

const courses: Course[] = (coursesData as unknown as Course[]).map((course) => ({
  ...course,
  source_page: typeof course.source_page === "number" ? course.source_page : -1,
}));

const filterCourses = (courses: Course[], filters: FilterOptions): Course[] => {
  let filtered = courses.filter(course => {
    const searchMatch = !filters.searchTerm ||
      course.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      course.dept.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const deptMatch = filters.departments.length === 0 ||
      filters.departments.includes(course.dept);

    const creditMatch = filters.credits.length === 0 ||
      filters.credits.includes(course.credits);

    const gradeMatch = filters.gradeLevels.length === 0 ||
      course.grade_levels.some(grade => filters.gradeLevels.includes(grade));

    const levelMatch = filters.levels.length === 0 ||
      (course.level && filters.levels.includes(course.level));

    const apMatch = !filters.apOnly || course.ap_flag;

    const repeatableMatch = !filters.repeatableOnly || course.repeatable;

    return searchMatch && deptMatch && creditMatch && gradeMatch && levelMatch && apMatch && repeatableMatch;
  });

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'code':
        comparison = a.code.toLowerCase().localeCompare(b.code.toLowerCase());
        break;
      case 'title':
        comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        break;
      case 'dept':
        comparison = a.dept.toLowerCase().localeCompare(b.dept.toLowerCase());
        break;
      case 'credits':
        comparison = a.credits - b.credits;
        break;
      default:
        comparison = a.code.toLowerCase().localeCompare(b.code.toLowerCase());
    }

    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
};

const getActiveFilterCount = (filters: FilterOptions): number => {
  let count = 0;
  if (filters.departments.length > 0) count++;
  if (filters.credits.length > 0) count++;
  if (filters.gradeLevels.length > 0) count++;
  if (filters.levels.length > 0) count++;
  if (filters.apOnly) count++;
  if (filters.repeatableOnly) count++;
  if (filters.sortBy !== 'code' || filters.sortOrder !== 'asc') count++;
  return count;
};

const FilterChip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ThemedStyles;
  colors: ThemeColors;
}> = ({ label, selected, onPress, styles, colors }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      selected && styles.filterChipSelected
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.filterChipText,
      selected && styles.filterChipTextSelected
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const CourseList: React.FC<{
  courses: Course[];
  onCourseSelect: (course: Course) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  styles: ThemedStyles;
  colors: ThemeColors;
}> = ({ courses, onCourseSelect, filters, onFiltersChange, showAdvancedFilters, onToggleAdvancedFilters, styles, colors }) => {
  const departments = Array.from(new Set(courses.map(c => c.dept))).sort();
  const creditOptions = Array.from(new Set(courses.map(c => c.credits))).sort((a, b) => a - b);
  const levelOptions = Array.from(new Set(courses.map(c => c.level).filter(Boolean) as string[])).sort();

  const allGradeLevels: string[] = [];
  courses.forEach(course => {
    course.grade_levels.forEach(grade => {
      if (!allGradeLevels.includes(grade)) {
        allGradeLevels.push(grade);
      }
    });
  });
  const gradeLevels = allGradeLevels.sort((a, b) => Number(a) - Number(b));

  const filteredCourses = filterCourses(courses, filters);
  const activeFilterCount = getActiveFilterCount(filters);

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      departments: [],
      credits: [],
      gradeLevels: [],
      levels: [],
      apOnly: false,
      repeatableOnly: false,
      sortBy: 'code',
      sortOrder: 'asc'
    });
  };

  const sortOptions: { value: FilterOptions['sortBy']; label: string }[] = [
    { value: 'code', label: 'Code' },
    { value: 'title', label: 'Title' },
    { value: 'dept', label: 'Dept' },
    { value: 'credits', label: 'Credits' },
  ];

  const CourseCard = ({ course, index }: { course: Course; index: number }) => {
    const animation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      animation.setValue(0);
      const delay = Math.min(index, 12) * 60;
      const timer = setTimeout(() => {
        Animated.spring(animation, {
          toValue: 1,
          friction: 10,
          tension: 70,
          useNativeDriver: true,
        }).start();
      }, delay);

      return () => clearTimeout(timer);
    }, [animation, index]);

    const animatedStyle = {
      opacity: animation,
      transform: [
        {
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.courseCardWrapper, animatedStyle]}>
        <TouchableOpacity style={styles.courseCard} onPress={() => onCourseSelect(course)}>
          <View style={styles.courseCardHeader}>
            <Text style={styles.courseCode}>{course.code}</Text>
            <View style={styles.badgeRow}>
              {course.ap_flag && <Text style={[styles.badge, styles.apBadge]}>AP</Text>}
              {course.level && course.level !== 'Regular' && !course.ap_flag && (
                <Text style={[styles.badge, styles.levelBadge]}>{course.level}</Text>
              )}
              {course.repeatable && <Text style={[styles.badge, styles.repeatableBadge]}>Repeatable</Text>}
            </View>
          </View>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDept}>{course.dept}</Text>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {course.description}
          </Text>
          <View style={styles.courseMeta}>
            <Text style={styles.metaItem}>{`${course.credits} credit${course.credits === 1 ? '' : 's'}`}</Text>
            {course.grade_levels.length > 0 && (
              <Text style={styles.metaItem}>{`Grades: ${course.grade_levels.join(', ')}`}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCourseItem = ({ item, index }: { item: Course; index: number }) => (
    <CourseCard course={item} index={index} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, codes, departments..."
            placeholderTextColor={colors.mutedText}
            value={filters.searchTerm}
            onChangeText={(text) => onFiltersChange({ ...filters, searchTerm: text })}
          />
          {filters.searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => onFiltersChange({ ...filters, searchTerm: '' })}>
              <Text style={styles.clearSearchIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterToggleRow}>
        <TouchableOpacity style={styles.filterToggleButton} onPress={onToggleAdvancedFilters}>
          <Text style={styles.filterToggleText}>{showAdvancedFilters ? 'Hide Filters' : 'Filters'}</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAdvancedFilters && (
        <ScrollView style={styles.advancedFilters} showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.sortRow}>
              <View style={styles.chipContainer}>
                {sortOptions.map(option => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={filters.sortBy === option.value}
                    onPress={() => onFiltersChange({ ...filters, sortBy: option.value })}
                    styles={styles}
                    colors={colors}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.sortOrderButton}
                onPress={() => onFiltersChange({
                  ...filters,
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                })}
              >
                <Text style={styles.sortOrderText}>
                  {filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Quick Filters</Text>
            <View style={styles.chipContainer}>
              <FilterChip
                label="AP Only"
                selected={filters.apOnly}
                onPress={() => onFiltersChange({ ...filters, apOnly: !filters.apOnly })}
                styles={styles}
                colors={colors}
              />
              <FilterChip
                label="Repeatable"
                selected={filters.repeatableOnly}
                onPress={() => onFiltersChange({ ...filters, repeatableOnly: !filters.repeatableOnly })}
                styles={styles}
                colors={colors}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Grade Levels</Text>
            <View style={styles.chipContainer}>
              {gradeLevels.map(grade => (
                <FilterChip
                  key={grade}
                  label={`Grade ${grade}`}
                  selected={filters.gradeLevels.includes(grade)}
                  onPress={() => {
                    const newGradeLevels = filters.gradeLevels.includes(grade)
                      ? filters.gradeLevels.filter(g => g !== grade)
                      : [...filters.gradeLevels, grade];
                    onFiltersChange({ ...filters, gradeLevels: newGradeLevels });
                  }}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Credits</Text>
            <View style={styles.chipContainer}>
              {creditOptions.map(credit => (
                <FilterChip
                  key={credit}
                  label={`${credit} cr`}
                  selected={filters.credits.includes(credit)}
                  onPress={() => {
                    const newCredits = filters.credits.includes(credit)
                      ? filters.credits.filter(c => c !== credit)
                      : [...filters.credits, credit];
                    onFiltersChange({ ...filters, credits: newCredits });
                  }}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {levelOptions.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Course Level</Text>
              <View style={styles.chipContainer}>
                {levelOptions.map(level => (
                  <FilterChip
                    key={level}
                    label={level}
                    selected={filters.levels.includes(level)}
                    onPress={() => {
                      const newLevels = filters.levels.includes(level)
                        ? filters.levels.filter(l => l !== level)
                        : [...filters.levels, level];
                      onFiltersChange({ ...filters, levels: newLevels });
                    }}
                    styles={styles}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Departments</Text>
            <View style={styles.chipContainer}>
              {departments.map(dept => (
                <FilterChip
                  key={dept}
                  label={dept}
                  selected={filters.departments.includes(dept)}
                  onPress={() => {
                    const newDepartments = filters.departments.includes(dept)
                      ? filters.departments.filter(d => d !== dept)
                      : [...filters.departments, dept];
                    onFiltersChange({ ...filters, departments: newDepartments });
                  }}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.resultsRow}>
        <Text style={styles.resultsInfo}>
          {filteredCourses.length === courses.length
            ? `${courses.length} courses`
            : `${filteredCourses.length} of ${courses.length} courses`}
        </Text>
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        style={styles.coursesList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const CourseDetail: React.FC<{
  course: Course;
  onBack: () => void;
  styles: ThemedStyles;
}> = ({ course, onBack, styles }) => {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Courses</Text>
      </TouchableOpacity>

      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseCode}>{course.code}</Text>
        <View style={styles.courseMeta}>
          <Text style={styles.metaItem}>{course.dept}</Text>
          <Text style={styles.metaItem}>{`${course.credits} credit${course.credits === 1 ? '' : 's'}`}</Text>
          {course.ap_flag && <Text style={[styles.metaItem, styles.apFlag]}>AP Course</Text>}
        </View>
      </View>

      <View style={styles.courseContent}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.courseDescription}>{course.description}</Text>

        <Text style={styles.sectionTitle}>Course Details</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Prerequisite:</Text>
          <Text style={styles.detailValue}>{course.prerequisite || 'None'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Grade Levels:</Text>
          <Text style={styles.detailValue}>{course.grade_levels.join(', ')}</Text>
        </View>
        {course.additional_notes && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Additional Notes:</Text>
            <Text style={styles.detailValue}>{course.additional_notes}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Main CoursePages component
const CoursePages: React.FC = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    departments: [],
    credits: [],
    gradeLevels: [],
    levels: [],
    apOnly: false,
    repeatableOnly: false,
    sortBy: 'code',
    sortOrder: 'asc'
  });

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCourse(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <CourseList
            courses={courses}
            onCourseSelect={handleCourseSelect}
            filters={filters}
            onFiltersChange={setFilters}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
            styles={styles}
            colors={colors}
          />
        );
      case 'detail':
        return selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            onBack={handleBackToList}
            styles={styles}
          />
        ) : (
          <View style={styles.container}>
            <Text>No course selected</Text>
          </View>
        );
      default:
        return (
          <SafeAreaView>
            <View style={styles.container}>
              <Text>Invalid view</Text>
            </View>
          </SafeAreaView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.appContainer} edges={['top', 'left', 'right']}>
      <View style={styles.appMain}>
        {renderCurrentView()}
      </View>
    </SafeAreaView>
  );
};


const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    appContainer: {
      flex: 1,
      backgroundColor: colors.background,
      paddingBottom: 120
    },
    appHeader: {
      backgroundColor: colors.surface,
      padding: 20,
      paddingTop: 50,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    appTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.4,
    },
    appMain: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    basicFilters: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    filterButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 14,
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    filterButtonText: {
      color: colors.primaryText,
      fontWeight: '700',
    },
    advancedFilters: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      maxHeight: 320,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
      gap: 6,
    },
    filterGroupTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
      color: colors.text,
    },
    filterItem: {
      paddingVertical: 8,
    },
    checkbox: {
      fontSize: 16,
      color: colors.text,
    },
    resultsInfo: {
      color: colors.mutedText,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    coursesList: {
      flex: 1,
    },
    courseCardWrapper: {
      marginBottom: 12,
    },
    courseCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
      gap: 6,
    },
    courseCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    courseCode: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    courseTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 2,
    },
    courseDept: {
      fontSize: 14,
      color: colors.mutedText,
      fontStyle: 'italic',
      marginBottom: 4,
    },
    courseDescription: {
      fontSize: 14,
      color: colors.mutedText,
      marginBottom: 10,
      lineHeight: 20,
    },
    courseMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metaItem: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      fontSize: 12,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    apFlag: {
      backgroundColor: colors.accent,
      color: colors.primaryText,
      borderColor: colors.accent,
    },
    backButton: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
    courseHeader: {
      marginBottom: 24,
      gap: 8,
    },
    courseContent: {
      gap: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    detailItem: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    detailLabel: {
      fontWeight: '700',
      marginRight: 8,
      color: colors.text,
    },
    detailValue: {
      flex: 1,
      color: colors.mutedText,
    },
    searchRow: {
      marginBottom: 12,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    clearSearchIcon: {
      fontSize: 18,
      color: colors.mutedText,
      padding: 8,
      fontWeight: '300',
    },
    filterToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    filterToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterToggleText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    filterCountBadge: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 6,
    },
    filterCountText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
    },
    clearFiltersButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    clearFiltersText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '600',
    },
    filterSection: {
      marginBottom: 16,
    },
    filterSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.mutedText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    filterChipTextSelected: {
      color: colors.primaryText,
    },
    sortOrderButton: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortOrderText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    resultsRow: {
      marginBottom: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      fontSize: 11,
      fontWeight: '700',
      overflow: 'hidden',
    },
    apBadge: {
      backgroundColor: colors.accent,
      color: colors.primaryText,
    },
    levelBadge: {
      backgroundColor: colors.primary,
      color: colors.primaryText,
    },
    repeatableBadge: {
      backgroundColor: colors.surfaceAlt,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

export default CoursePages;
