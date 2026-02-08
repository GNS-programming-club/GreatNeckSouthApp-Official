import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Image as RNImage,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

// eslint-disable-next-line import/no-unresolved
import { Colors } from "@/constants/theme";
// eslint-disable-next-line import/no-unresolved
import { useTheme } from "@/contexts/theme-context";

const MAP_IMAGE = require("../../../assets/images/school-map.png");

const { width: IMG_W, height: IMG_H } = RNImage.resolveAssetSource(MAP_IMAGE);
const IMG_ASPECT = IMG_W / IMG_H;

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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
  // Areas and named spaces
  makeLocation("Main Entrance", "main-entrance", ["entrance", "front", "main"], 0.33, 0.15),
  makeLocation("Main Office Complex", "main-office-complex", ["office", "main", "complex", "727"], 0.65, 0.15),
  makeLocation("Upper Cafeteria", "upper-cafeteria", ["cafe", "cafeteria", "lunch"], 0.1, 0.95),
  makeLocation("Lower Cafeteria", "lower-cafeteria", ["cafe", "cafeteria", "lunch"], 0.25, 0.95),
  makeLocation("Courtyard", "courtyard", ["courtyard", "outside"], 0.59, 0.43),
  makeLocation("Greenhouse", "greenhouse", ["greenhouse", "outside", "641"], 0.8, 0.48),
  makeLocation("Observatory", "observatory", ["observatory", "outside"], 0.7, 0.43),
  makeLocation("Library Classroom", "library-classroom", ["library", "classroom"], 0.62, 0.64),
  makeLocation("Computer Lab", "computer-lab", ["computer", "lab"], 0.517, 0.64),
  makeLocation("Library 502", "library-502", ["library", "502"], 0.57, 0.6),
  makeLocation("Auditorium", "auditorium", ["auditorium", "theater"], 0.355, 0.315),
  makeLocation("Stage", "stage", ["stage", "theater"], 0.355, 0.315),
  makeLocation("Choral Room 306", "choral-room-306", ["choral", "room", "306"], 0.275, 0.24),
  makeLocation("Practice Rooms", "practice-rooms", ["practice", "rooms"], 0.245, 0.24),
  makeLocation("Music 309", "music-309", ["music", "309"], 0.21, 0.24),
  makeLocation("Faculty Lounge 319C", "faculty-lounge-319c", ["faculty", "lounge", "319c"], 0.2, 0.418),
  makeLocation("Test Center 322", "test-center-322", ["test", "center", "322"], 0.25, 0.4),
  makeLocation("GP 324", "gp-324", ["gp", "324"], 0.315, 0.4),
  makeLocation("Deans 327/328", "deans-327-328", ["deans", "327", "328"], 0.33, 0.15),
  makeLocation("Study Center 210", "study-center-210", ["study", "center", "210"], 0.33, 0.15),
  makeLocation("School Store", "school-store", ["school", "store"], 0.33, 0.15),
  makeLocation("Internship Office 700A", "internship-office-700a", ["internship", "office", "700a"], 0.33, 0.15),
  makeLocation("Main Office 727", "main-office-727", ["main", "office", "727"], 0.33, 0.15),
  makeLocation("Principal 726", "principal-726", ["principal", "726"], 0.33, 0.15),
  makeLocation("Assistant Principal 727A", "assistant-principal-727a", ["assistant", "principal", "727a"], 0.33, 0.15),
  makeLocation("Assistant Principal 722", "assistant-principal-722", ["assistant", "principal", "722"], 0.33, 0.15),
  makeLocation("Conference Room 724", "conference-room-724", ["conference", "room", "724"], 0.33, 0.15),
  makeLocation("Nurse 732", "nurse-732", ["nurse", "732"], 0.33, 0.15),
  makeLocation("Attendance 730", "attendance-730", ["attendance", "730"], 0.33, 0.15),
  makeLocation("Guidance", "guidance", ["guidance"], 0.33, 0.15),
  makeLocation("Special Ed 720", "special-ed-720", ["special", "ed", "720"], 0.33, 0.15),
  makeLocation("East Gym 808", "east-gym-808", ["east", "gym", "808"], 0.092, 0.62),
  makeLocation("West Gym 102", "west-gym-102", ["west", "gym", "102"], 0.33, 0.15),
  makeLocation("Aux. Gym 100", "aux-gym-100", ["aux", "gym", "100"], 0.33, 0.15),
  makeLocation("Aux. Gym 809", "aux-gym-809", ["aux", "gym", "809"], 0.33, 0.15),
  makeLocation("Weight Room 810", "weight-room-810", ["weight", "room", "810"], 0.33, 0.15),
  makeLocation("Boys Locker 801", "boys-locker-801", ["boys", "locker", "801"], 0.33, 0.15),
  makeLocation("Girls Locker 820", "girls-locker-820", ["girls", "locker", "820"], 0.33, 0.15),
  makeLocation("Boys Locker 104M", "boys-locker-104m", ["boys", "locker", "104m"], 0.33, 0.15),
  makeLocation("Girls Locker 104", "girls-locker-104", ["girls", "locker", "104"], 0.33, 0.15),
  makeLocation("Wood Shop 200", "wood-shop-200", ["wood", "shop", "200"], 0.33, 0.15),
  makeLocation("Auto Shop", "auto-shop", ["auto", "shop"], 0.33, 0.15),
  makeLocation("Lab 202", "lab-202", ["lab", "202"], 0.33, 0.15),
  makeLocation("Concession Stand", "concession-stand", ["concession", "stand"], 0.33, 0.15),
  makeLocation("Upper Level", "upper-level", ["upper", "level"], 0.33, 0.15),
  makeLocation("Mezzanine Level", "mezzanine-level", ["mezzanine", "level"], 0.33, 0.15),
  makeLocation("Bottom Level", "bottom-level", ["bottom", "level"], 0.33, 0.15),
  // Elevators
  makeLocation("Elevator", "elevator-1"),
  makeLocation("Elevator", "elevator-2"),
  makeLocation("Elevator", "elevator-3"),
  // Bathrooms
  makeLocation("Boys Bathroom", "boys-bathroom-1"),
  makeLocation("Boys Bathroom", "boys-bathroom-2"),
  makeLocation("Boys Bathroom", "boys-bathroom-3"),
  makeLocation("Boys Bathroom", "boys-bathroom-4"),
  makeLocation("Men's Bathroom", "mens-bathroom-1"),
  makeLocation("Men's Bathroom", "mens-bathroom-2"),
  makeLocation("Men's Bathroom", "mens-bathroom-3"),
  makeLocation("Men's Bathroom", "mens-bathroom-4"),
  makeLocation("Men's Bathroom", "mens-bathroom-5"),
  makeLocation("Women's Bathroom", "womens-bathroom-1"),
  makeLocation("Women's Bathroom", "womens-bathroom-2"),
  makeLocation("Women's Bathroom", "womens-bathroom-3"),
  makeLocation("Women's Bathroom", "womens-bathroom-4"),
  makeLocation("Women's Bathroom", "womens-bathroom-5"),
  makeLocation("Girls Bathroom", "girls-bathroom-1"),
  makeLocation("Girls Bathroom", "girls-bathroom-2"),
  makeLocation("Girls Bathroom", "girls-bathroom-3"),
  // 100s
  makeLocation("104F", "104f", ["104f"]),
  makeLocation("105", "105", ["105"]),
  makeLocation("199", "199", ["199"]),
  makeLocation("199A", "199a", ["199a"]),
  // 200s
  makeLocation("206", "206", ["206"]),
  makeLocation("207", "207", ["207"]),
  makeLocation("211", "211", ["211"]),
  makeLocation("212", "212", ["212"]),
  makeLocation("213", "213", ["213"]),
  makeLocation("213A", "213a", ["213a"]),
  makeLocation("214", "214", ["214"]),
  // 300s
  makeLocation("313", "313", ["313"]),
  makeLocation("314", "314", ["314"]),
  makeLocation("315", "315", ["315"]),
  makeLocation("316", "316", ["316"]),
  makeLocation("319A", "319a", ["319a"]),
  makeLocation("319B", "319b", ["319b"]),
  makeLocation("319D", "319d", ["319d"]),
  makeLocation("319E", "319e", ["319e"]),
  makeLocation("319F", "319f", ["319f"]),
  makeLocation("319G", "319g", ["319g"]),
  makeLocation("319H", "319h", ["319h"]),
  makeLocation("319I", "319i", ["319i"]),
  makeLocation("319J", "319j", ["319j"]),
  makeLocation("319K", "319k", ["319k"]),
  // 400s
  makeLocation("401", "401", ["401"]),
  makeLocation("402", "402", ["402"]),
  makeLocation("403", "403", ["403"]),
  makeLocation("404", "404", ["404"]),
  makeLocation("405", "405", ["405"]),
  makeLocation("406", "406", ["406"]),
  makeLocation("407", "407", ["407"]),
  makeLocation("414", "414", ["414"]),
  makeLocation("416", "416", ["416"]),
  makeLocation("417", "417", ["417"]),
  makeLocation("418", "418", ["418"]),
  makeLocation("419", "419", ["419"]),
  makeLocation("420", "420", ["420"]),
  makeLocation("421", "421", ["421"]),
  makeLocation("423", "423", ["423"]),
  makeLocation("424", "424", ["424"]),
  makeLocation("425", "425", ["425"]),
  makeLocation("430", "430", ["430"]),
  makeLocation("431", "431", ["431"]),
  makeLocation("433", "433", ["433"]),
  makeLocation("434", "434", ["434"]),
  makeLocation("435", "435", ["435"]),
  makeLocation("437", "437", ["437"]),
  makeLocation("441", "441", ["441"]),
  makeLocation("442", "442", ["442"]),
  makeLocation("443", "443", ["443"]),
  makeLocation("445", "445", ["445"]),
  makeLocation("446", "446", ["446"]),
  makeLocation("447", "447", ["447"]),
  makeLocation("448", "448", ["448"]),
  makeLocation("449", "449", ["449"]),
  makeLocation("450", "450", ["450"]),
  makeLocation("451", "451", ["451"]),
  makeLocation("452", "452", ["452"]),
  // 500s
  makeLocation("501", "501", ["501"]),
  makeLocation("502A", "502a", ["502a"]),
  makeLocation("502B", "502b", ["502b"]),
  makeLocation("502C", "502c", ["502c"]),
  makeLocation("502D", "502d", ["502d"]),
  makeLocation("502F", "502f", ["502f"]),
  makeLocation("503", "503", ["503"]),
  makeLocation("503A", "503a", ["503a"]),
  makeLocation("504", "504", ["504"]),
  makeLocation("505", "505", ["505"]),
  makeLocation("506", "506", ["506"]),
  makeLocation("507", "507", ["507"]),
  makeLocation("508", "508", ["508"]),
  // 600s
  makeLocation("600", "600", ["600"]),
  makeLocation("601", "601", ["601"]),
  makeLocation("602", "602", ["602"]),
  makeLocation("603", "603", ["603"]),
  makeLocation("604", "604", ["604"]),
  makeLocation("605", "605", ["605"]),
  makeLocation("606", "606", ["606"]),
  makeLocation("607", "607", ["607"]),
  makeLocation("608", "608", ["608"]),
  makeLocation("609", "609", ["609"]),
  makeLocation("610", "610", ["610"]),
  makeLocation("611", "611", ["611"]),
  makeLocation("612", "612", ["612"]),
  makeLocation("613", "613", ["613"]),
  makeLocation("614", "614", ["614"]),
  makeLocation("615", "615", ["615"]),
  makeLocation("616B", "616b", ["616b"]),
  makeLocation("617", "617", ["617"]),
  makeLocation("620", "620", ["620"]),
  makeLocation("641", "641", ["641"]),
  // 700s
  makeLocation("700", "700", ["700"]),
  makeLocation("701", "701", ["701"]),
  makeLocation("702", "702", ["702"]),
  makeLocation("703", "703", ["703"]),
  makeLocation("704", "704", ["704"]),
  makeLocation("705", "705", ["705"]),
  makeLocation("707A", "707a", ["707a"]),
  makeLocation("707B", "707b", ["707b"]),
  makeLocation("729", "729", ["729"]),
  makeLocation("731", "731", ["731"]),
  // 800s
  makeLocation("800", "800", ["800"]),
];

export default function SchoolMap() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results =
    normalizedQuery.length === 0
      ? []
      : LOCATIONS.filter((loc) => {
          if (loc.label.toLowerCase().includes(normalizedQuery)) return true;
          return loc.keywords.some((k) => k.includes(normalizedQuery));
        }).slice(0, 8);

  const { width, height } = useWindowDimensions();
  const isMobilePortrait = width < 768 && width < height;

  const baseScale = useSharedValue(1);
  const [baseScaleValue, setBaseScaleValue] = useState(1);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const mapWidth = useSharedValue(0);
  const mapHeight = useSharedValue(0);
  const portraitFlag = useSharedValue(0);
  const lastCoordX = useSharedValue(0.5);
  const lastCoordY = useSharedValue(0.5);
  const lastCoordScale = useSharedValue(1);

  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [centerCoord, setCenterCoord] = useState({ x: 0.5, y: 0.5, scale: 1 });

  React.useEffect(() => {
    scale.value = withTiming(baseScaleValue);
    savedScale.value = baseScaleValue;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [width, height, baseScaleValue, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  React.useEffect(() => {
    portraitFlag.value = isMobilePortrait ? 1 : 0;
  }, [isMobilePortrait, portraitFlag]);

  const updateCenterCoord = (x: number, y: number, s: number) => {
    setCenterCoord({ x, y, scale: s });
  };

  useAnimatedReaction(
    () => ({
      tx: translateX.value,
      ty: translateY.value,
      s: scale.value,
      w: mapWidth.value,
      h: mapHeight.value,
      portrait: portraitFlag.value,
    }),
    (curr) => {
      if (!curr.w || !curr.h || !curr.s) return;

      const dxPrime = -curr.tx / curr.s;
      const dyPrime = -curr.ty / curr.s;

      let viewX = 0.5 + dxPrime / curr.w;
      let viewY = 0.5 + dyPrime / curr.h;

      let imageX: number;
      let imageY: number;

      if (curr.portrait === 1) {
        imageX = 1 - viewY;
        imageY = viewX;
      } else {
        imageX = viewX;
        imageY = viewY;
      }

      imageX = Math.max(0, Math.min(1, imageX));
      imageY = Math.max(0, Math.min(1, imageY));

      if (
        Math.abs(imageX - lastCoordX.value) < 0.001 &&
        Math.abs(imageY - lastCoordY.value) < 0.001 &&
        Math.abs(curr.s - lastCoordScale.value) < 0.01
      ) {
        return;
      }

      lastCoordX.value = imageX;
      lastCoordY.value = imageY;
      lastCoordScale.value = curr.s;

      runOnJS(updateCenterCoord)(imageX, imageY, curr.s);
    }
  );

  const zoomToLocation = (loc: MapLocation) => {
    setQuery("");

    const targetScale = Math.max(baseScale.value * 2.5, baseScale.value + 1);

    const w = mapWidth.value;
    const h = mapHeight.value;

    let viewX: number;
    let viewY: number;

    if (isMobilePortrait) {
      viewX = loc.y;
      viewY = 1 - loc.x;
    } else {
      viewX = loc.x;
      viewY = loc.y;
    }

    const dx = (viewX - 0.5) * w;
    const dy = (viewY - 0.5) * h;

    const targetTranslateX = -dx * targetScale;
    const targetTranslateY = -dy * targetScale;

    scale.value = withTiming(targetScale);
    savedScale.value = targetScale;
    translateX.value = withTiming(targetTranslateX);
    translateY.value = withTiming(targetTranslateY);
    savedTranslateX.value = targetTranslateX;
    savedTranslateY.value = targetTranslateY;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < baseScale.value) {
        scale.value = withTiming(baseScale.value);
        savedScale.value = baseScale.value;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > baseScale.value) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
        if (scale.value !== baseScale.value) {
            scale.value = withTiming(baseScale.value);
            savedScale.value = baseScale.value;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        } else {
            const zoomScale = Math.max(baseScale.value * 2.5, baseScale.value + 1);
            scale.value = withTiming(zoomScale);
            savedScale.value = zoomScale;
        }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const baseRotation = isMobilePortrait ? '90deg' : '0deg';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: baseRotation as '0deg' | '90deg' | '180deg' | '270deg' }
    ],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scale.value === 1 ? 1 : 0),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
            onPress={() => setQuery("")}
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
              style={[
                styles.resultRow,
                idx === results.length - 1 ? styles.resultRowLast : null,
              ]}
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
              {
                width: (() => {
                  if (mapDimensions.width === 0) return '100%';
                  const containerW = mapDimensions.width;
                  const containerH = mapDimensions.height;

                  if (isMobilePortrait) {
                    const scale = Math.min(containerW / IMG_H, containerH / IMG_W);

                    return IMG_W * scale;
                  } else {
                    const scale = Math.min(containerW / IMG_W, containerH / IMG_H);

                    return IMG_W * scale;
                  }
                })(),
                height: (() => {
                   if (mapDimensions.width === 0) return '100%';
                   const containerW = mapDimensions.width;
                   const containerH = mapDimensions.height;

                   if (isMobilePortrait) {
                     const scale = Math.min(containerW / IMG_H, containerH / IMG_W);
                     return IMG_H * scale;
                   } else {
                     const scale = Math.min(containerW / IMG_W, containerH / IMG_H);
                     return IMG_H * scale;
                   }
                })()
              }
            ]}
            onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                mapWidth.value = width;
                mapHeight.value = height;

                 if (Math.abs(baseScale.value - 1) > 0.01) {
                  baseScale.value = 1;
                  setBaseScaleValue(1);
                 }
            }}
          >
            <Image
              source={MAP_IMAGE}
              contentFit="fill"
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
        </GestureDetector>
        <View style={styles.centerMarker} pointerEvents="none" />
        <View style={styles.coordOverlay} pointerEvents="none">
          <Text style={styles.coordText}>
            x: {centerCoord.x.toFixed(3)}  y: {centerCoord.y.toFixed(3)}  z: {centerCoord.scale.toFixed(2)}
          </Text>
          <Text style={styles.coordHint}>Center of view</Text>
        </View>
        <Animated.View style={[styles.overlayHint, hintStyle]}>
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
      justifyContent: "center",
      alignContent: "center",
      paddingHorizontal: 16,
      paddingTop: 25,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
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
    searchWrap: {
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      zIndex: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    resultsCard: {
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
      zIndex: 20,
    },
    resultRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    resultRowLast: {
      borderBottomWidth: 0,
    },
    resultText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    resultHint: {
      color: colors.mutedText,
      fontSize: 12,
    },
    mapContainer: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      marginHorizontal: 16,
      marginBottom: 90, // Explicit space for absolute TabBar
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mapContent: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapImage: {
      width: '100%',
      height: '100%',
    },
    overlayHint: {
        position: 'absolute',
        bottom: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        pointerEvents: 'none',
    },
    mapHint: {
      color: '#fff',
      fontSize: 12,
      borderRadius: 10,
      padding: 4,
      fontWeight: '600',
    },
    coordOverlay: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: 'rgba(0,0,0,0.65)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    coordText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    coordHint: {
      marginTop: 2,
      fontSize: 10,
      color: '#ffffff',
    },
    centerMarker: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 8,
      height: 8,
      marginLeft: -4,
      marginTop: -4,
      borderRadius: 4,
      backgroundColor: 'var(--color-primary)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.8)',
    },
  });
