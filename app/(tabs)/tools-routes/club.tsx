import { useNavigation } from '@react-navigation/native';
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
import clubsData from '../../../assets/data/club.json';

interface Club {
  id: string;
  title: string;
  advisors: string;
  description: string;
  googleclasscode: string;
  meetinginfo: string;
}

type ThemeColors = (typeof Colors)['light'];
type ThemedStyles = ReturnType<typeof createStyles>;

const clubs: Club[] = clubsData as unknown as Club[];

// Search function
const filterClubs = (clubs: Club[], searchTerm: string): Club[] => {
  if (!searchTerm.trim()) return clubs;
  
  const term = searchTerm.toLowerCase().trim();
  
  return clubs.filter(club => {
    return (
      club.title.toLowerCase().includes(term) ||
      club.advisors.toLowerCase().includes(term) ||
      club.description.toLowerCase().includes(term) ||
      club.googleclasscode?.toLowerCase().includes(term) ||
      club.meetinginfo?.toLowerCase().includes(term)
    );
  });
};

const ClubCard: React.FC<{
  club: Club;
  index: number;
  onClubSelect: (club: Club) => void;
  styles: ThemedStyles;
}> = ({ club, index, onClubSelect, styles }) => {
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
    <Animated.View style={[styles.clubCardWrapper, animatedStyle]}>
      <TouchableOpacity style={styles.clubCard} onPress={() => onClubSelect(club)}>
        <View style={styles.clubCardHeader}>
          <Text style={styles.clubTitle}>{club.title}</Text>
        </View>
        
        <View style={styles.clubMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Advisor(s):</Text>
            <Text style={styles.metaValue}>{club.advisors}</Text>
          </View>
          
          {club.googleclasscode && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Google Classroom:</Text>
              <Text style={[styles.metaValue, styles.googleCode]}>{club.googleclasscode}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.clubDescription} numberOfLines={3}>
          {club.description}
        </Text>
        
        {club.meetinginfo && (
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingLabel}>Meeting Info:</Text>
            <Text style={styles.meetingValue}>{club.meetinginfo}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ClubDetail: React.FC<{
  club: Club;
  onBack: () => void;
  styles: ThemedStyles;
}> = ({ club, onBack, styles }) => {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Clubs</Text>
      </TouchableOpacity>

      <View style={styles.clubHeader}>
        <Text style={styles.clubTitle}>{club.title}</Text>
        
        <View style={styles.clubMeta}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Advisor(s):</Text>
            <Text style={styles.detailValue}>{club.advisors}</Text>
          </View>
          
          {club.googleclasscode && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Google Classroom Code:</Text>
              <Text style={[styles.detailValue, styles.googleCode]}>{club.googleclasscode}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.clubContent}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.clubDescription}>{club.description}</Text>

        {club.meetinginfo && (
          <>
            <Text style={styles.sectionTitle}>Meeting Information</Text>
            <Text style={styles.clubDescription}>{club.meetinginfo}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const ClubList: React.FC<{
  clubs: Club[];
  onClubSelect: (club: Club) => void;
  styles: ThemedStyles;
  colors: ThemeColors;
  showBackButton?: boolean;
  onBack?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}> = ({ clubs, onClubSelect, styles, colors, showBackButton, onBack, searchTerm, onSearchChange }) => {
  const filteredClubs = filterClubs(clubs, searchTerm);

  const renderClubItem = ({ item, index }: { item: Club; index: number }) => (
    <ClubCard club={item} index={index} onClubSelect={onClubSelect} styles={styles} />
  );

  return (
    <View style={styles.container}>
      {showBackButton && onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}
      
      {/* Search Bar - Same design as Courses page */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs, advisors, descriptions..."
            placeholderTextColor={colors.mutedText}
            value={searchTerm}
            onChangeText={onSearchChange}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Text style={styles.clearSearchIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.resultsRow}>
        <Text style={styles.resultsInfo}>
          {filteredClubs.length === clubs.length
            ? `${clubs.length} club${clubs.length === 1 ? '' : 's'}`
            : `${filteredClubs.length} of ${clubs.length} clubs`}
        </Text>
      </View>

      <FlatList
        data={filteredClubs}
        renderItem={renderClubItem}
        keyExtractor={(item) => item.id}
        style={styles.clubsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Main Clubs component
const Clubs: React.FC = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedClub(null);
  };

  const handleBackToMore = () => {
    navigation.goBack();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <ClubList
            clubs={clubs}
            onClubSelect={handleClubSelect}
            styles={styles}
            colors={colors}
            showBackButton={true}
            onBack={handleBackToMore}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        );
      case 'detail':
        return selectedClub ? (
          <ClubDetail
            club={selectedClub}
            onBack={handleBackToList}
            styles={styles}
          />
        ) : (
          <View style={styles.container}>
            <Text>No club selected</Text>
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
      paddingBottom: 100
    },
    appMain: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
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
    searchInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    clearSearchIcon: {
      fontSize: 18,
      color: colors.mutedText,
      padding: 8,
      fontWeight: '300',
    },
    resultsInfo: {
      color: colors.mutedText,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    clubsList: {
      flex: 1,
    },
    clubCardWrapper: {
      marginBottom: 12,
    },
    clubCard: {
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
      gap: 8,
    },
    clubCardHeader: {
      marginBottom: 4,
    },
    clubTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    clubMeta: {
      gap: 6,
      marginBottom: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedText,
    },
    metaValue: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    googleCode: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clubDescription: {
      fontSize: 14,
      color: colors.mutedText,
      lineHeight: 20,
      marginBottom: 8,
    },
    meetingInfo: {
      backgroundColor: colors.surfaceAlt,
      padding: 12,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    meetingLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    meetingValue: {
      fontSize: 14,
      color: colors.mutedText,
      lineHeight: 20,
    },
    backButton: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    backButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    clubHeader: {
      marginBottom: 24,
      gap: 12,
    },
    clubContent: {
      gap: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    detailItem: {
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.mutedText,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailValue: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    resultsRow: {
      marginBottom: 12,
    },
  });

export default Clubs;