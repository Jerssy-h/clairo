import { clearCache, getCache, setCache } from '@/lib/cache';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height, width } = Dimensions.get('window');

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  russian?: string;
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

  // --- Animation refs ---
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    const { error } = await supabase.from('progress').upsert(
      {
        device_id: deviceId,
        word_id: wordId,
        known: isKnown,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id,word_id' }
    );
    if (error) console.error(error.message);
    clearCache('topics');
  };

  // Flip the card with 3D animation
  const handleFlip = () => {
    if (answering) return;
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
    setFlipped(f => !f);
  };

  // Slide card out to left/right, then reset and show next
  const handleNext = async (didKnow: boolean) => {
    if (answering) return;
    setAnswering(true);

    const currentWord = words[index];
    const slideDirection = didKnow ? width : -width;

    // Slide out + fade
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: slideDirection,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await saveProgress(currentWord.id, didKnow);
      if (didKnow) setKnown(k => k + 1);
      else setUnknown(u => u + 1);

      if (index === words.length - 1) {
        setFinished(true);
      } else {
        // Reset card state
        flipAnim.setValue(0);
        slideAnim.setValue(0);
        fadeAnim.setValue(0);
        setFlipped(false);
        setIndex(i => i + 1);

        // Slide in from opposite side
        slideAnim.setValue(-slideDirection * 0.3);
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      setAnswering(false);
    });
  };

  // Interpolations for 3D flip
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0.4, 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0.4, 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

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

      {/* Header */}
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

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]}
        />
      </View>

      {/* Animated card wrapper */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={handleFlip}
          activeOpacity={1}
        >
          {/* Front face */}
          <Animated.View
            style={[
              styles.cardFace,
              {
                transform: [{ rotateY: frontRotate }],
                opacity: frontOpacity,
              },
            ]}
          >
            <Text style={styles.cardLabel}>中文</Text>
            <Text style={styles.cardChinese}>{card.chinese}</Text>
            <Text style={[styles.cardPinyin, { color }]}>{card.pinyin}</Text>
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>{t.tapToReveal}</Text>
            </View>
          </Animated.View>

          {/* Back face */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              {
                transform: [{ rotateY: backRotate }],
                opacity: backOpacity,
              },
            ]}
          >
            <Text style={styles.cardLabel}>中文</Text>
            <Text style={styles.cardChinese}>{card.chinese}</Text>
            <Text style={[styles.cardPinyin, { color }]}>{card.pinyin}</Text>
            <View style={styles.dividerLine} />
            {/* Russian translation (primary) */}
            <Text style={styles.cardRussian}>{card.russian ?? card.english}</Text>
            {/* English translation (secondary) */}
            {card.russian && (
              <Text style={styles.cardEnglish}>{card.english}</Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Action buttons — always visible, grayed out until flipped */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.btnAgain,
            !flipped && styles.btnDisabled,
          ]}
          onPress={() => flipped && handleNext(false)}
          disabled={answering}
          activeOpacity={flipped ? 0.7 : 1}
        >
          <Text style={[styles.btnIcon, !flipped && styles.btnIconDisabled]}>✕</Text>
          <Text style={[styles.btnLabel, !flipped && styles.btnLabelDisabled]}>Ещё раз</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnKnow,
            { backgroundColor: flipped ? color : 'rgba(255,255,255,0.06)' },
          ]}
          onPress={() => flipped && handleNext(true)}
          disabled={answering}
          activeOpacity={flipped ? 0.7 : 1}
        >
          <Text style={[styles.btnIcon, !flipped && styles.btnIconDisabled]}>✓</Text>
          <Text style={[styles.btnLabel, !flipped && styles.btnLabelDisabled]}>Знаю</Text>
        </TouchableOpacity>
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

  // Header
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
  headerCenter: { flex: 1 },
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

  // Progress bar
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
  },

  // Card
  cardWrapper: {
    flex: 1,
    marginBottom: 20,
  },
  cardTouchable: {
    flex: 1,
  },
  cardFace: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backfaceVisibility: 'hidden',
    gap: 10,
  },
  cardBack: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardLabel: {
    position: 'absolute',
    top: 20,
    left: 24,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
    marginTop: 16,
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
    marginVertical: 4,
  },
  cardRussian: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  cardEnglish: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  btnAgain: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 2,
  },
  btnKnow: {
    flex: 1,
    borderRadius: 28,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnIconDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnLabelDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },

  // Empty / finished states
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