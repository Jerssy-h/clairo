import { useAppTheme } from '@/lib/AppThemeContext';
import { clearCache, getCache, setCache } from '@/lib/cache';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { HanziWriter, useHanziWriter } from '@jamsch/react-native-hanzi-writer';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

// 2 guided rounds (outline visible) + 2 blind rounds = 4 total
const GUIDED_ROUNDS = 2;
const TOTAL_ROUNDS = 4;

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  russian?: string;
};

type Phase = 'watch' | 'practice';

// ─── Verified API from official readme ──────────────────────────────────────
// useHanziWriter({ character, loader })
// writer.animator.animateCharacter({ delayBetweenStrokes, strokeDuration, onComplete })
// writer.animator.cancelAnimation()
// writer.animator.useStore(s => s.state)  → 'playing' | 'idle'
// writer.quiz.start({ leniency, quizStartStrokeNum, showHintAfterMisses, onComplete, onCorrectStroke, onMistake })
// writer.quiz.useStore(s => s.active)
// writer.refetch
// HanziWriter.GridLines            props: color
// HanziWriter.Svg                  wrapper
// HanziWriter.Outline              props: color
// HanziWriter.Character            props: color, radicalColor
// HanziWriter.QuizStrokes          props: none
// HanziWriter.QuizMistakeHighlighter props: color, strokeDuration

function CharacterWriter({
  char,
  color,
  phase,
  round,
  language,
  onRoundComplete,
  palette,
  fonts,
}: {
  char: string;
  color: string;
  phase: Phase;
  round: number;
  language: string;
  onRoundComplete: () => void;
  palette: any;
  fonts: any;
}) {
  const styles = createStyles(palette, fonts);
  const writer = useHanziWriter({
    character: char,
    loader: (c) =>
      fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${c}.json`).then((r) => r.json()),
  });

  // Second writer just for the peek outline overlay
  const peekWriter = useHanziWriter({
    character: char,
    loader: (c) =>
      fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${c}.json`).then((r) => r.json()),
  });

  const animatorState = writer.animator.useStore((s) => s.state);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Peek animation
  const peekOpacity = useRef(new Animated.Value(0)).current;
  const [peeking, setPeeking] = useState(false);

  // Auto-play on mount when in watch phase
  useEffect(() => {
    const timer = setTimeout(() => {
      writer.animator.animateCharacter({ delayBetweenStrokes: 400, strokeDuration: 600 });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Start quiz when in practice phase
  useEffect(() => {
    if (phase === 'practice') {
      const timer = setTimeout(() => {
        writer.quiz.start({
          leniency: 1.5,
          showHintAfterMisses: 3,
          onCorrectStroke() {
            setFeedback('correct');
            setTimeout(() => setFeedback(null), 500);
          },
          onMistake() {
            setFeedback('wrong');
            setTimeout(() => setFeedback(null), 500);
          },
          onComplete() {
            setFeedback('correct');
            setTimeout(() => {
              setFeedback(null);
              onRoundComplete();
            }, 800);
          },
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handlePeek = () => {
    if (peeking) return;
    setPeeking(true);
    Animated.sequence([
      Animated.timing(peekOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(peekOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => setPeeking(false));
  };

  const isGuided = round < GUIDED_ROUNDS;

  const borderColor =
    feedback === 'correct' ? palette.text :
    feedback === 'wrong' ? palette.textMuted :
    palette.border;

  return (
    <View style={styles.writerSection}>
      <View style={[styles.canvasWrapper, { borderColor }]}>
        <HanziWriter
          writer={writer}
          loading={
            <View style={styles.canvasCentered}>
              <ActivityIndicator color={palette.text} />
              
            </View>
          }
          error={
            <View style={styles.canvasCentered}>
              <Text style={styles.canvasSubText}>⚠️ Not found</Text>
              <Button title="Retry" onPress={writer.refetch} color={color} />
            </View>
          }
          style={styles.writer}
        >
            <HanziWriter.GridLines color={palette.border} />
          <HanziWriter.Svg>
            {/* Outline: only shown in guided rounds */}
            {isGuided && <HanziWriter.Outline color={palette.borderStrong} />}
            {/* Ghost character: only shown in guided rounds */}
            {isGuided && (
              <HanziWriter.Character
                color={palette.borderStrong}
                radicalColor={palette.borderStrong}
              />
            )}
            {/* Correctly drawn strokes appear in topic color */}
            <HanziWriter.QuizStrokes color={color} />
            {/* Mistake flash — blue like the official example, clearly visible */}
            <HanziWriter.QuizMistakeHighlighter color={palette.textMuted} strokeDuration={400} />
          </HanziWriter.Svg>
        </HanziWriter>

        {/* Peek overlay — fades the outline in/out using a second writer */}
        {phase === 'practice' && !isGuided && (
          <Animated.View
            style={[styles.peekOverlay, { opacity: peekOpacity }]}
            pointerEvents="none"
          >
            <HanziWriter
              writer={peekWriter}
              style={styles.writer}
            >
              <HanziWriter.Svg>
                <HanziWriter.Outline color={palette.textMuted} />
                <HanziWriter.Character color={palette.borderStrong} radicalColor={palette.borderStrong} />
              </HanziWriter.Svg>
            </HanziWriter>
          </Animated.View>
        )}

        {/* Feedback flash */}
        {feedback !== null && (
          <View
            style={[
              styles.feedbackOverlay,
              { backgroundColor: palette.overlay },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.feedbackIcon, { color: feedback === 'correct' ? palette.text : palette.textMuted, fontFamily: fonts.mono }]}>
              {feedback === 'correct' ? '✓' : '✕'}
            </Text>
          </View>
        )}
      </View>

      {/* Buttons below canvas */}
      {phase === 'watch' && (
        <TouchableOpacity
          style={styles.replayBtn}
          disabled={animatorState === 'playing'}
          onPress={() =>
            writer.animator.animateCharacter({ delayBetweenStrokes: 400, strokeDuration: 600 })
          }
        >
          <Text style={styles.replayBtnText}>
            {animatorState === 'playing' ? (language === 'ru' ? '▶ Воспроизводится…' : '▶ Playing…') : (language === 'ru' ? '↺ Повтор' : '↺ Replay')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Peek button — only in blind rounds */}
      {phase === 'practice' && !isGuided && (
        <TouchableOpacity
          style={[styles.peekBtn, { borderColor: color + '88' }, peeking && styles.peekBtnActive]}
          onPress={handlePeek}
          disabled={peeking}
        >
          <Text style={[styles.peekBtnText, { color: palette.text, fontFamily: fonts.mono }]}>
            {peeking ? '👁 Показывается…' : '👁 Показать на 3 сек'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function StrokeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { palette, fonts } = useAppTheme();
  const { topicId, topicTitle, topicColor, allWords } = useLocalSearchParams();
  const color = (topicColor as string) || '#D97706';
  const styles = createStyles(palette, fonts);

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCharacterIndex, setReviewCharacterIndex] = useState(0);
  const [reviewPass, setReviewPass] = useState(0);
  const [phase, setPhase] = useState<Phase>('watch');
  const [round, setRound] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    getDeviceId().then(setDeviceId);
    fetchWords();
  }, []);

  const fetchWords = async () => {
    const isAllWordsMode = allWords === '1';
    const cacheKey = isAllWordsMode ? 'words_all' : `words_${topicId}`;
    const cached = getCache<Word[]>(cacheKey);
    if (cached) { setWords([...cached].sort(() => Math.random() - 0.5)); setLoading(false); return; }
    const query = supabase.from('words').select('*');
    const { data, error } = isAllWordsMode ? await query : await query.eq('topic_id', topicId);
    if (error) console.error(error);
    else {
      const randomized = [...(data || [])].sort(() => Math.random() - 0.5);
      setWords(randomized);
      setCache(cacheKey, data || []);
    }
    setLoading(false);
  };

  const saveProgress = async (wordId: string) => {
    if (!deviceId) return;
    const { error } = await supabase.from('progress').upsert({
      device_id: deviceId,
      word_id: wordId,
      known: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id,word_id' });
    if (error) console.error(error.message);
    clearCache('topics');
  };

  const goTo = (i: number, nextCharacterIndex = 0) => {
    setIndex(i);
    setCharacterIndex(nextCharacterIndex);
    setReviewMode(false);
    setReviewCharacterIndex(0);
    setReviewPass(0);
    setPhase('watch');
    setRound(0);
    setAllDone(false);
  };

  const finishCurrentWord = () => {
    const currentWord = words[index];
    const wordId = currentWord?.id;
    if (wordId) saveProgress(wordId);

    if (index < words.length - 1) {
      setTimeout(() => goTo(index + 1), 600);
    } else {
      setAllDone(true);
    }
  };

  const handleReviewComplete = () => {
    const characters = Array.from(words[index]?.chinese ?? '').filter(Boolean);
    const hasNextReviewCharacter = reviewCharacterIndex < characters.length - 1;

    if (hasNextReviewCharacter) {
      setReviewCharacterIndex((current) => current + 1);
      return;
    }

    if (reviewPass === 0) {
      setReviewPass(1);
      setReviewCharacterIndex(0);
      return;
    }

    finishCurrentWord();
  };

  const handleRoundComplete = () => {
    if (reviewMode) {
      handleReviewComplete();
      return;
    }

    const next = round + 1;
    if (next >= TOTAL_ROUNDS) {
      const currentWord = words[index];
      const characters = Array.from(currentWord?.chinese ?? '').filter(Boolean);
      const hasNextCharacter = characterIndex < characters.length - 1;

      if (hasNextCharacter) {
        setCharacterIndex((current) => current + 1);
        setPhase('watch');
        setRound(0);
        return;
      }

      setReviewMode(true);
      setReviewPass(0);
      setReviewCharacterIndex(0);
      setPhase('practice');
      setRound(0);
    } else {
      setRound(next);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <ActivityIndicator color={palette.text} size="small" />
      </LinearGradient>
    );
  }

  if (words.length === 0) {
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <Text style={styles.decorChar}>笔</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {language === 'ru' ? 'В теме нет слов' : 'No words in this topic'}
          </Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {language === 'ru' ? 'Назад' : 'Go Back'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (allDone) {
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <Text style={styles.doneEmoji}>🏆</Text>
        <Text style={styles.doneTitle}>
          {language === 'ru' ? 'Все иероглифы пройдены!' : 'All characters done!'}
        </Text>
        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: palette.text }]} onPress={() => router.back()}>
          <Text style={styles.btnPrimaryText}>
            {language === 'ru' ? '← К темам' : '← Back to Topics'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const card = words[index];
  const characters = Array.from(card.chinese).filter(Boolean);
  const activeCharacterIndex = reviewMode ? reviewCharacterIndex : characterIndex;
  const char = characters[activeCharacterIndex] ?? characters[0] ?? '';
  const meaning = language === 'ru' ? (card.russian ?? card.english) : card.english;
  const isGuided = reviewMode ? reviewPass === 0 : round < GUIDED_ROUNDS;
  const effectiveRound = reviewMode ? (reviewPass === 0 ? 0 : GUIDED_ROUNDS) : round;

  const instructionText =
    phase === 'watch'
      ? (language === 'ru' ? 'Смотрите порядок черт • нажмите Повтор или Практика' : 'Watch stroke order • Replay or start Practice')
      : isGuided
      ? (language === 'ru' ? 'Рисуйте каждую черту по порядку' : 'Draw each stroke in order')
      : (language === 'ru' ? '🧠 По памяти — без подсказки!' : '🧠 From memory — no guide!');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[palette.bg, palette.bg]}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.bgChar}>{char}</Text>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicTitle}</Text>
          <Text style={styles.progressText}>
            {index + 1} / {words.length} • {activeCharacterIndex + 1} / {characters.length}
          </Text>
        </View>
        <View style={[styles.phasePill, { backgroundColor: phase === 'watch' ? palette.surface : palette.text }]}>
          <Text style={styles.phasePillText}>
            {phase === 'watch'
              ? (language === 'ru' ? 'Смотреть' : 'Watch')
              : (language === 'ru' ? 'Рисовать' : 'Draw')}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, {
          width: `${((index + 1) / words.length) * 100}%`,
          backgroundColor: palette.text,
        }]} />
      </View>

      {/* Word info */}
      <View style={styles.wordInfo}>
        <Text style={styles.chineseText}>{card.chinese}</Text>
        <Text style={styles.currentCharText}>
          {reviewMode
            ? (language === 'ru' ? 'Слова подряд' : 'Word review')
            : (language === 'ru' ? 'Пропись иероглифа' : 'Practicing character')} {activeCharacterIndex + 1}/{characters.length}: {char}
        </Text>
        <Text style={[styles.pinyinText, { color: palette.textMuted }]}>{card.pinyin}</Text>
        <Text style={styles.meaningText}>{meaning}</Text>
      </View>

      {/* Round dots (only during practice) */}
      {phase === 'practice' && !reviewMode && (
        <View style={styles.roundRow}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.roundDot,
                i < round && { backgroundColor: palette.text },
                i === round && { backgroundColor: palette.text, transform: [{ scale: 1.3 }] },
              ]}
            />
          ))}
        </View>
      )}

      {/* Character writer — remounts on char + phase + round change */}
      <CharacterWriter
        key={`${char}-${index}-${phase}-${round}-${reviewMode ? `review-${reviewPass}-${reviewCharacterIndex}` : 'single'}`}
        char={char}
        color={color}
        phase={phase}
        round={effectiveRound}
        language={language}
        onRoundComplete={handleRoundComplete}
        palette={palette}
        fonts={fonts}
      />

      {/* Instructions */}
      <Text style={styles.instructions}>{instructionText}</Text>

      {reviewMode && (
        <Text style={styles.reviewHint}>
          {reviewPass === 0
            ? (language === 'ru' ? 'Финальный проход: с подсказкой по всем иероглифам слова.' : 'Final pass: guided review through every character in the word.')
            : (language === 'ru' ? 'Финальный проход: теперь напиши все иероглифы слова без подсказки.' : 'Final pass: now write every character in the word without hints.')}
        </Text>
      )}

      {/* Main action button */}
      {phase === 'watch' && (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: palette.text }]}
            onPress={() => { setPhase('practice'); setRound(0); }}
          >
            <Text style={styles.btnPrimaryText}>
              {language === 'ru' ? 'Практиковать' : 'Practice Drawing'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Prev / dots / Next */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
          onPress={() => goTo(index - 1)}
          disabled={index === 0}
        >
          <Text style={styles.navBtnText}>← {language === 'ru' ? 'Назад' : 'Prev'}</Text>
        </TouchableOpacity>

        <View style={styles.navDots}>
          {words.slice(0, 7).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === index && { backgroundColor: palette.text, width: 16 }]} />
            </TouchableOpacity>
          ))}
          {words.length > 7 && <Text style={styles.dotsMore}>…</Text>}
        </View>

        <TouchableOpacity
          style={[styles.navBtn, index === words.length - 1 && styles.navBtnDisabled]}
          onPress={() => goTo(index + 1)}
          disabled={index === words.length - 1}
        >
          <Text style={styles.navBtnText}>{language === 'ru' ? 'Далее' : 'Next'} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (palette: any, fonts: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bgChar: {
    position: 'absolute', fontSize: 320, color: palette.borderStrong,
    fontWeight: '900', top: height * 0.1, alignSelf: 'center', lineHeight: 340,
    opacity: 0.35,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: palette.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.borderStrong,
  },
  backArrow: { color: palette.text, fontSize: 18, fontFamily: fonts.mono },
  headerCenter: { flex: 1 },
  topicName: { color: palette.text, fontSize: 16, fontWeight: '700', fontFamily: fonts.mono },
  progressText: { color: palette.textMuted, fontSize: 12, marginTop: 2, fontFamily: fonts.mono },
  phasePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  phasePillText: { color: palette.bg, fontSize: 12, fontWeight: '700', fontFamily: fonts.mono },
  progressBarBg: {
    height: 3, backgroundColor: palette.surfaceSoft,
    borderRadius: 2, marginBottom: 16, overflow: 'hidden',
  },
  progressBarFill: { height: 3, borderRadius: 2 },
  wordInfo: { alignItems: 'center', marginBottom: 8, gap: 2 },
  chineseText: { fontSize: 30, fontWeight: '700', color: palette.text, letterSpacing: 2, fontFamily: fonts.mono },
  pinyinText: { fontSize: 16, fontWeight: '600', fontFamily: fonts.mono },
  currentCharText: { fontSize: 13, color: palette.textSoft, fontWeight: '600', fontFamily: fonts.mono },
  meaningText: { fontSize: 13, color: palette.textMuted, fontWeight: '500', fontFamily: fonts.mono },
  roundRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  roundDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: palette.borderStrong,
    borderWidth: 1, borderColor: palette.border,
  },
  writerSection: { alignItems: 'center', width: '100%', marginBottom: 6 },
  canvasWrapper: {
    width: 300, height: 300, borderRadius: 24, borderWidth: 1.5,
    backgroundColor: palette.bgElevated, overflow: 'hidden',
    position: 'relative', marginBottom: 10, alignSelf: 'center',
  },
  writer: { width: 300, height: 300, alignSelf: 'center' },
  canvasCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  canvasSubText: { color: palette.textMuted, fontSize: 13, fontFamily: fonts.mono },
  peekOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 5,
  },
  feedbackOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  feedbackIcon: { fontSize: 60, fontWeight: '700' },
  replayBtn: {
    backgroundColor: palette.surface, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: palette.border,
  },
  replayBtnText: { color: palette.textSoft, fontSize: 14, fontWeight: '600', fontFamily: fonts.mono },
  peekBtn: {
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, backgroundColor: palette.bgElevated,
  },
  peekBtnActive: { opacity: 0.5 },
  peekBtnText: { fontSize: 14, fontWeight: '600' },
  instructions: { textAlign: 'center', color: palette.textFaint, fontSize: 12, marginBottom: 10, fontFamily: fonts.mono },
  reviewHint: { textAlign: 'center', color: palette.textSoft, fontSize: 12, marginBottom: 12, fontFamily: fonts.mono },
  buttons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btnPrimary: { flex: 1, borderRadius: 20, height: 52, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: palette.bg, fontSize: 15, fontWeight: '700', fontFamily: fonts.mono, letterSpacing: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: palette.text, fontSize: 13, fontWeight: '600', fontFamily: fonts.mono },
  navDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.borderStrong },
  dotsMore: { color: palette.textFaint, fontSize: 12, fontFamily: fonts.mono },
  decorChar: { fontSize: 120, color: palette.borderStrong, fontWeight: '900', marginBottom: 24, opacity: 0.4 },
  emptyCard: {
    backgroundColor: palette.bgElevated, borderRadius: 24, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: palette.border,
    marginBottom: 24, width: '100%',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: palette.text, textAlign: 'center', fontFamily: fonts.mono },
  backBtn: {
    backgroundColor: palette.bgElevated, borderRadius: 20,
    paddingHorizontal: 32, paddingVertical: 14,
    borderWidth: 1, borderColor: palette.borderStrong,
  },
  backBtnText: { color: palette.text, fontSize: 16, fontWeight: '600', fontFamily: fonts.mono },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 24, fontWeight: '700', color: palette.text, marginBottom: 32, textAlign: 'center', fontFamily: fonts.mono },
});
