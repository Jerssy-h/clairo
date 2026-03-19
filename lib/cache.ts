type CacheEntry<T> = {
    data: T;
    timestamp: number;
  };
  
  const cache = new Map<string, CacheEntry<any>>();
  const TTL = 60 * 1000; // 1 minute
  
  export const setCache = <T>(key: string, data: T) => {
    cache.set(key, { data, timestamp: Date.now() });
  };
  
  export const getCache = <T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL) {
      cache.delete(key);
      return null;
    }
    return entry.data as T;
  };
  
  export const clearCache = (key: string) => {
    cache.delete(key);
  };