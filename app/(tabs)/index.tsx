import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Topic = {
  id: string;
  title: string;
  emoji: string;
  color: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchTopics();
    }, [])
  );

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('topics').select('*');
    if (error) console.error(error);
    else setTopics(data || []);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Clairo</Text>
        <Text style={styles.subtitle}>Learn Chinese your way</Text>
      </View>

      {/* Topics List */}
      <Text style={styles.sectionTitle}>Topics</Text>

      {loading ? (
        <ActivityIndicator color="#4F46E5" size="large" style={{ marginTop: 40 }} />
      ) : topics.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No topics yet</Text>
          <Text style={styles.emptySubtext}>Add your first topic from the Admin panel</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicCard, { borderLeftColor: topic.color }]}
              onPress={() => router.push({ pathname: '/flashcard', params: { topicId: topic.id, topicTitle: topic.title } })}
            >
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <View style={styles.topicInfo}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  arrow: {
    fontSize: 18,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});