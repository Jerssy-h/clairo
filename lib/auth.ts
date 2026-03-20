import { getDeviceId } from './device';

const ADMIN_DEVICE_IDS = (process.env.EXPO_PUBLIC_ADMIN_DEVICE_IDS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const isAdmin = async (): Promise<boolean> => {
  const id = await getDeviceId();
  return ADMIN_DEVICE_IDS.includes(id);
};