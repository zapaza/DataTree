import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useHistoryStore = defineStore('history', () => {
  const history = ref<string[]>([]);
  const currentIndex = ref(-1);
  const MAX_HISTORY = 50;

  const pushState = (content: string) => {
    // Если новое состояние совпадает с текущим, ничего не делаем
    if (currentIndex.value >= 0 && history.value[currentIndex.value] === content) {
      return;
    }

    // Удаляем ветку "Redo" если мы находимся не в конце
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1);
    }

    // Добавляем новое состояние
    history.value.push(content);

    // Ограничиваем размер истории
    if (history.value.length > MAX_HISTORY) {
      history.value.shift();
    } else {
      currentIndex.value++;
    }
  };

  const undo = (): string | null => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      return history.value[currentIndex.value] ?? null;
    }
    return null;
  };

  const redo = (): string | null => {
    if (currentIndex.value < history.value.length - 1) {
      currentIndex.value++;
      return history.value[currentIndex.value] ?? null;
    }
    return null;
  };

  const canUndo = computed(() => currentIndex.value > 0);
  const canRedo = computed(() => currentIndex.value < history.value.length - 1);

  return {
    history,
    currentIndex,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  };
});
