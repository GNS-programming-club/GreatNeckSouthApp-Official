import React from 'react';
import { Text } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';

const calendar = () => {
  return (
    <SafeAreaView>
      <Text style={{fontWeight: 700, fontSize: 30, marginLeft: 10}}>Calendar page</Text>
    </SafeAreaView>
  )
}

export default calendar