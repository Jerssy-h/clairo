import { useAppTheme } from '@/lib/AppThemeContext';
import { getDeviceId } from '@/lib/device';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getLocalWords, pushProgressToServer, saveProgressLocal } from '@/lib/sync';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  russian?: string;
};

export default function FlashcardScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { palette, fonts } = useAppTheme();
  const { topicId, topicTitle, allWords } = useLocalSearchParams();
  const styles = createStyles(palette, fonts);

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [known, setKnown] = useState(0);
  const [deviceId, setDeviceId] = useState('');

  const isAnimating = useRef(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function setup() {
      const id = await getDeviceId();
      setDeviceId(id);
      const isAllWordsMode = allWords === '1';
      const local = !isAllWordsMode ? getLocalWords(topicId as string) : [];
      let dataWords = local && local.length > 0 ? local : [];

      if (dataWords.length === 0) {
        const query = supabase.from('words').select('*');
        const { data } = isAllWordsMode ? await query : await query.eq('topic_id', topicId);
        dataWords = data || [];
      }
      
      setWords([...dataWords].sort(() => Math.random() - 0.5));
      setLoading(false);
    }
    setup();
  }, [allWords, topicId]);

  const flipCard = () => {
    if (isAnimating.current) return;
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  const finalizeAnswer = (isKnown: boolean) => {
    if (isAnimating.current || words.length === 0) return;
    isAnimating.current = true;
    const direction = isKnown ? 1 : -1;

    const currentWord = words[index];
    if (currentWord && deviceId) {
      saveProgressLocal(deviceId, currentWord.id, isKnown);
      pushProgressToServer(deviceId, currentWord.id, isKnown);
    }

    Animated.parallel([
      Animated.timing(cardTranslateX, {
        toValue: direction * 64,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.94,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      flipAnim.setValue(0);
      setFlipped(false);

      if (isKnown) setKnown(prev => prev + 1);

      if (index >= words.length - 1) {
        setFinished(true);
        isAnimating.current = false;
        return;
      }

      setIndex(prev => prev + 1);

      cardTranslateX.setValue(-direction * 40);
      cardOpacity.setValue(0);
      cardScale.setValue(0.96);

      Animated.parallel([
        Animated.spring(cardTranslateX, {
          toValue: 0,
          speed: 20,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          speed: 20,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (loading) {
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <ActivityIndicator color={palette.text} size="small" />
      </LinearGradient>
    );
  }

  if (words.length === 0 || finished) {
    if (finished) {
       const percentage = Math.round((known / words.length) * 100);
       return (
         <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
           <Text style={styles.finishedEmoji}>{percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}</Text>
           <Text style={styles.finishedTitle}>{t.sessionComplete}</Text>
           <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
           <View style={styles.resultsRow}>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{known}</Text><Text style={styles.resultLabel}>{t.known}</Text></View>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{words.length - known}</Text><Text style={styles.resultLabel}>{t.learning}</Text></View>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{percentage}%</Text><Text style={styles.resultLabel}>{t.score}</Text></View>
           </View>
           <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.text }]} onPress={() => router.back()}>
             <Text style={styles.actionBtnText}>{t.backToTopics}</Text>
           </TouchableOpacity>
         </LinearGradient>
       );
    }
    return (
      <LinearGradient colors={[palette.bgElevated, palette.bg]} style={styles.center}>
        <Text style={styles.decorChar}>学</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.noWordsYet}</Text>
          <Text style={styles.emptySubtext}>{t.addWordsFromAdmin}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {t.goBack}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const card = words[index];
  const meaning = language === 'ru' ? (card.russian ?? card.english) : card.english;
  const progress = ((index + 1) / words.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[palette.bg, palette.bg]} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.bgChar}>{card.chinese[0]}</Text>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicTitle}</Text>
          <Text style={styles.progressText}>{index + 1} / {words.length}</Text>
        </View>
        <View style={styles.knownPill}><Text style={styles.knownText}>✓ {known}</Text></View>
      </View>

      <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: palette.text }]} /></View>

      <View style={styles.cardWrapper}>
        <Animated.View 
          style={{
            flex: 1,
            opacity: cardOpacity,
            transform: [{ translateX: cardTranslateX }, { scale: cardScale }],
          }}
        >
          {/* Front */}
          <Animated.View style={[styles.card, { transform: [{ rotateY: frontInterpolate }], zIndex: flipped ? 0 : 1 }]}>
            <TouchableOpacity style={styles.cardInner} onPress={flipCard} activeOpacity={1}>
              <LinearGradient colors={[palette.surface, palette.bgElevated]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.tapHint}>{t.tapToFlip}</Text>
              <Text style={styles.chineseText}>{card.chinese}</Text>
              <Text style={[styles.pinyinText, { color: palette.textMuted }]}>{card.pinyin}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }], position: 'absolute' }]}>
            <TouchableOpacity style={styles.cardInner} onPress={flipCard} activeOpacity={1}>
              <LinearGradient colors={[palette.surfaceSoft, palette.bgElevated]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.tapHint}>{t.tapToFlip}</Text>
              <Text style={styles.chineseSmall}>{card.chinese}</Text>
              <Text style={[styles.pinyinSmall, { color: palette.textMuted }]}>{card.pinyin}</Text>
              <Text style={styles.meaningText}>{meaning}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonLeft]} onPress={() => finalizeAnswer(false)}>
          <Text style={styles.actionButtonIcon}>✕</Text>
          <Text style={styles.actionButtonLabel}>{t.stillLearning}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonRight]} onPress={() => finalizeAnswer(true)}>
          <Text style={styles.actionButtonIcon}>✓</Text>
          <Text style={styles.actionButtonLabel}>{t.iKnowThis}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  knownPill: { backgroundColor: palette.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: palette.border },
  knownText: { color: palette.text, fontSize: 14, fontWeight: '700', fontFamily: fonts.mono },
  progressBarBg: { height: 3, backgroundColor: palette.surfaceSoft, borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: 3, borderRadius: 2 },
  cardWrapper: { flex: 1, marginBottom: 20 },
  card: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.bgElevated },
  cardBack: { backgroundColor: palette.bgElevated },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  tapHint: { position: 'absolute', top: 20, color: palette.textFaint, fontSize: 11, fontFamily: fonts.mono, letterSpacing: 0.8 },
  chineseText: { fontSize: 80, fontWeight: '700', color: palette.text, textAlign: 'center', marginBottom: 12, fontFamily: fonts.mono },
  pinyinText: { fontSize: 20, fontWeight: '600', fontFamily: fonts.mono },
  chineseSmall: { fontSize: 48, fontWeight: '700', color: palette.text, textAlign: 'center', marginBottom: 8, fontFamily: fonts.mono },
  pinyinSmall: { fontSize: 16, fontWeight: '600', marginBottom: 20, fontFamily: fonts.mono },
  meaningText: { fontSize: 24, fontWeight: '600', color: palette.text, textAlign: 'center', fontFamily: fonts.mono },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionButton: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1 },
  actionButtonLeft: { backgroundColor: palette.bgElevated, borderColor: palette.borderStrong },
  actionButtonRight: { backgroundColor: palette.text, borderColor: palette.text },
  actionButtonIcon: { fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: 4, fontFamily: fonts.mono },
  actionButtonLabel: { fontSize: 11, fontWeight: '600', color: palette.textMuted, fontFamily: fonts.mono, letterSpacing: 0.8 },
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
