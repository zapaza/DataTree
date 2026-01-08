<template>
  <div class="tree-view-container h-full flex flex-col">
    <!-- Поиск и фильтры -->
    <div class="border-b border-light">
      <TreeSearch v-if="hasData" />
      <TreeFilters v-if="hasData" />
    </div>

    <!-- Если данные есть и не парсим -->
    <div v-if="hasData && !appStore.isParsing" ref="treeContainer" class="flex-1 overflow-auto p-4 custom-scrollbar outline-none dark:bg-[#1e1e1e]" tabindex="0">
      <TreeNode :node="parsedData!" path="root" :depth="0" />
    </div>

    <!-- Индикатор загрузки при парсинге -->
    <div v-else-if="appStore.isParsing" class="flex-1 flex flex-col items-center justify-center bg-secondary">
      <div class="i-carbon-progress-bar-round animate-spin text-4xl text-blue-500 mb-4" />
      <p class="text-sm font-medium text-muted">Parsing large structure...</p>
      <p class="text-[10px] text-light mt-1">This might take a few seconds</p>
    </div>

    <!-- Пустое состояние или ошибка -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-light p-8 text-center bg-secondary">
      <div class="i-carbon-tree-view text-5xl mb-4 opacity-20" />
      <p v-if="appStore.rawInput.trim()" class="text-sm italic">
        Invalid {{ appStore.format.toUpperCase() }} data to visualize.
      </p>
      <p v-else class="text-sm italic">
        Enter some {{ appStore.format.toUpperCase() }} in the editor to see the tree structure.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useTreeStore } from '@/stores/treeStore';
import { useTreeNavigation } from '@/composables/useTreeNavigation';
import TreeNode from './TreeNode.vue';
import TreeSearch from './TreeSearch.vue';
import TreeFilters from './TreeFilters.vue';
import type { TTreeNode } from '@/types/store';

const appStore = useAppStore();
const treeStore = useTreeStore();
const treeContainer = ref<HTMLElement | null>(null);

// Инициализируем навигацию с клавиатуры
useTreeNavigation(treeContainer);

const parsedData = computed(() => appStore.filteredData);
const hasData = computed(() => !!parsedData.value);

const getAllPaths = (node: TTreeNode, currentPath: string = 'root', paths: string[] = []): string[] => {
  paths.push(currentPath);
  if (node.children) {
    node.children.forEach(child => {
      getAllPaths(child, `${currentPath}.${child.key}`, paths);
    });
  }
  return paths;
};

const handleExpandAll = () => {
  if (parsedData.value) {
    const allPaths = getAllPaths(parsedData.value);
    treeStore.expandAll(allPaths);
  }
};

const handleCollapseAll = () => {
  treeStore.collapseAll();
};

defineExpose({
  expandAll: handleExpandAll,
  collapseAll: handleCollapseAll
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
