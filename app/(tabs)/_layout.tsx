import TabBar from '@/components/tab-bar';
import { Colors } from '@/constants/theme';
import { TabBarProvider } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { actualTheme } = useTheme();

  return (
    <SafeAreaProvider>
      <TabBarProvider>
        <View style={{ flex: 1 }}>
          <Tabs
            tabBar={(props: any) => <TabBar {...props} />}
            screenOptions={{
              tabBarActiveTintColor: Colors[actualTheme].tint,
              headerShown: false,
            }}>
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
              name="courses"
              options={{
                title: 'Courses',
              }}
            />
            <Tabs.Screen
              name="events"
              options={{
                title: 'Events',
              }}
            />
          </Tabs>
        </View>
      </TabBarProvider>
    </SafeAreaProvider>
  );
}
