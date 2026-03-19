import { getCache, setCache } from '@/lib/cache';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
};

export default function FlashcardScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#4F46E5';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [finished, setFinished] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [answering, setAnswering] = useState(false);

  useEffect(() => {
    setup();
  }, []);

  const setup = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    fetchWords();
  };

  const fetchWords = async () => {
    const cacheKey = `words_${topicId}`;
    const cached = getCache<Word[]>(cacheKey);
    if (cached) {
      setWords(cached);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('topic_id', topicId);
    if (error) console.error(error);
    else {
      setWords(data || []);
      setCache(cacheKey, data || []);
    }
    setLoading(false);
  };

  const saveProgress = async (wordId: string, isKnown: boolean) => {
    if (!deviceId) return;
    const { error } = await supabase.from('progress').upsert({
      device_id: deviceId,
      word_id: wordId,
      known: isKnown,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id,word_id' });
    if (error) console.error(error.message);
  };

  const handleNext = async (didKnow: boolean) => {
    if (answering) return;
    setAnswering(true);
    const currentWord = words[index];
    await saveProgress(currentWord.id, didKnow);
    if (didKnow) setKnown(k => k + 1);
    else setUnknown(u => u + 1);
    if (index === words.length - 1) {
      setFinished(true);
    } else {
      setIndex(i => i + 1);
      setFlipped(false);
    }
    setAnswering(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={[color, color + '88', '#0D0D0D']} style={styles.center}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </LinearGradient>
    );
  }

  if (words.length === 0) {
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
        <Text style={styles.decorChar}>学</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.noWordsInTopic}</Text>
          <Text style={styles.emptySubtext}>{t.addWordsFromAdmin}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {t.goBack}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (finished) {
    const total = known + unknown;
    const percentage = total > 0 ? Math.round((known / total) * 100) : 0;
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
        <Text style={styles.finishedEmoji}>
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.finishedTitle}>{t.sessionComplete}</Text>
        <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{known}</Text>
            <Text style={styles.resultLabel}>{t.known}</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{unknown}</Text>
            <Text style={styles.resultLabel}>{t.review}</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{percentage}%</Text>
            <Text style={styles.resultLabel}>{t.score}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: color }]}
          onPress={() => router.back()}
        >
          <Text style={styles.actionBtnText}>{t.backToTopics}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const card = words[index];
  const progress = ((index + 1) / words.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[color + 'CC', color + '44', '#0D0D0D']}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.bgChar}>{card.chinese[0]}</Text>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicTitle}</Text>
          <Text style={styles.progressText}>{index + 1} / {words.length}</Text>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{known}</Text>
          <Text style={styles.scoreLabel}>✓</Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={() => setFlipped(f => !f)}
        activeOpacity={0.95}
      >
        <View style={styles.cardInner}>
          {!flipped ? (
            <>
              <Text style={styles.cardChinese}>{card.chinese}</Text>
              <Text style={[styles.cardPinyin, { color }]}>{card.pinyin}</Text>
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>{t.tapToReveal}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardChinese}>{card.chinese}</Text>
              <Text style={[styles.cardPinyin, { color }]}>{card.pinyin}</Text>
              <View style={styles.dividerLine} />
              <Text style={styles.cardEnglish}>{card.english}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnAgain}
            onPress={() => handleNext(false)}
            disabled={answering}
          >
            <Text style={styles.btnAgainText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnKnow, { backgroundColor: color }]}
            onPress={() => handleNext(true)}
            disabled={answering}
          >
            <Text style={styles.btnKnowText}>✓</Text>
          </TouchableOpacity>
        </View>
      )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bgChar: {
    position: 'absolute',
    fontSize: 320,
    color: 'rgba(255,255,255,0.04)',
    fontWeight: '900',
    top: height * 0.1,
    alignSelf: 'center',
    lineHeight: 340,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
  },
  topicName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  cardChinese: {
    fontSize: 80,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  cardPinyin: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  tapHint: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tapHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 8,
  },
  cardEnglish: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  btnAgain: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnAgainText: {
    color: '#FF4444',
    fontSize: 28,
    fontWeight: '800',
  },
  btnKnow: {
    flex: 1,
    borderRadius: 28,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnKnowText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  decorChar: {
    fontSize: 120,
    color: 'rgba(255,255,255,0.15)',
    fontWeight: '900',
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 24,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  finishedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  finishedSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 30,
  },
  resultsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  resultBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 90,
  },
  resultNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionBtn: {
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});