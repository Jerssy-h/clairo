import ActivityCard from '@/components/practice/ActivityCard';
import PracticeHero from '@/components/practice/PracticeHero';
import { buildActivities } from '@/lib/activity-config';
import { useAppTheme } from '@/lib/AppThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ActiveRecallScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { palette, fonts } = useAppTheme();
  const color = '#4F46E5';
  const [wordCount, setWordCount] = useState(0);
  const styles = createStyles(palette, fonts);

  useEffect(() => {
    supabase.from('words').select('*', { count: 'exact', head: true }).then(({ count }) => setWordCount(count || 0));
  }, []);

  const title = t.activeRecall;
  const activities = buildActivities({ t, baseColor: color, mode: 'all-words' });

  const handleActivity = (route: '/flashcard' | '/quiz' | '/sentence' | '/stroke', minWords: number) => {
    if (wordCount < minWords) return;
    const params = { allWords: '1', topicTitle: title, topicColor: color };
    router.push({ pathname: route, params });
  };

  return (
    <View style={styles.container}>
      <PracticeHero
        title={title}
        subtitle={t.randomEveryRun}
        backgroundChar="学"
        accentColor={color}
        badges={[`${wordCount} ${t.words}`, t.fourModes, t.randomEveryRun]}
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
              onPress={() => handleActivity(activity.route, activity.minWords)}
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  });
