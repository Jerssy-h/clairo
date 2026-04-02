import { AppPalette } from '@/constants/theme';
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
  const { topicId, topicTitle } = useLocalSearchParams();

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
      const local = getLocalWords(topicId as string);
      let dataWords = local && local.length > 0 ? local : [];
      
      if (dataWords.length === 0) {
        const { data } = await supabase.from('words').select('*').eq('topic_id', topicId);
        dataWords = data || [];
      }
      
      setWords([...dataWords].sort(() => Math.random() - 0.5));
      setLoading(false);
    }
    setup();
  }, [topicId]);

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
      <LinearGradient colors={[AppPalette.bgElevated, AppPalette.bg]} style={styles.center}>
        <ActivityIndicator color={AppPalette.white} size="large" />
      </LinearGradient>
    );
  }

  if (words.length === 0 || finished) {
    if (finished) {
       const percentage = Math.round((known / words.length) * 100);
       return (
         <LinearGradient colors={[AppPalette.bgElevated, AppPalette.bg]} style={styles.center}>
           <Text style={styles.finishedEmoji}>{percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}</Text>
           <Text style={styles.finishedTitle}>{t.sessionComplete}</Text>
           <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
           <View style={styles.resultsRow}>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{known}</Text><Text style={styles.resultLabel}>{t.known}</Text></View>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{words.length - known}</Text><Text style={styles.resultLabel}>{t.learning}</Text></View>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{percentage}%</Text><Text style={styles.resultLabel}>{t.score}</Text></View>
           </View>
           <TouchableOpacity style={[styles.actionBtn, { backgroundColor: AppPalette.tintStrong }]} onPress={() => router.back()}>
             <Text style={styles.actionBtnText}>{t.backToTopics}</Text>
           </TouchableOpacity>
         </LinearGradient>
       );
    }
    return (
      <LinearGradient colors={[AppPalette.bgElevated, AppPalette.bg]} style={styles.center}>
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
      <LinearGradient colors={[AppPalette.bg, AppPalette.bg]} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.bgChar}>{card.chinese[0]}</Text>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicTitle}</Text>
          <Text style={styles.progressText}>{index + 1} / {words.length}</Text>
        </View>
        <View style={styles.knownPill}><Text style={styles.knownText}>✓ {known}</Text></View>
      </View>

      <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: AppPalette.tintStrong }]} /></View>

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
              <LinearGradient colors={[AppPalette.surface, AppPalette.bgElevated]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.tapHint}>{t.tapToFlip}</Text>
              <Text style={styles.chineseText}>{card.chinese}</Text>
              <Text style={[styles.pinyinText, { color: AppPalette.tintStrong }]}>{card.pinyin}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }], position: 'absolute' }]}>
            <TouchableOpacity style={styles.cardInner} onPress={flipCard} activeOpacity={1}>
              <LinearGradient colors={[AppPalette.surfaceSoft, AppPalette.bgElevated]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.tapHint}>{t.tapToFlip}</Text>
              <Text style={styles.chineseSmall}>{card.chinese}</Text>
              <Text style={[styles.pinyinSmall, { color: AppPalette.tintStrong }]}>{card.pinyin}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppPalette.bg, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bgChar: { position: 'absolute', fontSize: 320, color: 'rgba(255,255,255,0.03)', fontWeight: '900', top: height * 0.05, alignSelf: 'center', lineHeight: 340 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppPalette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: AppPalette.text, fontSize: 18 },
  headerCenter: { flex: 1 },
  topicName: { color: AppPalette.text, fontSize: 16, fontWeight: '700' },
  progressText: { color: AppPalette.textMuted, fontSize: 12, marginTop: 2 },
  knownPill: { backgroundColor: AppPalette.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  knownText: { color: AppPalette.success, fontSize: 14, fontWeight: '700' },
  progressBarBg: { height: 3, backgroundColor: AppPalette.surfaceSoft, borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: 3, borderRadius: 2 },
  cardWrapper: { flex: 1, marginBottom: 20 },
  card: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: AppPalette.border, backgroundColor: AppPalette.bgElevated },
  cardBack: { backgroundColor: AppPalette.bgElevated },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  tapHint: { position: 'absolute', top: 20, color: AppPalette.textFaint, fontSize: 12 },
  chineseText: { fontSize: 80, fontWeight: '900', color: AppPalette.text, textAlign: 'center', marginBottom: 12 },
  pinyinText: { fontSize: 24, fontWeight: '600' },
  chineseSmall: { fontSize: 48, fontWeight: '900', color: AppPalette.text, textAlign: 'center', marginBottom: 8 },
  pinyinSmall: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  meaningText: { fontSize: 28, fontWeight: '700', color: AppPalette.text, textAlign: 'center' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionButton: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1 },
  actionButtonLeft: { backgroundColor: 'rgba(255,142,158,0.12)', borderColor: AppPalette.danger },
  actionButtonRight: { backgroundColor: 'rgba(126,224,161,0.12)', borderColor: AppPalette.success },
  actionButtonIcon: { fontSize: 24, fontWeight: '900', color: AppPalette.text, marginBottom: 4 },
  actionButtonLabel: { fontSize: 12, fontWeight: '600', color: AppPalette.textMuted },
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