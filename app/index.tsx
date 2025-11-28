import { Redirect } from 'expo-router';

export default function Index() {
  // Always land in the tab-based home screen.
  return <Redirect href="/(tabs)" />;
}
