<template>
  <div v-if="diffResult" class="diff-summary p-4 bg-base border-t border-base">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-base">{{ t('compare.changeSummary') }}</h3>
      <div class="text-[10px] text-muted font-mono">
        {{ t('compare.totalChanges') }}: {{ totalChanges }}
      </div>
    </div>

    <!-- Distribution Bar -->
    <div class="h-2 w-full flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-6">
      <div
        class="h-full bg-green-500 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.added / totalNodes) * 100}%` }"
        v-tooltip="`${t('compare.added')}: ${diffResult.stats.added}`"
      />
      <div
        class="h-full bg-red-500 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.removed / totalNodes) * 100}%` }"
        v-tooltip="`${t('compare.removed')}: ${diffResult.stats.removed}`"
      />
      <div
        class="h-full bg-amber-500 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.modified / totalNodes) * 100}%` }"
        v-tooltip="`${t('compare.modified')}: ${diffResult.stats.modified}`"
      />
      <div
        class="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-500"
        :style="{ width: `${(diffResult.stats.unchanged / totalNodes) * 100}%` }"
        v-tooltip="`${t('compare.unchanged')}: ${diffResult.stats.unchanged}`"
      />
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
          <div class="i-carbon-add-alt text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">{{ t('compare.added') }}</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.added }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <div class="i-carbon-subtract-alt text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">{{ t('compare.removed') }}</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.removed }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <div class="i-carbon-renew text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">{{ t('compare.modified') }}</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.modified }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-light">
        <div class="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted">
          <div class="i-carbon-dot-mark text-lg" />
        </div>
        <div>
          <div class="text-[10px] text-muted uppercase font-bold">{{ t('compare.unchanged') }}</div>
          <div class="text-sm font-bold text-base">{{ diffResult.stats.unchanged }}</div>
        </div>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-2">
      <div class="p-2 rounded-md border border-light bg-red-50 dark:bg-red-900/15">
        <div class="text-[9px] text-red-600 dark:text-red-300 uppercase font-bold">{{ t('compare.breaking') }}</div>
        <div class="text-sm font-bold text-red-700 dark:text-red-200">{{ diffResult.riskSummary.breaking }}</div>
      </div>
      <div class="p-2 rounded-md border border-light bg-green-50 dark:bg-green-900/15">
        <div class="text-[9px] text-green-600 dark:text-green-300 uppercase font-bold">{{ t('compare.nonBreaking') }}</div>
        <div class="text-sm font-bold text-green-700 dark:text-green-200">{{ diffResult.riskSummary.nonBreaking }}</div>
      </div>
      <div class="p-2 rounded-md border border-light bg-amber-50 dark:bg-amber-900/15">
        <div class="text-[9px] text-amber-600 dark:text-amber-300 uppercase font-bold">{{ t('compare.warnings') }}</div>
        <div class="text-sm font-bold text-amber-700 dark:text-amber-200">{{ diffResult.riskSummary.warnings }}</div>
      </div>
    </div>

    <div v-if="diffResult.contractDiff?.changes.length" class="mt-4">
      <div class="text-[10px] font-bold uppercase text-muted mb-2">{{ t('compare.contractImpact') }}</div>
      <div class="space-y-1">
        <div
          v-for="change in diffResult.contractDiff.changes.slice(0, 4)"
          :key="`${change.path}-${change.title}`"
          class="px-2 py-1.5 rounded-md bg-secondary border border-light"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="[
                change.risk === 'breaking' ? 'bg-red-500' :
                change.risk === 'warning' ? 'bg-amber-500' :
                'bg-green-500'
              ]"
            />
            <span class="font-mono text-[10px] truncate">{{ change.displayPath }}</span>
          </div>
          <div class="text-[10px] text-light truncate">{{ change.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import type { TDiffResult } from '@/types/diff';

const props = defineProps<{
  diffResult: TDiffResult | null;
}>();

const { t } = useI18n();

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
