import { getCache, setCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const { topicId, topicTitle } = useLocalSearchParams();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);

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
    const others = words
      .filter((_, i) => i !== currentIndex)
      .map(w => w.english);
    const shuffledOthers = shuffle(others).slice(0, 3);
    const allOptions = shuffle([current.english, ...shuffledOthers]);
    setOptions(allOptions);
    setSelected(null);
  };

  const handleAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    const isCorrect = answer === words[index].english;
    if (isCorrect) setCorrect(c => c + 1);
    else setWrong(w => w + 1);

    setTimeout(() => {
      if (index === words.length - 1) {
        setFinished(true);
      } else {
        setIndex(i => i + 1);
      }
    }, 1000);
  };

  const getOptionStyle = (option: string) => {
    if (!selected) return styles.optionBtn;
    if (option === words[index].english) return [styles.optionBtn, styles.optionCorrect];
    if (option === selected) return [styles.optionBtn, styles.optionWrong];
    return [styles.optionBtn, styles.optionDim];
  };

  const getOptionTextStyle = (option: string) => {
    if (!selected) return styles.optionText;
    if (option === words[index].english) return [styles.optionText, styles.optionTextCorrect];
    if (option === selected) return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, styles.optionTextDim];
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4F46E5" size="large" />
      </View>
    );
  }

  if (words.length < 4) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>⚠️</Text>
        <Text style={styles.emptyText}>Need at least 4 words</Text>
        <Text style={styles.emptySubtext}>Add more words to this topic to unlock the quiz</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    const total = correct + wrong;
    const percentage = Math.round((correct / total) * 100);
    return (
      <View style={styles.center}>
        <Text style={styles.finishedEmoji}>
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.finishedTitle}>Quiz Complete!</Text>
        <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{correct}</Text>
            <Text style={styles.resultLabel}>Correct ✅</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{wrong}</Text>
            <Text style={styles.resultLabel}>Wrong ❌</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{percentage}%</Text>
            <Text style={styles.resultLabel}>Score</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back to Topics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = words[index];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topicName}>{topicTitle}</Text>
        <Text style={styles.progress}>{index + 1}/{words.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((index + 1) / words.length) * 100}%` }]} />
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreCorrect}>✅ {correct}</Text>
        <Text style={styles.scoreWrong}>❌ {wrong}</Text>
      </View>

      {/* Question */}
      <View style={styles.card}>
        <Text style={styles.questionLabel}>What does this mean?</Text>
        <Text style={styles.chinese}>{card.chinese}</Text>
        <Text style={styles.pinyin}>{card.pinyin}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={getOptionStyle(option)}
            onPress={() => handleAnswer(option)}
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
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  back: {
    color: '#888',
    fontSize: 16,
  },
  topicName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progress: {
    color: '#888',
    fontSize: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  scoreCorrect: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreWrong: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  questionLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  chinese: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  pinyin: {
    fontSize: 22,
    color: '#4F46E5',
  },
  optionsContainer: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  optionCorrect: {
    backgroundColor: '#1A2A1A',
    borderColor: '#4CAF50',
  },
  optionWrong: {
    backgroundColor: '#2A1A1A',
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
  optionTextCorrect: {
    color: '#4CAF50',
  },
  optionTextWrong: {
    color: '#FF4444',
  },
  optionTextDim: {
    color: '#888',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
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
    color: '#888',
    marginBottom: 30,
  },
  resultsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  resultBox: {
    backgroundColor: '#1A1A1A',
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
    color: '#888',
    marginTop: 4,
  },
  backBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});