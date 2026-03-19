import Logo from '@/components/Logo';
import { isAdmin } from '@/lib/auth';
import { getCache, setCache } from '@/lib/cache';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
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

export default function HomeScreen() {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [showLearned, setShowLearned] = useState(false);
  const [learnedWords, setLearnedWords] = useState<any[]>([]);
  const [loadingLearned, setLoadingLearned] = useState(false);

  useEffect(() => {
    isAdmin().then(setAdminMode);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTopics();
    }, [])
  );

  const fetchTopics = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCache<Topic[]>('topics');
      if (cached) {
        setTopics(cached);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    const { data, error } = await supabase.from('topics_with_count').select('*');
    if (error) console.error(error);
    else {
      setTopics(data || []);
      setCache('topics', data || []);
    }
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => adminMode && router.push('/admin')}
            activeOpacity={adminMode ? 0.7 : 1}
          >
            <Logo size={44} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.greetingChinese}>{getGreetingChinese()}</Text>
            <Text style={styles.greetingEn}>
              {language === 'en'
                ? new Date().getHours() < 12 ? 'Good morning'
                  : new Date().getHours() < 18 ? 'Good afternoon'
                  : 'Good evening'
                : new Date().getHours() < 12 ? 'Доброе утро'
                  : new Date().getHours() < 18 ? 'Добрый день'
                  : 'Добрый вечер'
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{language === 'en' ? '🇷🇺' : '🇬🇧'}</Text>
          </TouchableOpacity>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>0</Text>
          </View>
        </View>

        {/* Overall Progress Card */}
        {topics.length > 0 && (
          <TouchableOpacity
            style={styles.overallCard}
            onPress={() => {
              setShowLearned(true);
              fetchLearnedWords();
            }}
            activeOpacity={0.85}
          >
            <View style={styles.overallTop}>
              <Text style={styles.overallTitle}>{t.overallProgress}</Text>
              <Text style={styles.overallPercent}>{overallProgress}%</Text>
            </View>
            <View style={styles.overallBarBg}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.overallBarFill, { width: `${overallProgress}%` }]}
              />
            </View>
            <Text style={styles.overallSub}>
              {totalKnown} {t.wordsLearned}
            </Text>
          </TouchableOpacity>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.topics}</Text>
          <Text style={styles.sectionCount}>{topics.length} {t.total}</Text>
        </View>

        {/* Topics */}
        {loading ? (
          <View style={styles.topicsGrid}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.skeletonCard} />
            ))}
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
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.topicCard}
                  onPress={() => router.push({
                    pathname: '/topic',
                    params: {
                      topicId: topic.id,
                      topicTitle: topic.title,
                      topicColor: topic.color,
                      topicEmoji: topic.emoji,
                    }
                  })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[topic.color, topic.color + 'AA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.topicGradient}
                  />
                  <Text style={styles.bgChar}>{char}</Text>
                  <View style={styles.topicContent}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicMeta}>{topic.word_count} {t.words}</Text>
                    <View style={styles.topicProgressBg}>
                      <View style={[styles.topicProgressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.topicPercent}>{progress}{t.complete}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
                <Text style={{ color: '#888', textAlign: 'center' }}>{t.loading}</Text>
              </View>
            ) : learnedWords.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📚</Text>
                <Text style={{ color: '#888', fontSize: 15 }}>{t.noWordsYet}</Text>
                <Text style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
                  {t.completeFlashcards}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {learnedWords.map((item, i) => (
                  <View key={i} style={styles.learnedRow}>
                    <Text style={styles.learnedChinese}>{item.words?.chinese}</Text>
                    <View style={styles.learnedInfo}>
                      <Text style={styles.learnedEnglish} numberOfLines={1} ellipsizeMode="tail">
                        {item.words?.english}
                      </Text>
                      <Text style={styles.learnedPinyin} numberOfLines={1}>
                        {item.words?.pinyin}
                      </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  headerCenter: {
    flex: 1,
  },
  greetingChinese: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  greetingEn: {
    fontSize: 13,
    color: '#888',
    marginTop: 1,
  },
  langBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langBtnText: {
    fontSize: 18,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overallCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  overallTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overallTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overallPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4F46E5',
  },
  overallBarBg: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: 8,
    borderRadius: 4,
  },
  overallSub: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionCount: {
    fontSize: 13,
    color: '#666',
  },
  topicsGrid: {
    paddingHorizontal: 20,
    gap: 14,
  },
  topicCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 140,
  },
  topicGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bgChar: {
    position: 'absolute',
    right: -10,
    bottom: -20,
    fontSize: 140,
    color: 'rgba(255,255,255,0.08)',
    fontWeight: '900',
    lineHeight: 160,
  },
  topicContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  topicMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  topicProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 4,
  },
  topicProgressFill: {
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  topicPercent: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  skeletonCard: {
    height: 140,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyChar: {
    fontSize: 80,
    color: '#2A2A2A',
    fontWeight: '900',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalClose: {
    fontSize: 18,
    color: '#888',
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  learnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  learnedChinese: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 48,
    maxWidth: 80,
    textAlign: 'center',
  },
  learnedInfo: {
    flex: 1,
  },
  learnedEnglish: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  learnedPinyin: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 2,
  },
  learnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnedBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});