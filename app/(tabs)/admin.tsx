import { clearCache } from '@/lib/cache';
import { isAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Topic = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  sort_order: number;
};

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  topic_id: string;
};

type Sentence = {
  id: string;
  russian: string;
  chinese_words: string[];
  correct_order: string[];
  topic_id: string;
};

const COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626', '#0891B2'];
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD ?? '';

export default function AdminScreen() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<'topics' | 'words' | 'sentences'>('topics');

  const [topicTitle, setTopicTitle] = useState('');
  const [topicEmoji, setTopicEmoji] = useState('');
  const [topicColor, setTopicColor] = useState(COLORS[0]);

  const [chinese, setChinese] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [english, setEnglish] = useState('');

  const [russian, setRussian] = useState('');
  const [chineseWords, setChineseWords] = useState('');

  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [editSentence, setEditSentence] = useState<Sentence | null>(null);

  useEffect(() => {
    // Auto-authenticate admin devices (device allowlist is configured via env).
    isAdmin().then((ok) => {
      if (ok) setAuthenticated(true);
    });
  }, []);

  useEffect(() => {
    if (authenticated) fetchTopics();
  }, [authenticated]);

  useEffect(() => {
    if (selectedTopic) {
      fetchWords();
      fetchSentences();
    }
  }, [selectedTopic]);

  const handleLogin = () => {
    if (ADMIN_PASSWORD && passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const fetchTopics = async () => {
    const { data } = await supabase
      .from('topics')
      .select('*')
      .order('sort_order', { ascending: true });
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

  const fetchSentences = async () => {
    if (!selectedTopic) return;
    const { data } = await supabase
      .from('sentences')
      .select('*')
      .eq('topic_id', selectedTopic.id);
    setSentences(data || []);
  };

  // TOPICS
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
      sort_order: topics.length,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      setTopicTitle('');
      setTopicEmoji('');
      clearCache('topics');
      fetchTopics();
    }
    setLoading(false);
  };

  const updateTopic = async () => {
    if (!editTopic) return;
    setLoading(true);
    const { error } = await supabase.from('topics').update({
      title: editTopic.title,
      emoji: editTopic.emoji,
      color: editTopic.color,
    }).eq('id', editTopic.id);
    if (error) Alert.alert('Error', error.message);
    else {
      setEditTopic(null);
      clearCache('topics');
      fetchTopics();
    }
    setLoading(false);
  };

  const deleteTopic = async (id: string) => {
    Alert.alert('Delete Topic', 'This will delete the topic and all its content. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('topics').delete().eq('id', id);
          if (selectedTopic?.id === id) {
            setSelectedTopic(null);
            setWords([]);
            setSentences([]);
          }
          clearCache('topics');
          clearCache(`words_${id}`);
          clearCache(`sentences_${id}`);
          fetchTopics();
        },
      },
    ]);
  };

  const moveTopic = async (index: number, direction: 'up' | 'down') => {
    const newTopics = [...topics];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newTopics.length) return;
    [newTopics[index], newTopics[swapIndex]] = [newTopics[swapIndex], newTopics[index]];
    setTopics(newTopics);
    clearCache('topics');
    await Promise.all(newTopics.map((t, i) =>
      supabase.from('topics').update({ sort_order: i }).eq('id', t.id)
    ));
  };

  // WORDS
  const addWord = async () => {
    if (!selectedTopic) { Alert.alert('Select a topic first'); return; }
    if (!chinese || !pinyin || !english) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('words').insert({
      topic_id: selectedTopic.id,
      chinese, pinyin, english,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      setChinese(''); setPinyin(''); setEnglish('');
      clearCache(`words_${selectedTopic.id}`);
      fetchWords();
    }
    setLoading(false);
  };

  const updateWord = async () => {
    if (!editWord) return;
    setLoading(true);
    const { error } = await supabase.from('words').update({
      chinese: editWord.chinese,
      pinyin: editWord.pinyin,
      english: editWord.english,
    }).eq('id', editWord.id);
    if (error) Alert.alert('Error', error.message);
    else {
      setEditWord(null);
      clearCache(`words_${editWord.topic_id}`);
      fetchWords();
    }
    setLoading(false);
  };

  const deleteWord = async (id: string) => {
    Alert.alert('Delete Word', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('words').delete().eq('id', id);
          if (selectedTopic) clearCache(`words_${selectedTopic.id}`);
          fetchWords();
        },
      },
    ]);
  };

  // SENTENCES
  const addSentence = async () => {
    if (!selectedTopic) { Alert.alert('Select a topic first'); return; }
    if (!russian || !chineseWords) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    const wordsArray = chineseWords.split(' ').filter(w => w.trim() !== '');
    if (wordsArray.length < 2) {
      Alert.alert('Too short', 'Add at least 2 Chinese words');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('sentences').insert({
      topic_id: selectedTopic.id,
      russian,
      chinese_words: [...wordsArray].sort(() => Math.random() - 0.5),
      correct_order: wordsArray,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      setRussian(''); setChineseWords('');
      clearCache(`sentences_${selectedTopic.id}`);
      fetchSentences();
    }
    setLoading(false);
  };

  const updateSentence = async () => {
    if (!editSentence) return;
    const wordsArray = editSentence.correct_order;
    setLoading(true);
    const { error } = await supabase.from('sentences').update({
      russian: editSentence.russian,
      correct_order: wordsArray,
      chinese_words: [...wordsArray].sort(() => Math.random() - 0.5),
    }).eq('id', editSentence.id);
    if (error) Alert.alert('Error', error.message);
    else {
      setEditSentence(null);
      clearCache(`sentences_${editSentence.topic_id}`);
      fetchSentences();
    }
    setLoading(false);
  };

  const deleteSentence = async (id: string) => {
    Alert.alert('Delete Sentence', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('sentences').delete().eq('id', id);
          if (selectedTopic) clearCache(`sentences_${selectedTopic.id}`);
          fetchSentences();
        },
      },
    ]);
  };

  if (!authenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authEmoji}>🔐</Text>
        <Text style={styles.authTitle}>Admin</Text>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Password"
          placeholderTextColor="#555"
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
          onSubmitEditing={handleLogin}
        />
        {passwordError && <Text style={styles.errorText}>Wrong password</Text>}
        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={styles.btnText}>Enter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin</Text>
      </View>

      <View style={styles.tabBar}>
        {(['topics', 'words', 'sentences'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* TOPICS TAB */}
        {tab === 'topics' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Topic</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#555"
              value={topicTitle}
              onChangeText={setTopicTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Emoji"
              placeholderTextColor="#555"
              value={topicEmoji}
              onChangeText={setTopicEmoji}
            />
            <View style={styles.colorRow}>
              {COLORS.map(c => (
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

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Your Topics</Text>
            {topics.map((t, i) => (
              <View key={t.id} style={styles.row}>
                <View style={[styles.rowAccent, { backgroundColor: t.color }]} />
                <Text style={styles.rowEmoji}>{t.emoji}</Text>
                <Text style={styles.rowTitle}>{t.title}</Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => moveTopic(i, 'up')} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveTopic(i, 'down')} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditTopic(t)} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTopic(t.id)} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* WORDS TAB */}
        {tab === 'words' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {topics.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, selectedTopic?.id === t.id && styles.chipSelected]}
                  onPress={() => setSelectedTopic(t)}
                >
                  <Text style={styles.chipText}>{t.emoji} {t.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Add Word</Text>
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

            {selectedTopic && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  Words in &quot;{selectedTopic.title}&quot; ({words.length})
                </Text>
                {words.length === 0 ? (
                  <Text style={styles.emptyText}>No words yet</Text>
                ) : (
                  words.map(w => (
                    <View key={w.id} style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowChinese}>{w.chinese}</Text>
                        <Text style={styles.rowPinyin}>{w.pinyin} · {w.english}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => setEditWord(w)} style={styles.iconBtn}>
                          <Text style={styles.iconBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteWord(w.id)} style={styles.iconBtn}>
                          <Text style={styles.iconBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* SENTENCES TAB */}
        {tab === 'sentences' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {topics.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, selectedTopic?.id === t.id && styles.chipSelected]}
                  onPress={() => setSelectedTopic(t)}
                >
                  <Text style={styles.chipText}>{t.emoji} {t.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Add Sentence</Text>
            <TextInput
              style={styles.input}
              placeholder="Russian sentence"
              placeholderTextColor="#555"
              value={russian}
              onChangeText={setRussian}
            />
            <TextInput
              style={styles.input}
              placeholder="Chinese words (space separated, correct order)"
              placeholderTextColor="#555"
              value={chineseWords}
              onChangeText={setChineseWords}
            />
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669' }]} onPress={addSentence} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>+ Add Sentence</Text>}
            </TouchableOpacity>

            {selectedTopic && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  Sentences in &quot;{selectedTopic.title}&quot; ({sentences.length})
                </Text>
                {sentences.length === 0 ? (
                  <Text style={styles.emptyText}>No sentences yet</Text>
                ) : (
                  sentences.map(s => (
                    <View key={s.id} style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{s.russian}</Text>
                        <Text style={styles.rowPinyin}>{s.correct_order.join(' ')}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => setEditSentence(s)} style={styles.iconBtn}>
                          <Text style={styles.iconBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteSentence(s.id)} style={styles.iconBtn}>
                          <Text style={styles.iconBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Topic Modal */}
      <Modal visible={!!editTopic} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Topic</Text>
            <TextInput
              style={styles.input}
              value={editTopic?.title}
              onChangeText={v => setEditTopic(e => e ? { ...e, title: v } : null)}
              placeholder="Title"
              placeholderTextColor="#555"
            />
            <TextInput
              style={styles.input}
              value={editTopic?.emoji}
              onChangeText={v => setEditTopic(e => e ? { ...e, emoji: v } : null)}
              placeholder="Emoji"
              placeholderTextColor="#555"
            />
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, editTopic?.color === c && styles.colorSelected]}
                  onPress={() => setEditTopic(e => e ? { ...e, color: c } : null)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditTopic(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={updateTopic} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Word Modal */}
      <Modal visible={!!editWord} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Word</Text>
            <TextInput
              style={styles.input}
              value={editWord?.chinese}
              onChangeText={v => setEditWord(e => e ? { ...e, chinese: v } : null)}
              placeholder="Chinese"
              placeholderTextColor="#555"
            />
            <TextInput
              style={styles.input}
              value={editWord?.pinyin}
              onChangeText={v => setEditWord(e => e ? { ...e, pinyin: v } : null)}
              placeholder="Pinyin"
              placeholderTextColor="#555"
            />
            <TextInput
              style={styles.input}
              value={editWord?.english}
              onChangeText={v => setEditWord(e => e ? { ...e, english: v } : null)}
              placeholder="English"
              placeholderTextColor="#555"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditWord(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={updateWord} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Sentence Modal */}
      <Modal visible={!!editSentence} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Sentence</Text>
            <TextInput
              style={styles.input}
              value={editSentence?.russian}
              onChangeText={v => setEditSentence(e => e ? { ...e, russian: v } : null)}
              placeholder="Russian sentence"
              placeholderTextColor="#555"
            />
            <TextInput
              style={styles.input}
              value={editSentence?.correct_order.join(' ')}
              onChangeText={v => setEditSentence(e => e ? { ...e, correct_order: v.split(' ').filter(w => w.trim() !== '') } : null)}
              placeholder="Chinese words (space separated)"
              placeholderTextColor="#555"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditSentence(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669' }]} onPress={updateSentence} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  authEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 13,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  btn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  rowAccent: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  rowEmoji: {
    fontSize: 18,
  },
  rowTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  rowChinese: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rowPinyin: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  iconBtnText: {
    fontSize: 16,
  },
  chip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#1a1a3a',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
});