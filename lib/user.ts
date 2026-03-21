import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from './device';
import { supabase } from './supabase';

const USERNAME_KEY = 'clairo_username';
const ONBOARDING_KEY = 'clairo_onboarding_done';

export const getUsername = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(USERNAME_KEY);
};

export const setUsername = async (name: string): Promise<void> => {
  await AsyncStorage.setItem(USERNAME_KEY, name.trim());
};

export const isOnboardingDone = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
};

export const markOnboardingDone = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
};

export const syncUsernameToSupabase = async (name: string): Promise<void> => {
  const trimmed = name.trim();
  if (!trimmed) return;

  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.from('profiles').upsert(
      {
        device_id: deviceId,
        username: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' }
    );

    // Keep onboarding flow resilient even if backend schema/policies are not ready.
    if (error) {
      const isRlsBlocked = /row-level security policy/i.test(error.message || '');
      if (!isRlsBlocked) {
        console.warn('Username sync skipped:', error.message);
      }
    }
  } catch (err) {
    console.warn('Username sync failed:', err);
  }
};