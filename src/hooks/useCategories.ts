import { useCallback, useEffect, useState } from 'react';
import { categoryService } from '@/services/categoryService';
import { normalizeApiError } from '@/services/httpClient';
import type { AppApiError } from '@/types/api';
import type { Category } from '@/types/category';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppApiError | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await categoryService.getList();
      setCategories(response.data.items);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
