import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TOPICS = [
  { id: '1', title: 'Greetings & Basics', emoji: '👋', wordCount: 10, color: '#4F46E5' },
  { id: '2', title: 'Numbers & Time', emoji: '🔢', wordCount: 15, color: '#7C3AED' },
  { id: '3', title: 'Food & Restaurant', emoji: '🍜', wordCount: 20, color: '#DB2777' },
  { id: '4', title: 'Transport & Directions', emoji: '🚇', wordCount: 12, color: '#059669' },
  { id: '5', title: 'University Life', emoji: '🎓', wordCount: 18, color: '#D97706' },
];

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Clairo</Text>
        <Text style={styles.subtitle}>Learn Chinese your way</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Topics</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>75</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Day Streak 🔥</Text>
        </View>
      </View>

      {/* Topics List */}
      <Text style={styles.sectionTitle}>Topics</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[styles.topicCard, { borderLeftColor: topic.color }]}
            onPress={() => router.push('/flashcard')}
          >
            <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            <View style={styles.topicInfo}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicMeta}>{topic.wordCount} words</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  topicCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  topicEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topicMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
});