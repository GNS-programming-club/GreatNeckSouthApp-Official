import { Text } from '@react-navigation/elements';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const CourseDescriptions = () => {
  return (
    <SafeAreaView>
      <Text style={{fontWeight: 700, fontSize: 30, marginLeft: 10}}>Course Descriptions Page</Text>
    </SafeAreaView>
  )
}

export default CourseDescriptions