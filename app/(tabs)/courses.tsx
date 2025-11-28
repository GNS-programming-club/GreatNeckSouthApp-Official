import React, { useState } from 'react';
import {
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

// Import your courses data
const coursesData = require('./courses.json');

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

interface FilterOptions {
  searchTerm: string;
  departments: string[];
  credits: number[];
  gradeLevels: string[];
  apOnly: boolean;
  sortBy: 'code' | 'title' | 'dept' | 'rating';
  sortOrder: 'asc' | 'desc';
}

// In-memory storage - EMPTY REVIEWS ARRAY
let reviews: Review[] = [];
let teachers: Teacher[] = [];
const courses: Course[] = coursesData.courses;

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

// REMOVED THE generateSampleReviews FUNCTION

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
}> = ({ courses, onCourseSelect, filters, onFiltersChange, showAdvancedFilters, onToggleAdvancedFilters }) => {
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

  const renderCourseItem = ({ item: course }: { item: Course }) => {
    const courseReviews = reviews.filter(r => r.courseId === course.id && !r.flagged);
    const avgRating = courseReviews.length > 0 
      ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length 
      : 0;

    return (
      <TouchableOpacity
        style={styles.courseCard}
        onPress={() => onCourseSelect(course)}
      >
        <Text style={styles.courseCode}>{course.code}</Text>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseDept}>{course.dept}</Text>
        <Text style={styles.courseDescription}>
          {course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '')}
        </Text>
        <View style={styles.courseMeta}>
          <Text style={styles.metaItem}>{`${course.credits} credit${course.credits === 1 ? '' : 's'}`}</Text>
          <Text style={styles.metaItem}>{`Grades: ${course.grade_levels.join(', ')}`}</Text>
          {course.ap_flag && <Text style={[styles.metaItem, styles.apFlag]}>AP</Text>}
          <Text style={[styles.metaItem, styles.rating]}>
            {`Rating: ${avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.basicFilters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
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
}> = ({ course, reviews, onBack, onShowReviews }) => {
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
}> = ({ course, reviews, teachers, onBack, onSubmitReview }) => {
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
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Main CoursePages component
const CoursePages: React.FC = () => {
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

  // REMOVED the useEffect that initialized sample reviews

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
          />
        );
      case 'detail':
        return selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            reviews={courseReviews}
            onBack={handleBackToList}
            onShowReviews={handleShowReviews}
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
          />
        ) : (
          <View style={styles.container}>
            <Text>No course selected</Text>
          </View>
        );
      default:
        return (
          <View style={styles.container}>
            <Text>Invalid view</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.appContainer}>
      <View style={styles.appHeader}>
        <TouchableOpacity onPress={handleBackToList}>
          <Text style={styles.appTitle}>Course Pages</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.appMain}>
        {renderCurrentView()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appHeader: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  appMain: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  basicFilters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  filterButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  advancedFilters: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    maxHeight: 300,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  filterItem: {
    paddingVertical: 8,
  },
  checkbox: {
    fontSize: 16,
  },
  resultsInfo: {
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  coursesList: {
    flex: 1,
  },
  courseCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 4,
  },
  courseDept: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  apFlag: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  rating: {
    backgroundColor: '#ffc107',
    color: '#212529',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  courseHeader: {
    marginBottom: 24,
  },
  courseContent: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
  },
  reviewsSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avgRating: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  ratingStars: {
    fontSize: 18,
    color: '#ffc107',
  },
  reviewCount: {
    color: '#6c757d',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  reviewForm: {
    gap: 16,
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  pickerButtonText: {
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: 32,
    color: '#ddd',
  },
  activeStar: {
    color: '#ffc107',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
  },
  verificationWarning: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  existingReviews: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  reviewTeacher: {
    fontWeight: 'bold',
  },
  reviewRating: {
    color: '#ffc107',
  },
  reviewDate: {
    color: '#6c757d',
    fontSize: 12,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  advice: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  adviceLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 14,
  },
  errors: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  error: {
    color: '#721c24',
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  customTeacherInput: {
    marginTop: 16,
  },
  noReviews: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default CoursePages;
