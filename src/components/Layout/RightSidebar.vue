<template>
  <div class="flex flex-col h-full bg-sidebar border-l border-base">
    <div class="flex border-b border-base bg-base">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 flex flex-col items-center py-2 gap-1 transition-colors"
        :class="activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-light hover:text-muted'"
        @click="activeTab = tab.id"
      >
        <div :class="tab.icon" class="text-lg" />
        <span class="text-[10px] font-medium uppercase">{{ tab.label }}</span>
      </button>
    </div>

    <div class="flex-1 overflow-auto p-4">
      <div v-if="activeTab === 'stats'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase text-light tracking-wider">Document Stats</h3>
          <button
            class="flex items-center gap-1 px-2 py-1 text-[10px] bg-base border border-base rounded hover:bg-secondary text-muted transition-colors shadow-sm"
            @click="copyAll"
          >
            <div class="i-carbon-copy" />
            <span>Copy All</span>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-base p-3 rounded border border-light shadow-sm">
            <div class="text-[10px] text-light uppercase">Nodes</div>
            <div class="text-xl font-bold text-base">{{ stats.nodes }}</div>
          </div>
          <div class="bg-base p-3 rounded border border-light shadow-sm">
            <div class="text-[10px] text-light uppercase">Size</div>
            <div class="text-xl font-bold text-base">
              {{ (stats.size / 1024).toFixed(2) }} <span class="text-xs font-normal text-light">KB</span>
            </div>
          </div>
          <div class="bg-base p-3 rounded border border-light shadow-sm">
            <div class="text-[10px] text-light uppercase">Max Depth</div>
            <div class="text-xl font-bold text-base">{{ stats.depth }}</div>
          </div>
          <div class="bg-base p-3 rounded border border-light shadow-sm">
            <div class="text-[10px] text-light uppercase">Max Width</div>
            <div class="text-xl font-bold text-base">{{ stats.maxWidth }}</div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <div class="flex justify-between text-xs py-1 border-b border-light">
            <span class="text-light">Format</span>
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{{ stats.format }}</span>
          </div>
          <div class="flex justify-between text-xs py-1 border-b border-light">
            <span class="text-light">Parsing Time</span>
            <span class="font-mono text-muted">{{ stats.parseTime }} ms</span>
          </div>
          <div class="flex justify-between text-xs py-1 border-b border-light">
            <span class="text-light">Status</span>
            <span :class="stats.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-bold">
              {{ stats.isValid ? 'Valid' : 'Invalid' }}
            </span>
          </div>
        </div>

        <div class="pt-4">
          <h4 class="text-[10px] font-bold uppercase text-light mb-2">Type Distribution</h4>
          <div class="space-y-1.5">
            <div v-for="(count, type) in stats.typeDistribution" :key="type" class="flex flex-col gap-1">
              <div v-if="count > 0" class="flex justify-between text-[10px]">
                <span class="capitalize text-muted">{{ type }}s</span>
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

      <div v-if="activeTab === 'validation'" class="space-y-4">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider">JSON Schema Validation</h3>
        <div class="space-y-2">
          <label class="text-[10px] text-muted font-medium uppercase">Simple Zod-like Schema</label>
          <textarea
            v-model="appStore.validationSchema"
            class="w-full h-32 p-2 text-xs font-mono bg-base border border-base rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-base"
            placeholder='{ "name": "string", "age": "number" }'
            @input="appStore.validateSchema"
          />
        </div>

        <div v-if="appStore.validationSchema" class="pt-2">
          <div v-if="appStore.schemaErrors.length === 0" class="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-xs">
            <div class="i-carbon-checkmark-filled" />
            <span>Schema validation passed</span>
          </div>
          <div v-else class="space-y-2">
            <div class="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-xs font-bold">
              <div class="i-carbon-error-filled" />
              <span>Validation failed</span>
            </div>
            <ul class="text-[10px] text-red-600 dark:text-red-400 space-y-1 pl-2 border-l-2 border-red-100 dark:border-red-800 ml-1">
              <li v-for="(error, index) in appStore.schemaErrors" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/stores/appStore';
import useClipboard from '@/composables/useClipboard';

const appStore = useAppStore();
const { copy } = useClipboard();
const activeTab = ref('stats');

const tabs = [
  { id: 'stats', icon: 'i-carbon-chart-bar', label: 'Stats' },
  { id: 'validation', icon: 'i-carbon-rule', label: 'Schema' },
];

const stats = computed(() => appStore.statistics);

const copyAll = () => {
  copy(appStore.rawInput, 'Full content copied to clipboard');
};
</script>
