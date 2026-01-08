<template>
  <div class="tree-search flex items-center gap-2 p-2 bg-secondary border-b border-light">
    <div class="relative flex-1 group">
      <div class="absolute left-2.5 top-1/2 -translate-y-1/2 i-carbon-search text-light group-focus-within:text-blue-500 transition-colors" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search keys or values..."
        class="w-full pl-9 pr-8 py-1.5 text-xs bg-base border border-base rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-base"
        aria-label="Search tree nodes"
        @keydown="handleKeyDown"
      />
      <button
        v-if="searchQuery"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded text-light hover:text-muted transition-colors"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <div class="i-carbon-close text-[12px]" />
      </button>
    </div>

    <div v-if="searchQuery" class="flex items-center gap-1.5 shrink-0">
      <span class="text-[10px] text-muted font-medium min-w-[3rem] text-center">
        {{ resultsCount > 0 ? treeStore.currentSearchIndex + 1 : 0 }} / {{ resultsCount }}
      </span>
      <div class="flex border border-base rounded-md overflow-hidden bg-base">
        <button
          class="p-1 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] text-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-base"
          :disabled="resultsCount === 0"
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
          @click="prev"
        >
          <div class="i-carbon-chevron-up text-sm" />
        </button>
        <button
          class="p-1 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] text-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          :disabled="resultsCount === 0"
          title="Next match (Enter)"
          aria-label="Next match"
          @click="next"
        >
          <div class="i-carbon-chevron-down text-sm" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTreeSearch } from '@/composables/useTreeSearch';
import { useTreeStore } from '@/stores/treeStore';

const { searchQuery, next, prev, resultsCount } = useTreeSearch();
const treeStore = useTreeStore();

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      prev();
    } else {
      next();
    }
  }
};

const clearSearch = () => {
  searchQuery.value = '';
};
</script>

<style scoped>
.tree-search {
  z-index: 5;
}
</style>
