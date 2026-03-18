import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type Topic = {
  id: string;
  title: string;
  emoji: string;
  color: string;
};

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  topic_id: string;
};

const COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626', '#0891B2'];

export default function AdminScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);

  const [topicTitle, setTopicTitle] = useState('');
  const [topicEmoji, setTopicEmoji] = useState('');
  const [topicColor, setTopicColor] = useState(COLORS[0]);

  const [chinese, setChinese] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [english, setEnglish] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchWords();
  }, [selectedTopic]);

  const fetchTopics = async () => {
    const { data } = await supabase.from('topics').select('*');
    setTopics(data || []);
  };

  const fetchWords = async () => {
    if (!selectedTopic) return;
    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('topic_id', selectedTopic.id);
    setWords(data || []);
  };

  const addTopic = async () => {
    if (!topicTitle || !topicEmoji) {
      Alert.alert('Missing fields', 'Please fill in title and emoji');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('topics').insert({
      title: topicTitle,
      emoji: topicEmoji,
      color: topicColor,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('✅ Topic added!');
      setTopicTitle('');
      setTopicEmoji('');
      fetchTopics();
    }
    setLoading(false);
  };

  const deleteTopic = async (id: string) => {
    Alert.alert(
      'Delete Topic',
      'This will delete the topic and all its words. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('topics').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
            else {
              fetchTopics();
              if (selectedTopic?.id === id) {
                setSelectedTopic(null);
                setWords([]);
              }
            }
          },
        },
      ]
    );
  };

  const addWord = async () => {
    if (!selectedTopic) {
      Alert.alert('Select a topic first');
      return;
    }
    if (!chinese || !pinyin || !english) {
      Alert.alert('Missing fields', 'Please fill in all word fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('words').insert({
      topic_id: selectedTopic.id,
      chinese,
      pinyin,
      english,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('✅ Word added!');
      setChinese('');
      setPinyin('');
      setEnglish('');
      fetchWords();
    }
    setLoading(false);
  };

  const deleteWord = async (id: string) => {
    Alert.alert(
      'Delete Word',
      'Are you sure you want to delete this word?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('words').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
            else fetchWords();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Admin Panel</Text>

      {/* Add Topic Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Topic</Text>
        <TextInput
          style={styles.input}
          placeholder="Topic title (e.g. Greetings)"
          placeholderTextColor="#555"
          value={topicTitle}
          onChangeText={setTopicTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Emoji (e.g. 👋)"
          placeholderTextColor="#555"
          value={topicEmoji}
          onChangeText={setTopicEmoji}
        />
        <Text style={styles.label}>Pick a color:</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, topicColor === c && styles.colorSelected]}
              onPress={() => setTopicColor(c)}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={addTopic} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>+ Add Topic</Text>}
        </TouchableOpacity>
      </View>

      {/* Topics List with Delete */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Topics</Text>
        {topics.length === 0 ? (
          <Text style={styles.emptyText}>No topics yet. Add one above!</Text>
        ) : (
          topics.map((t) => (
            <View key={t.id} style={styles.topicRow}>
              <View style={[styles.topicColorBar, { backgroundColor: t.color }]} />
              <Text style={styles.topicRowEmoji}>{t.emoji}</Text>
              <Text style={styles.topicRowTitle}>{t.title}</Text>
              <TouchableOpacity onPress={() => deleteTopic(t.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>❌</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Add Word Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Word</Text>
        <Text style={styles.label}>Select topic:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll}>
          {topics.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.topicChip, selectedTopic?.id === t.id && styles.topicChipSelected]}
              onPress={() => setSelectedTopic(t)}
            >
              <Text style={styles.topicChipText}>{t.emoji} {t.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput
          style={styles.input}
          placeholder="Chinese (e.g. 你好)"
          placeholderTextColor="#555"
          value={chinese}
          onChangeText={setChinese}
        />
        <TextInput
          style={styles.input}
          placeholder="Pinyin (e.g. nǐ hǎo)"
          placeholderTextColor="#555"
          value={pinyin}
          onChangeText={setPinyin}
        />
        <TextInput
          style={styles.input}
          placeholder="English (e.g. Hello)"
          placeholderTextColor="#555"
          value={english}
          onChangeText={setEnglish}
        />
        <TouchableOpacity style={styles.btn} onPress={addWord} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>+ Add Word</Text>}
        </TouchableOpacity>
      </View>

      {/* Words List with Delete */}
      {selectedTopic && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Words in "{selectedTopic.title}"</Text>
          {words.length === 0 ? (
            <Text style={styles.emptyText}>No words yet in this topic.</Text>
          ) : (
            words.map((w) => (
              <View key={w.id} style={styles.topicRow}>
                <Text style={styles.wordChinese}>{w.chinese}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicRowTitle}>{w.english}</Text>
                  <Text style={styles.wordPinyin}>{w.pinyin}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteWord(w.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>❌</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F0F0F',
    borderRadius: 10,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  btn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  topicColorBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 10,
  },
  topicRowEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  topicRowTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  topicScroll: {
    marginBottom: 16,
  },
  topicChip: {
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topicChipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#1a1a3a',
  },
  topicChipText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  wordChinese: {
    fontSize: 22,
    color: '#FFFFFF',
    marginRight: 12,
    fontWeight: '700',
  },
  wordPinyin: {
    color: '#4F46E5',
    fontSize: 12,
    marginTop: 2,
  },
});