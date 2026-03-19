import { getCache, setCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Sentence = {
  id: string;
  russian: string;
  chinese_words: string[];
  correct_order: string[];
};

export default function SentenceScreen() {
  const router = useRouter();
  const { topicId, topicTitle } = useLocalSearchParams();
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchSentences();
  }, []);

  useEffect(() => {
    if (sentences.length > 0) {
      setAvailable([...sentences[index].chinese_words]);
      setSelected([]);
      setResult(null);
    }
  }, [sentences, index]);

  const fetchSentences = async () => {
    const cacheKey = `sentences_${topicId}`;
    const cached = getCache<Sentence[]>(cacheKey);
    if (cached) {
      setSentences(cached);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('sentences')
      .select('*')
      .eq('topic_id', topicId);
    setSentences(data || []);
    setCache(cacheKey, data || []);
    setLoading(false);
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

  const handleCheck = () => {
    const correct = sentences[index].correct_order;
    const isCorrect = selected.join(' ') === correct.join(' ');
    if (isCorrect) {
      setResult('correct');
      setScore(s => s + 1);
    } else {
        setResult('wrong');
        setTimeout(() => {
          setResult(null);
        }, 10000);
      }
  };

  const handleNext = () => {
    if (index === sentences.length - 1) {
      setFinished(true);
    } else {
      setIndex(i => i + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4F46E5" size="large" />
      </View>
    );
  }

  if (sentences.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyText}>No sentences yet</Text>
        <Text style={styles.emptySubtext}>Add sentences from the Admin panel</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    const percentage = Math.round((score / sentences.length) * 100);
    return (
      <View style={styles.center}>
        <Text style={styles.finishedEmoji}>
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.finishedTitle}>Complete!</Text>
        <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{score}</Text>
            <Text style={styles.resultLabel}>Correct ✅</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{sentences.length - score}</Text>
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

  const sentence = sentences[index];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topicName}>{topicTitle}</Text>
        <Text style={styles.progress}>{index + 1}/{sentences.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((index + 1) / sentences.length) * 100}%` }]} />
      </View>

      {/* Russian sentence */}
      <View style={styles.russianCard}>
        <Text style={styles.russianLabel}>Translate this sentence:</Text>
        <Text style={styles.russianText}>{sentence.russian}</Text>
      </View>

      {/* Answer area */}
      <View style={styles.answerArea}>
        <Text style={styles.areaLabel}>Your answer:</Text>
        <View style={[
          styles.answerBox,
          result === 'correct' && styles.answerCorrect,
          result === 'wrong' && styles.answerWrong,
        ]}>
          {selected.length === 0 ? (
            <Text style={styles.placeholder}>Tap words below to build sentence</Text>
          ) : (
            <View style={styles.wordsRow}>
              {selected.map((word, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.selectedWord}
                  onPress={() => handleRemoveWord(word, i)}
                >
                  <Text style={styles.selectedWordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {result === 'correct' && (
          <Text style={styles.resultText}>✅ Correct!</Text>
        )}
        {result === 'wrong' && (
            <Text style={styles.resultText}>❌ Try again...
        </Text>
)}
      </View>

      {/* Available words */}
      <View style={styles.availableArea}>
        <Text style={styles.areaLabel}>Available words:</Text>
        <View style={styles.wordsRow}>
          {available.map((word, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.availableWord, result !== null && styles.wordDim]}
              onPress={() => handleSelectWord(word, i)}
            >
              <Text style={styles.availableWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buttons */}
      {result === 'correct' ? (
  <TouchableOpacity style={styles.checkBtn} onPress={handleNext}>
    <Text style={styles.checkBtnText}>
      {index === sentences.length - 1 ? 'Finish 🎉' : 'Next →'}
    </Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity
    style={[styles.checkBtn, selected.length === 0 && styles.checkBtnDisabled]}
    onPress={handleCheck}
    disabled={selected.length === 0}
  >
    <Text style={styles.checkBtnText}>Check ✓</Text>
  </TouchableOpacity>
)}
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
    marginBottom: 24,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  russianCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  russianLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  russianText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  answerArea: {
    marginBottom: 20,
  },
  areaLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
  answerBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    minHeight: 70,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  answerCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#1A2A1A',
  },
  answerWrong: {
    borderColor: '#FF4444',
    backgroundColor: '#2A1A1A',
  },
  placeholder: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedWord: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectedWordText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resultText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  availableArea: {
    marginBottom: 24,
  },
  availableWord: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  wordDim: {
    opacity: 0.4,
  },
  availableWordText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  checkBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.4,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#059669',
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