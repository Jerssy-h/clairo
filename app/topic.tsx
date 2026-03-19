import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TopicScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { topicId, topicTitle, topicColor, topicEmoji } = useLocalSearchParams();
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWordCount();
  }, []);

  const fetchWordCount = async () => {
    const { count } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);
    setWordCount(count || 0);
    setLoading(false);
  };

  const activities = [
    {
      id: 'flashcard',
      emoji: '📚',
      title: t.flashcards,
      description: t.flipToLearn,
      color: '#4F46E5',
      minWords: 1,
    },
    {
      id: 'quiz',
      emoji: '🧠',
      title: t.quiz,
      description: t.multipleChoice,
      color: '#7C3AED',
      minWords: 4,
    },
    {
      id: 'sentence',
      emoji: '🧩',
      title: t.sentenceBuilder,
      description: t.arrangeWords,
      color: '#059669',
      minWords: 1,
    },
  ];

  const handleActivity = (activityId: string, minWords: number) => {
    if (wordCount < minWords) {
      alert(activityId === 'quiz' ? t.add4Words : t.addWordsFromAdmin);
      return;
    }
    if (activityId === 'flashcard') {
      router.push({ pathname: '/flashcard', params: { topicId, topicTitle } });
    } else if (activityId === 'quiz') {
      router.push({ pathname: '/quiz', params: { topicId, topicTitle } });
    } else if (activityId === 'sentence') {
      router.push({ pathname: '/sentence', params: { topicId, topicTitle } });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>{t.back}</Text>
      </TouchableOpacity>

      <View style={[styles.hero, { borderLeftColor: topicColor as string }]}>
        <Text style={styles.heroEmoji}>{topicEmoji}</Text>
        <Text style={styles.heroTitle}>{topicTitle}</Text>
        {loading ? (
          <ActivityIndicator color="#888" size="small" />
        ) : (
          <Text style={styles.heroMeta}>{wordCount} {t.words}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t.chooseActivity}</Text>
      <View style={styles.activitiesContainer}>
        {activities.map((activity) => {
          const locked = wordCount < activity.minWords;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[styles.activityCard, locked && styles.activityLocked]}
              onPress={() => handleActivity(activity.id, activity.minWords)}
            >
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '22' }]}>
                <Text style={styles.activityEmoji}>{activity.emoji}</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
              </View>
              {locked ? (
                <Text style={styles.lockIcon}>🔒</Text>
              ) : (
                <Text style={styles.arrow}>→</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  hero: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    borderLeftWidth: 4,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroMeta: {
    fontSize: 15,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  activitiesContainer: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activityLocked: {
    opacity: 0.5,
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: {
    fontSize: 26,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  activityDescription: {
    fontSize: 13,
    color: '#888',
  },
  lockIcon: {
    fontSize: 18,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
});