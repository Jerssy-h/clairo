import { db } from './db';
import { getDeviceId } from './device';
import { logSupabaseFallback } from './network-debug';
import { supabase } from './supabase';

type Topic = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  word_count: number;
  known_count: number;
};

export const getLocalTopics = (): Topic[] => {
  try {
    const data = db.getAllSync('SELECT * FROM topics');
    return data as Topic[];
  } catch (e) {
    console.log('Local DB error:', e);
    return [];
  }
};

const saveTopicsToLocal = (topics: Topic[]) => {
  for (const t of topics) {
    db.runSync(
      `INSERT OR REPLACE INTO topics 
      (id, title, emoji, color, word_count, known_count)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.emoji, t.color, t.word_count, t.known_count]
    );
  }
};

export const recalculateLocalTopicStats = async (): Promise<Topic[]> => {
  const deviceId = await getDeviceId();
  const topics = getLocalTopics();

  const wordRows = db.getAllSync(
    `SELECT topic_id, COUNT(*) as word_count
     FROM words
     GROUP BY topic_id`
  ) as { topic_id: string; word_count: number }[];

  const knownRows = db.getAllSync(
    `SELECT w.topic_id as topic_id, COUNT(*) as known_count
     FROM progress p
     JOIN words w ON w.id = p.word_id
     WHERE p.device_id = ? AND p.known = 1
     GROUP BY w.topic_id`,
    [deviceId]
  ) as { topic_id: string; known_count: number }[];

  const wordCountByTopic = new Map(wordRows.map((row) => [row.topic_id, Number(row.word_count) || 0]));
  const knownCountByTopic = new Map(knownRows.map((row) => [row.topic_id, Number(row.known_count) || 0]));

  const enrichedTopics = topics.map((topic) => ({
    ...topic,
    word_count: wordCountByTopic.get(topic.id) ?? topic.word_count ?? 0,
    known_count: knownCountByTopic.get(topic.id) ?? topic.known_count ?? 0,
  }));

  saveTopicsToLocal(enrichedTopics);
  return enrichedTopics;
};

export const fetchAndCacheTopics = async (): Promise<Topic[]> => {
  try {
    const { data, error } = await supabase
      .from('topics_with_count')
      .select('*');

    if (error) throw error;

    const topics = (data || []) as Topic[];
    saveTopicsToLocal(topics);

    return topics;
  } catch (e) {
    console.log('fetchAndCacheTopics: topics_with_count unavailable, trying base tables:', e);
  }

  try {
    const deviceId = await getDeviceId();
    const [{ data: topicRows, error: topicsError }, { data: wordRows, error: wordsError }, { data: progressRows, error: progressError }] = await Promise.all([
      supabase.from('topics').select('id, title, emoji, color, sort_order').order('sort_order', { ascending: true }),
      supabase.from('words').select('id, topic_id'),
      supabase.from('progress').select('word_id, known').eq('device_id', deviceId).eq('known', true),
    ]);

    if (topicsError) throw topicsError;
    if (wordsError) throw wordsError;
    if (progressError) throw progressError;

    const words = (wordRows || []) as { id: string; topic_id: string | null }[];
    const knownWordIds = new Set(((progressRows || []) as { word_id: string }[]).map((row) => row.word_id));

    const countsByTopic = new Map<string, { word_count: number; known_count: number }>();
    for (const word of words) {
      if (!word.topic_id) continue;
      const entry = countsByTopic.get(word.topic_id) || { word_count: 0, known_count: 0 };
      entry.word_count += 1;
      if (knownWordIds.has(word.id)) entry.known_count += 1;
      countsByTopic.set(word.topic_id, entry);
    }

    const topics = ((topicRows || []) as { id: string; title: string; emoji: string; color: string }[]).map((topic) => {
      const counts = countsByTopic.get(topic.id) || { word_count: 0, known_count: 0 };
      return {
        ...topic,
        word_count: counts.word_count,
        known_count: counts.known_count,
      };
    });

    saveTopicsToLocal(topics);
    return topics;
  } catch (e) {
    await logSupabaseFallback('fetchAndCacheTopics', e);
    return recalculateLocalTopicStats();
  }
};
