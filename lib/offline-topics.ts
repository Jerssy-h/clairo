import { db } from './db';
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

export const fetchAndCacheTopics = async (): Promise<Topic[]> => {
  try {
    const { data, error } = await supabase
      .from('topics_with_count')
      .select('*');

    if (error) throw error;

    const topics = (data || []) as Topic[];

    for (const t of topics) {
      db.runSync(
        `INSERT OR REPLACE INTO topics 
        (id, title, emoji, color, word_count, known_count)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.title, t.emoji, t.color, t.word_count, t.known_count]
      );
    }

    return topics;
  } catch (e) {
    console.log('Offline → using SQLite');
    return getLocalTopics();
  }
};