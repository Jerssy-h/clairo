type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

const cache = new Map<string, CacheEntry<any>>();

// Different TTLs for different data types:
// - topics/progress: short (30s) — needs fresh progress counts
// - words/sentences: long (10min) — content never changes mid-session
const TTL = {
  default:   30 * 1000,        // 30 seconds
  content:   10 * 60 * 1000,   // 10 minutes — words, sentences, word_map
  permanent: 60 * 60 * 1000,   // 1 hour — almost never stale
};

function getTTL(key: string): number {
  if (
    key.startsWith('words_') ||
    key.startsWith('sentences_') ||
    key.startsWith('word_map_')
  ) {
    return TTL.content;
  }
  return TTL.default;
}

export const setCache = <T>(key: string, data: T, ttlMs?: number) => {
  const ttl = ttlMs ?? getTTL(key);
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

export const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
};

export const clearCache = (key: string) => {
  // Only clear topics/progress — never clear content caches
  if (
    key.startsWith('words_') ||
    key.startsWith('sentences_') ||
    key.startsWith('word_map_')
  ) {
    return; // Ignore — content is stable
  }
  cache.delete(key);
};

// Force clear everything (e.g. after admin edits content)
export const clearAllCache = () => {
  cache.clear();
};

// Force clear content for a specific topic (call after admin saves words/sentences)
export const clearTopicContent = (topicId: string) => {
  cache.delete(`words_${topicId}`);
  cache.delete(`sentences_${topicId}`);
  cache.delete(`word_map_${topicId}`);
};