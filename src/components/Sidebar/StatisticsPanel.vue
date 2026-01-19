<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-analytics" />
      Statistics
    </h3>

    <div v-if="appStore.parsedData" class="grid grid-cols-2 gap-2">
      <div class="bg-base p-3 rounded border border-light shadow-sm">
        <div class="text-[9px] text-light uppercase font-bold">Nodes</div>
        <div class="text-lg font-bold text-base">{{ stats.nodes }}</div>
      </div>
      <div class="bg-base p-3 rounded border border-light shadow-sm">
        <div class="text-[9px] text-light uppercase font-bold">Size</div>
        <div class="text-lg font-bold text-base">
          {{ (stats.size / 1024).toFixed(1) }}<span class="text-[10px] ml-0.5">KB</span>
        </div>
      </div>
    </div>

    <div v-if="appStore.parsedData" class="space-y-1.5 pt-2 border-t border-base">
      <div class="flex justify-between text-[10px] py-1 border-b border-light">
        <span class="text-light uppercase font-bold">Format</span>
        <span class="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{{ stats.format }}</span>
      </div>
      <div class="flex justify-between text-[10px] py-1">
        <span class="text-light uppercase font-bold">Status</span>
        <span :class="stats.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-bold uppercase">
          {{ stats.isValid ? 'Valid' : 'Invalid' }}
        </span>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center p-6 text-center bg-secondary rounded-xl border border-dashed border-base">
      <div class="i-carbon-document-blank text-3xl text-light mb-2 opacity-50" />
      <p class="text-[10px] text-muted italic">Enter data to see stats.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/stores/appStore';

const appStore = useAppStore();
const stats = computed(() => appStore.statistics);

</script>
