import TabBar from '@/components/tab-bar';
import { Colors } from '@/constants/theme';
import { TabBarProvider } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const { actualTheme } = useTheme();

  return (
    <TabBarProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props: any) => <TabBar {...props} />}
          screenOptions={{
            tabBarActiveTintColor: Colors[actualTheme].tint,
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: 'Calendar',
            }}
          />
          <Tabs.Screen
            name="tools"
            options={{
              title: 'Tools',
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
            }}
          />
          <Tabs.Screen name="tools-routes/schedule" options={{ href: null }} />
          <Tabs.Screen name="tools-routes/bus" options={{ href: null }} />
          <Tabs.Screen name="tools-routes/clubs" options={{ href: null }} />
          <Tabs.Screen name="tools-routes/courses" options={{ href: null }} />
          <Tabs.Screen name="tools-routes/school-map" options={{ href: null }} />
          <Tabs.Screen name="tools-routes/school-map-full" options={{ href: null }} />
        </Tabs>
      </View>
    </TabBarProvider>
  );
}
