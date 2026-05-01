import { getCache, setCache } from './cache';
import { getDeviceId } from './device';
import { supabase } from './supabase';
import {
  getAllLocalSentences,
  getAllLocalWords,
  getLocalSentences,
  getLocalWords,
  pushProgressToServer,
  saveProgressLocal,
} from './sync';

export type PracticeWord = {
  id: string;
  topic_id?: string;
  chinese: string;
  pinyin: string;
  english: string;
  russian?: string;
};

export type PracticeSentence = {
  id: string;
  topic_id?: string;
  russian: string;
  chinese_words: string[];
  correct_order: string[];
};

export const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getMeaning = (word: PracticeWord, language: string) =>
  language === 'ru' ? (word.russian ?? word.english) : word.english;

export const loadPracticeWords = async ({
  topicId,
  allWords,
}: {
  topicId?: string;
  allWords?: boolean;
}): Promise<PracticeWord[]> => {
  if (!allWords && !topicId) return [];

  const cacheKey = allWords ? 'words_all' : `words_${topicId}`;
  const cached = getCache<PracticeWord[]>(cacheKey);
  if (cached) return shuffle(cached);

  if (allWords) {
    const local = getAllLocalWords() as PracticeWord[];
    if (local.length > 0) {
      setCache(cacheKey, local);
      return shuffle(local);
    }
  }

  if (!allWords && topicId) {
    const local = getLocalWords(topicId) as PracticeWord[];
    if (local.length > 0) {
      setCache(cacheKey, local);
      return shuffle(local);
    }
  }

  const query = supabase.from('words').select('*');
  const { data, error } = allWords || !topicId ? await query : await query.eq('topic_id', topicId);
  if (error) {
    console.error(error.message);
    return [];
  }

  const words = (data || []) as PracticeWord[];
  setCache(cacheKey, words);
  return shuffle(words);
};

export const loadPracticeSentences = async ({
  topicId,
  allWords,
}: {
  topicId?: string;
  allWords?: boolean;
}): Promise<{ sentences: PracticeSentence[]; wordIdByChinese: Record<string, string> }> => {
  if (!allWords && !topicId) return { sentences: [], wordIdByChinese: {} };

  const sentencesCacheKey = allWords ? 'sentences_all' : `sentences_${topicId}`;
  const wordMapCacheKey = allWords ? 'word_map_all' : `word_map_${topicId}`;
  const cachedSentences = getCache<PracticeSentence[]>(sentencesCacheKey);
  const cachedWordMap = getCache<Record<string, string>>(wordMapCacheKey);

  if (cachedSentences && cachedWordMap) {
    return { sentences: shuffle(cachedSentences), wordIdByChinese: cachedWordMap };
  }

  const localSentences = allWords
    ? getAllLocalSentences() as PracticeSentence[]
    : topicId
    ? getLocalSentences(topicId) as PracticeSentence[]
    : [];

  if (localSentences.length > 0) {
    const localWords = allWords
      ? getAllLocalWords() as PracticeWord[]
      : getLocalWords(topicId as string) as PracticeWord[];
    const wordIdByChinese = buildWordIdMap(localWords);
    setCache(sentencesCacheKey, localSentences);
    setCache(wordMapCacheKey, wordIdByChinese);
    return { sentences: shuffle(localSentences), wordIdByChinese };
  }

  const sentenceQuery = supabase.from('sentences').select('*');
  const wordQuery = supabase.from('words').select('id, chinese');
  const [{ data: sentenceData, error: sentenceError }, { data: wordData, error: wordError }] = await Promise.all([
    allWords || !topicId ? sentenceQuery : sentenceQuery.eq('topic_id', topicId),
    allWords || !topicId ? wordQuery : wordQuery.eq('topic_id', topicId),
  ]);

  if (sentenceError) console.error(sentenceError.message);
  if (wordError) console.error(wordError.message);

  const sentences = (sentenceData || []) as PracticeSentence[];
  const wordIdByChinese = buildWordIdMap((wordData || []) as Pick<PracticeWord, 'id' | 'chinese'>[]);
  setCache(sentencesCacheKey, sentences);
  setCache(wordMapCacheKey, wordIdByChinese);

  return { sentences: shuffle(sentences), wordIdByChinese };
};

export const saveKnownProgress = async (wordId: string, known: boolean, deviceId?: string) => {
  const id = deviceId || await getDeviceId();
  if (!id) return;
  saveProgressLocal(id, wordId, known);
  pushProgressToServer(id, wordId, known);
};

const buildWordIdMap = (words: Pick<PracticeWord, 'id' | 'chinese'>[]) => {
  const mapping: Record<string, string> = {};
  words.forEach((word) => {
    if (word.chinese && word.id) mapping[word.chinese] = word.id;
  });
  return mapping;
};
