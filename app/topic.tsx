import { AppPalette } from '@/constants/theme';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchAndCacheTopics, getLocalTopics } from '@/lib/offline-topics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Topic = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  word_count: number;
  known_count: number;
};

const TOPIC_CHARS = ['你', '我', '好', '学', '中', '文', '说', '话', '读', '写'];

export default function TopicsTabScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const enterAnim = useRef(new Animated.Value(0)).current;

  const fetchTopics = useCallback(async () => {
    const local = getLocalTopics();
    if (local.length > 0) {
      setTopics(local);
      setLoading(false);
    }

    const fresh = await fetchAndCacheTopics();
    setTopics(fresh);

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTopics();
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [enterAnim, fetchTopics])
  );

  const sortedTopics = useMemo(() => topics, [topics]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{t.browse}</Text>
          <Text style={styles.heroTitle}>{t.topics}</Text>
          <Text style={styles.heroText}>{t.topicsTabHint}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionCount}>
            {sortedTopics.length} {t.total}
          </Text>
        </View>

        {loading ? (
          <View style={styles.topicsGrid}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonCard} />
            ))}
          </View>
        ) : sortedTopics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyChar}>学</Text>
            <Text style={styles.emptyText}>{t.noTopicsYet}</Text>
            <Text style={styles.emptySubtext}>{t.addFirstTopic}</Text>
          </View>
        ) : (
          <View style={styles.topicsGrid}>
            {sortedTopics.map((topic, index) => {
              const progress = topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;
              const char = TOPIC_CHARS[index % TOPIC_CHARS.length];
              const remaining = topic.word_count - topic.known_count;

              return (
                <Animated.View
                  key={topic.id}
                  style={{
                    opacity: enterAnim,
                    transform: [
                      {
                        translateY: enterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18 + index * 4, 0],
                        }),
                      },
                    ],
                  }}>
                  <TouchableOpacity
                    style={styles.topicCard}
                    onPress={() =>
                      router.push({
                        pathname: '/topic',
                        params: {
                          topicId: topic.id,
                          topicTitle: topic.title,
                          topicColor: topic.color,
                          topicEmoji: topic.emoji,
                        },
                      })
                    }
                    activeOpacity={0.9}>
                    <Text style={styles.bgChar}>{char}</Text>
                    <View style={[styles.topicStripe, { backgroundColor: topic.color || AppPalette.tintStrong }]} />

                    <View style={styles.topicContent}>
                      <View style={styles.topicTopRow}>
                        <View style={styles.topicWordBadge}>
                          <Text style={styles.topicWordBadgeText}>
                            {topic.word_count} {t.words}
                          </Text>
                        </View>
                        <View style={styles.topicPctBadge}>
                          <Text style={styles.topicPctText}>{progress}%</Text>
                        </View>
                      </View>

                      <Text style={styles.topicTitle}>{topic.title}</Text>

                      <View style={styles.topicBarBg}>
                        <View style={[styles.topicBarFill, { width: `${progress}%` }]} />
                      </View>

                      <View style={styles.topicBottomRow}>
                        <Text style={styles.topicRemaining}>{remaining > 0 ? `${remaining} ${t.left}` : t.done}</Text>
                        <Text style={styles.topicLastStudied}>{t.open}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppPalette.bg },
  scroll: { paddingTop: 52, paddingBottom: 48 },
  hero: { paddingHorizontal: 20, marginBottom: 24 },
  heroEyebrow: {
    fontSize: 12,
    color: AppPalette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 32, fontWeight: '800', color: AppPalette.text, marginBottom: 8 },
  heroText: { fontSize: 14, lineHeight: 22, color: AppPalette.textMuted },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sectionCount: { fontSize: 13, color: AppPalette.textFaint },
  topicsGrid: { paddingHorizontal: 20, gap: 12 },
  topicCard: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 150,
    borderWidth: 1,
    borderColor: AppPalette.border,
    backgroundColor: AppPalette.bgElevated,
  },
  topicStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, opacity: 0.75 },
  bgChar: {
    position: 'absolute',
    right: -2,
    bottom: -12,
    fontSize: 130,
    color: 'rgba(255,255,255,0.04)',
    fontWeight: '900',
    lineHeight: 148,
  },
  topicContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  topicTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  topicWordBadge: {
    backgroundColor: AppPalette.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  topicWordBadgeText: { color: AppPalette.textMuted, fontSize: 11, fontWeight: '600' },
  topicPctBadge: {
    backgroundColor: AppPalette.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  topicPctText: { color: AppPalette.textSoft, fontSize: 11, fontWeight: '700' },
  topicTitle: { fontSize: 22, fontWeight: '700', color: AppPalette.text, letterSpacing: -0.4 },
  topicBarBg: { height: 3, backgroundColor: AppPalette.surfaceSoft, borderRadius: 2, overflow: 'hidden' },
  topicBarFill: { height: 3, backgroundColor: AppPalette.tintStrong, borderRadius: 2 },
  topicBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicRemaining: { fontSize: 12, color: AppPalette.textMuted, fontWeight: '600' },
  topicLastStudied: { fontSize: 11, color: AppPalette.textFaint },
  skeletonCard: { height: 150, borderRadius: 18, backgroundColor: AppPalette.bgElevated },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyChar: { fontSize: 80, color: AppPalette.surfaceSoft, fontWeight: '900', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: AppPalette.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: AppPalette.textMuted, textAlign: 'center' },
});