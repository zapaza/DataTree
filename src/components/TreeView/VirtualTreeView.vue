<template>
  <div class="virtual-tree-view h-full flex flex-col">
    <!-- Поиск и фильтры (Desktop) -->
    <div v-if="!isMobile && hasData" class="flex flex-col bg-base border-b border-base shrink-0">
      <div class="p-2 bg-secondary border-b border-light">
        <TreeSearch />
      </div>
      <div class="p-3">
        <TreeFilters />
      </div>
    </div>

    <!-- Кнопка вызова фильтров на мобилках -->
    <div v-if="isMobile && hasData" class="p-2 border-b border-light bg-secondary flex justify-center shrink-0">
      <button
        class="flex items-center gap-2 px-6 py-2 bg-base border border-base rounded-full shadow-md text-sm font-medium text-muted hover:text-blue-600 transition-colors active:scale-95"
        @click="showMobileFilters = true"
      >
        <div class="i-carbon-search text-base" />
        <span>{{ t('tree.searchFilters') }}</span>
        <div v-if="hasActiveFilters" class="w-2 h-2 rounded-full bg-blue-500" />
      </button>
    </div>

    <!-- Список -->
    <div
      v-if="hasData && !documentStore.isParsing"
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
          :path-segments="item.pathSegments"
          :depth="item.depth"
        />
      </RecycleScroller>
    </div>

    <!-- Загрузка -->
    <div v-else-if="documentStore.isParsing" class="flex-1 flex flex-col items-center justify-center bg-secondary">
      <div class="i-carbon-progress-bar-round animate-spin text-4xl text-blue-500 mb-4" />
      <p class="text-sm font-medium text-muted">{{ t('tree.processing') }}</p>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-light p-8 text-center bg-secondary">
      <div :class="emptyIcon" class="text-5xl mb-4 opacity-25" />
      <p v-if="documentStore.rawInput.trim()" class="text-sm italic">
        {{ t('tree.invalidData') }}
      </p>
      <div v-else class="max-w-sm space-y-3">
        <p class="text-sm font-medium text-muted">{{ emptyTitle }}</p>
        <p class="text-xs leading-relaxed text-light">{{ emptyDescription }}</p>
        <button
          class="inline-flex items-center gap-2 rounded border border-base bg-base px-3 py-2 text-xs font-bold text-muted shadow-sm transition-colors hover:text-blue-600"
          @click="openCommandPalette"
        >
          <div class="i-carbon-search" />
          {{ t('tree.openExamples') }}
        </button>
      </div>
    </div>

    <!-- Mobile Bottom Sheet -->
    <BottomSheet :show="showMobileFilters" @close="showMobileFilters = false">
      <template #title>
        <div class="i-carbon-search text-blue-500" />
        <span>{{ t('tree.searchFilters') }}</span>
      </template>
      <div class="flex flex-col gap-4">
        <div class="bg-secondary p-2 rounded-lg border border-light">
          <TreeSearch />
        </div>
        <div class="bg-secondary p-3 rounded-lg border border-light">
          <TreeFilters />
        </div>
      </div>
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDocumentStore } from '@/stores/documentStore';
import { useTreeStore } from '@/stores/treeStore';
import { useVirtualTree } from '@/composables/useVirtualTree';
import { useTreeNavigation } from '@/composables/useTreeNavigation';
import { useBreakpoints } from '@/composables/useBreakpoints';
import VirtualTreeNode from './VirtualTreeNode.vue';
import TreeSearch from './TreeSearch.vue';
import TreeFilters from './TreeFilters.vue';
import BottomSheet from '@/components/UI/BottomSheet.vue';
import { getProductModeByPath } from '@/config/product-modes';
import useI18n from '@/composables/useI18n';

const documentStore = useDocumentStore();
const treeStore = useTreeStore();
const route = useRoute();
const { isMobile } = useBreakpoints();
const { t } = useI18n();

const scroller = ref<{ scrollToItem: (index: number) => void } | null>(null);
const treeContainer = ref<HTMLElement | null>(null);
const showMobileFilters = ref(false);

const parsedData = computed(() => documentStore.filteredData);
const hasData = computed(() => !!documentStore.parsedData);
const activeMode = computed(() => getProductModeByPath(route.path));
const emptyIcon = computed(() => activeMode.value.icon);
const emptyTitle = computed(() => {
  if (activeMode.value.id === 'inspect') return t('modes.inspect.emptyTitle');
  if (activeMode.value.id === 'validate') return t('modes.validate.emptyTitle');
  return t('modes.transform.emptyTitle');
});
const emptyDescription = computed(() => {
  if (activeMode.value.id === 'validate') return t('modes.validate.emptyDescription');
  if (activeMode.value.id === 'inspect') return t('modes.inspect.emptyDescription');
  return t('modes.transform.emptyDescription');
});

const hasActiveFilters = computed(() => {
  const f = documentStore.filters;
  return f.hideNull || f.hideEmptyArrays || f.hideEmptyObjects || f.hideTypes.length > 0 || f.maxDepth < 20 || treeStore.searchQuery !== '';
});

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

watch(() => documentStore.activeContractIssue, (issue) => {
  if (!issue) return;
  const flatIndex = flatList.value.findIndex(item => item.path === issue.path);
  if (flatIndex !== -1 && scroller.value) {
    scroller.value.scrollToItem(flatIndex);
  }
});

const openCommandPalette = () => {
  window.dispatchEvent(new Event('datatree:open-command-palette'));
};
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
