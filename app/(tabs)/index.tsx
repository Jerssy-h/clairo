import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { UpdateChecker } from '@/components/UpdateChecker';
import { useAppTheme } from '@/lib/AppThemeContext';
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

let splashShown = false;

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { palette, fonts, isDark } = useAppTheme();

  const [isReady, setIsReady] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentTopicIds, setRecentTopicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [username, setUsernameState] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;
  const styles = createStyles(palette, fonts);

  const loadDashboardData = useCallback(async () => {
    try {
      const local = await getLocalTopics();
      if (local?.length) {
        setTopics(local);
        setLoading(false);
      }

      const recentIds = await getRecentTopicIds();
      setRecentTopicIds(recentIds || []);

      const fresh = await fetchAndCacheTopics();
      if (fresh?.length) setTopics(fresh);
    } catch (err) {
      console.log('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!isReady) return;
    await loadDashboardData();
  }, [isReady, loadDashboardData]);

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
        syncAllData().then(() => loadDashboardData());

        if (!splashShown) {
          splashShown = true;
          setTimeout(() => router.replace('/splash'), 50);
        }

        Animated.timing(enterAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } catch (e) {
        console.error('Ошибка инициализации:', e);
        setIsReady(true);
      }
    }

    prepare();
  }, [enterAnim, loadDashboardData, router]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const totalWords = topics.reduce((sum, tp) => sum + (tp.word_count || 0), 0);
  const totalKnown = topics.reduce((sum, tp) => sum + (tp.known_count || 0), 0);
  const overallProgress = totalWords > 0 ? Math.round((totalKnown / totalWords) * 100) : 0;

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
    const started = topics.filter((item) => item.known_count > 0 && item.known_count < item.word_count);
    const unstarted = topics.filter((item) => item.known_count === 0);
    return [
      ...started.sort((a, b) => a.known_count / Math.max(a.word_count, 1) - b.known_count / Math.max(b.word_count, 1)),
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

  const heroName = username || (language === 'ru' ? 'ученик' : 'learner');
  const statLabels = {
    words: language === 'ru' ? 'СЛОВА' : 'WORDS',
    known: language === 'ru' ? 'ЗНАЮ' : 'KNOWN',
    progress: language === 'ru' ? 'ПРОГРЕСС' : 'PROGRESS',
  };

  if (!isReady) {
    return (
      <View style={[styles.loadingShell, { backgroundColor: palette.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator color={palette.text} size="small" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View
          style={[
            styles.shell,
            {
              opacity: enterAnim,
              transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.brand}>
              <TouchableOpacity onPress={() => adminMode && router.push('/admin')} activeOpacity={adminMode ? 0.7 : 1}>
                <Logo size={42} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.brandTitle, { color: palette.text }]}>CLAIRO</Text>
                <Text style={[styles.brandMeta, { color: palette.textMuted }]}>
                  {language === 'ru' ? 'labs' : 'labs'}
                </Text>
              </View>
            </View>
            <View style={styles.controls}>
              <ThemeToggle />
              <LanguagePicker />
            </View>
          </View>

          <View style={styles.heroBlock}>
            <Text style={[styles.heroTitle, { color: palette.text }]}>
              {language === 'ru'
                ? `Мы лаборатория изучения\nкитайского.`
                : `We are a Chinese\nlearning lab.`}
            </Text>
            <Text style={[styles.heroCopy, { color: palette.textSoft }]}>
              {language === 'ru'
                ? `Привет, ${heroName}. Открывай тему, запускай общий повтор и возвращайся к сложным словам.`
                : `Hi, ${heroName}. Open a topic, run active recall, and return to the words that need work.`}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>{statLabels.words}</Text>
              <Text style={[styles.statValue, { color: palette.text }]}>{totalWords}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>{statLabels.known}</Text>
              <Text style={[styles.statValue, { color: palette.text }]}>{totalKnown}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>{statLabels.progress}</Text>
              <Text style={[styles.statValue, { color: palette.text }]}>{overallProgress}%</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryPanel, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}
            onPress={() => router.push('/active-recall')}
            activeOpacity={0.85}
          >
            <Text style={[styles.panelEyebrow, { color: palette.textMuted }]}>◐ {t.activeRecall}</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>{t.activeRecallTitle}</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              {t.flashcards} · {t.quiz} · {t.sentenceBuilder} · {t.strokes}
            </Text>
          </TouchableOpacity>

          <SectionTitle label={t.recentTopics} action={t.seeAll} onPress={() => router.push('/topics')} palette={palette} fonts={fonts} />
          {loading ? (
            <View style={styles.placeholderWrap}>
              {[1, 2].map((item) => (
                <View key={item} style={[styles.placeholder, { borderColor: palette.border, backgroundColor: palette.bgElevated }]} />
              ))}
            </View>
          ) : recentTopics.length === 0 ? (
            <View style={[styles.emptyBlock, { borderColor: palette.border, backgroundColor: palette.bgElevated }]}>
              <Text style={[styles.emptyText, { color: palette.textSoft }]}>
                {t.noRecentPracticeHint}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {recentTopics.map((topic) => {
                const progress = topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[styles.topicRow, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}
                    onPress={() => openTopic(topic)}
                    activeOpacity={0.84}
                  >
                    <Text style={[styles.topicSymbol, { color: palette.text }]}>{topic.emoji || 'C'}</Text>
                    <View style={styles.topicCopy}>
                      <Text style={[styles.topicTitle, { color: palette.text }]}>{topic.title}</Text>
                      <Text style={[styles.topicMeta, { color: palette.textMuted }]}>
                        {topic.word_count} {t.words} · {progress}%
                      </Text>
                    </View>
                    <Text style={[styles.topicAction, { color: palette.textMuted }]}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <SectionTitle label={t.recommendations} palette={palette} fonts={fonts} />
          <View style={styles.list}>
            {recommendations.length === 0 ? (
              <View style={[styles.emptyBlock, { borderColor: palette.border, backgroundColor: palette.bgElevated }]}>
                <Text style={[styles.emptyText, { color: palette.textSoft }]}>{t.addFirstTopic}</Text>
              </View>
            ) : (
              recommendations.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.recommendation, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]}
                  onPress={() => openTopic(topic)}
                  activeOpacity={0.84}
                >
                  <Text style={[styles.recommendationTitle, { color: palette.text }]}>{topic.title}</Text>
                  <Text style={[styles.recommendationBody, { color: palette.textMuted }]}>
                    {topic.known_count === 0 ? t.startTopicHint : t.progressDoneHint(Math.round((topic.known_count / Math.max(topic.word_count, 1)) * 100))}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <UpdateChecker />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({
  label,
  action,
  onPress,
  palette,
  fonts,
}: {
  label: string;
  action?: string;
  onPress?: () => void;
  palette: { text: string; textMuted: string };
  fonts: { mono?: string; sans?: string; serif?: string; rounded?: string };
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 30 }}>
      <Text style={{ color: palette.text, fontFamily: fonts.mono, fontSize: 15, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      {action && onPress ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={{ color: palette.textMuted, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1 }}>{action.toUpperCase()}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (palette: any, fonts: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    loadingShell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 20, paddingTop: 54, paddingBottom: 44 },
    shell: { gap: 0 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      rowGap: 12,
      columnGap: 12,
    },
    brand: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexShrink: 1,
      minWidth: 0,
      flex: 1,
      paddingRight: 8,
    },
    brandTitle: { fontSize: 15, letterSpacing: 2.2, fontFamily: fonts.mono, fontWeight: '700' },
    brandMeta: { fontSize: 10, letterSpacing: 1.2, fontFamily: fonts.mono, marginTop: 3 },
    controls: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexShrink: 0,
      marginLeft: 'auto',
    },
    heroBlock: { paddingTop: 80, paddingBottom: 34 },
    heroTitle: { fontSize: 34, lineHeight: 44, fontFamily: fonts.mono, fontWeight: '500', marginBottom: 18 },
    heroCopy: { fontSize: 13, lineHeight: 22, fontFamily: fonts.mono, maxWidth: '82%' },
    statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    statCard: { flex: 1, minWidth: '30%', borderWidth: 1, borderRadius: 22, padding: 14 },
    statLabel: { fontSize: 10, letterSpacing: 1.2, fontFamily: fonts.mono, marginBottom: 10 },
    statValue: { fontSize: 24, fontFamily: fonts.mono, fontWeight: '600' },
    primaryPanel: { borderWidth: 1, borderRadius: 26, padding: 18, marginTop: 22 },
    panelEyebrow: { fontSize: 10, letterSpacing: 1.1, fontFamily: fonts.mono, marginBottom: 10 },
    panelTitle: { fontSize: 24, lineHeight: 31, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 8 },
    panelText: { fontSize: 11, lineHeight: 18, fontFamily: fonts.mono },
    placeholderWrap: { gap: 10 },
    placeholder: { height: 92, borderRadius: 22, borderWidth: 1 },
    emptyBlock: { borderWidth: 1, borderRadius: 22, padding: 18 },
    emptyText: { fontSize: 13, lineHeight: 22, fontFamily: fonts.mono },
    list: { gap: 10 },
    topicRow: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center' },
    topicSymbol: { width: 38, fontSize: 20, fontFamily: fonts.mono, fontWeight: '700' },
    topicCopy: { flex: 1 },
    topicTitle: { fontSize: 18, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 4 },
    topicMeta: { fontSize: 12, fontFamily: fonts.mono, lineHeight: 18 },
    topicAction: { fontSize: 16, fontFamily: fonts.mono },
    recommendation: { borderWidth: 1, borderRadius: 22, padding: 16 },
    recommendationTitle: { fontSize: 16, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 6 },
    recommendationBody: { fontSize: 12, lineHeight: 20, fontFamily: fonts.mono },
  });
