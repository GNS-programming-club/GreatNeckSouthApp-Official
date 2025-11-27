import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import axios from 'axios';

interface TodayInfo {
  date: string;
  dayLetter: string;
  lunchMenu?: Array<string>;
  holidays?: Array<string>;
  clubEvents?: Array<{ name: string; time: string }>;
}

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showLunchMenu, setShowLunchMenu] = useState(false);
  const [todayInfo, setTodayInfo] = useState<TodayInfo>({
    date: '',
    dayLetter: '',
    lunchMenu: [],
    holidays: [],
    clubEvents: []
  });

  useEffect(() => {
    // Load today's info
    handleLoadTodayInfo();
  }, []);

  const handleLoadTodayInfo = async () => {
    try {
      // Add your backend API call here for today's data
      const response = await axios.get(`/api/today/${selectedDate.toISOString()}`);
      
      setTodayInfo({
        date: selectedDate.toLocaleDateString(),
        dayLetter: getDayLetter(selectedDate),
        lunchMenu: response.data.lunchMenu || [],
        holidays: response.data.holidays || [],
        clubEvents: response.data.clubEvents || []
      });
    } catch (error) {
      console.error('Failed to load today info:', error);
    }
  };

  const getDayLetter = (date: Date): string => {
    // Calculate day letter based on your school schedule
    // Implement actual logic here for A/B/C/D days
    return 'A';
  };

  const onDayPress = (day: any) => {
    setSelectedDate(new Date(day.date));
    handleLoadTodayInfo();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Today's Info Section */}
        <View style={styles.SectionContainer}>
          <Text style={styles.sectionTitle}>Today's Information</Text>
          
          {/* Basic Info */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text>{todayInfo.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Day:</Text>
            <Text>{todayInfo.dayLetter}</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.SectionContainer}>
          <CalendarList
            current={selectedDate}
            minDate={new Date()}
            maxDate={new Date().setMonth(new Date().getMonth() + 6)}
            onDayPress={onDayPress}
            firstDay={0}
            monthFormat={'MMMM yyyy'}
            pastScrollRange={24}
            futureScrollRange={24}
          />
        </View>

        {/* Lunch Menu Section */}
        <View style={styles.SectionContainer}>
          <Text style={styles.sectionTitle}>Lunch Menu</Text>
          
          {!showLunchMenu && (
            <Text 
              onPress={() => setShowLunchMenu(true)}
              style={styles.ToggleButton}
            >
              Tap to show menu
            </Text>
          )}
          
          {showLunchMenu && todayInfo.lunchMenu.length > 0 && (
            <View>
              <Text>Today's Menu:</Text>
              {todayInfo.lunchMenu.map((item, index) => (
                <Text key={index}>{item}</Text>
              ))}
              <Text 
                onPress={() => setShowLunchMenu(false)}
                style={styles.ToggleButton}
              >
                Hide menu
              </Text>
            </View>
          )}
        </View>

        {/* Clubs Section */}
        <View style={styles.SectionContainer}>
          <Text style={styles.sectionTitle}>Today's Club Events</Text>
          
          {todayInfo.clubEvents.length > 0 ? (
            todayInfo.clubEvents.map((event, index) => (
              <View key={index} style={styles клубEvent}>
                <Text>{event.name}</Text>
                <Text>{event.time}</Text>
              </View>
            ))
          ) : (
            <Text>No club events scheduled for today</Text>
          )}
        </View>

        {/* Holidays Section */}
        <View style={styles.SectionContainer}>
          <Text style={styles.sectionTitle}>Holidays & Special Events</Text>
          
          {todayInfo.holidays.length > 0 && (
            todayInfo.holidays.map((event, index) => (
              <Text key={index}>{event}</Text>
            ))
          )}
        </View>

        {/* Status Messages */}
        <View style={styles.SectionContainer}>
          <Text statusMessage>True</Text>
          {status === 'loading' && <Text>Loading...</Text>}
          {status === 'error' && (
            <Text>Error: Failed to load some data. Please try again.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  SectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5
  },
  label: {
    fontWeight: '600',
    color: '#666'
  },
  ToggleButton: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 10,
    textDecorationLine: 'underline'
  },
  klubEvent: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: '#eee'
  }
});

export default Calendar;
