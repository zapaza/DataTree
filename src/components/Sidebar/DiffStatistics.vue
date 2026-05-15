<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-chart-multitype" />
      {{ t('compare.summary') }}
    </h3>

    <div v-if="diffStore.diffResult" class="space-y-3">
      <div class="grid grid-cols-1 gap-2">
        <!-- Added -->
        <div class="bg-base p-3 rounded-lg border border-light shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-[10px] font-bold uppercase text-muted">{{ t('compare.added') }}</span>
          </div>
          <span class="text-lg font-bold text-base">{{ diffStore.diffResult.stats.added }}</span>
        </div>

        <!-- Removed -->
        <div class="bg-base p-3 rounded-lg border border-light shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-500" />
            <span class="text-[10px] font-bold uppercase text-muted">{{ t('compare.removed') }}</span>
          </div>
          <span class="text-lg font-bold text-base">{{ diffStore.diffResult.stats.removed }}</span>
        </div>

        <!-- Modified -->
        <div class="bg-base p-3 rounded-lg border border-light shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-amber-500" />
            <span class="text-[10px] font-bold uppercase text-muted">{{ t('compare.modified') }}</span>
          </div>
          <span class="text-lg font-bold text-base">{{ diffStore.diffResult.stats.modified }}</span>
        </div>
      </div>

      <div class="pt-2 space-y-2">
        <div class="flex justify-between text-[10px] text-muted font-bold uppercase">
          <span>{{ t('compare.integrationRisk') }}</span>
          <span>{{ riskTotal }}</span>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <div class="bg-base p-3 rounded-md border border-light flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-red-500">{{ t('compare.breaking') }}</span>
            <span class="text-sm font-bold text-base">{{ diffStore.diffResult.riskSummary.breaking }}</span>
          </div>
          <div class="bg-base p-3 rounded-md border border-light flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-green-600 dark:text-green-400">{{ t('compare.nonBreaking') }}</span>
            <span class="text-sm font-bold text-base">{{ diffStore.diffResult.riskSummary.nonBreaking }}</span>
          </div>
          <div class="bg-base p-3 rounded-md border border-light flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-amber-500">{{ t('compare.warnings') }}</span>
            <span class="text-sm font-bold text-base">{{ diffStore.diffResult.riskSummary.warnings }}</span>
          </div>
        </div>
      </div>

      <!-- Total Progress Bar -->
      <div class="pt-2">
        <div class="flex justify-between text-[10px] text-muted mb-1 font-bold uppercase">
          <span>{{ t('compare.totalChanges') }}</span>
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

      <div v-if="topPathGroups.length" class="pt-2 space-y-2">
        <div class="text-[10px] text-muted font-bold uppercase">{{ t('compare.groupedByPath') }}</div>
        <div class="space-y-1">
          <div
            v-for="group in topPathGroups"
            :key="group.displayPath"
            class="px-3 py-2 bg-base border border-light rounded-md"
          >
            <div class="font-mono text-[10px] text-base truncate">{{ group.displayPath }}</div>
            <div class="mt-1 flex gap-2 text-[9px] text-light uppercase font-bold">
              <span>{{ t('compare.changes', { count: group.total }) }}</span>
              <span v-if="group.breaking" class="text-red-500">{{ t('compare.breakingCount', { count: group.breaking }) }}</span>
              <span v-if="group.warnings" class="text-amber-500">{{ t('compare.warningCount', { count: group.warnings }) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="diffStore.diffResult.contractDiff?.changes.length" class="pt-2 space-y-2">
        <div class="text-[10px] text-muted font-bold uppercase">{{ t('compare.contractDiff') }}</div>
        <div class="space-y-1">
          <div
            v-for="change in diffStore.diffResult.contractDiff.changes.slice(0, 6)"
            :key="`${change.path}-${change.title}`"
            class="px-3 py-2 bg-base border border-light rounded-md"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] text-base truncate">{{ change.displayPath }}</span>
              <span
                class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0"
                :class="riskClass(change.risk)"
              >
                {{ change.risk }}
              </span>
            </div>
            <div class="text-[10px] text-muted mt-1">{{ change.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center p-8 text-center bg-secondary rounded-xl border border-dashed border-base">
      <div class="i-carbon-chart-line text-3xl text-light mb-2 opacity-50" />
      <p class="text-[10px] text-muted italic">{{ t('compare.noData') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiffStore } from '@/stores/diffStore';
import useI18n from '@/composables/useI18n';

const diffStore = useDiffStore();
const { t } = useI18n();

const totalChanges = computed(() => {
  if (!diffStore.diffResult) return 0;
  const { added, removed, modified } = diffStore.diffResult.stats;
  return added + removed + modified || 1; // Avoid division by zero
});

const riskTotal = computed(() => {
  if (!diffStore.diffResult) return 0;
  const { breaking, nonBreaking, warnings, neutral } = diffStore.diffResult.riskSummary;
  return breaking + nonBreaking + warnings + neutral;
});

const topPathGroups = computed(() => diffStore.diffResult?.pathSummary.slice(0, 5) ?? []);

const riskClass = (risk: string) => {
  if (risk === 'breaking') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  if (risk === 'non-breaking') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (risk === 'warning') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
};

</script>
