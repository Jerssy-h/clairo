import { AppPalette } from '@/constants/theme';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getLocalWords, pushProgressToServer, saveProgressLocal } from '@/lib/sync';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  russian?: string;
};

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function QuizScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topicId, topicTitle } = useLocalSearchParams();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const [deviceId, setDeviceId] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const introPlayed = useRef(false);
  const lastAnimatedKey = useRef('');
  const introHeaderOpacity = useRef(new Animated.Value(0)).current;
  const introHeaderTranslateY = useRef(new Animated.Value(18)).current;
  const introCardOpacity = useRef(new Animated.Value(0)).current;
  const introCardTranslateY = useRef(new Animated.Value(24)).current;
  const introCardScale = useRef(new Animated.Value(0.985)).current;
  const introOptions = useRef(
    Array.from({ length: 4 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(18),
      scale: new Animated.Value(0.985),
    }))
  ).current;

  useEffect(() => { setup(); }, []);
  useEffect(() => { if (words.length > 0) generateOptions(index); }, [words, index, language]);
  useEffect(() => {
    if (loading || words.length < 4 || options.length === 0) return;

    const animationKey = `${index}-${options.join('|')}`;
    if (lastAnimatedKey.current === animationKey) return;
    lastAnimatedKey.current = animationKey;

    const isFirstQuestion = index === 0 && !introPlayed.current;

    const resetQuestionAnimation = () => {
      introCardOpacity.setValue(0);
      introCardTranslateY.setValue(isFirstQuestion ? 24 : 16);
      introCardScale.setValue(isFirstQuestion ? 0.985 : 0.992);
      introOptions.forEach(({ opacity, translateY, scale }) => {
        opacity.setValue(0);
        translateY.setValue(isFirstQuestion ? 18 : 12);
        scale.setValue(isFirstQuestion ? 0.985 : 0.992);
      });
    };

    const cardEasing = isFirstQuestion ? Easing.out(Easing.exp) : Easing.bezier(0.22, 1, 0.36, 1);
    const optionEasing = Easing.bezier(0.2, 0.9, 0.25, 1);

    const animateQuestionContent = (cardDuration: number, optionDuration: number, stagger: number) =>
      Animated.parallel([
        Animated.parallel([
          Animated.timing(introCardOpacity, { toValue: 1, duration: cardDuration, easing: cardEasing, useNativeDriver: true }),
          Animated.timing(introCardTranslateY, { toValue: 0, duration: cardDuration, easing: cardEasing, useNativeDriver: true }),
          Animated.timing(introCardScale, { toValue: 1, duration: cardDuration + 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.stagger(stagger, introOptions.map(({ opacity, translateY, scale }) =>
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: optionDuration, easing: optionEasing, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: optionDuration, easing: optionEasing, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: optionDuration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ])
        )),
      ]);

    resetQuestionAnimation();

    if (introPlayed.current) {
      animateQuestionContent(260, 240, 55).start();
      return;
    }

    introPlayed.current = true;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(introHeaderOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(introHeaderTranslateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      animateQuestionContent(360, 320, 80),
    ]).start();
  }, [index, introCardOpacity, introCardScale, introCardTranslateY, introHeaderOpacity, introHeaderTranslateY, introOptions, loading, options, words.length]);

  const getMeaning = (word: Word) =>
    language === 'ru' ? (word.russian ?? word.english) : word.english;

  const fetchWords = async () => {
    // Сначала из локальной БД
    const local = getLocalWords(topicId as string);
    if (local.length > 0) {
      setWords(shuffle(local));
      setLoading(false);
      return;
    }
    // Фоллбэк на Supabase
    const { data } = await supabase.from('words').select('*').eq('topic_id', topicId);
    setWords(shuffle(data || []));
    setLoading(false);
  };

  const setup = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    fetchWords();
  };

  const saveProgress = async (wordId: string, isKnown: boolean) => {
    if (!deviceId) return;
    saveProgressLocal(deviceId, wordId, isKnown);
    pushProgressToServer(deviceId, wordId, isKnown);
  };

  const generateOptions = (currentIndex: number) => {
    const current = words[currentIndex];
    const others = words.filter((_, i) => i !== currentIndex).map(w => getMeaning(w));
    const shuffledOthers = shuffle(others).slice(0, 3);
    const allOptions = shuffle([getMeaning(current), ...shuffledOthers]);
    setOptions(allOptions);
    setSelected(null);
  };

  const handleAnswer = (answer: string) => {
    if (selected || savingAnswer) return;
    setSelected(answer);
    const correctAnswer = getMeaning(words[index]);
    const isCorrect = answer === correctAnswer;

    setSavingAnswer(true);
    if (isCorrect) { setCorrect(c => c + 1); setCombo(c => c + 1); }
    else { setWrong(w => w + 1); setCombo(0); }

    saveProgress(words[index].id, isCorrect).finally(() => setSavingAnswer(false));

    setTimeout(() => {
      if (index === words.length - 1) setFinished(true);
      else setIndex(i => i + 1);
    }, 900);
  };

  const getOptionStyle = (option: string) => {
    if (!selected) return styles.optionBtn;
    if (option === getMeaning(words[index])) return [styles.optionBtn, styles.optionCorrect];
    if (option === selected) return [styles.optionBtn, styles.optionWrong];
    return [styles.optionBtn, styles.optionDim];
  };

  const getOptionTextStyle = (option: string) => {
    if (!selected) return styles.optionText;
    if (option === getMeaning(words[index])) return [styles.optionText, { color: AppPalette.success }];
    if (option === selected) return [styles.optionText, { color: AppPalette.danger }];
    return [styles.optionText, { opacity: 0.4 }];
  };

  if (loading) {
    return (
      <LinearGradient colors={[AppPalette.bgElevated, AppPalette.bg]} style={styles.center}>
        <ActivityIndicator color={AppPalette.white} size="large" />
      </LinearGradient>
    );
  }

  if (words.length < 4) {
    return (
      <LinearGradient colors={[AppPalette.bgElevated, AppPalette.bg]} style={styles.center}>
        <Text style={styles.decorChar}>问</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.need4Words}</Text>
          <Text style={styles.emptySubtext}>{t.add4Words}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {t.goBack}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (finished) {
    const total = correct + wrong;
    const percentage = Math.round((correct / total) * 100);
    return (
      <LinearGradient colors={[AppPalette.bgElevated, AppPalette.bg]} style={styles.center}>
        <Text style={styles.finishedEmoji}>
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.finishedTitle}>{t.quizComplete}</Text>
        <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{correct}</Text>
            <Text style={styles.resultLabel}>{t.correct}</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{wrong}</Text>
            <Text style={styles.resultLabel}>{t.wrong}</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{percentage}%</Text>
            <Text style={styles.resultLabel}>{t.score}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: AppPalette.tintStrong }]} onPress={() => router.back()}>
          <Text style={styles.actionBtnText}>{t.backToTopics}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const card = words[index];
  const progress = ((index + 1) / words.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[AppPalette.bg, AppPalette.bg]} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.bgChar}>{card.chinese[0]}</Text>

      <Animated.View style={[styles.headerBlock, { opacity: introHeaderOpacity, transform: [{ translateY: introHeaderTranslateY }] }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.topicName}>{topicTitle}</Text>
            <Text style={styles.progressText}>{index + 1} / {words.length}</Text>
          </View>
          {combo >= 2 && (
            <View style={styles.comboBadge}>
              <Text style={styles.comboText}>🔥 {combo}x</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: AppPalette.tintStrong }]} />
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scorePill}><Text style={styles.scoreCorrect}>✓ {correct}</Text></View>
          <View style={styles.scorePill}><Text style={styles.scoreWrong}>✕ {wrong}</Text></View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.card, { opacity: introCardOpacity, transform: [{ translateY: introCardTranslateY }, { scale: introCardScale }] }]}>
        <Text style={styles.questionLabel}>{language === 'ru' ? 'Что это значит?' : 'What does this mean?'}</Text>
        <Text style={styles.cardChinese}>{card.chinese}</Text>
        <Text style={[styles.cardPinyin, { color: AppPalette.tintStrong }]}>{card.pinyin}</Text>
      </Animated.View>

      <View style={styles.optionsContainer}>
        {options.map((option, optionIndex) => (
          <Animated.View
            key={option}
            style={{
              opacity: introOptions[optionIndex]?.opacity ?? 1,
              transform: [
                { translateY: introOptions[optionIndex]?.translateY ?? 0 },
                { scale: introOptions[optionIndex]?.scale ?? 1 },
              ],
            }}>
            <TouchableOpacity style={getOptionStyle(option)} onPress={() => handleAnswer(option)} activeOpacity={0.85}>
              <Text style={getOptionTextStyle(option)}>{option}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppPalette.bg, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bgChar: { position: 'absolute', fontSize: 320, color: 'rgba(255,255,255,0.03)', fontWeight: '900', top: height * 0.05, alignSelf: 'center', lineHeight: 340 },
  headerBlock: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppPalette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: AppPalette.text, fontSize: 18 },
  headerCenter: { flex: 1 },
  topicName: { color: AppPalette.text, fontSize: 16, fontWeight: '700' },
  progressText: { color: AppPalette.textMuted, fontSize: 12, marginTop: 2 },
  comboBadge: { backgroundColor: 'rgba(255,201,120,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,201,120,0.28)' },
  comboText: { color: AppPalette.warning, fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 3, backgroundColor: AppPalette.surfaceSoft, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressBarFill: { height: 3, borderRadius: 2 },
  scoreRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scorePill: { backgroundColor: AppPalette.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  scoreCorrect: { color: AppPalette.success, fontSize: 14, fontWeight: '700' },
  scoreWrong: { color: AppPalette.danger, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: AppPalette.bgElevated, borderRadius: 28, borderWidth: 1, borderColor: AppPalette.border, padding: 32, alignItems: 'center', marginBottom: 20 },
  questionLabel: { color: AppPalette.textMuted, fontSize: 13, marginBottom: 16, letterSpacing: 0.5 },
  cardChinese: { fontSize: 72, color: AppPalette.text, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  cardPinyin: { fontSize: 22, fontWeight: '600' },
  optionsContainer: { gap: 10 },
  optionBtn: { backgroundColor: AppPalette.surface, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: AppPalette.border },
  optionCorrect: { backgroundColor: 'rgba(126,224,161,0.16)', borderColor: AppPalette.success },
  optionWrong: { backgroundColor: 'rgba(255,142,158,0.14)', borderColor: AppPalette.danger },
  optionDim: { opacity: 0.4 },
  optionText: { color: AppPalette.text, fontSize: 16, fontWeight: '600' },
  decorChar: { fontSize: 120, color: 'rgba(255,255,255,0.07)', fontWeight: '900', marginBottom: 24 },
  emptyCard: { backgroundColor: AppPalette.bgElevated, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: AppPalette.border, marginBottom: 24, width: '100%' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: AppPalette.text, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: AppPalette.textMuted, textAlign: 'center' },
  finishedEmoji: { fontSize: 64, marginBottom: 16 },
  finishedTitle: { fontSize: 28, fontWeight: '800', color: AppPalette.text, marginBottom: 8 },
  finishedSubtitle: { fontSize: 16, color: AppPalette.textMuted, marginBottom: 30 },
  resultsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  resultBox: { backgroundColor: AppPalette.surface, borderRadius: 16, padding: 20, alignItems: 'center', minWidth: 90 },
  resultNumber: { fontSize: 28, fontWeight: '800', color: AppPalette.text },
  resultLabel: { fontSize: 12, color: AppPalette.textMuted, marginTop: 4 },
  backBtn: { backgroundColor: AppPalette.surfaceSoft, borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 1, borderColor: AppPalette.borderStrong },
  backBtnText: { color: AppPalette.text, fontSize: 16, fontWeight: '600' },
  actionBtn: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16 },
  actionBtnText: { color: AppPalette.white, fontSize: 16, fontWeight: '700' },
});