<template>
  <div class="space-y-4 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold uppercase text-light tracking-wider">{{ t('stats.document') }}</h3>
      <button
        class="flex items-center gap-1 px-2 py-1 text-[10px] bg-base border border-base rounded hover:bg-secondary text-muted transition-colors shadow-sm"
        @click="copyAll"
      >
        <div class="i-carbon-copy" />
        <span>{{ t('stats.copyAll') }}</span>
      </button>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-base p-3 rounded border border-light shadow-sm">
        <div class="text-[10px] text-light uppercase">{{ t('stats.nodes') }}</div>
        <div class="text-xl font-bold text-base">{{ stats.nodes }}</div>
      </div>
      <div class="bg-base p-3 rounded border border-light shadow-sm">
        <div class="text-[10px] text-light uppercase">{{ t('stats.size') }}</div>
        <div class="text-xl font-bold text-base">
          {{ (stats.size / 1024).toFixed(2) }} <span class="text-xs font-normal text-light">KB</span>
        </div>
      </div>
      <div class="bg-base p-3 rounded border border-light shadow-sm">
        <div class="text-[10px] text-light uppercase">{{ t('stats.maxDepth') }}</div>
        <div class="text-xl font-bold text-base">{{ stats.depth }}</div>
      </div>
      <div class="bg-base p-3 rounded border border-light shadow-sm">
        <div class="text-[10px] text-light uppercase">{{ t('stats.maxWidth') }}</div>
        <div class="text-xl font-bold text-base">{{ stats.maxWidth }}</div>
      </div>
    </div>

    <div class="space-y-2 pt-2">
      <div class="flex justify-between text-xs py-1 border-b border-light">
        <span class="text-light">{{ t('stats.format') }}</span>
        <span class="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{{ stats.format }}</span>
      </div>
      <div class="flex justify-between text-xs py-1 border-b border-light">
        <span class="text-light">{{ t('stats.parsingTime') }}</span>
        <span class="font-mono text-muted">{{ stats.parseTime }} ms</span>
      </div>
      <div class="flex justify-between text-xs py-1 border-b border-light">
        <span class="text-light">{{ t('stats.status') }}</span>
        <span :class="stats.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-bold">
          {{ stats.isValid ? t('stats.valid') : t('stats.invalid') }}
        </span>
      </div>
    </div>

    <div class="pt-4">
      <h4 class="text-[10px] font-bold uppercase text-light mb-2">{{ t('stats.typeDistribution') }}</h4>
      <div class="space-y-1.5">
        <div v-for="(count, type) in stats.typeDistribution" :key="type" class="flex flex-col gap-1">
          <div v-if="count > 0" class="flex justify-between text-[10px]">
            <span class="capitalize text-muted">{{ typeLabel(type) }}</span>
            <span class="font-bold text-muted">{{ count }} ({{ Math.round((count / stats.nodes) * 100) }}%)</span>
          </div>
          <div v-if="count > 0" class="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all duration-500"
              :style="{ width: `${(count / stats.nodes) * 100}%` }"
              :class="{
                'bg-blue-500': type === 'object',
                'bg-indigo-500': type === 'array',
                'bg-green-500': type === 'string',
                'bg-amber-500': type === 'number',
                'bg-purple-500': type === 'boolean',
                'bg-gray-400 dark:bg-gray-600': type === 'null'
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import useClipboard from '@/composables/useClipboard';
import useI18n from '@/composables/useI18n';

const documentStore = useDocumentStore();
const { copy } = useClipboard();
const { t } = useI18n();
const stats = computed(() => documentStore.statistics);

const typeLabel = (type: string) => {
  return t(`tree.types.${type}`);
};

const copyAll = () => {
  copy(documentStore.rawInput, t('stats.copyAll'));
};
</script>
