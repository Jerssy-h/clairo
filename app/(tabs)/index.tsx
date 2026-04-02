import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';
import { UpdateChecker } from '@/components/UpdateChecker';
import { AppPalette } from '@/constants/theme';
import { isAdmin } from '@/lib/auth';
import { initDB } from '@/lib/db';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchAndCacheTopics, getLocalTopics } from '@/lib/offline-topics';
import { getRecentTopicIds } from '@/lib/recent-topics';
import { syncAllData } from '@/lib/sync';
import { getUsername, syncUsernameToSupabase } from '@/lib/user';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

const getGreetingChinese = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

let splashShown = false;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [isReady, setIsReady] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentTopicIds, setRecentTopicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [username, setUsernameState] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      try {
        await initDB();

        const [admin, name] = await Promise.all([isAdmin(), getUsername()]);
        setAdminMode(admin);
        if (name) {
          setUsernameState(name);
          syncUsernameToSupabase(name);
        }

        setIsReady(true);

        syncAllData().then(() => loadDashboard());

        if (!splashShown) {
          splashShown = true;
          setTimeout(() => router.replace('/splash'), 50);
        }

        Animated.timing(enterAnim, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }).start();
      } catch (e) {
        console.error('Ошибка инициализации:', e);
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!isReady) return;

    try {
      const local = await getLocalTopics();
      if (local && local.length > 0) {
        setTopics(local);
        setLoading(false);
      }

      const recentIds = await getRecentTopicIds();
      setRecentTopicIds(recentIds || []);

      const fresh = await fetchAndCacheTopics();
      if (fresh && fresh.length > 0) {
        setTopics(fresh);
      }
    } catch (err) {
      console.log('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const totalWords = topics.reduce((sum, tp) => sum + (tp.word_count || 0), 0);
  const totalKnown = topics.reduce((sum, tp) => sum + (tp.known_count || 0), 0);
  const overallProgress = totalWords > 0 ? Math.round((totalKnown / totalWords) * 100) : 0;

  const greeting =
    new Date().getHours() < 12
      ? t.goodMorning
      : new Date().getHours() < 18
      ? t.goodAfternoon
      : t.goodEvening;

  const topicMap = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);

  const recentTopics = useMemo(
    () =>
      recentTopicIds
        .map((id) => topicMap.get(id))
        .filter((topic): topic is Topic => Boolean(topic))
        .slice(0, 3),
    [recentTopicIds, topicMap]
  );

  const recommendations = useMemo(() => {
    const started = topics.filter((topic) => topic.known_count > 0 && topic.known_count < topic.word_count);
    const unstarted = topics.filter((topic) => topic.known_count === 0);
    return [
      ...started.sort(
        (a, b) =>
          a.known_count / Math.max(a.word_count, 1) - b.known_count / Math.max(b.word_count, 1)
      ),
      ...unstarted,
    ].slice(0, 2);
  }, [topics]);

  const openTopic = (topic: Topic) => {
    router.push({
      pathname: '/topic',
      params: {
        topicId: topic.id,
        topicTitle: topic.title,
        topicColor: topic.color,
        topicEmoji: topic.emoji,
      },
    });
  };

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={AppPalette.textSoft} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View
          style={[
            styles.headerCard,
            {
              opacity: enterAnim,
              transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => adminMode && router.push('/admin')}
              activeOpacity={adminMode ? 0.7 : 1}
              style={styles.avatarWrapper}>
              <Logo size={46} />
            </TouchableOpacity>

            <View style={styles.headerGreeting}>
              {username ? <Text style={styles.username}>{username}</Text> : null}
              <Text style={styles.greetingRow}>
                <Text style={styles.greetingChinese}>{getGreetingChinese()} </Text>
                <Text style={styles.greetingEn}>· {greeting}</Text>
              </Text>
            </View>

            <LanguagePicker />
          </View>

          <View style={styles.divider} />

          <View style={styles.progressRow}>
            <View style={styles.progressLeft}>
              <Text style={styles.progressLabel}>{t.overallProgress}</Text>
              <Text style={styles.progressSub}>
                {totalKnown} {t.wordsLearned}
              </Text>
            </View>
            <View style={styles.progressRight}>
              <Text style={styles.progressPercent}>{overallProgress}%</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.recentTopics}</Text>
          <TouchableOpacity onPress={() => router.push('/topics')}>
            <Text style={styles.sectionAction}>{t.seeAll}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.sectionBody}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonCard} />
            ))}
          </View>
        ) : recentTopics.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t.noRecentPractice}</Text>
            <Text style={styles.emptyText}>{t.noRecentPracticeHint}</Text>
          </View>
        ) : (
          <View style={styles.sectionBody}>
            {recentTopics.map((topic) => {
              const progress = topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;
              const remaining = Math.max(topic.word_count - topic.known_count, 0);

              return (
                <TouchableOpacity key={topic.id} style={styles.recentCard} onPress={() => openTopic(topic)} activeOpacity={0.86}>
                  <View style={[styles.topicDot, { backgroundColor: topic.color || AppPalette.tintStrong }]} />
                  <View style={styles.recentHeaderRow}>
                    <Text style={styles.recentEmoji}>{topic.emoji || '学'}</Text>
                    <Text style={styles.recentPercent}>{progress}%</Text>
                  </View>
                  <Text style={styles.recentTitle}>{topic.title}</Text>
                  <Text style={styles.recentMeta}>
                    {remaining} {t.left} · {topic.word_count} {t.words}
                  </Text>
                  <View style={styles.topicBarBg}>
                    <View style={[styles.topicBarFill, { width: `${progress}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.recommendations}</Text>
        </View>

        {loading ? (
          <View style={styles.sectionBody}>
            {[1, 2].map((item) => (
              <View key={item} style={styles.skeletonCard} />
            ))}
          </View>
        ) : recommendations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t.noTopicsYet}</Text>
            <Text style={styles.emptyText}>{t.addFirstTopic}</Text>
          </View>
        ) : (
          <View style={styles.sectionBody}>
            {recommendations.map((topic, index) => {
              const progress = topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;
              return (
                <TouchableOpacity key={topic.id} style={styles.recommendationCard} onPress={() => openTopic(topic)} activeOpacity={0.85}>
                  <View style={styles.recommendationCopy}>
                    <Text style={styles.recommendationLabel}>
                      {index === 0 ? t.bestNextStep : t.alsoWorthReviewing}
                    </Text>
                    <Text style={styles.recommendationTitle}>{topic.title}</Text>
                    <Text style={styles.recommendationText}>
                      {progress === 0 ? t.startTopicHint : t.progressDoneHint(progress)}
                    </Text>
                  </View>
                  <View style={styles.recommendationBadge}>
                    <Text style={styles.recommendationBadgeText}>{progress}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <UpdateChecker />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppPalette.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingTop: 52, paddingBottom: 48 },
  headerCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: AppPalette.bgElevated,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrapper: { borderRadius: 12, overflow: 'hidden' },
  headerGreeting: { flex: 1 },
  username: { fontSize: 15, fontWeight: '700', color: AppPalette.text, marginBottom: 2 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  greetingChinese: { fontSize: 13, fontWeight: '600', color: AppPalette.textSoft },
  greetingEn: { fontSize: 12, color: AppPalette.textMuted },
  divider: { height: 1, backgroundColor: AppPalette.border, marginVertical: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  progressLeft: { flex: 1 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: AppPalette.textSoft },
  progressSub: { fontSize: 11, color: AppPalette.textMuted, marginTop: 2 },
  progressRight: { alignItems: 'flex-end', gap: 6 },
  progressPercent: { fontSize: 20, fontWeight: '700', color: AppPalette.text },
  progressBarBg: {
    width: 110,
    height: 5,
    backgroundColor: AppPalette.surfaceSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: 5, borderRadius: 3, backgroundColor: AppPalette.tintStrong },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: AppPalette.text },
  sectionAction: { color: AppPalette.tint, fontSize: 13, fontWeight: '600' },
  sectionBody: { paddingHorizontal: 20, gap: 12, marginBottom: 28 },
  skeletonCard: { height: 110, borderRadius: 18, backgroundColor: AppPalette.bgElevated },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: AppPalette.bgElevated,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AppPalette.text, marginBottom: 6 },
  emptyText: { fontSize: 13, lineHeight: 20, color: AppPalette.textMuted },
  recentCard: {
    minHeight: 116,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: AppPalette.bgElevated,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  topicDot: { position: 'absolute', right: 14, top: 14, width: 10, height: 10, borderRadius: 5, opacity: 0.75 },
  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentEmoji: { fontSize: 24 },
  recentPercent: { fontSize: 13, fontWeight: '700', color: AppPalette.textSoft },
  recentTitle: { fontSize: 20, fontWeight: '700', color: AppPalette.text, marginBottom: 6 },
  recentMeta: { fontSize: 12, color: AppPalette.textMuted, marginBottom: 12 },
  topicBarBg: { height: 4, backgroundColor: AppPalette.surfaceSoft, borderRadius: 99, overflow: 'hidden' },
  topicBarFill: { height: 4, backgroundColor: AppPalette.tintStrong, borderRadius: 99 },
  recommendationCard: {
    backgroundColor: AppPalette.bgElevated,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: AppPalette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recommendationCopy: { flex: 1 },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppPalette.textFaint,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  recommendationTitle: { fontSize: 17, fontWeight: '700', color: AppPalette.text, marginBottom: 4 },
  recommendationText: { fontSize: 13, lineHeight: 20, color: AppPalette.textMuted },
  recommendationBadge: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: AppPalette.surface,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  recommendationBadgeText: { fontSize: 16, fontWeight: '700', color: AppPalette.text },
});