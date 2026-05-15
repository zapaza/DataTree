import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TDataType } from '@/types/editor';

export interface TPinnedQuery {
  id: string;
  query: string;
  format: TDataType;
  createdAt: number;
}

const STORAGE_KEY = 'datatree_pinned_queries';

const readPinnedQueries = (): TPinnedQuery[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as TPinnedQuery[] : [];
  } catch {
    return [];
  }
};

export const useQueryStore = defineStore('query', () => {
  const pinnedQueries = ref<TPinnedQuery[]>(readPinnedQueries());

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedQueries.value));
  };

  const pinQuery = (query: string, format: TDataType) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    pinnedQueries.value = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        query: trimmed,
        format,
        createdAt: Date.now(),
      },
      ...pinnedQueries.value.filter(item => !(item.query === trimmed && item.format === format)),
    ].slice(0, 12);
    persist();
  };

  const removePinnedQuery = (id: string) => {
    pinnedQueries.value = pinnedQueries.value.filter(item => item.id !== id);
    persist();
  };

  return {
    pinnedQueries,
    pinQuery,
    removePinnedQuery,
  };
});

export default useQueryStore;
