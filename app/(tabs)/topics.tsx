import { useAppTheme } from '@/lib/AppThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchAndCacheTopics, getLocalTopics } from '@/lib/offline-topics';
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

type SortMode = 'default' | 'title' | 'progress';

const TOPIC_CHARS = ['你', '学', '会', '说', '写', '读', '听', '问', '答', '懂'];
const CARD_GRADIENTS = [
  ['#20C997', '#11A7D9'],
  ['#FF8A3D', '#FF4F7B'],
  ['#7C5CFF', '#19C2FF'],
  ['#FFD166', '#F97316'],
  ['#30E3CA', '#4F46E5'],
  ['#FF6B6B', '#F8B400'],
] as const;

const titleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const getTopicProgress = (topic: Topic) =>
  topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;

const normalizeHex = (value?: string) => {
  if (!value) return '#19A7CE';
  const raw = value.replace('#', '').trim();
  if (raw.length === 3) return `#${raw.split('').map((char) => char + char).join('')}`;
  return raw.length === 6 ? `#${raw}` : '#19A7CE';
};

const blendHex = (hex: string, target: string, amount: number) => {
  const source = normalizeHex(hex).replace('#', '');
  const blend = normalizeHex(target).replace('#', '');
  const mix = (start: number, end: number) => Math.round(start + (end - start) * amount);

  const r = mix(parseInt(source.slice(0, 2), 16), parseInt(blend.slice(0, 2), 16));
  const g = mix(parseInt(source.slice(2, 4), 16), parseInt(blend.slice(2, 4), 16));
  const b = mix(parseInt(source.slice(4, 6), 16), parseInt(blend.slice(4, 6), 16));

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

export default function TopicsTabScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { palette, fonts, isDark } = useAppTheme();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const enterAnim = useRef(new Animated.Value(0)).current;
  const styles = createStyles(palette, fonts, isDark);

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
      enterAnim.setValue(0);
      Animated.spring(enterAnim, {
        toValue: 1,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }).start();
    }, [enterAnim, fetchTopics])
  );

  const sortedTopics = useMemo(() => {
    const items = [...topics];
    if (sortMode === 'title') {
      return items.sort((a, b) => titleCollator.compare(a.title, b.title));
    }
    if (sortMode === 'progress') {
      return items.sort((a, b) => {
        const progressDiff = getTopicProgress(b) - getTopicProgress(a);
        return progressDiff || titleCollator.compare(a.title, b.title);
      });
    }
    return items;
  }, [sortMode, topics]);

  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: 'default', label: language === 'ru' ? 'Порядок' : 'Order' },
    { mode: 'title', label: language === 'ru' ? 'Название' : 'Name' },
    { mode: 'progress', label: language === 'ru' ? 'Прогресс' : 'Progress' },
  ];
  const selectedSortLabel = sortOptions.find((option) => option.mode === sortMode)?.label ?? sortOptions[0].label;
  const totalWords = sortedTopics.reduce((sum, topic) => sum + (topic.word_count || 0), 0);
  const totalKnown = sortedTopics.reduce((sum, topic) => sum + (topic.known_count || 0), 0);
  const totalProgress = totalWords > 0 ? Math.round((totalKnown / totalWords) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: enterAnim,
              transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#223052', '#102A43'] : ['#FFFFFF', '#EAF9FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.heroBubble}>学</Text>
          <Text style={styles.heroEyebrow}>{t.browse}</Text>
          <Text style={styles.heroTitle}>{t.topics}</Text>
          <Text style={styles.heroText}>{t.topicsTabHint}</Text>

          <View style={styles.heroStats}>
            <View style={[styles.heroStat, { backgroundColor: '#20C997' }]}>
              <Text style={styles.heroStatValue}>{sortedTopics.length}</Text>
              <Text style={styles.heroStatLabel}>{t.total}</Text>
            </View>
            <View style={[styles.heroStat, { backgroundColor: '#FF8A3D' }]}>
              <Text style={styles.heroStatValue}>{totalWords}</Text>
              <Text style={styles.heroStatLabel}>{t.words}</Text>
            </View>
            <View style={[styles.heroStat, { backgroundColor: '#7C5CFF' }]}>
              <Text style={styles.heroStatValue}>{totalProgress}%</Text>
              <Text style={styles.heroStatLabel}>{t.done}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t.topics}</Text>
            <Text style={styles.sectionCount}>{sortedTopics.length} {t.total}</Text>
          </View>

          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterOpen((open) => !open)}
              activeOpacity={0.84}
            >
              <Text style={styles.filterButtonText}>{selectedSortLabel}</Text>
              <Text style={styles.filterChevron}>{filterOpen ? '↑' : '↓'}</Text>
            </TouchableOpacity>

            {filterOpen ? (
              <View style={styles.filterMenu}>
                {sortOptions.map((option) => {
                  const active = option.mode === sortMode;

                  return (
                    <TouchableOpacity
                      key={option.mode}
                      style={[styles.filterMenuItem, active && styles.filterMenuItemActive]}
                      onPress={() => {
                        setSortMode(option.mode);
                        setFilterOpen(false);
                      }}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.filterMenuText, active && styles.filterMenuTextActive]}>
                        {option.label}
                      </Text>
                      {active ? <Text style={styles.filterCheck}>✓</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.topicsGrid}>
            {[1, 2, 3].map((item, index) => (
              <View key={item} style={[styles.skeletonCard, { backgroundColor: CARD_GRADIENTS[index][0] }]} />
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
              const char = topic.emoji || TOPIC_CHARS[index % TOPIC_CHARS.length];
              const remaining = Math.max(topic.word_count - topic.known_count, 0);
              const fallback = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              const baseColor = normalizeHex(topic.color);
              const cardColors = topic.color
                ? [blendHex(baseColor, fallback[0], 0.35), blendHex(baseColor, fallback[1], 0.55)]
                : [...fallback];

              return (
                <Animated.View
                  key={topic.id}
                  style={{
                    opacity: enterAnim,
                    transform: [
                      {
                        scale: enterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.97, 1],
                        }),
                      },
                      {
                        translateY: enterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18 + index * 3, 0],
                        }),
                      },
                    ],
                  }}
                >
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
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={cardColors as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.cardShine} />
                    <Text style={styles.bgChar}>{TOPIC_CHARS[index % TOPIC_CHARS.length]}</Text>
                    <View style={styles.topicContent}>
                      <View style={styles.topicTopRow}>
                        <View style={styles.topicIcon}>
                          <Text style={styles.topicIconText}>{char}</Text>
                        </View>
                        <View style={styles.topicPctBadge}>
                          <Text style={styles.topicPctText}>{progress}%</Text>
                        </View>
                      </View>

                      <View>
                        <Text style={styles.topicTitle}>{topic.title}</Text>
                        <Text style={styles.topicMeta}>{topic.word_count} {t.words}</Text>
                      </View>

                      <View>
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

const createStyles = (palette: any, fonts: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg },
    scroll: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 48 },
    hero: {
      borderRadius: 30,
      overflow: 'hidden',
      padding: 22,
      marginBottom: 26,
      borderWidth: 1,
      borderColor: palette.border,
    },
    heroBubble: {
      position: 'absolute',
      right: -6,
      top: -26,
      fontSize: 150,
      color: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(25,167,206,0.12)',
      fontFamily: fonts.rounded,
      fontWeight: '900',
      lineHeight: 180,
    },
    heroEyebrow: {
      alignSelf: 'flex-start',
      overflow: 'hidden',
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
      color: '#122033',
      fontSize: 11,
      fontFamily: fonts.rounded,
      fontWeight: '900',
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 14,
    },
    heroTitle: { fontSize: 38, fontFamily: fonts.rounded, fontWeight: '900', color: palette.text, marginBottom: 8 },
    heroText: { fontSize: 15, lineHeight: 22, color: palette.textSoft, fontFamily: fonts.sans, maxWidth: '88%' },
    heroStats: { flexDirection: 'row', gap: 10, marginTop: 22 },
    heroStat: {
      flex: 1,
      minHeight: 76,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 12,
      justifyContent: 'space-between',
      shadowColor: '#122033',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 3,
    },
    heroStatValue: { color: '#FFFFFF', fontSize: 22, fontFamily: fonts.rounded, fontWeight: '900' },
    heroStatLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontFamily: fonts.rounded, fontWeight: '800' },
    sectionHeader: {
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      zIndex: 10,
    },
    sectionTitle: { fontSize: 21, color: palette.text, fontFamily: fonts.rounded, fontWeight: '900' },
    sectionCount: { marginTop: 3, fontSize: 13, color: palette.textMuted, fontFamily: fonts.sans, fontWeight: '700' },
    filterWrap: {
      position: 'relative',
      alignItems: 'flex-end',
      flexShrink: 0,
      zIndex: 20,
    },
    filterButton: {
      minHeight: 42,
      borderRadius: 16,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: palette.bgElevated,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      shadowColor: '#122033',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
    filterButtonText: {
      color: palette.text,
      fontSize: 12,
      fontFamily: fonts.rounded,
      fontWeight: '900',
    },
    filterChevron: {
      color: palette.tint,
      fontSize: 13,
      fontFamily: fonts.rounded,
      fontWeight: '900',
    },
    filterMenu: {
      position: 'absolute',
      top: 48,
      right: 0,
      width: 168,
      borderRadius: 18,
      padding: 6,
      backgroundColor: palette.bgElevated,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      shadowColor: '#122033',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 8,
      zIndex: 30,
    },
    filterMenuItem: {
      minHeight: 40,
      borderRadius: 13,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    filterMenuItemActive: {
      backgroundColor: palette.surface,
    },
    filterMenuText: {
      color: palette.textSoft,
      fontSize: 12,
      fontFamily: fonts.rounded,
      fontWeight: '800',
    },
    filterMenuTextActive: {
      color: palette.text,
      fontWeight: '900',
    },
    filterCheck: {
      color: palette.tint,
      fontSize: 13,
      fontFamily: fonts.rounded,
      fontWeight: '900',
    },
    topicsGrid: { gap: 14 },
    topicCard: {
      borderRadius: 28,
      overflow: 'hidden',
      minHeight: 188,
      shadowColor: '#122033',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 4,
    },
    cardShine: {
      position: 'absolute',
      left: -30,
      top: -50,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.20)',
    },
    bgChar: {
      position: 'absolute',
      right: -8,
      bottom: -18,
      fontSize: 150,
      color: 'rgba(255,255,255,0.14)',
      fontFamily: fonts.rounded,
      fontWeight: '900',
      lineHeight: 168,
    },
    topicContent: { flex: 1, padding: 18, justifyContent: 'space-between', gap: 16 },
    topicTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    topicIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.24)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    topicIconText: { fontSize: 25, fontFamily: fonts.rounded, fontWeight: '900' },
    topicPctBadge: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.24)',
    },
    topicPctText: { color: '#FFFFFF', fontSize: 13, fontFamily: fonts.rounded, fontWeight: '900' },
    topicTitle: { fontSize: 25, fontFamily: fonts.rounded, fontWeight: '900', color: '#FFFFFF' },
    topicMeta: { marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.82)', fontFamily: fonts.sans, fontWeight: '700' },
    topicBarBg: { height: 9, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' },
    topicBarFill: { height: 9, backgroundColor: '#FFFFFF', borderRadius: 999 },
    topicBottomRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topicRemaining: { fontSize: 12, color: 'rgba(255,255,255,0.78)', fontFamily: fonts.rounded, fontWeight: '800' },
    topicLastStudied: { fontSize: 12, color: '#FFFFFF', fontFamily: fonts.rounded, fontWeight: '900' },
    skeletonCard: { height: 188, borderRadius: 28, opacity: 0.45 },
    emptyState: {
      alignItems: 'center',
      padding: 28,
      borderRadius: 28,
      backgroundColor: palette.bgElevated,
      borderWidth: 1,
      borderColor: palette.border,
    },
    emptyChar: { fontSize: 82, color: palette.tint, fontFamily: fonts.rounded, fontWeight: '900', marginBottom: 12 },
    emptyText: { fontSize: 20, fontFamily: fonts.rounded, fontWeight: '900', color: palette.text, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: palette.textMuted, fontFamily: fonts.sans, textAlign: 'center', lineHeight: 21 },
  });
