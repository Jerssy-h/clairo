import { useAppTheme } from '@/lib/AppThemeContext';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getLocalSentences, getLocalWords, pushProgressToServer, saveProgressLocal } from '@/lib/sync';
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

type Sentence = {
  id: string;
  russian: string;
  chinese_words: string[];
  correct_order: string[];
};

export default function SentenceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { palette, fonts } = useAppTheme();
  const { topicId, topicTitle, topicColor, allWords } = useLocalSearchParams();
  const color = (topicColor as string) || '#059669';
  const styles = createStyles(palette, fonts);

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

  const gradientAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => { setup(); }, []);

  useEffect(() => {
    if (sentences.length > 0) {
      setAvailable([...sentences[index].chinese_words]);
      setSelected([]);
      setResult(null);
      gradientAnim.setValue(0);
      checkmarkScale.setValue(0);
      checkmarkOpacity.setValue(0);
    }
  }, [sentences, index]);

  useEffect(() => {
    while (wordAnims.length < selected.length) {
      wordAnims.push(new Animated.Value(1));
    }
  }, [selected]);

  const buildWordIdMapping = (words: any[]) => {
    const mapping: Record<string, string> = {};
    words.forEach((w) => { if (w.chinese && w.id) mapping[w.chinese] = w.id; });
    setWordIdByChinese(mapping);
  };

  const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

  const fetchSentences = async () => {
    // Сначала из локальной БД
    const isAllWordsMode = allWords === '1';
    const localSentences = !isAllWordsMode ? getLocalSentences(topicId as string) : [];
    if (localSentences.length > 0) {
      setSentences(shuffle(localSentences));
      setLoading(false);

      // Маппинг слов из локальной БД
      const localWords = getLocalWords(topicId as string);
      buildWordIdMapping(localWords);
      return;
    }

    // Фоллбэк на Supabase
    const sentenceQuery = supabase.from('sentences').select('*');
    const { data: sentenceData } = isAllWordsMode ? await sentenceQuery : await sentenceQuery.eq('topic_id', topicId);
    setSentences(shuffle(sentenceData || []));

    const wordQuery = supabase.from('words').select('id, chinese');
    const { data: wordData } = isAllWordsMode ? await wordQuery : await wordQuery.eq('topic_id', topicId);
    buildWordIdMapping(wordData || []);

    setLoading(false);
  };

  const setup = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    setLoading(true);
    await fetchSentences();
  };

  const playSuccessAnimation = () => {
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
      Animated.timing(gradientAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(checkmarkScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
        Animated.timing(checkmarkOpacity, { toValue: 1, duration: 1, useNativeDriver: true }),
      ]),
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
    const correctOrder = sentences[index].correct_order;
    const isCorrect = selected.join(' ') === correctOrder.join(' ');

    setSavingAnswer(true);
    try {
      const targetWordIds = Array.from(
        new Set(
          correctOrder
            .map((chinese) => wordIdByChinese[chinese])
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      );
      if (isCorrect && deviceId && targetWordIds.length > 0) {
        for (const wordId of targetWordIds) {
          saveProgressLocal(deviceId, wordId, true);
          pushProgressToServer(deviceId, wordId, true);
        }
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

  const gradientColor1 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [color + '22', palette.bgElevated],
  });
  const gradientColor2 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [color + '10', palette.bg],
  });

  if (loading) {
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <ActivityIndicator color={palette.text} size="small" />
      </LinearGradient>
    );
  }

  if (sentences.length === 0) {
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
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
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <Text style={styles.finishedEmoji}>{percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}</Text>
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
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.text }]} onPress={() => router.back()}>
          <Text style={styles.actionBtnText}>{t.backToTopics}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const sentence = sentences[index];
  const progress = ((index + 1) / sentences.length) * 100;

  return (
    <View style={styles.container}>
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <AnimatedLinearGradient
          colors={[gradientColor1, gradientColor2, palette.bg]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Text style={styles.bgChar}>文</Text>

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

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: palette.text }]} />
      </View>

      <View style={styles.russianCard}>
        <Text style={styles.russianLabel}>{t.translateSentence}</Text>
        <Text style={styles.russianText}>{sentence.russian}</Text>
      </View>

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
                      style={[styles.selectedWord, { backgroundColor: result === 'correct' ? palette.text : palette.surfaceSoft }]}
                      onPress={() => handleRemoveWord(word, i)}
                    >
                      <Text style={styles.selectedWordText}>{word}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {result === 'correct' && (
            <Animated.View
              style={[styles.checkmarkOverlay, { opacity: checkmarkOpacity, transform: [{ scale: checkmarkScale }] }]}
              pointerEvents="none"
            >
              <Text style={styles.checkmarkText}>✓</Text>
            </Animated.View>
          )}
        </View>

        {result === 'wrong' && <Text style={styles.resultText}>{t.tryAgain}</Text>}
      </View>

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

      {result === 'correct' ? (
        <TouchableOpacity style={[styles.checkBtn, { backgroundColor: palette.text }]} onPress={handleNext}>
          <Text style={styles.checkBtnText}>{index === sentences.length - 1 ? t.finish : t.next}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.checkBtn, { backgroundColor: palette.text }, selected.length === 0 && styles.checkBtnDisabled]}
          onPress={handleCheck}
          disabled={selected.length === 0}
        >
          <Text style={styles.checkBtnText}>{t.check}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const createStyles = (palette: any, fonts: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bgChar: { position: 'absolute', fontSize: 320, color: palette.borderStrong, fontWeight: '900', top: height * 0.05, alignSelf: 'center', lineHeight: 340, opacity: 0.35 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.borderStrong },
  backArrow: { color: palette.text, fontSize: 18, fontFamily: fonts.mono },
  headerCenter: { flex: 1 },
  topicName: { color: palette.text, fontSize: 16, fontWeight: '700', fontFamily: fonts.mono },
  progressText: { color: palette.textMuted, fontSize: 12, marginTop: 2, fontFamily: fonts.mono },
  scorePill: { backgroundColor: palette.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: palette.border },
  scoreText: { color: palette.text, fontSize: 14, fontWeight: '700', fontFamily: fonts.mono },
  progressBarBg: { height: 3, backgroundColor: palette.surfaceSoft, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressBarFill: { height: 3, borderRadius: 2 },
  russianCard: { backgroundColor: palette.bgElevated, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: palette.borderStrong },
  russianLabel: { color: palette.textMuted, fontSize: 11, marginBottom: 8, letterSpacing: 0.8, fontFamily: fonts.mono, textTransform: 'uppercase' },
  russianText: { color: palette.text, fontSize: 22, fontWeight: '600', fontFamily: fonts.mono },
  answerArea: { marginBottom: 16 },
  areaLabel: { color: palette.textMuted, fontSize: 11, marginBottom: 8, letterSpacing: 0.8, fontFamily: fonts.mono, textTransform: 'uppercase' },
  answerBox: { backgroundColor: palette.bgElevated, borderRadius: 16, padding: 16, minHeight: 64, justifyContent: 'center', borderWidth: 1, borderColor: palette.border, position: 'relative', overflow: 'hidden' },
  answerCorrect: { borderColor: palette.text, backgroundColor: palette.bgElevated },
  answerWrong: { borderColor: palette.textMuted, backgroundColor: palette.bgElevated },
  placeholder: { color: palette.textFaint, fontSize: 14, textAlign: 'center', fontFamily: fonts.mono },
  wordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedWord: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  selectedWordText: { color: palette.bg, fontSize: 18, fontWeight: '600', fontFamily: fonts.mono },
  checkmarkOverlay: { position: 'absolute', right: 14, top: '50%', marginTop: -18 },
  checkmarkText: { fontSize: 36, color: palette.text, fontWeight: '700', fontFamily: fonts.mono },
  resultText: { color: palette.textMuted, fontSize: 13, marginTop: 8, fontWeight: '600', fontFamily: fonts.mono },
  availableArea: { marginBottom: 20 },
  availableWord: { backgroundColor: palette.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: palette.border },
  wordDim: { opacity: 0.3 },
  availableWordText: { color: palette.text, fontSize: 18, fontWeight: '600', fontFamily: fonts.mono },
  checkBtn: { borderRadius: 20, padding: 18, alignItems: 'center' },
  checkBtnDisabled: { opacity: 0.3 },
  checkBtnText: { color: palette.bg, fontSize: 14, fontWeight: '700', fontFamily: fonts.mono, letterSpacing: 1 },
  decorChar: { fontSize: 120, color: palette.borderStrong, fontWeight: '900', marginBottom: 24, opacity: 0.4 },
  emptyCard: { backgroundColor: palette.bgElevated, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: palette.border, marginBottom: 24, width: '100%' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: 8, textAlign: 'center', fontFamily: fonts.mono },
  emptySubtext: { fontSize: 14, color: palette.textMuted, textAlign: 'center', fontFamily: fonts.mono, lineHeight: 22 },
  finishedEmoji: { fontSize: 64, marginBottom: 16 },
  finishedTitle: { fontSize: 28, fontWeight: '700', color: palette.text, marginBottom: 8, fontFamily: fonts.mono },
  finishedSubtitle: { fontSize: 16, color: palette.textMuted, marginBottom: 30, fontFamily: fonts.mono },
  resultsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  resultBox: { backgroundColor: palette.surface, borderRadius: 16, padding: 20, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: palette.border },
  resultNumber: { fontSize: 28, fontWeight: '700', color: palette.text, fontFamily: fonts.mono },
  resultLabel: { fontSize: 11, color: palette.textMuted, marginTop: 4, fontFamily: fonts.mono },
  backBtn: { backgroundColor: palette.bgElevated, borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 1, borderColor: palette.borderStrong },
  backBtnText: { color: palette.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.mono },
  actionBtn: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16 },
  actionBtnText: { color: palette.bg, fontSize: 14, fontWeight: '700', fontFamily: fonts.mono, letterSpacing: 1 },
});
