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
  apOnly: boolean;
  sortBy: 'code' | 'title' | 'dept';
  sortOrder: 'asc' | 'desc';
}

const courses: Course[] = (coursesData.courses as unknown as Course[]).map((course) => ({
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

    const apMatch = !filters.apOnly || course.ap_flag;

    return searchMatch && deptMatch && creditMatch && gradeMatch && apMatch;
  });

  filtered.sort((a, b) => {
    let aValue: string, bValue: string;
    
    switch (filters.sortBy) {
      case 'code':
        aValue = a.code;
        bValue = b.code;
        break;
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'dept':
        aValue = a.dept;
        bValue = b.dept;
        break;
      default:
        aValue = a.code;
        bValue = b.code;
    }

    aValue = aValue.toLowerCase();
    bValue = bValue.toLowerCase();

    if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
};

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
  const departments = Array.from(new Set(courses.map(c => c.dept)));
  const creditOptions = Array.from(new Set(courses.map(c => c.credits)));
  
  const allGradeLevels: string[] = [];
  courses.forEach(course => {
    course.grade_levels.forEach(grade => {
      if (!allGradeLevels.includes(grade)) {
        allGradeLevels.push(grade);
      }
    });
  });
  const gradeLevels = allGradeLevels.sort();

  const filteredCourses = filterCourses(courses, filters);

  const CourseCard = ({ course, index }: { course: Course; index: number }) => {
    const animation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      animation.setValue(0);
      const delay = Math.min(index, 12) * 90;
      const timer = setTimeout(() => {
        Animated.spring(animation, {
          toValue: 1,
          friction: 9,
          tension: 60,
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
            outputRange: [10, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.courseCardWrapper, animatedStyle]}>
        <TouchableOpacity style={styles.courseCard} onPress={() => onCourseSelect(course)}>
          <View style={styles.courseCardHeader}>
            <Text style={styles.courseCode}>{course.code}</Text>
            {course.ap_flag && <Text style={[styles.metaItem, styles.apFlag]}>AP</Text>}
          </View>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDept}>{course.dept}</Text>
          <Text style={styles.courseDescription}>
            {course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '')}
          </Text>
          <View style={styles.courseMeta}>
            <Text style={styles.metaItem}>{`${course.credits} credit${course.credits === 1 ? '' : 's'}`}</Text>
            <Text style={styles.metaItem}>{`Grades: ${course.grade_levels.join(', ')}`}</Text>
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
      <View style={styles.basicFilters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor={colors.mutedText}
          value={filters.searchTerm}
          onChangeText={(text) => onFiltersChange({ ...filters, searchTerm: text })}
        />
        <TouchableOpacity style={styles.filterButton} onPress={onToggleAdvancedFilters}>
          <Text style={styles.filterButtonText}>
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAdvancedFilters && (
        <ScrollView style={styles.advancedFilters}>
          <Text style={styles.filterGroupTitle}>Departments</Text>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={styles.filterItem}
              onPress={() => {
                const newDepartments = filters.departments.includes(dept)
                  ? filters.departments.filter(d => d !== dept)
                  : [...filters.departments, dept];
                onFiltersChange({ ...filters, departments: newDepartments });
              }}
            >
              <Text style={styles.checkbox}>
                {filters.departments.includes(dept) ? '✓' : '○'} {dept}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.filterGroupTitle}>Credits</Text>
          {creditOptions.map(credit => (
            <TouchableOpacity
              key={credit}
              style={styles.filterItem}
              onPress={() => {
                const newCredits = filters.credits.includes(credit)
                  ? filters.credits.filter(c => c !== credit)
                  : [...filters.credits, credit];
                onFiltersChange({ ...filters, credits: newCredits });
              }}
            >
              <Text style={styles.checkbox}>
                {filters.credits.includes(credit) ? '✓' : '○'} {credit} credit{credit === 1 ? '' : 's'}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.filterGroupTitle}>Grade Levels</Text>
          {gradeLevels.map(grade => (
            <TouchableOpacity
              key={grade}
              style={styles.filterItem}
              onPress={() => {
                const newGradeLevels = filters.gradeLevels.includes(grade)
                  ? filters.gradeLevels.filter(g => g !== grade)
                  : [...filters.gradeLevels, grade];
                onFiltersChange({ ...filters, gradeLevels: newGradeLevels });
              }}
            >
              <Text style={styles.checkbox}>
                {filters.gradeLevels.includes(grade) ? '✓' : '○'} Grade {grade}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => onFiltersChange({ ...filters, apOnly: !filters.apOnly })}
          >
            <Text style={styles.checkbox}>
              {filters.apOnly ? '✓' : '○'} AP Courses Only
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Text style={styles.resultsInfo}>
        Showing {filteredCourses.length} of {courses.length} courses
      </Text>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        style={styles.coursesList}
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
    apOnly: false,
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
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      backgroundColor: colors.surface,
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
  });

export default CoursePages;
