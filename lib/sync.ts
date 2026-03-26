import { db } from './db';
import { getDeviceId } from './device';
import { supabase } from './supabase';

export const syncAllData = async (): Promise<void> => {
  try {
    const deviceId = await getDeviceId();

    // 1. Темы
    const { data: topics } = await supabase.from('topics_with_count').select('*');
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

    console.log('✅ Синхронизация завершена');
  } catch (e) {
    console.log('⚠️ Офлайн — используем локальные данные');
  }
};

// Локальные геттеры
export const getLocalWords = (topicId: string) => {
  const rows = db.getAllSync(`SELECT * FROM words WHERE topic_id = ?`, [topicId]);
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