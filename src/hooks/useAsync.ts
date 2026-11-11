import { useCallback, useState } from 'react';
import { normalizeApiError } from '@/services/httpClient';
import type { AppApiError, AsyncState } from '@/types/api';

export function useAsync<TData, TArgs extends unknown[] = []>(
  asyncFn: (...args: TArgs) => Promise<TData>,
  initialData: TData | null = null
) {
  const [state, setState] = useState<AsyncState<TData>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs): Promise<TData> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await asyncFn(...args);
        setState({ data: result, isLoading: false, error: null });
        return result;
      } catch (err) {
        const normalized: AppApiError = normalizeApiError(err);
        setState((prev) => ({ ...prev, isLoading: false, error: normalized }));
        throw normalized;
      }
    },
    [asyncFn]
  );

  const setData = useCallback((updater: TData | null | ((prev: TData | null) => TData | null)) => {
    setState((prev) => ({
      ...prev,
      data: typeof updater === 'function'
        ? (updater as (p: TData | null) => TData | null)(prev.data)
        : updater,
    }));
  }, []);

  return {
    ...state,
    execute,
    setData,
  };
}
