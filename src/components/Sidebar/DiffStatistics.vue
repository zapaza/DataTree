<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-chart-multitype" />
      Diff Statistics
    </h3>

    <div v-if="diffStore.diffResult" class="space-y-3">
      <div class="grid grid-cols-1 gap-2">
        <!-- Added -->
        <div class="bg-base p-3 rounded-lg border border-light shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-[10px] font-bold uppercase text-muted">Added</span>
          </div>
          <span class="text-lg font-bold text-base">{{ diffStore.diffResult.stats.added }}</span>
        </div>

        <!-- Removed -->
        <div class="bg-base p-3 rounded-lg border border-light shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-500" />
            <span class="text-[10px] font-bold uppercase text-muted">Removed</span>
          </div>
          <span class="text-lg font-bold text-base">{{ diffStore.diffResult.stats.removed }}</span>
        </div>

        <!-- Modified -->
        <div class="bg-base p-3 rounded-lg border border-light shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-amber-500" />
            <span class="text-[10px] font-bold uppercase text-muted">Modified</span>
          </div>
          <span class="text-lg font-bold text-base">{{ diffStore.diffResult.stats.modified }}</span>
        </div>
      </div>

      <!-- Total Progress Bar -->
      <div class="pt-2">
        <div class="flex justify-between text-[10px] text-muted mb-1 font-bold uppercase">
          <span>Total Changes</span>
          <span>{{ totalChanges }}</span>
        </div>
        <div class="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
          <div
            v-if="diffStore.diffResult.stats.added"
            class="h-full bg-green-500 transition-all"
            :style="{ width: `${(diffStore.diffResult.stats.added / totalChanges) * 100}%` }"
          />
          <div
            v-if="diffStore.diffResult.stats.removed"
            class="h-full bg-red-500 transition-all"
            :style="{ width: `${(diffStore.diffResult.stats.removed / totalChanges) * 100}%` }"
          />
          <div
            v-if="diffStore.diffResult.stats.modified"
            class="h-full bg-amber-500 transition-all"
            :style="{ width: `${(diffStore.diffResult.stats.modified / totalChanges) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center p-8 text-center bg-secondary rounded-xl border border-dashed border-base">
      <div class="i-ph-chart-line-duotone text-3xl text-light mb-2 opacity-50" />
      <p class="text-[10px] text-muted italic">No comparison data available yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiffStore } from '@/stores/diffStore';

const diffStore = useDiffStore();

const totalChanges = computed(() => {
  if (!diffStore.diffResult) return 0;
  const { added, removed, modified } = diffStore.diffResult.stats;
  return added + removed + modified || 1; // Avoid division by zero
});

</script>
