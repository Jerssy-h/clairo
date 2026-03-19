import { getCache, setCache } from '@/lib/cache';
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

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function QuizScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { topicId, topicTitle, topicColor } = useLocalSearchParams();
  const color = (topicColor as string) || '#7C3AED';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    if (words.length > 0) generateOptions(index);
  }, [words, index]);

  const fetchWords = async () => {
    const cacheKey = `words_${topicId}`;
    const cached = getCache<Word[]>(cacheKey);
    if (cached) {
      setWords(shuffle(cached));
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('topic_id', topicId);
    setWords(shuffle(data || []));
    setCache(cacheKey, data || []);
    setLoading(false);
  };

  const generateOptions = (currentIndex: number) => {
    const current = words[currentIndex];
    const others = words.filter((_, i) => i !== currentIndex).map(w => w.english);
    const shuffledOthers = shuffle(others).slice(0, 3);
    const allOptions = shuffle([current.english, ...shuffledOthers]);
    setOptions(allOptions);
    setSelected(null);
  };

  const handleAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    const isCorrect = answer === words[index].english;
    if (isCorrect) {
      setCorrect(c => c + 1);
      setCombo(c => c + 1);
    } else {
      setWrong(w => w + 1);
      setCombo(0);
    }
    setTimeout(() => {
      if (index === words.length - 1) setFinished(true);
      else setIndex(i => i + 1);
    }, 900);
  };

  const getOptionStyle = (option: string) => {
    if (!selected) return styles.optionBtn;
    if (option === words[index].english) return [styles.optionBtn, styles.optionCorrect];
    if (option === selected) return [styles.optionBtn, styles.optionWrong];
    return [styles.optionBtn, styles.optionDim];
  };

  const getOptionTextStyle = (option: string) => {
    if (!selected) return styles.optionText;
    if (option === words[index].english) return [styles.optionText, { color: '#4CAF50' }];
    if (option === selected) return [styles.optionText, { color: '#FF4444' }];
    return [styles.optionText, { opacity: 0.4 }];
  };

  if (loading) {
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </LinearGradient>
    );
  }

  if (words.length < 4) {
    return (
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
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
      <LinearGradient colors={[color, '#0D0D0D']} style={styles.center}>
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
        {combo >= 2 && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>🔥 {combo}x</Text>
          </View>
        )}
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scorePill}>
          <Text style={styles.scoreCorrect}>✓ {correct}</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scoreWrong}>✕ {wrong}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.questionLabel}>What does this mean?</Text>
        <Text style={styles.cardChinese}>{card.chinese}</Text>
        <Text style={[styles.cardPinyin, { color }]}>{card.pinyin}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={getOptionStyle(option)}
            onPress={() => handleAnswer(option)}
            activeOpacity={0.85}
          >
            <Text style={getOptionTextStyle(option)}>{option}</Text>
          </TouchableOpacity>
        ))}
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
  comboBadge: {
    backgroundColor: 'rgba(255,160,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,160,0,0.3)',
  },
  comboText: {
    color: '#FFA000',
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scorePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreCorrect: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  scoreWrong: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  questionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  cardChinese: {
    fontSize: 72,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardPinyin: {
    fontSize: 22,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 10,
  },
  optionBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderColor: '#4CAF50',
  },
  optionWrong: {
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderColor: '#FF4444',
  },
  optionDim: {
    opacity: 0.4,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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