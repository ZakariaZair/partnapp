import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>PartNApp mobile</Text>
      <Text style={styles.title}>Trouve le bon partenaire pour lancer ton projet.</Text>
      <Text style={styles.body}>
        Version Expo iOS/Android. Le client web vit séparément dans apps/web.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24,
  },
  kicker: {
    color: '#14b8a6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 12,
  },
  body: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
});
