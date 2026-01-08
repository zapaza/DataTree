import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTreeStore = defineStore('tree', () => {
  const expandedNodes = ref<Set<string>>(new Set(['root']));

  const selectedPath = ref<string | null>(null);

  const searchQuery = ref('');
  const searchResults = ref<string[]>([]);
  const currentSearchIndex = ref(-1);

  const toggleNode = (path: string) => {
    if (expandedNodes.value.has(path)) {
      expandedNodes.value.delete(path);
    } else {
      expandedNodes.value.add(path);
    }
  };

  const expandToPath = (path: string) => {
    const parts = path.split('.');
    let current = '';
    parts.forEach((part, index) => {
      current = index === 0 ? part : `${current}.${part}`;
      expandedNodes.value.add(current);
    });
  };

  const setSearchResults = (query: string, paths: string[]) => {
    searchQuery.value = query;
    searchResults.value = paths;
    currentSearchIndex.value = paths.length > 0 ? 0 : -1;
  };

  const nextSearchResult = () => {
    if (searchResults.value.length > 0) {
      currentSearchIndex.value = (currentSearchIndex.value + 1) % searchResults.value.length;
      return searchResults.value[currentSearchIndex.value];
    }
    return null;
  };

  const prevSearchResult = () => {
    if (searchResults.value.length > 0) {
      currentSearchIndex.value = (currentSearchIndex.value - 1 + searchResults.value.length) % searchResults.value.length;
      return searchResults.value[currentSearchIndex.value];
    }
    return null;
  };

  const setSelectedPath = (path: string | null) => {
    selectedPath.value = path;
  };

  const isExpanded = (path: string) => {
    return expandedNodes.value.has(path);
  };

  const expandAll = (paths: string[]) => {
    expandedNodes.value = new Set(paths);
  };

  const collapseAll = () => {
    expandedNodes.value = new Set(['root']);
  };

  return {
    expandedNodes,
    selectedPath,
    searchQuery,
    searchResults,
    currentSearchIndex,
    toggleNode,
    expandToPath,
    setSearchResults,
    nextSearchResult,
    prevSearchResult,
    setSelectedPath,
    isExpanded,
    expandAll,
    collapseAll
  };
});

export default useTreeStore;
