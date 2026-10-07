import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { errorMessage } from './sf/api';

/** Loads data every time the screen comes into view (so it is fresh after going back). */
export function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(async () => {
    setError(null);
    try {
      setData(await load());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, error, refreshing, refresh, reload: run };
}
