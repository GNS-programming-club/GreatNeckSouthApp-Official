import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
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
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity style={styles.card} onPress={() => onClubSelect(club)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{club.title}</Text>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Advisor(s):</Text>
            <Text style={styles.metaValue} numberOfLines={1} ellipsizeMode="tail">{club.advisors}</Text>
          </View>

          {club.googleclasscode && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Google Classroom:</Text>
              <Text style={[styles.metaValue, styles.highlightCode]}>{club.googleclasscode}</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardDescription} numberOfLines={3}>
          {club.description}
        </Text>

        {club.meetinginfo !== "Unknown" && (
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
  colors: ThemeColors;
}> = ({ club, onBack, styles, colors }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Club Details</Text>
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{club.title}</Text>

          <View style={styles.detailMeta}>
            <View style={styles.detailItemVertical}>
              <Text style={styles.detailLabel}>Advisor(s):</Text>
              <Text style={styles.detailValue}>{club.advisors}</Text>
            </View>

            {club.googleclasscode && (
              <View style={styles.detailItemVertical}>
                <Text style={styles.detailLabel}>Google Classroom Code:</Text>
                <View style={styles.codeContainer}>
                    <Text style={[styles.detailValue, styles.highlightCode]}>{club.googleclasscode}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.detailContent}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{club.description}</Text>

          {club.meetinginfo !== "Unknown" && (
            <>
              <Text style={styles.sectionTitle}>Meeting Information</Text>
              <Text style={styles.descriptionText}>{club.meetinginfo}</Text>
            </>
          )}
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const ClubList: React.FC<{
  clubs: Club[];
  onClubSelect: (club: Club) => void;
  styles: ThemedStyles;
  colors: ThemeColors;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}> = ({ clubs, onClubSelect, styles, colors, searchTerm, onSearchChange }) => {
  const filteredClubs = filterClubs(clubs, searchTerm);
  const router = useRouter();

  const renderClubItem = ({ item, index }: { item: Club; index: number }) => (
    <ClubCard club={item} index={index} onClubSelect={onClubSelect} styles={styles} />
  );

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>School Clubs</Text>
      </View>

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
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const Clubs: React.FC = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <ClubList
            clubs={clubs}
            onClubSelect={handleClubSelect}
            styles={styles}
            colors={colors}
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
            colors={colors}
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
      paddingBottom: 75
    },
    appMain: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
      paddingBottom: 46,
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
      marginBottom: 16,
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
    list: {
      flex: 1,
    },
    cardWrapper: {
      marginBottom: 12,
    },
    card: {
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
    cardHeader: {
        marginBottom: 4,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    cardMeta: {
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
    highlightCode: {
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
    cardDescription: {
      fontSize: 14,
      color: colors.mutedText,
      lineHeight: 20,
      marginBottom: 8,
    },
    meetingInfo: {
        backgroundColor: colors.surfaceAlt,
        padding: 12,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 4,
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
    detailBackButton: {
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
    detailHeader: {
      marginBottom: 24,
      gap: 8,
    },
    detailTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    detailMeta: {
       gap: 12,
    },
    detailContent: {
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
        fontSize: 14,
        fontWeight: '700',
        color: colors.mutedText,
        marginRight: 8,
    },
    detailValue: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    descriptionText: {
        fontSize: 16,
        color: colors.mutedText,
        lineHeight: 24,
    },
    resultsRow: {
      marginBottom: 12,
    },
    detailItemVertical: {
      flexDirection: 'column',
      marginBottom: 16,
      gap: 6,
    },
    detailScroll: {
      flex: 1,
    },
    codeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
        alignSelf: 'flex-start',
        height: 35,
    }
  });

export default Clubs;
