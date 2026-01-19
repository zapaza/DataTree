<template>
  <div v-if="diffResult" class="diff-summary p-4 bg-base border-t border-base">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-base">Change Summary</h3>
      <div class="text-[10px] text-muted font-mono">
        Total Changes: {{ totalChanges }}
      </div>
    </div>

    <!-- Distribution Bar -->
    <div class="h-2 w-full flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-6">
      <div
        class="h-full bg-green-500 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.added / totalNodes) * 100}%` }"
        v-tooltip="`Added: ${diffResult.stats.added}`"
      />
      <div
        class="h-full bg-red-500 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.removed / totalNodes) * 100}%` }"
        v-tooltip="`Removed: ${diffResult.stats.removed}`"
      />
      <div
        class="h-full bg-amber-500 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.modified / totalNodes) * 100}%` }"
        v-tooltip="`Modified: ${diffResult.stats.modified}`"
      />
      <div
        class="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.unchanged / totalNodes) * 100}%` }"
        v-tooltip="`Unchanged: ${diffResult.stats.unchanged}`"
      />
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
          <div class="i-carbon-add-alt text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">Added</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.added }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <div class="i-carbon-subtract-alt text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">Removed</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.removed }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <div class="i-carbon-renew text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">Modified</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.modified }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted">
          <div class="i-carbon-dot-mark text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">Unchanged</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.unchanged }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TDiffResult } from '@/types/diff';

const props = defineProps<{
  diffResult: TDiffResult | null;
}>();

const totalNodes = computed(() => {
  if (!props.diffResult) return 1;
  const s = props.diffResult.stats;
  return s.added + s.removed + s.modified + s.unchanged;
});

const totalChanges = computed(() => {
  if (!props.diffResult) return 0;
  const s = props.diffResult.stats;
  return s.added + s.removed + s.modified;
});
</script>
