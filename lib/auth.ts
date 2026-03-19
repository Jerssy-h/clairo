import { getDeviceId } from './device';

const ADMIN_DEVICE_IDS = [
  '004BBA48-C6B0-458B-8B4B-7365E968F374', // Emir's iPhone
];

export const isAdmin = async (): Promise<boolean> => {
  const id = await getDeviceId();
  return ADMIN_DEVICE_IDS.includes(id);
};