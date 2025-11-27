import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Agenda } from 'react-native-calendars';

interface TodayInfo {
  date: string;
  dayLetter: string;
  lunchMenu?: Array<string>;
  holidays?: Array<string>;
  clubEvents?: Array<{ name: string; time: string }>;
}

interface CalendarItem {
  title: string;
  time?: string;
}

const Calendar = () => {
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayInfo, setTodayInfo] = useState<TodayInfo>({
    date: '',
    dayLetter: '',
    lunchMenu: [],
    holidays: [],
    clubEvents: []
  });

  const getDayLetter = (date: Date): string => {
    return 'A'; // Placeholder
  };

  useEffect(() => {
    const loadTodayInfo = async () => {
      try {
        const response = await axios.get(`/api/today/${selectedDate.toISOString()}`);

        setTodayInfo({
          date: selectedDate.toLocaleDateString(),
          dayLetter: getDayLetter(selectedDate),
          lunchMenu: response.data?.lunchMenu || [],
          holidays: response.data?.holidays || [],
          clubEvents: response.data?.clubEvents || []
        });
      } catch (error) {
        console.error('Failed to load today info:', error);
      }
    };

    loadTodayInfo();
  }, [selectedDate]);

  const agendaItems: Record<string, CalendarItem[]> = {
    [selectedDate.toISOString().split('T')[0]]:
      todayInfo.clubEvents?.map(event => ({
        title: event.name,
        time: event.time
      })) || []
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        
        {/* Today's Info Section */}
        <View style={styles.SectionContainer}>
          <Text style={styles.sectionTitle}>Today</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text>{todayInfo.date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Day:</Text>
            <Text>{todayInfo.dayLetter}</Text>
          </View>
        </View>

        {/* Calendar */}
        <Agenda
          items={agendaItems}
          selected={selectedDate.toISOString().split('T')[0]}
          onDayPress={(day) => {
            setSelectedDate(new Date(day.dateString));
          }}
          renderItem={(item: CalendarItem) => (
            <View style={{ padding: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
              {item.time && <Text>{item.time}</Text>}
            </View>
          )}
          renderEmptyDate={() => (
            <View style={{ padding: 10 }}>
              <Text>No events today</Text>
            </View>
          )}
        />

        {/* Club Events */}
        <View style={styles.SectionContainer}>
          <Text style={styles.sectionTitle}>Today's Club Events</Text>

          {todayInfo.clubEvents && todayInfo.clubEvents.length > 0 ? (
            todayInfo.clubEvents.map((event, index) => (
              <View key={index} style={styles.clubEvent}>
                <Text>{event.name}</Text>
                <Text>{event.time}</Text>
              </View>
            ))
          ) : (
            <Text>No club events scheduled for today</Text>
          )}
        </View>

        {/* Add Event Button */}
        <Pressable
          onPress={() => navigation.navigate('SubmitClubEvent' as never)}
          style={{ padding: 20 }}
        >
          <Text style={{ color: '#007AFF', textAlign: 'center' }}>
            Add New Club Event
          </Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  SectionContainer: {
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
  clubEvent: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#eee'
  }
});

export default Calendar;
