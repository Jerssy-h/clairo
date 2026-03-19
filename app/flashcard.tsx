import { getDeviceId } from '@/lib/device';
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

export default function FlashcardScreen() {
  const router = useRouter();
  const { topicId, topicTitle } = useLocalSearchParams();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [finished, setFinished] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    setup();
  }, []);

  const setup = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    fetchWords();
  };

  const fetchWords = async () => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('topic_id', topicId);
    if (error) console.error(error);
    else setWords(data || []);
    setLoading(false);
  };

  const saveProgress = async (wordId: string, isKnown: boolean) => {
    if (!deviceId) return;
    await supabase.from('progress').upsert({
      device_id: deviceId,
      word_id: wordId,
      known: isKnown,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id,word_id' });
  };

  const handleNext = async (didKnow: boolean) => {
    const currentWord = words[index];
    await saveProgress(currentWord.id, didKnow);

    if (didKnow) setKnown(k => k + 1);
    else setUnknown(u => u + 1);

    if (index === words.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(i => i + 1);
    setFlipped(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4F46E5" size="large" />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyText}>No words in this topic yet</Text>
        <Text style={styles.emptySubtext}>Add words from the Admin panel</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.center}>
        <Text style={styles.finishedEmoji}>🎉</Text>
        <Text style={styles.finishedTitle}>Session Complete!</Text>
        <Text style={styles.finishedSubtitle}>{topicTitle}</Text>
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{known}</Text>
            <Text style={styles.resultLabel}>Known ✅</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumber}>{unknown}</Text>
            <Text style={styles.resultLabel}>Review ❌</Text>
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
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topicName}>{topicTitle}</Text>
        <Text style={styles.progress}>{index + 1}/{words.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((index + 1) / words.length) * 100}%` }]} />
      </View>

      <TouchableOpacity style={styles.card} onPress={() => setFlipped(f => !f)}>
        <View style={styles.cardInner}>
          <Text style={styles.chinese}>{card.chinese}</Text>
          <Text style={styles.pinyin}>{card.pinyin}</Text>
          {flipped ? (
            <Text style={styles.english}>{card.english}</Text>
          ) : (
            <Text style={styles.hint}>Tap to reveal</Text>
          )}
        </View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btnNo} onPress={() => handleNext(false)}>
            <Text style={styles.btnText}>❌ Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnYes} onPress={() => handleNext(true)}>
            <Text style={styles.btnText}>✅ Got it</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 40,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    marginBottom: 40,
  },
  cardInner: {
    alignItems: 'center',
    gap: 16,
  },
  chinese: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pinyin: {
    fontSize: 24,
    color: '#4F46E5',
  },
  english: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#555',
    marginTop: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
  },
  btnNo: {
    flex: 1,
    backgroundColor: '#2A1A1A',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnYes: {
    flex: 1,
    backgroundColor: '#1A2A1A',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    gap: 16,
    marginBottom: 40,
  },
  resultBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  resultNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultLabel: {
    fontSize: 14,
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