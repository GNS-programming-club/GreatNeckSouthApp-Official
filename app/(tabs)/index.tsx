import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome to Great Neck South!</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Get Started</Text>
          <Text style={styles.text}>
            This is your home screen. Start building your app here!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Next Steps</Text>
          <Text style={styles.text}>
            Add your app's features, screens, and functionality.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  titleContainer: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});