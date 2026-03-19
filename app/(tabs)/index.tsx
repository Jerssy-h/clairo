import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

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

  const recentTopic = topics.find(t => t.known_count > 0) || topics[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.appName}>Clairo</Text>
        </View>

        {/* Continue Card */}
        {recentTopic && (
          <TouchableOpacity
            style={[styles.continueCard, { backgroundColor: recentTopic.color }]}
            onPress={() => router.push({
              pathname: '/topic',
              params: {
                topicId: recentTopic.id,
                topicTitle: recentTopic.title,
                topicColor: recentTopic.color,
                topicEmoji: recentTopic.emoji,
              }
            })}
            activeOpacity={0.85}
          >
            <View style={styles.continueCardOverlay}>
              <Text style={styles.continueLabel}>CONTINUE LEARNING</Text>
              <Text style={styles.continueEmoji}>{recentTopic.emoji}</Text>
              <Text style={styles.continueTitle}>{recentTopic.title}</Text>
              <Text style={styles.continueMeta}>{recentTopic.known_count}/{recentTopic.word_count} words known</Text>
              <View style={styles.continueProgressBar}>
                <View style={[styles.continueProgressFill, {
                  width: recentTopic.word_count > 0
                    ? `${Math.round((recentTopic.known_count / recentTopic.word_count) * 100)}%`
                    : '0%'
                }]} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Row */}
        {topics.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalKnown}</Text>
              <Text style={styles.statLabel}>Words Learned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{overallProgress}%</Text>
              <Text style={styles.statLabel}>Overall Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{topics.length}</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
          </View>
        )}

        {/* Topics Grid */}
        <Text style={styles.sectionTitle}>All Topics</Text>

        {loading ? (
          <ActivityIndicator color="#1DB954" size="large" style={{ marginTop: 40 }} />
        ) : topics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No topics yet</Text>
            <Text style={styles.emptySubtext}>Add your first topic from the Admin panel</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {topics.map((topic) => {
              const progress = topic.word_count > 0
                ? Math.round((topic.known_count / topic.word_count) * 100)
                : 0;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.gridCard, { backgroundColor: topic.color + '33' }]}
                  onPress={() => router.push({
                    pathname: '/topic',
                    params: {
                      topicId: topic.id,
                      topicTitle: topic.title,
                      topicColor: topic.color,
                      topicEmoji: topic.emoji,
                    }
                  })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.gridCardAccent, { backgroundColor: topic.color }]} />
                  <Text style={styles.gridEmoji}>{topic.emoji}</Text>
                  <Text style={styles.gridTitle}>{topic.title}</Text>
                  <Text style={styles.gridMeta}>{topic.word_count} words</Text>
                  <View style={styles.gridProgressBar}>
                    <View style={[styles.gridProgressFill, {
                      width: `${progress}%`,
                      backgroundColor: topic.color,
                    }]} />
                  </View>
                  <Text style={[styles.gridPercent, { color: topic.color }]}>{progress}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scroll: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  continueCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    height: 180,
  },
  continueCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 20,
    justifyContent: 'flex-end',
  },
  continueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 8,
    position: 'absolute',
    top: 20,
    left: 20,
  },
  continueEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  continueTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  continueMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  continueProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  continueProgressFill: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#B3B3B3',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  gridCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 8,
    marginTop: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gridMeta: {
    fontSize: 12,
    color: '#B3B3B3',
    marginBottom: 10,
  },
  gridProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 6,
  },
  gridProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  gridPercent: {
    fontSize: 12,
    fontWeight: '700',
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
    color: '#B3B3B3',
    textAlign: 'center',
  },
});