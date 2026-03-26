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
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

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
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#7C3AED';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [known, setKnown] = useState(0);
  const [deviceId, setDeviceId] = useState('');

  const isAnimating = useRef(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

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
      useNativeDriver: true, // Здесь Native Driver безопасен, так как нет жестов
    }).start();
    setFlipped(!flipped);
  };

  const swipeCard = (isKnown: boolean) => {
    if (isAnimating.current || words.length === 0) return;
    isAnimating.current = true;

    const currentWord = words[index];
    if (currentWord && deviceId) {
      saveProgressLocal(deviceId, currentWord.id, isKnown);
      pushProgressToServer(deviceId, currentWord.id, isKnown);
    }

    const toValue = isKnown ? width * 1.5 : -width * 1.5;

    Animated.timing(swipeAnim, {
      toValue,
      duration: 300,
      // ИСПРАВЛЕНИЕ 1: Отключаем аппаратное ускорение для синхронизации с JS-потоком PanResponder
      useNativeDriver: false, 
    }).start(() => {
      swipeAnim.setValue(0);
      flipAnim.setValue(0);
      setFlipped(false);

      if (isKnown) setKnown(prev => prev + 1);

      if (index >= words.length - 1) {
        setFinished(true);
      } else {
        setIndex(prev => prev + 1);
      }

      setTimeout(() => {
        isAnimating.current = false;
      }, 50);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => 
        !isAnimating.current && Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { dx }) => {
        swipeAnim.setValue(dx);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const swipeThreshold = 120;
        const velocityThreshold = 0.5;

        if (dx > swipeThreshold || vx > velocityThreshold) {
          swipeCard(true);
        } else if (dx < -swipeThreshold || vx < -velocityThreshold) {
          swipeCard(false);
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            // ИСПРАВЛЕНИЕ 2: Также отключаем Native Driver при возврате карточки
            useNativeDriver: false, 
            bounciness: 10
          }).start();
        }
      },
    })
  ).current;

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const rotate = swipeAnim.interpolate({ 
    inputRange: [-width / 2, 0, width / 2], 
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  if (loading) {
    return (
      <LinearGradient colors={[color, AppPalette.bg]} style={styles.center}>
        <ActivityIndicator color={AppPalette.white} size="large" />
      </LinearGradient>
    );
  }

  if (words.length === 0 || finished) {
    if (finished) {
       const percentage = Math.round((known / words.length) * 100);
       return (
         <LinearGradient colors={[color, AppPalette.bg]} style={styles.center}>
           <Text style={styles.finishedEmoji}>{percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}</Text>
           <Text style={styles.finishedTitle}>{t.sessionComplete}</Text>
           <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
           <View style={styles.resultsRow}>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{known}</Text><Text style={styles.resultLabel}>{t.known}</Text></View>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{words.length - known}</Text><Text style={styles.resultLabel}>{t.learning}</Text></View>
             <View style={styles.resultBox}><Text style={styles.resultNumber}>{percentage}%</Text><Text style={styles.resultLabel}>{t.score}</Text></View>
           </View>
           <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={() => router.back()}>
             <Text style={styles.actionBtnText}>{t.backToTopics}</Text>
           </TouchableOpacity>
         </LinearGradient>
       );
    }
    return (
      <LinearGradient colors={[color, AppPalette.bg]} style={styles.center}>
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
      <LinearGradient colors={[color + 'CC', color + '36', AppPalette.bg]} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.bgChar}>{card.chinese[0]}</Text>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicTitle}</Text>
          <Text style={styles.progressText}>{index + 1} / {words.length}</Text>
        </View>
        <View style={styles.knownPill}><Text style={styles.knownText}>✓ {known}</Text></View>
      </View>

      <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} /></View>

      <View style={styles.hintsRow}>
        <Text style={styles.hintLeft}>← {t.stillLearning}</Text>
        <Text style={styles.hintRight}>{t.iKnowThis} →</Text>
      </View>

      <View style={styles.cardWrapper}>
        <Animated.View 
          style={[{ flex: 1, transform: [{ translateX: swipeAnim }, { rotate }] }]} 
          {...panResponder.panHandlers}
        >
          {/* Front */}
          <Animated.View style={[styles.card, { transform: [{ rotateY: frontInterpolate }], zIndex: flipped ? 0 : 1 }]}>
            <TouchableOpacity style={styles.cardInner} onPress={flipCard} activeOpacity={1}>
              <LinearGradient colors={[color + '33', AppPalette.bgElevated]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.tapHint}>{t.tapToFlip}</Text>
              <Text style={styles.chineseText}>{card.chinese}</Text>
              <Text style={[styles.pinyinText, { color }]}>{card.pinyin}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }], position: 'absolute' }]}>
            <TouchableOpacity style={styles.cardInner} onPress={flipCard} activeOpacity={1}>
              <LinearGradient colors={[color + '44', AppPalette.bgElevated]} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.tapHint}>{t.tapToFlip}</Text>
              <Text style={styles.chineseSmall}>{card.chinese}</Text>
              <Text style={[styles.pinyinSmall, { color }]}>{card.pinyin}</Text>
              <Text style={styles.meaningText}>{meaning}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonLeft]} onPress={() => swipeCard(false)}>
          <Text style={styles.actionButtonIcon}>✕</Text>
          <Text style={styles.actionButtonLabel}>{t.stillLearning}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonRight]} onPress={() => swipeCard(true)}>
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
  bgChar: { position: 'absolute', fontSize: 320, color: 'rgba(255,255,255,0.05)', fontWeight: '900', top: height * 0.05, alignSelf: 'center', lineHeight: 340 },
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
  hintsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  hintLeft: { color: AppPalette.danger, fontSize: 12, fontWeight: '600' },
  hintRight: { color: AppPalette.success, fontSize: 12, fontWeight: '600' },
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
  decorChar: { fontSize: 120, color: 'rgba(255,255,255,0.16)', fontWeight: '900', marginBottom: 24 },
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