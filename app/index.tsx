import { Redirect } from 'expo-router';

export default function Index() {
  // always land in the tabbed home screen (index)
  return <Redirect href="/(tabs)" />;
}
