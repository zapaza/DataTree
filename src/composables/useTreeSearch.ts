import { ref, watch, onUnmounted, computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { useTreeStore } from '../stores/treeStore';
import { SearchIndex } from '../utils/search-index';

export function useTreeSearch() {
  const appStore = useAppStore();
  const treeStore = useTreeStore();
  const searchQuery = ref('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const performSearch = () => {
    if (!searchQuery.value.trim() || !appStore.parsedData) {
      treeStore.setSearchResults('', []);
      return;
    }

    const results = SearchIndex.search(appStore.parsedData, searchQuery.value);
    const paths = results.map(r => r.path);
    treeStore.setSearchResults(searchQuery.value, paths);

    // Автоматически разворачиваем и выделяем первый результат
    if (paths.length > 0) {
      treeStore.expandToPath(paths[0]);
      treeStore.setSelectedPath(paths[0]);
    }
  };

  const next = () => {
    const path = treeStore.nextSearchResult();
    if (path) {
      treeStore.expandToPath(path);
      treeStore.setSelectedPath(path);
    }
  };

  const prev = () => {
    const path = treeStore.prevSearchResult();
    if (path) {
      treeStore.expandToPath(path);
      treeStore.setSelectedPath(path);
    }
  };

  // Следим за изменением поискового запроса с дебаунсом
  watch(searchQuery, (newQuery) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);
  });

  // Очистка при размонтировании
  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return {
    searchQuery,
    next,
    prev,
    resultsCount: computed(() => treeStore.searchResults.length),
    currentIndex: computed(() => treeStore.currentSearchIndex)
  };
}
