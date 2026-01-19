<template>
  <div class="diff-tree-view h-full flex flex-col bg-base overflow-hidden">
    <!-- Toolbar -->
    <div class="px-3 h-10 border-b border-base flex items-center bg-secondary justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Diff Tree</span>
        <div class="flex items-center gap-1 ml-2 pl-2 border-l border-base">
          <button
            v-tooltip="'Expand all changes'"
            class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted"
            title="Expand All"
            @click="expandAll"
          >
            <div class="i-material-symbols-expand-all text-sm" />
          </button>
          <button
            v-tooltip="'Collapse all changes'"
            class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted"
            title="Collapse All"
            @click="collapseAll"
          >
            <div class="i-material-symbols-collapse-all text-sm" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Navigation -->
        <div class="flex items-center gap-1 mr-2 pr-2 border-r border-base">
          <button
            class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted disabled:opacity-30"
            title="Previous Change"
            v-tooltip="'Previous Change'"
            :disabled="!hasChanges"
            @click="handlePrev"
          >
            <div class="i-carbon-chevron-up text-sm" />
          </button>
          <span v-if="hasChanges" class="text-[10px] font-mono text-muted min-w-[3rem] text-center">
            {{ diffStore.currentChangeIndex + 1 }} / {{ totalChanges }}
          </span>
          <button
            v-tooltip="'Next Change'"
            class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted disabled:opacity-30"
            title="Next Change"
            :disabled="!hasChanges"
            @click="handleNext"
          >
            <div class="i-carbon-chevron-down text-sm" />
          </button>
        </div>

        <label class="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            v-model="diffStore.showOnlyChanges"
            class="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-[10px] font-medium text-muted group-hover:text-base transition-colors">Only Changes</span>
        </label>
      </div>
    </div>

    <!-- Tree Content -->
    <div
      v-if="diffStore.diffTree"
      ref="treeContainer"
      class="flex-1 min-h-0 flex flex-col relative dark:bg-[#1e1e1e] outline-none"
      tabindex="0"
    >
      <RecycleScroller
        ref="scroller"
        class="flex-1 min-h-0 px-2 custom-scrollbar"
        :items="flatList"
        :item-size="24"
        key-field="id"
        v-slot="{ item }"
      >
        <DiffTreeNode
          :node="item.node"
          :depth="item.depth"
          :is-expanded="isExpanded(item.path)"
          @toggle-expand="toggleExpand"
        />
      </RecycleScroller>
    </div>

    <!-- Empty/Loading State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-light p-8 text-center bg-secondary">
      <div v-if="diffStore.isComputingDiff" class="flex flex-col items-center">
        <div class="i-carbon-circle-dash animate-spin text-5xl mb-4 opacity-40" />
        <p class="text-sm italic">Computing diff…</p>
      </div>
      <template v-else>
        <div class="i-carbon-ibm-cloud-direct-link-2-dedicated text-5xl mb-4 opacity-20" />
        <p class="text-sm italic">
          Load two files to compare and see the diff tree.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { useDiffStore } from '@/stores/diffStore';
import { useDiffVirtualTree } from '@/composables/useDiffVirtualTree';
import DiffTreeNode from './DiffTreeNode.vue';

const diffStore = useDiffStore();
const scroller = ref<any>(null);
const treeContainer = ref<HTMLElement | null>(null);

const {
  flatList,
  isExpanded,
  toggleExpand,
  expandAll,
  collapseAll
} = useDiffVirtualTree(toRef(diffStore, 'diffTree'), toRef(diffStore, 'showOnlyChanges'));

const totalChanges = computed(() => {
  if (!diffStore.diffResult) return 0;
  return diffStore.diffResult.stats.added + diffStore.diffResult.stats.removed + diffStore.diffResult.stats.modified;
});

const hasChanges = computed(() => totalChanges.value > 0);

const handleNext = () => {
  const path = diffStore.nextChange();
  if (path) scrollToPath(path);
};

const handlePrev = () => {
  const path = diffStore.prevChange();
  if (path) scrollToPath(path);
};

const scrollToPath = (path: string) => {
  const index = flatList.value.findIndex(item => item.path === path);
  if (index !== -1 && scroller.value) {
    scroller.value.scrollToItem(index);
  }
};
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

:deep(.vue-recycle-scroller__item-view.hover) {
  background: rgba(0, 0, 0, 0.05);
}
</style>
