<template>
  <div class="virtual-tree-view h-full flex flex-col">
    <!-- Поиск и фильтры -->
    <div class="border-b border-light">
      <TreeSearch v-if="hasData" />
      <TreeFilters v-if="hasData" />
    </div>

    <!-- Список -->
    <div
      v-if="hasData && !appStore.isParsing"
      ref="treeContainer"
      class="flex-1 min-h-0 flex flex-col relative dark:bg-[#1e1e1e] outline-none"
      tabindex="0"
    >
      <RecycleScroller
        ref="scroller"
        class="flex-1 min-h-0 px-2 custom-scrollbar"
        :items="flatList"
        :item-size="24"
        key-field="path"
        v-slot="{ item }"
      >
        <VirtualTreeNode
          :node="item.node"
          :path="item.path"
          :depth="item.depth"
        />
      </RecycleScroller>
    </div>

    <!-- Загрузка -->
    <div v-else-if="appStore.isParsing" class="flex-1 flex flex-col items-center justify-center bg-secondary">
      <div class="i-carbon-progress-bar-round animate-spin text-4xl text-blue-500 mb-4" />
      <p class="text-sm font-medium text-muted">Processing structure...</p>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-light p-8 text-center bg-secondary">
      <div class="i-carbon-tree-view text-5xl mb-4 opacity-20" />
      <p v-if="appStore.rawInput.trim()" class="text-sm italic">
        Invalid data to visualize.
      </p>
      <p v-else class="text-sm italic">
        Enter some data to see the tree structure.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useTreeStore } from '@/stores/treeStore';
import { useVirtualTree } from '@/composables/useVirtualTree';
import { useTreeNavigation } from '@/composables/useTreeNavigation';
import VirtualTreeNode from './VirtualTreeNode.vue';
import TreeSearch from './TreeSearch.vue';
import TreeFilters from './TreeFilters.vue';

const appStore = useAppStore();
const treeStore = useTreeStore();
const scroller = ref<any>(null);
const treeContainer = ref<HTMLElement | null>(null);

const parsedData = computed(() => appStore.filteredData);
const hasData = computed(() => !!parsedData.value);

const { flatList } = useVirtualTree(parsedData);

// Инициализируем навигацию с клавиатуры
useTreeNavigation(treeContainer, {
  nodes: flatList,
  onNavigate: (path) => {
    const index = flatList.value.findIndex(item => item.path === path);
    if (index !== -1 && scroller.value) {
      scroller.value.scrollToItem(index);
    }
  }
});

watch(() => treeStore.currentSearchIndex, (index) => {
  if (index !== -1 && treeStore.searchResults[index]) {
    const path = treeStore.searchResults[index];
    const flatIndex = flatList.value.findIndex(item => item.path === path);
    if (flatIndex !== -1 && scroller.value) {
      scroller.value.scrollToItem(flatIndex);
    }
  }
});
</script>

<style scoped>
.custom-scrollbar :deep(.vue-recycle-scroller__slot) {
  display: none;
}

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
