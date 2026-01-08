import { ref, watch, onUnmounted } from 'vue';
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
    treeStore.setSearchResults(searchQuery.value, results.map(r => r.path));
  };

  const next = () => {
    const path = treeStore.nextSearchResult();
    if (path) {
      treeStore.expandToPath(path);
      treeStore.setSelectedPath(path);
      scrollToPath(path);
    }
  };

  const prev = () => {
    const path = treeStore.prevSearchResult();
    if (path) {
      treeStore.expandToPath(path);
      treeStore.setSelectedPath(path);
      scrollToPath(path);
    }
  };

  const scrollToPath = (path: string) => {
    // Ждем следующего тика, чтобы DOM успел обновиться (развернуться узлы)
    setTimeout(() => {
      const element = document.querySelector(`[data-path="${path}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
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
    resultsCount: treeStore.searchResults.length,
    currentIndex: treeStore.currentSearchIndex
  };
}
