import * as Application from 'expo-application';
import { Platform } from 'react-native';

export const getDeviceId = async (): Promise<string> => {
  if (Platform.OS === 'ios') {
    return Application.getIosIdForVendorAsync().then(id => id || 'unknown');
  }
  return Application.getAndroidId() || 'unknown';
};