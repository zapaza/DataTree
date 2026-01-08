import { defineStore } from 'pinia';
import { ref } from 'vue';
import { historyDB, type THistoryItem } from '@/utils/history-db';

export const useOperationsHistoryStore = defineStore('operations-history', () => {
  const historyItems = ref<THistoryItem[]>([]);
  const isLoading = ref(false);
  const MAX_ITEMS = 20;

  const loadHistory = async () => {
    isLoading.value = true;
    try {
      historyItems.value = await historyDB.getAll();
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const addItem = async (item: Omit<THistoryItem, 'timestamp'>) => {
    const newItem: THistoryItem = {
      ...item,
      timestamp: Date.now()
    };

    try {
      await historyDB.save(newItem);
      await historyDB.trim(MAX_ITEMS);
      await loadHistory();
    } catch (error) {
      console.error('Failed to save history item:', error);
    }
  };

  const removeItem = async (id: number) => {
    try {
      await historyDB.delete(id);
      await loadHistory();
    } catch (error) {
      console.error('Failed to remove history item:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await historyDB.clear();
      historyItems.value = [];
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return {
    historyItems,
    isLoading,
    loadHistory,
    addItem,
    removeItem,
    clearHistory
  };
});
