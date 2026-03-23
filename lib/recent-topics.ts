import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_TOPICS_KEY = 'recent_topic_ids';
const MAX_RECENT_TOPICS = 6;

export const getRecentTopicIds = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(RECENT_TOPICS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const pushRecentTopic = async (topicId: string) => {
  if (!topicId) return;

  const existing = await getRecentTopicIds();
  const next = [topicId, ...existing.filter((id) => id !== topicId)].slice(0, MAX_RECENT_TOPICS);
  await AsyncStorage.setItem(RECENT_TOPICS_KEY, JSON.stringify(next));
};