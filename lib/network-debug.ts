import NetInfo from '@react-native-community/netinfo';

type NetStateSnapshot = {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

const getErrorText = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

export const getNetStateSnapshot = async (): Promise<NetStateSnapshot> => {
  try {
    const state = await NetInfo.fetch();
    return {
      type: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
    };
  } catch {
    return {
      type: 'unknown',
      isConnected: null,
      isInternetReachable: null,
    };
  }
};

export const classifyNetworkError = (error: unknown) => {
  const text = getErrorText(error).toLowerCase();
  if (text.includes('network request failed')) return 'network_request_failed';
  if (text.includes('failed to fetch')) return 'network_request_failed';
  if (text.includes('timeout')) return 'timeout';
  return 'unknown';
};

export const logSupabaseFallback = async (scope: string, error: unknown) => {
  const network = await getNetStateSnapshot();
  const kind = classifyNetworkError(error);

  console.log(`${scope}: Supabase unavailable, using local SQLite`, {
    kind,
    network,
    error,
  });
};
