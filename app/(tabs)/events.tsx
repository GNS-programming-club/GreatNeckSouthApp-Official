import { Text } from '@react-navigation/elements';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const Events = () => {
  return (
    <SafeAreaView>
      <Text style={{fontWeight: 700, fontSize: 30, marginLeft: 10}}>Events Page</Text>
    </SafeAreaView>
  )
}

export default Events