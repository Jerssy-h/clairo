import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAppTheme } from '@/lib/AppThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { fetchAndCacheTopics, getLocalTopics } from '@/lib/offline-topics';
import { Ionicons } from '@expo/vector-icons';
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

const titleCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const getTopicProgress = (topic: Topic) =>
  topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;

export default function TopicsTabScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { palette, fonts, isDark } = useAppTheme();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const enterAnim = useRef(new Animated.Value(0)).current;
  const styles = createStyles(palette, fonts);

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
        duration: 420,
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

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Logo size={36} />
            <View>
              <Text style={[styles.brandTitle, { color: palette.text }]}>CLAIRO</Text>
              <Text style={[styles.brandMeta, { color: palette.textMuted }]}>
                {language === 'ru' ? 'темы и наборы слов' : 'topics and word sets'}
              </Text>
            </View>
          </View>
          <View style={styles.controls}>
            <ThemeToggle />
            <LanguagePicker />
          </View>
        </View>

        <Animated.View
          style={{
            opacity: enterAnim,
            transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <Text style={[styles.eyebrow, { color: palette.textMuted }]}>{t.browse.toUpperCase()}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t.topics}</Text>
          <Text style={[styles.copy, { color: palette.textSoft }]}>{t.topicsTabHint}</Text>

          <TouchableOpacity style={[styles.recallButton, { borderColor: palette.borderStrong, backgroundColor: palette.bgElevated }]} onPress={() => router.push('/active-recall')}>
            <Text style={[styles.recallButtonText, { color: palette.text }]}>{t.activeRecall}</Text>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{sortedTopics.length} {t.total}</Text>
            <View style={styles.filterWrap}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]}
                onPress={() => setFilterOpen((open) => !open)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterButtonText, { color: palette.text }]}>
                  {language === 'ru' ? 'Фильтр' : 'Filter'}
                </Text>
                <Ionicons name="settings-outline" size={15} color={palette.text} />
              </TouchableOpacity>

              {filterOpen ? (
                <View style={[styles.filterMenu, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]}>
                  {sortOptions.map((option) => {
                    const active = sortMode === option.mode;
                    return (
                      <TouchableOpacity
                        key={option.mode}
                        style={[styles.filterMenuItem, active && { backgroundColor: palette.surface }]}
                        onPress={() => {
                          setSortMode(option.mode);
                          setFilterOpen(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.filterMenuText, { color: active ? palette.text : palette.textMuted }]}>
                          {option.label}
                        </Text>
                        {active ? <Ionicons name="checkmark" size={15} color={palette.text} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          <Text style={[styles.activeFilterLabel, { color: palette.textMuted }]}>
            {language === 'ru' ? 'Сортировка:' : 'Sorted by:'} {selectedSortLabel}
          </Text>

          {loading ? (
            <View style={styles.grid}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={[styles.placeholder, { backgroundColor: palette.bgElevated, borderColor: palette.border }]} />
              ))}
            </View>
          ) : sortedTopics.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
              <Text style={[styles.emptyChar, { color: palette.textMuted }]}>C</Text>
              <Text style={[styles.emptyText, { color: palette.text }]}>{t.noTopicsYet}</Text>
              <Text style={[styles.emptySubtext, { color: palette.textMuted }]}>{t.addFirstTopic}</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {sortedTopics.map((topic, index) => {
                const progress = getTopicProgress(topic);
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
                            outputRange: [16 + index * 4, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.topicCard, { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong }]}
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
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.topicCardSymbol, { color: palette.textMuted }]}>{topic.emoji || 'C'}</Text>
                      <Text style={[styles.topicTitle, { color: palette.text }]}>{topic.title}</Text>
                      <View style={[styles.topicProgressTrack, { backgroundColor: palette.surfaceSoft }]}>
                        <View style={[styles.topicProgressFill, { width: `${progress}%`, backgroundColor: palette.text }]} />
                      </View>
                      <View style={styles.topicMetaRow}>
                        <Text style={[styles.topicMeta, { color: palette.textMuted }]}>{topic.word_count} {t.words}</Text>
                        <Text style={[styles.topicMeta, { color: palette.textMuted }]}>
                          {remaining > 0 ? `${remaining} ${t.left}` : t.done}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (palette: any, fonts: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 40 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    brandTitle: { fontSize: 14, letterSpacing: 2, fontFamily: fonts.mono, fontWeight: '700' },
    brandMeta: { fontSize: 10, letterSpacing: 1.1, fontFamily: fonts.mono, marginTop: 3 },
    controls: { flexDirection: 'row', gap: 8 },
    eyebrow: { fontSize: 11, letterSpacing: 1.4, fontFamily: fonts.mono, marginBottom: 12 },
    title: { fontSize: 32, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 12 },
    copy: { fontSize: 14, lineHeight: 24, fontFamily: fonts.mono, marginBottom: 20, maxWidth: '92%' },
    recallButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 22 },
    recallButtonText: { fontSize: 12, letterSpacing: 1, fontFamily: fonts.mono, fontWeight: '700' },
    sectionHeader: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, zIndex: 5 },
    sectionLabel: { fontSize: 11, letterSpacing: 1.1, fontFamily: fonts.mono },
    filterWrap: { position: 'relative', alignItems: 'flex-end' },
    filterButton: { minHeight: 38, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
    filterButtonText: { fontSize: 11, letterSpacing: 0.8, fontFamily: fonts.mono, fontWeight: '700', textTransform: 'uppercase' },
    filterMenu: { position: 'absolute', top: 44, right: 0, width: 168, borderWidth: 1, borderRadius: 14, padding: 4, zIndex: 20 },
    filterMenuItem: { minHeight: 38, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    filterMenuText: { fontSize: 11, letterSpacing: 0.6, fontFamily: fonts.mono, fontWeight: '700', textTransform: 'uppercase' },
    activeFilterLabel: { fontSize: 10, letterSpacing: 0.7, fontFamily: fonts.mono, marginBottom: 14 },
    grid: { gap: 12 },
    placeholder: { height: 124, borderRadius: 24, borderWidth: 1 },
    emptyState: { borderWidth: 1, borderRadius: 28, padding: 24, alignItems: 'center' },
    emptyChar: { fontSize: 58, fontFamily: fonts.mono, marginBottom: 16 },
    emptyText: { fontSize: 16, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 8 },
    emptySubtext: { fontSize: 13, lineHeight: 22, fontFamily: fonts.mono, textAlign: 'center' },
    topicCard: { borderWidth: 1, borderRadius: 24, padding: 18 },
    topicCardSymbol: { fontSize: 18, fontFamily: fonts.mono, marginBottom: 16 },
    topicTitle: { fontSize: 20, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 14 },
    topicProgressTrack: { height: 4, borderRadius: 999, overflow: 'hidden', marginBottom: 14 },
    topicProgressFill: { height: 4, borderRadius: 999 },
    topicMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topicMeta: { fontSize: 11, letterSpacing: 0.5, fontFamily: fonts.mono },
  });
