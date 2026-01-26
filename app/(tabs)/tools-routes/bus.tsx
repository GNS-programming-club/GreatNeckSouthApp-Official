import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
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
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

import busData from '/Users/kelton/Desktop/GNSHS APP /GreatNeckSouthApp-Official/assets/data/bus.json';

interface BusStop {
  stop: number;
  time: string;
  students: number;
  location: string;
}

interface BusRoute {
  id: string;
  title: string;
  vehicle: string;
  departureTime: string;
  stops: BusStop[];
}

interface FilterOptions {
  searchTerm: string;
}

// -------------------- Helpers --------------------

const filterRoutes = (routes: BusRoute[], filters: FilterOptions) => {
  if (!filters.searchTerm) return routes;

  const term = filters.searchTerm.toLowerCase();

  return routes.filter(route =>
    route.vehicle.toLowerCase().includes(term) ||
    route.title.toLowerCase().includes(term) ||
    route.stops.some(stop => stop.location.toLowerCase().includes(term))
  );
};

// -------------------- Main Component --------------------

const Bus: React.FC = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const navigation = useNavigation<any>();

  const routes: BusRoute[] = busData as BusRoute[];

  const [filters, setFilters] = useState<FilterOptions>({ searchTerm: '' });
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);

  const filteredRoutes = filterRoutes(routes, filters);

  // -------------------- Cards --------------------

  const RouteCard = ({ route, index }: { route: BusRoute; index: number }) => {
    const animation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      animation.setValue(0);
      const delay = Math.min(index, 10) * 60;
      const timer = setTimeout(() => {
        Animated.spring(animation, {
          toValue: 1,
          friction: 10,
          tension: 70,
          useNativeDriver: true,
        }).start();
      }, delay);
      return () => clearTimeout(timer);
    }, [index]);

    return (
      <Animated.View
        style={{
          opacity: animation,
          transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <TouchableOpacity
          style={styles.routeCard}
          onPress={() => setSelectedRoute(route)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.vehicle}>Bus {route.vehicle}</Text>
            <Text style={styles.departure}>Departs {route.departureTime}</Text>
          </View>
          <Text style={styles.routeTitle}>{route.title}</Text>
          <Text style={styles.metaText}>{route.stops.length} stops</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // -------------------- Views --------------------

  if (selectedRoute) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <TouchableOpacity onPress={() => setSelectedRoute(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back to Routes</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>{selectedRoute.title}</Text>
          <Text style={styles.detailMeta}>Bus {selectedRoute.vehicle} • Departs {selectedRoute.departureTime}</Text>

          {selectedRoute.stops.map(stop => (
            <View key={stop.stop} style={styles.stopRow}>
              <Text style={styles.stopTime}>{stop.time}</Text>
              <Text style={styles.stopLocation}>{stop.location}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/tools')}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Routes</Text>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bus, route, or stop…"
          placeholderTextColor={colors.mutedText}
          value={filters.searchTerm}
          onChangeText={text => setFilters({ searchTerm: text })}
        />
      </View>

      <FlatList
        data={filteredRoutes}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <RouteCard route={item} index={index} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// -------------------- Styles --------------------

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    searchWrapper: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    searchInput: {
      height: 48,
      color: colors.text,
    },
    routeCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    vehicle: {
      fontWeight: '800',
      color: colors.primary,
    },
    departure: {
      color: colors.mutedText,
    },
    routeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    metaText: {
      color: colors.mutedText,
      fontSize: 13,
    },
    backButton: {
      marginBottom: 12,
    },
    backText: {
      color: colors.primary,
      fontWeight: '700',
    },
    detailTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 6,
      color: colors.text,
    },
    detailMeta: {
      marginBottom: 16,
      color: colors.mutedText,
    },
    stopRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stopTime: {
      width: 60,
      fontWeight: '700',
      color: colors.text,
    },
    stopLocation: {
      flex: 1,
      color: colors.text,
    },
  });

export default Bus;