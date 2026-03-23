import { AppPalette } from '@/constants/theme';
import { getCache, setCache } from '@/lib/cache';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
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

const blendHex = (hex: string, target: string, amount: number) => {
  const normalize = (value: string) => {
    const raw = value.replace('#', '');
    return raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  };

  const source = normalize(hex);
  const blend = normalize(target);
  const mix = (start: number, end: number) => Math.round(start + (end - start) * amount);

  const r = mix(parseInt(source.slice(0, 2), 16), parseInt(blend.slice(0, 2), 16));
  const g = mix(parseInt(source.slice(2, 4), 16), parseInt(blend.slice(2, 4), 16));
  const b = mix(parseInt(source.slice(4, 6), 16), parseInt(blend.slice(4, 6), 16));

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

export default function TopicsTabScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const enterAnim = useRef(new Animated.Value(0)).current;

  const fetchTopics = useCallback(async () => {
    const cached = getCache<Topic[]>('topics');
    if (cached) {
      setTopics(cached);
      setLoading(false);
    }

    const { data, error } = await supabase.from('topics_with_count').select('*');
    if (error) {
      console.error(error);
    } else {
      const nextTopics = data || [];
      setTopics(nextTopics);
      setCache('topics', nextTopics);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTopics();
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 420,
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
          <Text style={styles.sectionCount}>{sortedTopics.length} {t.total}</Text>
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
              const topicBase = blendHex(topic.color, AppPalette.bgElevated, 0.55);
              const topicShade = blendHex(topic.color, AppPalette.bg, 0.75);
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
                    activeOpacity={0.85}>
                    <LinearGradient
                      colors={[topicBase, topicShade]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.bgChar}>{char}</Text>
                    <View style={styles.topicContent}>
                      <View style={styles.topicTopRow}>
                        <View style={styles.topicWordBadge}>
                          <Text style={styles.topicWordBadgeText}>{topic.word_count} {t.words}</Text>
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
                        <Text style={styles.topicRemaining}>
                          {remaining > 0 ? `${remaining} ${t.left}` : t.done}
                        </Text>
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
    color: AppPalette.accentSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: AppPalette.text, marginBottom: 8 },
  heroText: { fontSize: 14, lineHeight: 22, color: AppPalette.textMuted },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sectionCount: { fontSize: 13, color: AppPalette.textFaint },
  topicsGrid: { paddingHorizontal: 20, gap: 12 },
  topicCard: { borderRadius: 24, overflow: 'hidden', height: 164 },
  bgChar: {
    position: 'absolute',
    right: -8,
    bottom: -16,
    fontSize: 148,
    color: 'rgba(255,255,255,0.12)',
    fontWeight: '900',
    lineHeight: 168,
  },
  topicContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  topicTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  topicWordBadge: {
    backgroundColor: 'rgba(11,16,32,0.22)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicWordBadgeText: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '600' },
  topicPctBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicPctText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  topicTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  topicBarBg: { height: 3, backgroundColor: AppPalette.topicTrack, borderRadius: 2, overflow: 'hidden' },
  topicBarFill: { height: 3, backgroundColor: '#FFFFFF', borderRadius: 2 },
  topicBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicRemaining: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  topicLastStudied: { fontSize: 11, color: 'rgba(255,255,255,0.72)' },
  skeletonCard: { height: 164, borderRadius: 24, backgroundColor: AppPalette.bgElevated },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyChar: { fontSize: 80, color: AppPalette.surfaceSoft, fontWeight: '900', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: AppPalette.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: AppPalette.textMuted, textAlign: 'center' },
});