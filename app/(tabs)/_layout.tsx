// app/(tabs)/_layout.tsx
import { TabBarProvider } from '@/contexts/tab-bar-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// ---- Custom TabBar Component ----
function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        height: 60,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isFocused ? '#e0e0e0' : '#fff',
            }}
          >
            <Text style={{ color: isFocused ? '#007aff' : '#222' }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---- Main Layout ----
export default function TabLayout() {
  return (
    <TabBarProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <TabBar {...props} />}
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
          name="courses"
          options={{
            title: 'Courses',
          }}
        />
      </Tabs>
    </TabBarProvider>
  );
}
