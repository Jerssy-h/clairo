import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function TopicScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { topicId, topicTitle, topicColor, topicEmoji } = useLocalSearchParams();
  const color = (topicColor as string) || '#4F46E5';
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
      title: t.flashcards,
      description: t.flipToLearn,
      color: '#4F46E5',
      accentColor: '#6366F1',
      icon: '卡',
      minWords: 1,
    },
    {
      id: 'quiz',
      title: t.quiz,
      description: t.multipleChoice,
      color: '#7C3AED',
      accentColor: '#8B5CF6',
      icon: '测',
      minWords: 4,
    },
    {
      id: 'sentence',
      title: t.sentenceBuilder,
      description: t.arrangeWords,
      color: '#059669',
      accentColor: '#10B981',
      icon: '句',
      minWords: 1,
    },
  ];

  const handleActivity = (activityId: string, minWords: number) => {
    if (wordCount < minWords) {
      alert(activityId === 'quiz' ? t.add4Words : t.addWordsFromAdmin);
      return;
    }
    if (activityId === 'flashcard') {
      router.push({ pathname: '/flashcard', params: { topicId, topicTitle, topicColor } });
    } else if (activityId === 'quiz') {
      router.push({ pathname: '/quiz', params: { topicId, topicTitle, topicColor } });
    } else if (activityId === 'sentence') {
      router.push({ pathname: '/sentence', params: { topicId, topicTitle, topicColor } });
    }
  };

  return (
    <View style={styles.container}>
      {/* Full background gradient */}
      <LinearGradient
        colors={[color + 'CC', color + '44', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Giant background character */}
      <Text style={styles.bgChar}>{(topicTitle as string)?.[0] || '中'}</Text>

      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{topicTitle}</Text>
        {loading ? (
          <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" />
        ) : (
          <View style={styles.heroMeta}>
            <View style={[styles.metaBadge, { backgroundColor: color + '44' }]}>
              <Text style={styles.metaBadgeText}>{wordCount} {t.words}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Activities */}
      <Text style={styles.sectionLabel}>{t.chooseActivity}</Text>
      <View style={styles.activitiesContainer}>
        {activities.map((activity) => {
          const locked = wordCount < activity.minWords;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[styles.activityCard, locked && styles.activityLocked]}
              onPress={() => handleActivity(activity.id, activity.minWords)}
              activeOpacity={0.85}
            >
              {/* Glass effect */}
              <View style={styles.activityCardInner}>
                {/* Left icon */}
                <LinearGradient
                  colors={[activity.color, activity.accentColor]}
                  style={styles.activityIconBox}
                >
                  <Text style={styles.activityIconText}>{activity.icon}</Text>
                </LinearGradient>

                {/* Info */}
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>

                {/* Right indicator */}
                {locked ? (
                  <View style={styles.lockBox}>
                    <Text style={styles.lockText}>🔒</Text>
                  </View>
                ) : (
                  <View style={[styles.arrowBox, { backgroundColor: activity.color + '33' }]}>
                    <Text style={[styles.arrowText, { color: activity.accentColor }]}>→</Text>
                  </View>
                )}
              </View>

              {/* Bottom accent line */}
              <View style={[styles.activityAccent, { backgroundColor: activity.color }]} />
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
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  bgChar: {
    position: 'absolute',
    fontSize: 320,
    color: 'rgba(255,255,255,0.04)',
    fontWeight: '900',
    top: height * 0.05,
    alignSelf: 'center',
    lineHeight: 340,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  hero: {
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metaBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  activitiesContainer: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  activityCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  activityLocked: {
    opacity: 0.4,
  },
  activityIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
  },
  lockBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  arrowBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '700',
  },
  activityAccent: {
    height: 2,
    opacity: 0.6,
  },
});