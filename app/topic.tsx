import ActivityCard from '@/components/practice/ActivityCard';
import PracticeHero from '@/components/practice/PracticeHero';
import { useAppTheme } from '@/lib/AppThemeContext';
import { getCache, setCache } from '@/lib/cache';
import { buildActivities } from '@/lib/activity-config';
import { useLanguage } from '@/lib/LanguageContext';
import { pushRecentTopic } from '@/lib/recent-topics';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TopicScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { palette, fonts } = useAppTheme();
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#4F46E5';
  const styles = createStyles(palette, fonts);

  const cacheKey = `word_count_${topicId}`;
  const [wordCount, setWordCount] = useState<number>(getCache<number>(cacheKey) ?? 0);
  const [loading, setLoading] = useState(getCache<number>(cacheKey) === null);

  useEffect(() => {
    pushRecentTopic(String(topicId));

    const cached = getCache<number>(cacheKey);
    if (cached !== null) {
      setWordCount(cached);
      setLoading(false);

      supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId)
        .then(({ count }) => {
          if (count !== null) {
            setWordCount(count);
            setCache(cacheKey, count);
          }
        });
      return;
    }

    supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .then(({ count }) => {
        const n = count || 0;
        setWordCount(n);
        setCache(cacheKey, n);
        setLoading(false);
      });
  }, [cacheKey, topicId]);

  const activities = buildActivities({ t, baseColor: color, mode: 'topic' });

  const handleActivity = (activityId: string, route: '/flashcard' | '/quiz' | '/sentence' | '/stroke', minWords: number) => {
    if (wordCount < minWords) {
      alert(activityId === 'quiz' ? t.add4Words : t.addWordsFromAdmin);
      return;
    }
    const params = { topicId, topicTitle, topicColor };
    router.push({ pathname: route, params });
  };

  return (
    <View style={styles.container}>
      <PracticeHero
        title={String(topicTitle)}
        subtitle={t.topicPracticeSummary}
        backgroundChar={(topicTitle as string)?.[0] || '中'}
        accentColor={color}
        badges={[loading ? '...' : `${wordCount} ${t.words}`, t.fourModes]}
      />

      <Text style={styles.sectionLabel}>{t.chooseActivity}</Text>

      <View style={styles.grid}>
        {activities.map((activity) => {
          const locked = wordCount < activity.minWords;

          return (
            <ActivityCard
              key={activity.id}
              color={activity.color}
              icon={activity.icon}
              title={activity.title}
              subtitle={activity.subtitle}
              locked={locked}
              tag={locked ? `${activity.minWords}+` : undefined}
              onPress={() => handleActivity(activity.id, activity.route, activity.minWords)}
            />
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (palette: any, fonts: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: 20, paddingTop: 60 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.textMuted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 12,
      fontFamily: fonts.mono,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
  });
