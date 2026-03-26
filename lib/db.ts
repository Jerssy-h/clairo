import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('clairo.db');

export const initDB = async (): Promise<void> => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      emoji TEXT,
      color TEXT,
      word_count INTEGER DEFAULT 0,
      known_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY NOT NULL,
      topic_id TEXT,
      chinese TEXT,
      pinyin TEXT,
      english TEXT,
      russian TEXT
    );
    CREATE TABLE IF NOT EXISTS sentences (
      id TEXT PRIMARY KEY NOT NULL,
      topic_id TEXT,
      russian TEXT,
      chinese_words TEXT,
      correct_order TEXT
    );
    CREATE TABLE IF NOT EXISTS progress (
      device_id TEXT NOT NULL,
      word_id TEXT NOT NULL,
      known INTEGER DEFAULT 0,
      updated_at TEXT,
      PRIMARY KEY (device_id, word_id)
    );
  `);
};