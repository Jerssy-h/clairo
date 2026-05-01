import { db } from './db';
import { getDeviceId } from './device';
import { logSupabaseFallback } from './network-debug';
import { recalculateLocalTopicStats } from './offline-topics';
import { supabase } from './supabase';

export const syncAllData = async (): Promise<void> => {
  try {
    const deviceId = await getDeviceId();

    // 1. Темы
    let topics: any[] | null = null;
    const { data: topicsWithCount, error: topicsWithCountError } = await supabase.from('topics_with_count').select('*');
    if (topicsWithCountError) {
      console.log('syncAllData: topics_with_count unavailable, falling back to topics:', topicsWithCountError);
      const { data: baseTopics, error: baseTopicsError } = await supabase.from('topics').select('id, title, emoji, color');
      if (baseTopicsError) throw baseTopicsError;
      topics = (baseTopics || []).map((topic) => ({
        ...topic,
        word_count: 0,
        known_count: 0,
      }));
    } else {
      topics = topicsWithCount;
    }

    if (topics) {
      for (const t of topics) {
        db.runSync(
          `INSERT OR REPLACE INTO topics (id, title, emoji, color, word_count, known_count)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [t.id, t.title, t.emoji, t.color, t.word_count, t.known_count]
        );
      }
    }

    // 2. Слова
    const { data: words } = await supabase.from('words').select('*');
    if (words) {
      for (const w of words) {
        db.runSync(
          `INSERT OR REPLACE INTO words (id, topic_id, chinese, pinyin, english, russian)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [w.id, w.topic_id, w.chinese, w.pinyin, w.english, w.russian ?? null]
        );
      }
    }

    // 3. Предложения
    const { data: sentences } = await supabase.from('sentences').select('*');
    if (sentences) {
      for (const s of sentences) {
        db.runSync(
          `INSERT OR REPLACE INTO sentences (id, topic_id, russian, chinese_words, correct_order)
           VALUES (?, ?, ?, ?, ?)`,
          [
            s.id,
            s.topic_id,
            s.russian,
            JSON.stringify(s.chinese_words),
            JSON.stringify(s.correct_order),
          ]
        );
      }
    }

    // 4. Прогресс пользователя
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('device_id', deviceId);
    if (progress) {
      for (const p of progress) {
        db.runSync(
          `INSERT OR REPLACE INTO progress (device_id, word_id, known, updated_at)
           VALUES (?, ?, ?, ?)`,
          [p.device_id, p.word_id, p.known ? 1 : 0, p.updated_at]
        );
      }
    }

    await recalculateLocalTopicStats();

    console.log('✅ Синхронизация завершена');
  } catch (e) {
    await logSupabaseFallback('syncAllData', e);
  }
};

// Локальные геттеры
export const getLocalWords = (topicId: string) => {
  const rows = db.getAllSync(`SELECT * FROM words WHERE topic_id = ?`, [topicId]);
  return rows as any[];
};

export const getAllLocalWords = () => {
  const rows = db.getAllSync(`SELECT * FROM words`);
  return rows as any[];
};

export const getLocalSentences = (topicId: string) => {
  const rows = db.getAllSync(`SELECT * FROM sentences WHERE topic_id = ?`, [topicId]);
  return rows.map((s: any) => ({
    ...s,
    chinese_words: JSON.parse(s.chinese_words || '[]'),
    correct_order: JSON.parse(s.correct_order || '[]'),
  }));
};

export const getAllLocalSentences = () => {
  const rows = db.getAllSync(`SELECT * FROM sentences`);
  return rows.map((s: any) => ({
    ...s,
    chinese_words: JSON.parse(s.chinese_words || '[]'),
    correct_order: JSON.parse(s.correct_order || '[]'),
  }));
};

export const saveProgressLocal = (deviceId: string, wordId: string, known: boolean) => {
  db.runSync(
    `INSERT OR REPLACE INTO progress (device_id, word_id, known, updated_at)
     VALUES (?, ?, ?, ?)`,
    [deviceId, wordId, known ? 1 : 0, new Date().toISOString()]
  );
};

export const pushProgressToServer = async (deviceId: string, wordId: string, known: boolean) => {
  try {
    await supabase.from('progress').upsert({
      device_id: deviceId,
      word_id: wordId,
      known,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id,word_id' });
  } catch {
    // Офлайн — прогресс уже сохранён локально
  }
};
