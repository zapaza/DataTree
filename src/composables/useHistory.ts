import { onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDocumentStore } from '../stores/documentStore';
import { useOperationsHistoryStore } from '../stores/operationsHistoryStore';
import { getProductModeByPath } from '@/config/product-modes';

export default function useHistory() {
  const documentStore = useDocumentStore();
  const historyStore = useOperationsHistoryStore();
  const route = useRoute();

  let autoSaveTimer: number | null = null;
  const AUTOSAVE_INTERVAL = 30000; // 30 секунд

  const saveCurrentState = async () => {
    if (!documentStore.rawInput.trim()) return;

    await historyStore.addItem({
      content: documentStore.rawInput,
      format: documentStore.format,
      isValid: documentStore.isValid,
      nodesCount: documentStore.statistics.nodes,
      mode: getProductModeByPath(route.path).id,
      operationType: 'autosave'
    });
  };

  const startAutoSave = () => {
    stopAutoSave();
    autoSaveTimer = window.setInterval(async () => {
      await saveCurrentState();
    }, AUTOSAVE_INTERVAL);
  };

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  };

  onMounted(() => {
    historyStore.loadHistory();
    startAutoSave();
  });

  onUnmounted(() => {
    stopAutoSave();
  });

  return {
    saveCurrentState,
    loadHistory: historyStore.loadHistory,
    clearHistory: historyStore.clearHistory,
    historyItems: historyStore.historyItems,
    isLoading: historyStore.isLoading
  };
}
