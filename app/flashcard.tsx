import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CARDS = [
  { id: '1', chinese: '你好', pinyin: 'nǐ hǎo', english: 'Hello' },
  { id: '2', chinese: '谢谢', pinyin: 'xiè xiè', english: 'Thank you' },
  { id: '3', chinese: '再见', pinyin: 'zài jiàn', english: 'Goodbye' },
  { id: '4', chinese: '对不起', pinyin: 'duì bu qǐ', english: 'Sorry' },
  { id: '5', chinese: '没关系', pinyin: 'méi guān xi', english: 'No problem' },
];

export default function FlashcardScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);

  const card = CARDS[index];
  const isLast = index === CARDS.length - 1;

  const handleNext = (didKnow: boolean) => {
    if (didKnow) setKnown(k => k + 1);
    else setUnknown(u => u + 1);

    if (isLast) {
      alert(`Done! ✅ ${known + (didKnow ? 1 : 0)} known, ${unknown + (!didKnow ? 1 : 0)} to review`);
      router.back();
      return;
    }
    setIndex(i => i + 1);
    setFlipped(false);
  };

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{index + 1} / {CARDS.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((index + 1) / CARDS.length) * 100}%` }]} />
      </View>

      {/* Card */}
      <TouchableOpacity style={styles.card} onPress={() => setFlipped(f => !f)}>
        {!flipped ? (
          <View style={styles.cardInner}>
            <Text style={styles.chinese}>{card.chinese}</Text>
            <Text style={styles.pinyin}>{card.pinyin}</Text>
            <Text style={styles.hint}>Tap to reveal</Text>
          </View>
        ) : (
          <View style={styles.cardInner}>
            <Text style={styles.chinese}>{card.chinese}</Text>
            <Text style={styles.pinyin}>{card.pinyin}</Text>
            <Text style={styles.english}>{card.english}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Buttons */}
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
});