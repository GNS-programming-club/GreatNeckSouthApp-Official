import React, { createContext, useContext, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

interface TabBarContextType {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  tabBarHeight: number;
  setTabBarHeight: (height: number) => void;
}

const ESTIMATED_TAB_BAR_HEIGHT = 72;

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export function tabBarBottomOffset(bottomInset: number) {
  return Math.max(bottomInset + 8, 16) + (bottomInset ? 8 : 12);
}

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [tabBarHeight, setTabBarHeight] = useState(ESTIMATED_TAB_BAR_HEIGHT);

  const setTabBarVisible = (visible: boolean) => {
    setIsTabBarVisible(visible);
  };

  return (
    <TabBarContext.Provider
      value={{ isTabBarVisible, setTabBarVisible, tabBarHeight, setTabBarHeight }}
    >
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const context = useContext(TabBarContext);

  if (context === undefined) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }

  return context;
}

export function useTabBarClearance() {
  const context = useContext(TabBarContext);
  const insets = useSafeAreaInsets();

  if (!context?.isTabBarVisible) {
    return insets.bottom + Spacing.lg;
  }

  return tabBarBottomOffset(insets.bottom) + context.tabBarHeight + Spacing.lg;
}
