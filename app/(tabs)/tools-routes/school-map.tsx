import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image as RNImage,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const MAP_IMAGE = require('../../../assets/images/school-map.png');

const { width: IMG_W, height: IMG_H } = RNImage.resolveAssetSource(MAP_IMAGE);

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_SCALE = 2.5;

const clamp = (value: number, min: number, max: number) => {
  'worklet';

  return Math.min(Math.max(value, min), max);
};

type MapLocation = {
  id: string;
  label: string;
  keywords: string[];
  x: number;
  y: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const makeLocation = (
  label: string,
  idOverride?: string,
  keywords: string[] = [],
  x?: number,
  y?: number
): MapLocation => ({
  id: idOverride ?? slugify(label),
  label,
  keywords,
  x: x ?? 0.5,
  y: y ?? 0.5,
});

const LOCATIONS: MapLocation[] = [
  makeLocation('Main Entrance', 'main-entrance', ['entrance', 'front', 'main'], 0.33, 0.15),
  makeLocation(
    'Main Office Complex',
    'main-office-complex',
    ['office', 'main', 'complex', '727'],
    0.65,
    0.15
  ),
  makeLocation('Upper Cafeteria', 'upper-cafeteria', ['cafe', 'cafeteria', 'lunch'], 0.1, 0.95),
  makeLocation('Lower Cafeteria', 'lower-cafeteria', ['cafe', 'cafeteria', 'lunch'], 0.25, 0.95),
  makeLocation('Courtyard', 'courtyard', ['courtyard', 'outside'], 0.59, 0.43),
  makeLocation('Greenhouse', 'greenhouse', ['greenhouse', 'outside', '641'], 0.8, 0.48),
  makeLocation('Observatory', 'observatory', ['observatory', 'outside'], 0.7, 0.43),
  makeLocation('Library Classroom', 'library-classroom', ['library', 'classroom'], 0.62, 0.64),
  makeLocation('Computer Lab', 'computer-lab', ['computer', 'lab'], 0.517, 0.64),
  makeLocation('Library 502', 'library-502', ['library', '502'], 0.57, 0.6),
  makeLocation('Auditorium', 'auditorium', ['auditorium', 'theater'], 0.355, 0.315),
  makeLocation('Stage', 'stage', ['stage', 'theater'], 0.355, 0.315),
  makeLocation('Choral Room 306', 'choral-room-306', ['choral', 'room', '306'], 0.275, 0.24),
  makeLocation('Practice Rooms', 'practice-rooms', ['practice', 'rooms'], 0.245, 0.24),
  makeLocation('Music 309', 'music-309', ['music', '309'], 0.21, 0.24),
  makeLocation(
    'Faculty Lounge 319C',
    'faculty-lounge-319c',
    ['faculty', 'lounge', '319c'],
    0.2,
    0.418
  ),
  makeLocation('Test Center 322', 'test-center-322', ['test', 'center', '322'], 0.25, 0.4),
  makeLocation('GP 324', 'gp-324', ['gp', '324'], 0.315, 0.4),
  makeLocation('Deans 327/328', 'deans-327-328', ['deans', '327', '328'], 0.33, 0.15),
  makeLocation('Study Center 210', 'study-center-210', ['study', 'center', '210'], 0.33, 0.15),
  makeLocation('School Store', 'school-store', ['school', 'store'], 0.33, 0.15),
  makeLocation(
    'Internship Office 700A',
    'internship-office-700a',
    ['internship', 'office', '700a'],
    0.33,
    0.15
  ),
  makeLocation('Main Office 727', 'main-office-727', ['main', 'office', '727'], 0.33, 0.15),
  makeLocation('Principal 726', 'principal-726', ['principal', '726'], 0.33, 0.15),
  makeLocation(
    'Assistant Principal 727A',
    'assistant-principal-727a',
    ['assistant', 'principal', '727a'],
    0.33,
    0.15
  ),
  makeLocation(
    'Assistant Principal 722',
    'assistant-principal-722',
    ['assistant', 'principal', '722'],
    0.33,
    0.15
  ),
  makeLocation(
    'Conference Room 724',
    'conference-room-724',
    ['conference', 'room', '724'],
    0.33,
    0.15
  ),
  makeLocation('Nurse 732', 'nurse-732', ['nurse', '732'], 0.33, 0.15),
  makeLocation('Attendance 730', 'attendance-730', ['attendance', '730'], 0.33, 0.15),
  makeLocation('Guidance', 'guidance', ['guidance'], 0.33, 0.15),
  makeLocation('Special Ed 720', 'special-ed-720', ['special', 'ed', '720'], 0.33, 0.15),
  makeLocation('East Gym 808', 'east-gym-808', ['east', 'gym', '808'], 0.092, 0.62),
  makeLocation('West Gym 102', 'west-gym-102', ['west', 'gym', '102'], 0.33, 0.15),
  makeLocation('Aux. Gym 100', 'aux-gym-100', ['aux', 'gym', '100'], 0.33, 0.15),
  makeLocation('Aux. Gym 809', 'aux-gym-809', ['aux', 'gym', '809'], 0.33, 0.15),
  makeLocation('Weight Room 810', 'weight-room-810', ['weight', 'room', '810'], 0.33, 0.15),
  makeLocation('Boys Locker 801', 'boys-locker-801', ['boys', 'locker', '801'], 0.33, 0.15),
  makeLocation('Girls Locker 820', 'girls-locker-820', ['girls', 'locker', '820'], 0.33, 0.15),
  makeLocation('Boys Locker 104M', 'boys-locker-104m', ['boys', 'locker', '104m'], 0.33, 0.15),
  makeLocation('Girls Locker 104', 'girls-locker-104', ['girls', 'locker', '104'], 0.33, 0.15),
  makeLocation('Wood Shop 200', 'wood-shop-200', ['wood', 'shop', '200'], 0.33, 0.15),
  makeLocation('Auto Shop', 'auto-shop', ['auto', 'shop'], 0.33, 0.15),
  makeLocation('Lab 202', 'lab-202', ['lab', '202'], 0.33, 0.15),
  makeLocation('Concession Stand', 'concession-stand', ['concession', 'stand'], 0.33, 0.15),
  makeLocation('Upper Level', 'upper-level', ['upper', 'level'], 0.33, 0.15),
  makeLocation('Mezzanine Level', 'mezzanine-level', ['mezzanine', 'level'], 0.33, 0.15),
  makeLocation('Bottom Level', 'bottom-level', ['bottom', 'level'], 0.33, 0.15),
  makeLocation('Elevator', 'elevator-1'),
  makeLocation('Elevator', 'elevator-2'),
  makeLocation('Elevator', 'elevator-3'),
  makeLocation('Boys Bathroom', 'boys-bathroom-1'),
  makeLocation('Boys Bathroom', 'boys-bathroom-2'),
  makeLocation('Boys Bathroom', 'boys-bathroom-3'),
  makeLocation('Boys Bathroom', 'boys-bathroom-4'),
  makeLocation("Men's Bathroom", 'mens-bathroom-1'),
  makeLocation("Men's Bathroom", 'mens-bathroom-2'),
  makeLocation("Men's Bathroom", 'mens-bathroom-3'),
  makeLocation("Men's Bathroom", 'mens-bathroom-4'),
  makeLocation("Men's Bathroom", 'mens-bathroom-5'),
  makeLocation("Women's Bathroom", 'womens-bathroom-1'),
  makeLocation("Women's Bathroom", 'womens-bathroom-2'),
  makeLocation("Women's Bathroom", 'womens-bathroom-3'),
  makeLocation("Women's Bathroom", 'womens-bathroom-4'),
  makeLocation("Women's Bathroom", 'womens-bathroom-5'),
  makeLocation('Girls Bathroom', 'girls-bathroom-1'),
  makeLocation('Girls Bathroom', 'girls-bathroom-2'),
  makeLocation('Girls Bathroom', 'girls-bathroom-3'),
  makeLocation('104F', '104f', ['104f']),
  makeLocation('105', '105', ['105']),
  makeLocation('199', '199', ['199']),
  makeLocation('199A', '199a', ['199a']),
  makeLocation('206', '206', ['206']),
  makeLocation('207', '207', ['207']),
  makeLocation('211', '211', ['211']),
  makeLocation('212', '212', ['212']),
  makeLocation('213', '213', ['213']),
  makeLocation('213A', '213a', ['213a']),
  makeLocation('214', '214', ['214']),
  makeLocation('313', '313', ['313']),
  makeLocation('314', '314', ['314']),
  makeLocation('315', '315', ['315']),
  makeLocation('316', '316', ['316']),
  makeLocation('319A', '319a', ['319a']),
  makeLocation('319B', '319b', ['319b']),
  makeLocation('319D', '319d', ['319d']),
  makeLocation('319E', '319e', ['319e']),
  makeLocation('319F', '319f', ['319f']),
  makeLocation('319G', '319g', ['319g']),
  makeLocation('319H', '319h', ['319h']),
  makeLocation('319I', '319i', ['319i']),
  makeLocation('319J', '319j', ['319j']),
  makeLocation('319K', '319k', ['319k']),
  makeLocation('401', '401', ['401']),
  makeLocation('402', '402', ['402']),
  makeLocation('403', '403', ['403']),
  makeLocation('404', '404', ['404']),
  makeLocation('405', '405', ['405']),
  makeLocation('406', '406', ['406']),
  makeLocation('407', '407', ['407']),
  makeLocation('414', '414', ['414']),
  makeLocation('416', '416', ['416']),
  makeLocation('417', '417', ['417']),
  makeLocation('418', '418', ['418']),
  makeLocation('419', '419', ['419']),
  makeLocation('420', '420', ['420']),
  makeLocation('421', '421', ['421']),
  makeLocation('423', '423', ['423']),
  makeLocation('424', '424', ['424']),
  makeLocation('425', '425', ['425']),
  makeLocation('430', '430', ['430']),
  makeLocation('431', '431', ['431']),
  makeLocation('433', '433', ['433']),
  makeLocation('434', '434', ['434']),
  makeLocation('435', '435', ['435']),
  makeLocation('437', '437', ['437']),
  makeLocation('441', '441', ['441']),
  makeLocation('442', '442', ['442']),
  makeLocation('443', '443', ['443']),
  makeLocation('445', '445', ['445']),
  makeLocation('446', '446', ['446']),
  makeLocation('447', '447', ['447']),
  makeLocation('448', '448', ['448']),
  makeLocation('449', '449', ['449']),
  makeLocation('450', '450', ['450']),
  makeLocation('451', '451', ['451']),
  makeLocation('452', '452', ['452']),
  makeLocation('501', '501', ['501']),
  makeLocation('502A', '502a', ['502a']),
  makeLocation('502B', '502b', ['502b']),
  makeLocation('502C', '502c', ['502c']),
  makeLocation('502D', '502d', ['502d']),
  makeLocation('502F', '502f', ['502f']),
  makeLocation('503', '503', ['503']),
  makeLocation('503A', '503a', ['503a']),
  makeLocation('504', '504', ['504']),
  makeLocation('505', '505', ['505']),
  makeLocation('506', '506', ['506']),
  makeLocation('507', '507', ['507']),
  makeLocation('508', '508', ['508']),
  makeLocation('600', '600', ['600']),
  makeLocation('601', '601', ['601']),
  makeLocation('602', '602', ['602']),
  makeLocation('603', '603', ['603']),
  makeLocation('604', '604', ['604']),
  makeLocation('605', '605', ['605']),
  makeLocation('606', '606', ['606']),
  makeLocation('607', '607', ['607']),
  makeLocation('608', '608', ['608']),
  makeLocation('609', '609', ['609']),
  makeLocation('610', '610', ['610']),
  makeLocation('611', '611', ['611']),
  makeLocation('612', '612', ['612']),
  makeLocation('613', '613', ['613']),
  makeLocation('614', '614', ['614']),
  makeLocation('615', '615', ['615']),
  makeLocation('616B', '616b', ['616b']),
  makeLocation('617', '617', ['617']),
  makeLocation('620', '620', ['620']),
  makeLocation('641', '641', ['641']),
  makeLocation('700', '700', ['700']),
  makeLocation('701', '701', ['701']),
  makeLocation('702', '702', ['702']),
  makeLocation('703', '703', ['703']),
  makeLocation('704', '704', ['704']),
  makeLocation('705', '705', ['705']),
  makeLocation('707A', '707a', ['707a']),
  makeLocation('707B', '707b', ['707b']),
  makeLocation('729', '729', ['729']),
  makeLocation('731', '731', ['731']),
  makeLocation('800', '800', ['800']),
];

export default function SchoolMap() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const results =
    normalizedQuery.length === 0
      ? []
      : LOCATIONS.filter((loc) => {
          if (loc.label.toLowerCase().includes(normalizedQuery)) return true;

          return loc.keywords.some((k) => k.includes(normalizedQuery));
        }).slice(0, 8);

  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  const fitted = useMemo(() => {
    if (!mapDimensions.width || !mapDimensions.height) return null;

    const scale = Math.min(mapDimensions.width / IMG_W, mapDimensions.height / IMG_H);

    return { width: IMG_W * scale, height: IMG_H * scale };
  }, [mapDimensions]);

  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const zoomToLocation = (loc: MapLocation) => {
    setQuery('');

    const dx = (loc.x - 0.5) * contentWidth.value;
    const dy = (loc.y - 0.5) * contentHeight.value;

    const targetTranslateX = -dx * ZOOM_SCALE;
    const targetTranslateY = -dy * ZOOM_SCALE;

    scale.value = withTiming(ZOOM_SCALE);
    savedScale.value = ZOOM_SCALE;
    translateX.value = withTiming(targetTranslateX);
    translateY.value = withTiming(targetTranslateY);
    savedTranslateX.value = targetTranslateX;
    savedTranslateY.value = targetTranslateY;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= MIN_SCALE) return;

      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(ZOOM_SCALE);
        savedScale.value = ZOOM_SCALE;
      }
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scale.value > MIN_SCALE ? 0 : 1),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>School Map</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.mutedText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search rooms or places (e.g., Gym, Cafeteria)"
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Feather name="x" size={16} color={colors.mutedText} />
          </TouchableOpacity>
        )}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsCard}>
          {results.map((r, idx) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.resultRow, idx === results.length - 1 ? styles.resultRowLast : null]}
              onPress={() => zoomToLocation(r)}
            >
              <Text style={styles.resultText}>{r.label}</Text>
              <Text style={styles.resultHint}>Tap to view on map</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View
        style={styles.mapContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setMapDimensions({ width, height });
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.mapContent,
              animatedStyle,
              fitted ? { width: fitted.width, height: fitted.height } : null,
            ]}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              contentWidth.value = width;
              contentHeight.value = height;
            }}
          >
            <Image source={MAP_IMAGE} contentFit="fill" style={styles.mapImage} />
          </Animated.View>
        </GestureDetector>

        <Animated.View style={[styles.overlayHint, hintStyle]} pointerEvents="none">
          <Text style={styles.mapHint}>Double tap or pinch to zoom</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      justifyContent: 'center',
      alignContent: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      alignSelf: 'flex-start',
      height: 36,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: Spacing.sm,
      ...Type.display,
      color: colors.text,
    },
    searchWrap: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      zIndex: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      ...Type.label,
      fontWeight: '400',
    },
    resultsCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      zIndex: 20,
    },
    resultRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    resultRowLast: {
      borderBottomWidth: 0,
    },
    resultText: {
      color: colors.text,
      ...Type.label,
    },
    resultHint: {
      color: colors.mutedText,
      ...Type.caption,
      fontWeight: '400',
    },
    mapContainer: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: 90,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mapContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapImage: {
      width: '100%',
      height: '100%',
    },
    overlayHint: {
      position: 'absolute',
      bottom: Spacing.lg,
      backgroundColor: colors.shadow,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.pill,
    },
    mapHint: {
      color: colors.primaryText,
      ...Type.caption,
      fontWeight: '600',
    },
  });
