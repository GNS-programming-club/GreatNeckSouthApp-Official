import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MAP_SEARCH_INDEX,
  entryLevel,
  entryTitle,
  type MapEntry,
} from '@/components/map/map-entries';
import MapStage, { type MapStageHandle } from '@/components/map/map-stage';
import type { MapSpotlightTarget, ScaleBound } from '@/components/map/map-types';
import ResultPanel from '@/components/map/result-panel';
import ZoomControls from '@/components/map/zoom-controls';
import SearchBar from '@/components/tools/search-bar';
import { Colors, Elevation, IconSize, Radii, type RadiusScale, Spacing } from '@/constants/theme';
import { useTabBarClearance } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import type { Insets } from '@/lib/map-viewport';
import { filterSearchIndex } from '@/lib/search-index';

const BACK_BUTTON_SIZE = 44;

type OpenRegion = { y: number; height: number };

function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) =>
      setKeyboardHeight(event.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
}

export default function FindARoomScreen() {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const insets = useSafeAreaInsets();
  const tabBarClearance = useTabBarClearance();
  const keyboardHeight = useKeyboardHeight();
  const stageRef = useRef<MapStageHandle>(null);

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scaleBound, setScaleBound] = useState<ScaleBound>('min');
  const [screenHeight, setScreenHeight] = useState(0);
  const [openRegion, setOpenRegion] = useState<OpenRegion>({ y: 0, height: 0 });

  const hasQuery = query.trim().length > 0;
  const results = useMemo(
    () => (hasQuery ? filterSearchIndex(MAP_SEARCH_INDEX, query) : []),
    [hasQuery, query]
  );
  const spotlightEntry = results.find((entry) => entry.id === selectedId) ?? null;
  const spotlightBox = spotlightEntry?.box ?? null;

  const spotlight = useMemo<MapSpotlightTarget | null>(
    () =>
      spotlightEntry && spotlightEntry.box
        ? {
            box: spotlightEntry.box,
            label: entryTitle(spotlightEntry),
            detail: entryLevel(spotlightEntry),
          }
        : null,
    [spotlightEntry]
  );

  const obscured = useMemo<Insets>(
    () => ({
      top: openRegion.y,
      bottom: Math.max(0, screenHeight - openRegion.y - openRegion.height),
      left: 0,
      right: 0,
    }),
    [openRegion, screenHeight]
  );

  useEffect(() => {
    if (spotlightBox) {
      stageRef.current?.focus(spotlightBox);
    }
  }, [spotlightBox]);

  const handleQueryChange = (next: string) => {
    const nextResults = next.trim().length > 0 ? filterSearchIndex(MAP_SEARCH_INDEX, next) : [];

    setQuery(next);
    setSelectedId(nextResults.length === 1 ? nextResults[0].id : null);
  };

  const handleMapTap = () => {
    Keyboard.dismiss();
    setSelectedId(null);
  };

  const handleSelect = (entry: MapEntry) => {
    Keyboard.dismiss();

    if (entry.id === selectedId && entry.box) {
      stageRef.current?.focus(entry.box);
    }

    setSelectedId(entry.id);
  };

  const handleOpenRegionLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;

    setOpenRegion({ y, height });
  };

  const bottomSpace = Math.max(tabBarClearance, keyboardHeight + Spacing.sm);

  return (
    <View
      style={styles.root}
      onLayout={(event) => setScreenHeight(event.nativeEvent.layout.height)}
    >
      <MapStage
        ref={stageRef}
        obscured={obscured}
        spotlight={spotlight}
        onScaleBoundChange={setScaleBound}
        onGestureStart={Keyboard.dismiss}
        onMapTap={handleMapTap}
      />

      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: bottomSpace },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
          >
            <Feather name="chevron-left" size={IconSize.xl} color={colors.text} />
          </Pressable>
          <View style={styles.search}>
            <SearchBar
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search a room or place"
            />
          </View>
        </View>

        <View style={styles.openRegion} pointerEvents="box-none" onLayout={handleOpenRegionLayout}>
          <ZoomControls
            scaleBound={scaleBound}
            onZoomIn={() => stageRef.current?.zoom('in')}
            onZoomOut={() => stageRef.current?.zoom('out')}
            onFit={() => stageRef.current?.fit()}
          />
        </View>

        {hasQuery ? (
          <ResultPanel
            results={results}
            spotlightId={spotlightEntry?.id ?? null}
            onSelect={handleSelect}
          />
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      paddingHorizontal: Spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    backButton: {
      width: BACK_BUTTON_SIZE,
      height: BACK_BUTTON_SIZE,
      borderRadius: BACK_BUTTON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...Elevation.raised,
    },
    backButtonPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    search: {
      flex: 1,
      borderRadius: radius.lg,
      ...Elevation.raised,
    },
    openRegion: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginVertical: Spacing.sm,
    },
  });
