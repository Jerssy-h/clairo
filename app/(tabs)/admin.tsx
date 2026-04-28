import LanguagePicker from '@/components/LanguagePicker';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAppTheme } from '@/lib/AppThemeContext';
import { isAdmin } from '@/lib/auth';
import { clearCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
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
  russian: string;
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
  const { palette, fonts, isDark } = useAppTheme();
  const styles = createStyles(palette, fonts);

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
  const [wordRussian, setWordRussian] = useState('');

  const [russian, setRussian] = useState('');
  const [chineseWords, setChineseWords] = useState('');

  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [editSentence, setEditSentence] = useState<Sentence | null>(null);

  useEffect(() => {
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
    const { data } = await supabase.from('topics').select('*').order('sort_order', { ascending: true });
    setTopics(data || []);
  };

  const fetchWords = async () => {
    if (!selectedTopic) return;
    const { data } = await supabase.from('words').select('*').eq('topic_id', selectedTopic.id);
    setWords(data || []);
  };

  const fetchSentences = async () => {
    if (!selectedTopic) return;
    const { data } = await supabase.from('sentences').select('*').eq('topic_id', selectedTopic.id);
    setSentences(data || []);
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
    const { error } = await supabase
      .from('topics')
      .update({
        title: editTopic.title,
        emoji: editTopic.emoji,
        color: editTopic.color,
      })
      .eq('id', editTopic.id);
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
        text: 'Delete',
        style: 'destructive',
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
          clearCache(`word_map_${id}`);
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
    await Promise.all(newTopics.map((t, i) => supabase.from('topics').update({ sort_order: i }).eq('id', t.id)));
  };

  const addWord = async () => {
    if (!selectedTopic) {
      Alert.alert('Select a topic first');
      return;
    }
    if (!chinese || !pinyin || !english || !wordRussian) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }

    const { data: existing } = await supabase
      .from('words')
      .select('id')
      .eq('topic_id', selectedTopic.id)
      .eq('chinese', chinese)
      .limit(1);
    if (existing && existing.length > 0) {
      Alert.alert('Duplicate word', 'That Chinese word already exists in this topic.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('words').insert({
      topic_id: selectedTopic.id,
      chinese,
      pinyin,
      english,
      russian: wordRussian,
    });
    if (error) Alert.alert('Error', error.message);
    else {
      setChinese('');
      setPinyin('');
      setEnglish('');
      setWordRussian('');
      clearCache(`words_${selectedTopic.id}`);
      clearCache(`word_map_${selectedTopic.id}`);
      fetchWords();
    }
    setLoading(false);
  };

  const updateWord = async () => {
    if (!editWord) return;

    const { data: existing } = await supabase
      .from('words')
      .select('id')
      .eq('topic_id', editWord.topic_id)
      .eq('chinese', editWord.chinese)
      .neq('id', editWord.id)
      .limit(1);
    if (existing && existing.length > 0) {
      Alert.alert('Duplicate word', 'That Chinese word already exists in this topic.');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('words')
      .update({
        chinese: editWord.chinese,
        pinyin: editWord.pinyin,
        english: editWord.english,
        russian: editWord.russian,
      })
      .eq('id', editWord.id);
    if (error) Alert.alert('Error', error.message);
    else {
      setEditWord(null);
      clearCache(`words_${editWord.topic_id}`);
      clearCache(`word_map_${editWord.topic_id}`);
      fetchWords();
    }
    setLoading(false);
  };

  const deleteWord = async (id: string) => {
    Alert.alert('Delete Word', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('words').delete().eq('id', id);
          if (selectedTopic) {
            clearCache(`words_${selectedTopic.id}`);
            clearCache(`word_map_${selectedTopic.id}`);
          }
          fetchWords();
        },
      },
    ]);
  };

  const addSentence = async () => {
    if (!selectedTopic) {
      Alert.alert('Select a topic first');
      return;
    }
    if (!russian || !chineseWords) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    const wordsArray = chineseWords.split(' ').filter((w) => w.trim() !== '');
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
      setRussian('');
      setChineseWords('');
      clearCache(`sentences_${selectedTopic.id}`);
      fetchSentences();
    }
    setLoading(false);
  };

  const updateSentence = async () => {
    if (!editSentence) return;
    const wordsArray = editSentence.correct_order;
    setLoading(true);
    const { error } = await supabase
      .from('sentences')
      .update({
        russian: editSentence.russian,
        correct_order: wordsArray,
        chinese_words: [...wordsArray].sort(() => Math.random() - 0.5),
      })
      .eq('id', editSentence.id);
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
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('sentences').delete().eq('id', id);
          if (selectedTopic) clearCache(`sentences_${selectedTopic.id}`);
          fetchSentences();
        },
      },
    ]);
  };

  const renderTopicPicker = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
      {topics.map((topic) => {
        const selected = selectedTopic?.id === topic.id;
        return (
          <TouchableOpacity
            key={topic.id}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => setSelectedTopic(topic)}
          >
            <Text style={styles.chipText}>{topic.emoji} {topic.title}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  if (!authenticated) {
    return (
      <View style={styles.authScreen}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.authCard}>
          <Text style={styles.authMark}>C</Text>
          <Text style={styles.authTitle}>Admin</Text>
          <Text style={styles.authCopy}>Private workspace for topics, words and sentence sets.</Text>
          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            placeholder="Password"
            placeholderTextColor={palette.textFaint}
            value={passwordInput}
            onChangeText={setPasswordInput}
            secureTextEntry
            onSubmitEditing={handleLogin}
          />
          {passwordError ? <Text style={styles.errorText}>Wrong password</Text> : null}
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Enter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Logo size={36} />
            <View>
              <Text style={styles.brandTitle}>CLAIRO</Text>
              <Text style={styles.brandMeta}>admin workspace</Text>
            </View>
          </View>
          <View style={styles.controls}>
            <ThemeToggle />
            <LanguagePicker />
          </View>
        </View>

        <Text style={styles.eyebrow}>PRIVATE</Text>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.copy}>Manage topics, vocabulary and sentence sets in one quiet workspace.</Text>

        <View style={styles.tabBar}>
          {(['topics', 'words', 'sentences'] as const).map((item) => {
            const active = tab === item;
            return (
              <TouchableOpacity key={item} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => setTab(item)}>
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'topics' ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>New topic</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor={palette.textFaint}
                value={topicTitle}
                onChangeText={setTopicTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Emoji"
                placeholderTextColor={palette.textFaint}
                value={topicEmoji}
                onChangeText={setTopicEmoji}
              />
              <View style={styles.colorRow}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorDot, { backgroundColor: color }, topicColor === color && styles.colorSelected]}
                    onPress={() => setTopicColor(color)}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={addTopic} disabled={loading}>
                {loading ? <ActivityIndicator color={palette.bg} /> : <Text style={styles.primaryButtonText}>Add topic</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Your topics</Text>
              {topics.map((topic, index) => (
                <View key={topic.id} style={styles.rowCard}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowEmoji}>{topic.emoji}</Text>
                    <View style={styles.rowContent}>
                      <Text style={styles.rowTitle}>{topic.title}</Text>
                      <Text style={styles.rowSubtext}>sort #{index + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity onPress={() => moveTopic(index, 'up')} style={styles.actionChip}>
                      <Text style={styles.actionChipText}>UP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveTopic(index, 'down')} style={styles.actionChip}>
                      <Text style={styles.actionChipText}>DN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditTopic(topic)} style={styles.actionChip}>
                      <Text style={styles.actionChipText}>EDIT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTopic(topic.id)} style={styles.actionChip}>
                      <Text style={styles.actionChipText}>DEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {tab === 'words' ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Choose topic</Text>
              {renderTopicPicker()}
              <Text style={styles.panelTitle}>New word</Text>
              <TextInput
                style={styles.input}
                placeholder="Chinese"
                placeholderTextColor={palette.textFaint}
                value={chinese}
                onChangeText={setChinese}
              />
              <TextInput
                style={styles.input}
                placeholder="Pinyin"
                placeholderTextColor={palette.textFaint}
                value={pinyin}
                onChangeText={setPinyin}
              />
              <TextInput
                style={styles.input}
                placeholder="English"
                placeholderTextColor={palette.textFaint}
                value={english}
                onChangeText={setEnglish}
              />
              <TextInput
                style={styles.input}
                placeholder="Russian"
                placeholderTextColor={palette.textFaint}
                value={wordRussian}
                onChangeText={setWordRussian}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={addWord} disabled={loading}>
                {loading ? <ActivityIndicator color={palette.bg} /> : <Text style={styles.primaryButtonText}>Add word</Text>}
              </TouchableOpacity>
            </View>

            {selectedTopic ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Words in &quot;{selectedTopic.title}&quot;</Text>
                {words.length === 0 ? (
                  <Text style={styles.emptyText}>No words yet</Text>
                ) : (
                  words.map((word) => (
                    <View key={word.id} style={styles.rowCard}>
                      <View style={styles.rowContentWide}>
                        <Text style={styles.rowChinese}>{word.chinese}</Text>
                        <Text style={styles.rowSubtext}>{word.pinyin} · {word.russian || word.english}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => setEditWord(word)} style={styles.actionChip}>
                          <Text style={styles.actionChipText}>EDIT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteWord(word.id)} style={styles.actionChip}>
                          <Text style={styles.actionChipText}>DEL</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </>
        ) : null}

        {tab === 'sentences' ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Choose topic</Text>
              {renderTopicPicker()}
              <Text style={styles.panelTitle}>New sentence</Text>
              <TextInput
                style={styles.input}
                placeholder="Russian sentence"
                placeholderTextColor={palette.textFaint}
                value={russian}
                onChangeText={setRussian}
              />
              <TextInput
                style={styles.input}
                placeholder="Chinese words separated by spaces"
                placeholderTextColor={palette.textFaint}
                value={chineseWords}
                onChangeText={setChineseWords}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={addSentence} disabled={loading}>
                {loading ? <ActivityIndicator color={palette.bg} /> : <Text style={styles.primaryButtonText}>Add sentence</Text>}
              </TouchableOpacity>
            </View>

            {selectedTopic ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Sentences in &quot;{selectedTopic.title}&quot;</Text>
                {sentences.length === 0 ? (
                  <Text style={styles.emptyText}>No sentences yet</Text>
                ) : (
                  sentences.map((sentence) => (
                    <View key={sentence.id} style={styles.rowCard}>
                      <View style={styles.rowContentWide}>
                        <Text style={styles.rowTitle}>{sentence.russian}</Text>
                        <Text style={styles.rowSubtext}>{sentence.correct_order.join(' ')}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => setEditSentence(sentence)} style={styles.actionChip}>
                          <Text style={styles.actionChipText}>EDIT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteSentence(sentence.id)} style={styles.actionChip}>
                          <Text style={styles.actionChipText}>DEL</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={!!editTopic} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit topic</Text>
            <TextInput
              style={styles.input}
              value={editTopic?.title}
              onChangeText={(value) => setEditTopic((current) => (current ? { ...current, title: value } : null))}
              placeholder="Title"
              placeholderTextColor={palette.textFaint}
            />
            <TextInput
              style={styles.input}
              value={editTopic?.emoji}
              onChangeText={(value) => setEditTopic((current) => (current ? { ...current, emoji: value } : null))}
              placeholder="Emoji"
              placeholderTextColor={palette.textFaint}
            />
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorDot, { backgroundColor: color }, editTopic?.color === color && styles.colorSelected]}
                  onPress={() => setEditTopic((current) => (current ? { ...current, color } : null))}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditTopic(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={updateTopic} disabled={loading}>
                {loading ? <ActivityIndicator color={palette.bg} /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editWord} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit word</Text>
            <TextInput
              style={styles.input}
              value={editWord?.chinese}
              onChangeText={(value) => setEditWord((current) => (current ? { ...current, chinese: value } : null))}
              placeholder="Chinese"
              placeholderTextColor={palette.textFaint}
            />
            <TextInput
              style={styles.input}
              value={editWord?.pinyin}
              onChangeText={(value) => setEditWord((current) => (current ? { ...current, pinyin: value } : null))}
              placeholder="Pinyin"
              placeholderTextColor={palette.textFaint}
            />
            <TextInput
              style={styles.input}
              value={editWord?.english}
              onChangeText={(value) => setEditWord((current) => (current ? { ...current, english: value } : null))}
              placeholder="English"
              placeholderTextColor={palette.textFaint}
            />
            <TextInput
              style={styles.input}
              value={editWord?.russian}
              onChangeText={(value) => setEditWord((current) => (current ? { ...current, russian: value } : null))}
              placeholder="Russian"
              placeholderTextColor={palette.textFaint}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditWord(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={updateWord} disabled={loading}>
                {loading ? <ActivityIndicator color={palette.bg} /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editSentence} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit sentence</Text>
            <TextInput
              style={styles.input}
              value={editSentence?.russian}
              onChangeText={(value) => setEditSentence((current) => (current ? { ...current, russian: value } : null))}
              placeholder="Russian sentence"
              placeholderTextColor={palette.textFaint}
            />
            <TextInput
              style={styles.input}
              value={editSentence?.correct_order.join(' ')}
              onChangeText={(value) =>
                setEditSentence((current) =>
                  current ? { ...current, correct_order: value.split(' ').filter((word) => word.trim() !== '') } : null
                )
              }
              placeholder="Chinese words separated by spaces"
              placeholderTextColor={palette.textFaint}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditSentence(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={updateSentence} disabled={loading}>
                {loading ? <ActivityIndicator color={palette.bg} /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (palette: any, fonts: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg },
    scroll: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 40 },
    authScreen: { flex: 1, backgroundColor: palette.bg, justifyContent: 'center', paddingHorizontal: 20 },
    authCard: {
      backgroundColor: palette.bgElevated,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      borderRadius: 28,
      padding: 24,
    },
    authMark: {
      fontSize: 56,
      color: palette.textMuted,
      fontFamily: fonts.mono,
      marginBottom: 12,
    },
    authTitle: {
      fontSize: 32,
      color: palette.text,
      fontFamily: fonts.mono,
      fontWeight: '700',
      marginBottom: 8,
    },
    authCopy: {
      fontSize: 14,
      color: palette.textMuted,
      fontFamily: fonts.mono,
      lineHeight: 22,
      marginBottom: 18,
    },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    brandTitle: { fontSize: 14, letterSpacing: 2, fontFamily: fonts.mono, fontWeight: '700', color: palette.text },
    brandMeta: { fontSize: 10, letterSpacing: 1.1, fontFamily: fonts.mono, marginTop: 3, color: palette.textMuted },
    controls: { flexDirection: 'row', gap: 8 },
    eyebrow: { fontSize: 11, letterSpacing: 1.4, fontFamily: fonts.mono, marginBottom: 12, color: palette.textMuted },
    title: { fontSize: 32, fontFamily: fonts.mono, fontWeight: '600', marginBottom: 12, color: palette.text },
    copy: { fontSize: 14, lineHeight: 24, fontFamily: fonts.mono, marginBottom: 20, maxWidth: '92%', color: palette.textSoft },
    tabBar: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tabButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabButtonActive: {
      borderColor: palette.borderStrong,
      backgroundColor: palette.surface,
    },
    tabButtonText: {
      color: palette.textMuted,
      fontFamily: fonts.mono,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    tabButtonTextActive: { color: palette.text },
    panel: {
      backgroundColor: palette.bgElevated,
      borderWidth: 1,
      borderColor: palette.borderStrong,
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
    },
    panelTitle: {
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: palette.textMuted,
      fontFamily: fonts.mono,
      fontWeight: '700',
      marginBottom: 12,
    },
    input: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: palette.text,
      fontSize: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: palette.border,
      fontFamily: fonts.mono,
    },
    inputError: { borderColor: palette.text },
    errorText: {
      color: palette.textMuted,
      fontSize: 12,
      fontFamily: fonts.mono,
      marginTop: -2,
      marginBottom: 12,
    },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    colorDot: { width: 26, height: 26, borderRadius: 13 },
    colorSelected: { borderWidth: 2, borderColor: palette.text },
    primaryButton: {
      backgroundColor: palette.text,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.text,
    },
    modalPrimary: {
      flex: 1,
      backgroundColor: palette.text,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.text,
    },
    primaryButtonText: {
      color: palette.bg,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: fonts.mono,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    secondaryButtonText: {
      color: palette.textMuted,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: fonts.mono,
    },
    chipsRow: { paddingBottom: 4, gap: 8, paddingRight: 8 },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginRight: 8,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    chipSelected: {
      borderColor: palette.borderStrong,
      backgroundColor: palette.bgElevated,
    },
    chipText: { color: palette.text, fontSize: 12, fontFamily: fonts.mono, fontWeight: '600' },
    rowCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowEmoji: { fontSize: 20 },
    rowContent: { flex: 1 },
    rowContentWide: { flex: 1, gap: 4 },
    rowTitle: { color: palette.text, fontSize: 16, fontWeight: '600', fontFamily: fonts.mono },
    rowChinese: { color: palette.text, fontSize: 20, fontWeight: '700', fontFamily: fonts.mono },
    rowSubtext: { color: palette.textMuted, fontSize: 12, fontFamily: fonts.mono, lineHeight: 18 },
    rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    actionChip: {
      minWidth: 52,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.bgElevated,
      alignItems: 'center',
    },
    actionChipText: {
      color: palette.text,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: fonts.mono,
    },
    emptyText: {
      color: palette.textMuted,
      fontSize: 13,
      textAlign: 'center',
      paddingVertical: 18,
      fontFamily: fonts.mono,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      backgroundColor: palette.bgElevated,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.borderStrong,
    },
    modalTitle: {
      fontSize: 20,
      color: palette.text,
      marginBottom: 16,
      fontFamily: fonts.mono,
      fontWeight: '700',
    },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  });
