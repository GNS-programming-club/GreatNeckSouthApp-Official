import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

import coursesData from '../../assets/data/courses.json';
import { SafeAreaView } from 'react-native-safe-area-context';

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

interface Review {
  id: string;
  courseId: string;
  teacher: string;
  rating: number;
  reviewText: string;
  advice: string;
  date: string;
  studentEmail: string;
  flagged: boolean;
}

interface Teacher {
  id: string;
  name: string;
  department: string;
}

type ThemeColors = (typeof Colors)['light'];
type ThemedStyles = ReturnType<typeof createStyles>;

interface FilterOptions {
  searchTerm: string;
  departments: string[];
  credits: number[];
  gradeLevels: string[];
  apOnly: boolean;
  sortBy: 'code' | 'title' | 'dept' | 'rating';
  sortOrder: 'asc' | 'desc';
}

let reviews: Review[] = [];
let teachers: Teacher[] = [];
const courses: Course[] = (coursesData.courses as unknown as Course[]).map((course) => ({
  ...course,
  source_page: typeof course.source_page === "number" ? course.source_page : -1,
}));

const filterCourses = (courses: Course[], filters: FilterOptions, courseReviews: Review[]): Course[] => {
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
    let aValue: any, bValue: any;
    
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
      case 'rating':
        const aReviews = courseReviews.filter(r => r.courseId === a.id);
        const bReviews = courseReviews.filter(r => r.courseId === b.id);
        aValue = aReviews.length > 0 ? aReviews.reduce((sum, r) => sum + r.rating, 0) / aReviews.length : 0;
        bValue = bReviews.length > 0 ? bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length : 0;
        break;
      default:
        aValue = a.code;
        bValue = b.code;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
};

function generateSampleReviews(): Review[] {
  const departments = Array.from(new Set(courses.map(c => c.dept)));
  const sampleReviews: Review[] = [];
  
  departments.forEach(dept => {
    const deptCourses = courses.filter(c => c.dept === dept).slice(0, 2);
    deptCourses.forEach(course => {
      for (let i = 0; i < 3; i++) {
        sampleReviews.push({
          id: `sample-${dept}-${course.id}-${i}`,
          courseId: course.id,
          teacher: `Teacher ${i + 1}`,
          rating: Math.floor(Math.random() * 3) + 3,
          reviewText: `This is a sample review for ${course.title}. Great course!`,
          advice: 'Make sure to attend all lectures and complete assignments on time.',
          date: new Date().toISOString(),
          studentEmail: `student${i}@student.gn.k12.ny.us`,
          flagged: false
        });
      }
    });
  });
  
  return sampleReviews;
}

function isVerifiedStudent(email: string): boolean {
  return email.endsWith('@student.gn.k12.ny.us');
}

function validateReview(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.teacher || data.teacher.trim().length === 0) {
    errors.push('Teacher is required');
  }
  
  if (!data.rating || data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
    errors.push('Rating must be an integer between 1 and 5');
  }
  
  if (!data.reviewText || data.reviewText.length > 1000) {
    errors.push('Review text is required and must be 1000 characters or less');
  }
  
  if (data.advice && data.advice.length > 300) {
    errors.push('Advice must be 300 characters or less');
  }
  
  if (!data.studentEmail || !isVerifiedStudent(data.studentEmail)) {
    errors.push('Valid student email is required');
  }
  
  return { valid: errors.length === 0, errors };
}

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

  const filteredCourses = filterCourses(courses, filters, reviews);

  const CourseCard = ({ course, index }: { course: Course; index: number }) => {
    const courseReviews = reviews.filter(r => r.courseId === course.id && !r.flagged);
    const avgRating =
      courseReviews.length > 0
        ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length
        : 0;

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
            <Text style={[styles.metaItem, styles.rating]}>
              {`Rating: ${avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}`}
            </Text>
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
  reviews: Review[];
  onBack: () => void;
  onShowReviews: () => void;
  styles: ThemedStyles;
  colors: ThemeColors;
}> = ({ course, reviews, onBack, onShowReviews, styles, colors: _colors }) => {
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

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

        <View style={styles.reviewsSummary}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Student Reviews</Text>
            <TouchableOpacity style={styles.reviewButton} onPress={onShowReviews}>
              <Text style={styles.reviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingSummary}>
            <Text style={styles.avgRating}>{avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}</Text>
            <Text style={styles.ratingStars}>
              {avgRating > 0 ? '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating)) : 'No ratings yet'}
            </Text>
            <Text style={styles.reviewCount}>
              {`${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const ReviewsPage: React.FC<{ 
  course: Course;
  reviews: Review[];
  teachers: Teacher[];
  onBack: () => void;
  onSubmitReview: (review: Omit<Review, 'id' | 'flagged'>) => void;
  styles: ThemedStyles;
  colors: ThemeColors;
}> = ({ course, reviews, teachers, onBack, onSubmitReview, styles, colors }) => {
  const [teacher, setTeacher] = useState('');
  const [customTeacher, setCustomTeacher] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [advice, setAdvice] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  const isVerified = isVerifiedStudent(studentEmail);
  const finalTeacher = teacher === 'custom' ? customTeacher : teacher;

  const handleSubmit = () => {
    const reviewData = {
      courseId: course.id,
      teacher: finalTeacher,
      rating,
      reviewText,
      advice,
      date: new Date().toISOString(),
      studentEmail
    };

    const validation = validateReview(reviewData);
    if (validation.valid) {
      onSubmitReview(reviewData);
      setTeacher('');
      setCustomTeacher('');
      setRating(0);
      setReviewText('');
      setAdvice('');
      setStudentEmail('');
      setErrors([]);
      Alert.alert('Success', 'Your review has been submitted!');
    } else {
      setErrors(validation.errors);
    }
  };

  const renderReviewItem = ({ item: review }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTeacher}>{review.teacher}</Text>
        <Text style={styles.reviewRating}>
          {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
        </Text>
        <Text style={styles.reviewDate}>
          {new Date(review.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.reviewText}>{review.reviewText}</Text>
      {review.advice && (
        <View style={styles.advice}>
          <Text style={styles.adviceLabel}>Advice:</Text>
          <Text style={styles.adviceText}>{review.advice}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Course</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Review {course.title}</Text>

        <View style={styles.reviewForm}>
          <Text style={styles.sectionTitle}>Write a Review</Text>
          
          {errors.length > 0 && (
            <View style={styles.errors}>
              {errors.map((error, index) => (
                <Text key={index} style={styles.error}>{error}</Text>
              ))}
            </View>
          )}

          <Text style={styles.label}>Teacher</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowTeacherModal(true)}
          >
            <Text style={styles.pickerButtonText}>
              {teacher ? (teacher === 'custom' ? customTeacher : teacher) : 'Select a teacher'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Text style={[styles.star, star <= rating && styles.activeStar]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Review</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience with this course..."
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{reviewText.length}/1000</Text>

          <Text style={styles.label}>Advice (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={advice}
            onChangeText={setAdvice}
            placeholder="Any advice for future students?"
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <Text style={styles.charCount}>{advice.length}/300</Text>

          <Text style={styles.label}>Student Email</Text>
          <TextInput
            style={styles.textInput}
            value={studentEmail}
            onChangeText={setStudentEmail}
            placeholder="your.email@student.gn.k12.ny.us"
            placeholderTextColor={colors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {!isVerified && studentEmail && (
            <Text style={styles.verificationWarning}>
              You must be a verified student to submit a review.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !isVerified && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!isVerified}
          >
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.existingReviews}>
          <Text style={styles.sectionTitle}>Existing Reviews</Text>
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noReviews}>No reviews yet. Be the first to review this course!</Text>
          )}
        </View>

        <Modal
          visible={showTeacherModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Teacher</Text>
              <ScrollView>
                {teachers.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setTeacher(t.name);
                      setShowTeacherModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setTeacher('custom');
                    setShowTeacherModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>Other...</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTeacherModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {teacher === 'custom' && (
          <View style={styles.customTeacherInput}>
            <Text style={styles.label}>Teacher Name</Text>
            <TextInput
              style={styles.textInput}
              value={customTeacher}
              onChangeText={setCustomTeacher}
              placeholder="Enter teacher name"
              placeholderTextColor={colors.mutedText}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Main CoursePages component
const CoursePages: React.FC = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'reviews'>('list');
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

  useEffect(() => {
    if (reviews.length === 0) {
      reviews = generateSampleReviews();
    }
  }, []);

  const courseReviews = selectedCourse 
    ? reviews.filter(r => r.courseId === selectedCourse.id && !r.flagged)
    : [];

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCourse(null);
  };

  const handleShowReviews = () => {
    setCurrentView('reviews');
  };

  const handleBackToDetail = () => {
    setCurrentView('detail');
  };

  const handleSubmitReview = (reviewData: Omit<Review, 'id' | 'flagged'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `review-${Date.now()}`,
      flagged: false
    };
    
    reviews.push(newReview);
    
    if (!teachers.some(t => t.name === reviewData.teacher)) {
      teachers.push({
        id: `teacher-${Date.now()}`,
        name: reviewData.teacher,
        department: selectedCourse?.dept || 'Unknown'
      });
    }
    
    setCurrentView('detail');
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
            reviews={courseReviews}
            onBack={handleBackToList}
            onShowReviews={handleShowReviews}
            styles={styles}
            colors={colors}
          />
        ) : (
          <View style={styles.container}>
            <Text>No course selected</Text>
          </View>
        );
      case 'reviews':
        return selectedCourse ? (
          <ReviewsPage
            course={selectedCourse}
            reviews={courseReviews}
            teachers={teachers.filter(t => t.department === selectedCourse.dept)}
            onBack={handleBackToDetail}
            onSubmitReview={handleSubmitReview}
            styles={styles}
            colors={colors}
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
    <SafeAreaView style={styles.appContainer}>
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
      paddingBottom: 100
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
    rating: {
      backgroundColor: colors.primary,
      color: colors.primaryText,
      borderColor: colors.primary,
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
    reviewsSummary: {
      backgroundColor: colors.surfaceAlt,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reviewButton: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 10,
    },
    reviewButtonText: {
      color: colors.primaryText,
      fontWeight: '700',
    },
    ratingSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avgRating: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.accent,
    },
    ratingStars: {
      fontSize: 18,
      color: colors.accent,
    },
    reviewCount: {
      color: colors.mutedText,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text,
    },
    reviewForm: {
      gap: 16,
      marginBottom: 24,
    },
    label: {
      fontWeight: '700',
      marginBottom: 4,
      color: colors.text,
    },
    pickerButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.surface,
    },
    pickerButtonText: {
      fontSize: 16,
      color: colors.text,
    },
    ratingContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    star: {
      fontSize: 32,
      color: colors.border,
    },
    activeStar: {
      color: colors.primary,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      textAlign: 'right',
      fontSize: 12,
      color: colors.mutedText,
    },
    verificationWarning: {
      color: colors.accent,
      fontSize: 14,
      marginTop: 4,
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    disabledButton: {
      backgroundColor: colors.border,
    },
    submitButtonText: {
      color: colors.primaryText,
      fontWeight: '700',
      fontSize: 16,
    },
    existingReviews: {
      gap: 16,
    },
    reviewItem: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      flexWrap: 'wrap',
      gap: 6,
    },
    reviewTeacher: {
      fontWeight: '700',
      color: colors.text,
    },
    reviewRating: {
      color: colors.accent,
    },
    reviewDate: {
      color: colors.mutedText,
      fontSize: 12,
    },
    reviewText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
    },
    advice: {
      backgroundColor: colors.surfaceAlt,
      padding: 12,
      borderRadius: 10,
      marginTop: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    adviceLabel: {
      fontWeight: '700',
      marginBottom: 4,
      color: colors.text,
    },
    adviceText: {
      fontSize: 14,
      color: colors.mutedText,
    },
    errors: {
      backgroundColor: colors.accentSoft,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    error: {
      color: colors.text,
      marginBottom: 4,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '86%',
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    modalItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      fontSize: 16,
      color: colors.text,
    },
    modalCloseButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalCloseButtonText: {
      color: colors.primaryText,
      fontWeight: '700',
    },
    customTeacherInput: {
      marginTop: 16,
    },
    noReviews: {
      fontSize: 16,
      color: colors.primaryText,
    }
  });

export default CoursePages;
