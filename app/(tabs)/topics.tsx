import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAppTheme } from '@/lib/AppThemeContext';
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

export default function TopicsTabScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { palette, fonts, isDark } = useAppTheme();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
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

  const sortedTopics = useMemo(() => topics, [topics]);

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
          </View>

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
                const progress = topic.word_count > 0 ? Math.round((topic.known_count / topic.word_count) * 100) : 0;
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
    sectionHeader: { marginBottom: 12 },
    sectionLabel: { fontSize: 11, letterSpacing: 1.1, fontFamily: fonts.mono },
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
