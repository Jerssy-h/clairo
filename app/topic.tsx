import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_SIZE = (width - 20 * 2 - 12) / 2;

export default function TopicScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#4F46E5';
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWordCount(); }, []);

  const fetchWordCount = async () => {
    const { count } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);
    setWordCount(count || 0);
    setLoading(false);
  };

  // Colors encode meaning — not random rainbow:
  // Blue  = Recognition (flashcard, quiz) — recall from input
  // Green = Production (sentence) — generate output
  // Amber = Writing (stroke) — physical skill
  const activities = [
    {
      id: 'flashcard',
      title: t.flashcards,
      subtitle: language === 'ru' ? 'Узнавание' : 'Recognition',
      icon: '卡',
      color: '#3B4FD4',
      minWords: 1,
    },
    {
      id: 'quiz',
      title: t.quiz,
      subtitle: language === 'ru' ? 'Проверка' : 'Testing',
      icon: '测',
      color: '#2D3BAA',
      minWords: 4,
    },
    {
      id: 'sentence',
      title: t.sentenceBuilder,
      subtitle: language === 'ru' ? 'Составление' : 'Production',
      icon: '句',
      color: '#166534',
      minWords: 1,
    },
    {
      id: 'stroke',
      title: language === 'ru' ? 'Пропись' : 'Strokes',
      subtitle: language === 'ru' ? 'Написание' : 'Writing',
      icon: '笔',
      color: '#92400E',
      minWords: 1,
    },
  ];

  const handleActivity = (activityId: string, minWords: number) => {
    if (wordCount < minWords) {
      alert(activityId === 'quiz' ? t.add4Words : t.addWordsFromAdmin);
      return;
    }
    const params = { topicId, topicTitle, topicColor };
    if (activityId === 'flashcard') router.push({ pathname: '/flashcard', params });
    else if (activityId === 'quiz') router.push({ pathname: '/quiz', params });
    else if (activityId === 'sentence') router.push({ pathname: '/sentence', params });
    else if (activityId === 'stroke') router.push({ pathname: '/stroke', params });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[color + 'CC', color + '33', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Watermark */}
      <Text style={styles.bgChar}>{(topicTitle as string)?.[0] || '中'}</Text>

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{topicTitle}</Text>
        {loading ? (
          <ActivityIndicator color="rgba(255,255,255,0.4)" size="small" />
        ) : (
          <View style={styles.heroMeta}>
            <View style={[styles.metaBadge, { backgroundColor: color + '44' }]}>
              <Text style={styles.metaBadgeText}>{wordCount} {t.words}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={styles.sectionLabel}>{t.chooseActivity}</Text>

      {/* 2×2 Grid */}
      <View style={styles.grid}>
        {activities.map((activity) => {
          const locked = wordCount < activity.minWords;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[styles.gridCard, { opacity: locked ? 0.4 : 1 }]}
              onPress={() => handleActivity(activity.id, activity.minWords)}
              activeOpacity={0.8}
            >
              {/* Background gradient */}
              <LinearGradient
                colors={[activity.color + 'EE', activity.color + '88']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Watermark icon */}
              <Text style={styles.cardBgIcon}>{activity.icon}</Text>

              {/* Content */}
              <View style={styles.cardContent}>
                {/* Big icon */}
                <Text style={styles.cardIcon}>{activity.icon}</Text>
                <Text style={styles.cardTitle}>{activity.title}</Text>
                <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>
              </View>

              {/* Lock overlay */}
              {locked && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
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
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  bgChar: {
    position: 'absolute',
    fontSize: 300,
    color: 'rgba(255,255,255,0.04)',
    fontWeight: '900',
    top: height * 0.04,
    alignSelf: 'center',
    lineHeight: 320,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  backArrow: { color: '#FFFFFF', fontSize: 18 },

  hero: { marginBottom: 32 },
  heroTitle: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginBottom: 10 },
  heroMeta: { flexDirection: 'row' },
  metaBadge: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  metaBadgeText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
  },

  // 2×2 grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBgIcon: {
    position: 'absolute',
    bottom: -16,
    right: -8,
    fontSize: 96,
    color: 'rgba(255,255,255,0.1)',
    fontWeight: '900',
    lineHeight: 110,
  },
  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
    gap: 4,
  },
  cardIcon: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lockIcon: { fontSize: 24 },
});