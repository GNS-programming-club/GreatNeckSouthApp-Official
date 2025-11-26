import { Tabs } from 'expo-router';
import React from 'react';

import TabBar from '@/components/tab-bar';
import { TabBarProvider } from '@/contexts/tab-bar-context';

export default function TabLayout() {
  return (
    <TabBarProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <TabBar {...props} />}>
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
      </Tabs>
    </TabBarProvider>
  );
}
