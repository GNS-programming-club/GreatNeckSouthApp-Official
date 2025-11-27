import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';

interface TodayInfo {
  date: string;
  dayLetter: string;
  lunchMenu: string[];
  holidays: string[];
  clubEvents: Array<{ name: string; time: string }>;
}

interface TodayResponse {
  lunchMenu?: string[];
  holidays?: string[];
  clubEvents?: Array<{ name: string; time: string }>;
}

interface ClubEvent {
  name: string;
  time: string;
}

const CalendarScreen = () => {
  const navigation = useNavigation();
  const isMountedRef = useRef(true);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [todayInfo, setTodayInfo] = useState<TodayInfo>({
    date: '',
    dayLetter: '',
    lunchMenu: [],
    holidays: [],
    clubEvents: []
  });

  const getDayLetter = useCallback((date: Date): string => {
    return 'A';
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTodayInfo = async () => {
      try {
        const response = await axios.get<TodayResponse>(
          `/api/today/${selectedDate}`
        );

        if (cancelled || !isMountedRef.current) return;

        const dateObj = new Date(selectedDate);

        setTodayInfo({
          date: dateObj.toLocaleDateString(),
          dayLetter: getDayLetter(dateObj),
          lunchMenu: response.data?.lunchMenu || [],
          holidays: response.data?.holidays || [],
          clubEvents: response.data?.clubEvents || []
        });
      } catch (error) {
        if (cancelled || !isMountedRef.current) return;
        
        console.error('Failed to load today\'s info:', error);
        
        const dateObj = new Date(selectedDate);
        setTodayInfo({
          date: dateObj.toLocaleDateString(),
          dayLetter: getDayLetter(dateObj),
          lunchMenu: [],
          holidays: [],
          clubEvents: []
        });
      }
    };

    loadTodayInfo();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, getDayLetter]);

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#007AFF'
    }
  };

  const handleDayPress = useCallback((day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  }, []);

  const renderEventItem = useCallback(({ item }: { item: ClubEvent }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventTime}>{item.time}</Text>
    </View>
  ), []);

  const handleAddEvent = useCallback(() => {
    navigation.navigate('SubmitClubEvent' as never);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.infoText}>{todayInfo.date || 'Loading...'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Day:</Text>
            <Text style={styles.infoText}>{todayInfo.dayLetter || '-'}</Text>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              selectedDayBackgroundColor: '#007AFF',
              todayTextColor: '#007AFF',
              dotColor: '#007AFF',
              arrowColor: '#007AFF'
            }}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Events for {todayInfo.date || selectedDate}</Text>

          {todayInfo.clubEvents && todayInfo.clubEvents.length > 0 ? (
            <FlatList
              data={todayInfo.clubEvents}
              renderItem={renderEventItem}
              keyExtractor={(item, index) => `event-${selectedDate}-${index}`}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noEventsText}>
              No club events scheduled for this day
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleAddEvent}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Add New Club Event</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  sectionContainer: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderColor: '#ddd'
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8
  },
  label: {
    fontWeight: '500',
    color: '#666'
  },
  infoText: {
    color: '#333'
  },
  calendarContainer: {
    marginVertical: 10,
    paddingHorizontal: 10
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#eee'
  },
  eventName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  eventTime: {
    fontSize: 14,
    color: '#666'
  },
  noEventsText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20
  },
  addButton: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default CalendarScreen;