import Logo from '@/components/Logo';
import { AppPalette } from '@/constants/theme';
import { isAdmin } from '@/lib/auth';
import { getCache, setCache } from '@/lib/cache';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getUsername, syncUsernameToSupabase } from '@/lib/user';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

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


// Track if we already showed splash this session
let _splashShown = false;

export default function HomeScreen() {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [username, setUsernameState] = useState('');
  const [showLearned, setShowLearned] = useState(false);
  const [learnedWords, setLearnedWords] = useState<any[]>([]);
  const [loadingLearned, setLoadingLearned] = useState(false);
  const enterAnim = useRef(new Animated.Value(0)).current;
  const ctaPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!_splashShown) {
      _splashShown = true;
      // Defer navigation until after root layout is mounted
      const timer = setTimeout(() => {
        router.replace('/splash');
      }, 50);
      return () => clearTimeout(timer);
    }
    isAdmin().then(setAdminMode);
    getUsername().then((n) => {
      const resolved = n || '';
      setUsernameState(resolved);
      if (resolved) syncUsernameToSupabase(resolved);
    });
  }, []);

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ctaPulseAnim]);

  useFocusEffect(useCallback(() => { fetchTopics(); }, []));

  const fetchTopics = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCache<Topic[]>('topics');
      if (cached) { setTopics(cached); setLoading(false); return; }
    }
    setLoading(true);
    const { data, error } = await supabase.from('topics_with_count').select('*');
    if (error) console.error(error);
    else { setTopics(data || []); setCache('topics', data || []); }
    setLoading(false);
  };

  const fetchLearnedWords = async () => {
    setLoadingLearned(true);
    const deviceId = await getDeviceId();
    const { data } = await supabase
      .from('progress')
      .select('word_id, known, words(chinese, pinyin, english)')
      .eq('device_id', deviceId)
      .eq('known', true);
    setLearnedWords(data || []);
    setLoadingLearned(false);
  };

  const totalWords = topics.reduce((sum, t) => sum + t.word_count, 0);
  const totalKnown = topics.reduce((sum, t) => sum + t.known_count, 0);
  const overallProgress = totalWords > 0 ? Math.round((totalKnown / totalWords) * 100) : 0;

  const greeting = language === 'en'
    ? (new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening')
    : (new Date().getHours() < 12 ? 'Доброе утро' : new Date().getHours() < 18 ? 'Добрый день' : 'Добрый вечер');

  // First topic for CTA
  const firstTopic = topics[0] ?? null;
  const firstProgress = firstTopic && firstTopic.word_count > 0
    ? Math.round((firstTopic.known_count / firstTopic.word_count) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── HEADER CARD ── */}
        <Animated.View
          style={[
            styles.headerCard,
            {
              opacity: enterAnim,
              transform: [
                {
                  translateY: enterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.headerTop}>

            {/* Panda avatar — taps to admin if admin device */}
            <TouchableOpacity
              onPress={() => adminMode && router.push('/admin')}
              activeOpacity={adminMode ? 0.7 : 1}
              style={styles.avatarWrapper}
            >
              <Logo size={46} />
            </TouchableOpacity>

            {/* Name + greeting */}
            <View style={styles.headerGreeting}>
              {username ? (
                <Text style={styles.username}>{username}</Text>
              ) : null}
              <Text style={styles.greetingRow}>
                <Text style={styles.greetingChinese}>{getGreetingChinese()} </Text>
                <Text style={styles.greetingEn}>· {greeting}</Text>
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnLabel}>{language === 'en' ? 'RU' : 'EN'}</Text>
            </TouchableOpacity>
            <View style={styles.streakBadge}>
              <View style={styles.flameOuter} />
              <View style={styles.flameInner} />
              <Text style={styles.streakText}>0</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Progress row */}
          {topics.length > 0 && (
            <TouchableOpacity
              style={styles.progressRow}
              onPress={() => { setShowLearned(true); fetchLearnedWords(); }}
              activeOpacity={0.8}
            >
              <View style={styles.progressLeft}>
                <Text style={styles.progressLabel}>{t.overallProgress}</Text>
                <Text style={styles.progressSub}>{totalKnown} {t.wordsLearned}</Text>
              </View>
              <View style={styles.progressRight}>
                <Text style={styles.progressPercent}>{overallProgress}%</Text>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={[AppPalette.tintStrong, AppPalette.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${overallProgress}%` }]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── SECTION HEADER ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.topics}</Text>
          <Text style={styles.sectionCount}>{topics.length} {t.total}</Text>
        </View>

        {/* ── TOPICS ── */}
        {loading ? (
          <View style={styles.topicsGrid}>
            {[1, 2].map(i => <View key={i} style={styles.skeletonCard} />)}
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyChar}>学</Text>
            <Text style={styles.emptyText}>{t.noTopicsYet}</Text>
            <Text style={styles.emptySubtext}>{t.addFirstTopic}</Text>
          </View>
        ) : (
          <View style={styles.topicsGrid}>
            {topics.map((topic, i) => {
              const progress = topic.word_count > 0
                ? Math.round((topic.known_count / topic.word_count) * 100)
                : 0;
              const char = TOPIC_CHARS[i % TOPIC_CHARS.length];
              const remaining = topic.word_count - topic.known_count;
              const topicBase = blendHex(topic.color, AppPalette.bgElevated, 0.55);
              const topicShade = blendHex(topic.color, AppPalette.bg, 0.75);
              return (
                <Animated.View
                  key={topic.id}
                  style={{
                    opacity: enterAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                    transform: [
                      {
                        translateY: enterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18 + i * 5, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={styles.topicCard}
                    onPress={() => router.push({
                      pathname: '/topic',
                      params: { topicId: topic.id, topicTitle: topic.title, topicColor: topic.color, topicEmoji: topic.emoji },
                    })}
                    activeOpacity={0.85}
                    >
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
                          {remaining > 0
                            ? `${remaining} ${language === 'ru' ? 'осталось' : 'left'}`
                            : language === 'ru' ? '✓ Готово' : '✓ Done'}
                        </Text>
                        <Text style={styles.topicLastStudied}>
                          {language === 'ru' ? 'Сегодня' : 'Today'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── CTA — shows where you left off ── */}
        {!loading && firstTopic && (
          <Animated.View
            style={{
              transform: [
                {
                  translateY: ctaPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -2],
                  }),
                },
                {
                  scale: ctaPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.01],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push({
                pathname: '/topic',
                params: { topicId: firstTopic.id, topicTitle: firstTopic.title, topicColor: firstTopic.color, topicEmoji: firstTopic.emoji },
              })}
              activeOpacity={0.85}
            >
              <View style={styles.ctaLeft}>
                <Text style={styles.ctaLabel}>
                  {language === 'ru' ? 'Продолжить' : 'Continue'}
                </Text>
                <Text style={styles.ctaTopicName} numberOfLines={1}>{firstTopic.title}</Text>
                {/* Mini progress bar */}
                <View style={styles.ctaBarBg}>
                  <LinearGradient
                    colors={[
                      blendHex(firstTopic.color, AppPalette.bgElevated, 0.55),
                      blendHex(firstTopic.color, AppPalette.bg, 0.76),
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.ctaBarFill, { width: `${firstProgress}%` }]}
                  />
                </View>
              </View>
              <View style={styles.ctaRight}>
                <Text style={styles.ctaPct}>{firstProgress}%</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>

      {/* Learned Words Modal */}
      <Modal visible={showLearned} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.wordsLearnedTitle}</Text>
              <TouchableOpacity onPress={() => setShowLearned(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{totalKnown} {t.wordsMasteredSoFar}</Text>
            {loadingLearned ? (
              <View style={{ paddingVertical: 40 }}>
                <Text style={{ color: AppPalette.textMuted, textAlign: 'center' }}>{t.loading}</Text>
              </View>
            ) : learnedWords.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: AppPalette.textMuted, fontSize: 15 }}>{t.noWordsYet}</Text>
                <Text style={{ color: AppPalette.textFaint, fontSize: 13, marginTop: 4 }}>{t.completeFlashcards}</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {learnedWords.map((item, i) => (
                  <View key={i} style={styles.learnedRow}>
                    <Text style={styles.learnedChinese}>{item.words?.chinese}</Text>
                    <View style={styles.learnedInfo}>
                      <Text style={styles.learnedEnglish} numberOfLines={1}>{item.words?.english}</Text>
                      <Text style={styles.learnedPinyin} numberOfLines={1}>{item.words?.pinyin}</Text>
                    </View>
                    <View style={styles.learnedBadge}>
                      <Text style={styles.learnedBadgeText}>✓</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppPalette.bg },
  scroll: { paddingTop: 52, paddingBottom: 48 },

  // Header
  headerCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: AppPalette.bgElevated,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: AppPalette.border,
    shadowColor: '#050814',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerGreeting: { flex: 1 },
  username: {
    fontSize: 15,
    fontWeight: '800',
    color: AppPalette.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  greetingChinese: { fontSize: 13, fontWeight: '700', color: AppPalette.text },
  greetingEn: { fontSize: 12, color: AppPalette.textMuted },

  langBtn: {
    backgroundColor: AppPalette.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: AppPalette.borderStrong,
  },
  langBtnLabel: { fontSize: 11, fontWeight: '800', color: AppPalette.text, letterSpacing: 1 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppPalette.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: AppPalette.borderStrong,
    position: 'relative',
  },
  flameOuter: { width: 10, height: 13, borderRadius: 5, backgroundColor: AppPalette.warning },
  flameInner: { position: 'absolute', left: 12, bottom: 8, width: 5, height: 7, borderRadius: 3, backgroundColor: AppPalette.accentSoft },
  streakText: { fontSize: 12, fontWeight: '700', color: AppPalette.text },

  divider: { height: 1, backgroundColor: AppPalette.border, marginVertical: 14 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  progressLeft: { flex: 1 },
  progressLabel: { fontSize: 13, fontWeight: '700', color: AppPalette.text },
  progressSub: { fontSize: 11, color: AppPalette.textMuted, marginTop: 2 },
  progressRight: { alignItems: 'flex-end', gap: 6 },
  progressPercent: { fontSize: 20, fontWeight: '800', color: AppPalette.accentSoft },
  progressBarBg: { width: 110, height: 5, backgroundColor: AppPalette.surfaceSoft, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 5, borderRadius: 3 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: AppPalette.text },
  sectionCount: { fontSize: 13, color: AppPalette.textFaint },

  // Topic cards
  topicsGrid: { paddingHorizontal: 20, gap: 12 },
  topicCard: { borderRadius: 24, overflow: 'hidden', height: 164 },
  bgChar: {
    position: 'absolute', right: -8, bottom: -16,
    fontSize: 148, color: 'rgba(255,255,255,0.12)',
    fontWeight: '900', lineHeight: 168,
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
  topicLastStudied: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  skeletonCard: { height: 164, borderRadius: 24, backgroundColor: AppPalette.bgElevated },

  // CTA — shows where you left off
  ctaBtn: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: AppPalette.bgElevated,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: AppPalette.border,
  },
  ctaLeft: { flex: 1, gap: 4 },
  ctaLabel: { fontSize: 11, fontWeight: '700', color: AppPalette.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  ctaTopicName: { fontSize: 15, fontWeight: '800', color: AppPalette.text, letterSpacing: -0.3 },
  ctaBarBg: { height: 3, backgroundColor: AppPalette.surfaceSoft, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  ctaBarFill: { height: 3, borderRadius: 2 },
  ctaRight: { alignItems: 'center', gap: 4 },
  ctaPct: { fontSize: 13, fontWeight: '800', color: AppPalette.accentSoft },
  ctaArrow: { fontSize: 16, color: AppPalette.textMuted },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyChar: { fontSize: 80, color: AppPalette.surfaceSoft, fontWeight: '900', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: AppPalette.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: AppPalette.textMuted, textAlign: 'center', paddingHorizontal: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: AppPalette.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: AppPalette.bgElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: AppPalette.text },
  modalClose: { fontSize: 18, color: AppPalette.textMuted, padding: 4 },
  modalSub: { fontSize: 13, color: AppPalette.textMuted, marginBottom: 20 },
  learnedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppPalette.surface, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  learnedChinese: { fontSize: 22, fontWeight: '800', color: AppPalette.text, minWidth: 48, maxWidth: 80, textAlign: 'center' },
  learnedInfo: { flex: 1 },
  learnedEnglish: { fontSize: 15, fontWeight: '600', color: AppPalette.text },
  learnedPinyin: { fontSize: 12, color: AppPalette.accentSoft, marginTop: 2 },
  learnedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: AppPalette.tintStrong, alignItems: 'center', justifyContent: 'center' },
  learnedBadgeText: { color: AppPalette.white, fontSize: 13, fontWeight: '800' },
});