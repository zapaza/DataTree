import { onMounted, onUnmounted, watch } from 'vue';
import { useAppStore } from '../stores/appStore';
import { useOperationsHistoryStore } from '../stores/operationsHistoryStore';

export default function useHistory() {
  const appStore = useAppStore();
  const historyStore = useOperationsHistoryStore();

  let autoSaveTimer: number | null = null;
  const AUTOSAVE_INTERVAL = 30000; // 30 секунд

  const saveCurrentState = async () => {
    if (!appStore.rawInput.trim()) return;

    await historyStore.addItem({
      content: appStore.rawInput,
      format: appStore.format,
      isValid: appStore.isValid,
      nodesCount: appStore.statistics.nodes
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
