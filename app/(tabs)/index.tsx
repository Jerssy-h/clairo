import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Topic = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  word_count: number;
  known_count: number;
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
    const { data, error } = await supabase.from('topics_with_count').select('*');
    if (error) console.error(error);
    else setTopics(data || []);
    setLoading(false);
  };

  const totalWords = topics.reduce((sum, t) => sum + t.word_count, 0);
  const totalKnown = topics.reduce((sum, t) => sum + t.known_count, 0);
  const overallProgress = totalWords > 0 ? Math.round((totalKnown / totalWords) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好 👋</Text>
            <Text style={styles.appName}>Clairo</Text>
          </View>
        </View>

        {/* Overall Progress Card */}
        {topics.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressCardTop}>
              <View>
                <Text style={styles.progressCardTitle}>Overall Progress</Text>
                <Text style={styles.progressCardSub}>{totalKnown} of {totalWords} words learned</Text>
              </View>
              <Text style={styles.progressPercent}>{overallProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Topics */}
        <Text style={styles.sectionLabel}>TOPICS</Text>
        <View style={styles.topicsContainer}>
          {loading ? (
            <ActivityIndicator color="#0A84FF" size="large" style={{ marginTop: 40 }} />
          ) : topics.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No topics yet</Text>
              <Text style={styles.emptySubtext}>Add your first topic from the Admin panel</Text>
            </View>
          ) : (
            topics.map((topic, i) => {
              const progress = topic.word_count > 0
                ? Math.round((topic.known_count / topic.word_count) * 100)
                : 0;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    i === topics.length - 1 && styles.topicCardLast
                  ]}
                  onPress={() => router.push({
                    pathname: '/topic',
                    params: {
                      topicId: topic.id,
                      topicTitle: topic.title,
                      topicColor: topic.color,
                      topicEmoji: topic.emoji,
                    }
                  })}
                  activeOpacity={0.6}
                >
                  {/* Left emoji bubble */}
                  <View style={[styles.emojiBox, { backgroundColor: topic.color + '22' }]}>
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <View style={styles.miniProgressBar}>
                      <View style={[styles.miniProgressFill, {
                        width: `${progress}%`,
                        backgroundColor: topic.color,
                      }]} />
                    </View>
                    <Text style={styles.topicMeta}>{topic.known_count}/{topic.word_count} words</Text>
                  </View>

                  {/* Progress % + chevron */}
                  <View style={styles.topicRight}>
                    <Text style={[styles.topicPercent, { color: topic.color }]}>{progress}%</Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 15,
    color: '#888',
    marginBottom: 4,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 32,
  },
  progressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressCardSub: {
    fontSize: 13,
    color: '#888',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A84FF',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#0A84FF',
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  topicsContainer: {
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
    gap: 12,
  },
  topicCardLast: {
    borderBottomWidth: 0,
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicEmoji: {
    fontSize: 22,
  },
  topicInfo: {
    flex: 1,
    gap: 4,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  miniProgressBar: {
    height: 3,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
  },
  miniProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  topicMeta: {
    fontSize: 12,
    color: '#888',
  },
  topicRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  topicPercent: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: '#3A3A3C',
    fontWeight: '300',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});