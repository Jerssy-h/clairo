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

const { height } = Dimensions.get('window');

const SUCCESS_GREEN = '#059669';
const SUCCESS_GREEN_BRIGHT = '#10B981';

type Sentence = {
  id: string;
  russian: string;
  chinese_words: string[];
  correct_order: string[];
};

export default function SentenceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#059669';

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [wordIdByChinese, setWordIdByChinese] = useState<Record<string, string>>({});

  // ── Animation refs ──────────────────────────────────────────────────────────
  const gradientAnim = useRef(new Animated.Value(0)).current; // 0 = topic color, 1 = green
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => { setup(); }, []);

  useEffect(() => {
    if (sentences.length > 0) {
      setAvailable([...sentences[index].chinese_words]);
      setSelected([]);
      setResult(null);
      // Reset animations
      gradientAnim.setValue(0);
      checkmarkScale.setValue(0);
      checkmarkOpacity.setValue(0);
    }
  }, [sentences, index]);

  // Rebuild word anim refs when selected changes
  useEffect(() => {
    while (wordAnims.length < selected.length) {
      wordAnims.push(new Animated.Value(1));
    }
  }, [selected]);

  const fetchWordIdMapping = async () => {
    const cacheKey = `word_map_${topicId}`;
    const cached = getCache<Record<string, string>>(cacheKey);
    if (cached) { setWordIdByChinese(cached); return; }
    const { data } = await supabase.from('words').select('id, chinese').eq('topic_id', topicId);
    const mapping: Record<string, string> = {};
    (data || []).forEach((w) => { if (w.chinese && w.id) mapping[w.chinese] = w.id; });
    setWordIdByChinese(mapping);
    setCache(cacheKey, mapping);
  };

  const fetchSentences = async () => {
    const cacheKey = `sentences_${topicId}`;
    const cached = getCache<Sentence[]>(cacheKey);
    if (cached) { setSentences(cached); setLoading(false); return; }
    const { data } = await supabase.from('sentences').select('*').eq('topic_id', topicId);
    setSentences(data || []);
    setCache(cacheKey, data || []);
    setLoading(false);
  };

  const setup = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    setLoading(true);
    await fetchWordIdMapping();
    await fetchSentences();
  };

  const playSuccessAnimation = () => {
    // Reset word anims
    const bounces = selected.map((_, i) => {
      const anim = new Animated.Value(1);
      wordAnims[i] = anim;
      return Animated.sequence([
        Animated.delay(i * 60),
        Animated.spring(anim, { toValue: 1.2, friction: 4, tension: 200, useNativeDriver: true }),
        Animated.spring(anim, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }),
      ]);
    });

    Animated.parallel([
      // Background goes green
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false, // can't use native for color interpolation
      }),
      // Checkmark pops in
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(checkmarkScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
        Animated.timing(checkmarkOpacity, { toValue: 1, duration: 1, useNativeDriver: true }),
      ]),
      // Words bounce one by one
      Animated.stagger(60, bounces),
    ]).start();
  };

  const handleSelectWord = (word: string, wordIndex: number) => {
    if (result) return;
    const newAvailable = [...available];
    newAvailable.splice(wordIndex, 1);
    setAvailable(newAvailable);
    setSelected([...selected, word]);
  };

  const handleRemoveWord = (word: string, wordIndex: number) => {
    if (result) return;
    const newSelected = [...selected];
    newSelected.splice(wordIndex, 1);
    setSelected(newSelected);
    setAvailable([...available, word]);
  };

  const handleCheck = async () => {
    if (result || savingAnswer) return;
    const correct = sentences[index].correct_order;
    const isCorrect = selected.join(' ') === correct.join(' ');

    setSavingAnswer(true);
    try {
      const targetWordIds = Array.from(
        new Set(
          correct
            .map((chinese) => wordIdByChinese[chinese])
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      );
      if (isCorrect && deviceId && targetWordIds.length > 0) {
        await Promise.all(
          targetWordIds.map((wordId) =>
            supabase.from('progress').upsert({
              device_id: deviceId,
              word_id: wordId,
              known: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'device_id,word_id' })
          )
        );
        clearCache('topics');
      }
    } finally {
      setSavingAnswer(false);
    }

    if (isCorrect) {
      setResult('correct');
      setScore(s => s + 1);
      playSuccessAnimation();
    } else {
      setResult('wrong');
      setTimeout(() => setResult(null), 800);
    }
  };

  const handleNext = () => {
    if (index === sentences.length - 1) setFinished(true);
    else setIndex(i => i + 1);
  };

  // Interpolated gradient colors
  const gradientColor1 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [color + 'CC', SUCCESS_GREEN + 'EE'],
  });
  const gradientColor2 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [color + '44', SUCCESS_GREEN + '88'],
  });

  if (loading) {
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </LinearGradient>
    );
  }

  if (sentences.length === 0) {
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
        <Text style={styles.decorChar}>文</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.noSentencesYet}</Text>
          <Text style={styles.emptySubtext}>{t.addSentencesFromAdmin}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t.goBack}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (finished) {
    const percentage = Math.round((score / sentences.length) * 100);
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
        <Text style={styles.finishedEmoji}>
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.finishedTitle}>{t.complete2}</Text>
        <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{score}</Text>
            <Text style={styles.resultLabel}>{t.correct}</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{sentences.length - score}</Text>
            <Text style={styles.resultLabel}>{t.wrong}</Text>
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

  const sentence = sentences[index];
  const progress = ((index + 1) / sentences.length) * 100;

  return (
    <View style={styles.container}>
      {/* Animated background gradient */}
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <AnimatedLinearGradient
          colors={[gradientColor1, gradientColor2, '#0D0D0D']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Text style={styles.bgChar}>文</Text>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicTitle}</Text>
          <Text style={styles.progressText}>{index + 1} / {sentences.length}</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>✓ {score}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>

      {/* Russian sentence card */}
      <View style={styles.russianCard}>
        <Text style={styles.russianLabel}>{t.translateSentence}</Text>
        <Text style={styles.russianText}>{sentence.russian}</Text>
      </View>

      {/* Answer area */}
      <View style={styles.answerArea}>
        <Text style={styles.areaLabel}>{t.yourAnswer}</Text>
        <View style={[
          styles.answerBox,
          result === 'correct' && styles.answerCorrect,
          result === 'wrong' && styles.answerWrong,
        ]}>
          {selected.length === 0 ? (
            <Text style={styles.placeholder}>{t.tapWordsBelow}</Text>
          ) : (
            <View style={styles.wordsRow}>
              {selected.map((word, i) => {
                const scale = wordAnims[i] ?? new Animated.Value(1);
                return (
                  <Animated.View key={i} style={{ transform: [{ scale }] }}>
                    <TouchableOpacity
                      style={[
                        styles.selectedWord,
                        { backgroundColor: result === 'correct' ? SUCCESS_GREEN : color },
                      ]}
                      onPress={() => handleRemoveWord(word, i)}
                    >
                      <Text style={styles.selectedWordText}>{word}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Checkmark overlay on correct */}
          {result === 'correct' && (
            <Animated.View
              style={[
                styles.checkmarkOverlay,
                {
                  opacity: checkmarkOpacity,
                  transform: [{ scale: checkmarkScale }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.checkmarkText}>✓</Text>
            </Animated.View>
          )}
        </View>

        {result === 'wrong' && (
          <Text style={styles.resultText}>{t.tryAgain}</Text>
        )}
      </View>

      {/* Available words */}
      <View style={styles.availableArea}>
        <Text style={styles.areaLabel}>{t.availableWords}</Text>
        <View style={styles.wordsRow}>
          {available.map((word, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.availableWord, result === 'correct' && styles.wordDim]}
              onPress={() => handleSelectWord(word, i)}
            >
              <Text style={styles.availableWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action button */}
      {result === 'correct' ? (
        <TouchableOpacity
          style={[styles.checkBtn, { backgroundColor: SUCCESS_GREEN_BRIGHT }]}
          onPress={handleNext}
        >
          <Text style={styles.checkBtnText}>
            {index === sentences.length - 1 ? t.finish : t.next}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.checkBtn,
            { backgroundColor: color },
            selected.length === 0 && styles.checkBtnDisabled,
          ]}
          onPress={handleCheck}
          disabled={selected.length === 0}
        >
          <Text style={styles.checkBtnText}>{t.check}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Animated.createAnimatedComponent wrapper for LinearGradient
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
    top: height * 0.05,
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
  backArrow: { color: '#FFFFFF', fontSize: 18 },
  headerCenter: { flex: 1 },
  topicName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  progressText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  scorePill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: { color: '#4CAF50', fontSize: 14, fontWeight: '700' },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: { height: 3, borderRadius: 2 },
  russianCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  russianLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  russianText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  answerArea: { marginBottom: 16 },
  areaLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  answerBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    minHeight: 64,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  answerCorrect: {
    borderColor: SUCCESS_GREEN_BRIGHT,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  answerWrong: {
    borderColor: '#FF4444',
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  placeholder: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 14,
    textAlign: 'center',
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedWord: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedWordText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  checkmarkOverlay: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -18,
  },
  checkmarkText: {
    fontSize: 36,
    color: SUCCESS_GREEN_BRIGHT,
    fontWeight: '900',
  },
  resultText: { color: '#FF4444', fontSize: 13, marginTop: 8, fontWeight: '600' },
  availableArea: { marginBottom: 20 },
  availableWord: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  wordDim: { opacity: 0.3 },
  availableWordText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  checkBtn: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  checkBtnDisabled: { opacity: 0.3 },
  checkBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
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
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  finishedEmoji: { fontSize: 64, marginBottom: 16 },
  finishedTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  finishedSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 30 },
  resultsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  resultBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 90,
  },
  resultNumber: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  resultLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  actionBtn: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16 },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});