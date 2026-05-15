<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-settings-adjust" />
      {{ t('compare.semanticDiff') }}
    </h3>

    <div class="space-y-3">
      <label class="block space-y-1">
        <span class="text-[10px] font-bold uppercase text-muted">{{ t('compare.options.ignoreKeys') }}</span>
        <input
          v-model="ignoreKeysText"
          class="w-full px-3 py-2 bg-base border border-base rounded-md text-xs text-base focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          :placeholder="t('compare.options.ignoreKeysPlaceholder')"
        />
      </label>

      <label class="flex items-start gap-3 p-3 bg-base border border-base rounded-md cursor-pointer hover:bg-secondary">
        <input
          :checked="diffStore.diffOptions.ignoreVolatileFields"
          type="checkbox"
          class="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          @change="setOption('ignoreVolatileFields', ($event.target as HTMLInputElement).checked)"
        />
        <span class="min-w-0">
          <span class="block text-[10px] font-bold uppercase text-base">{{ t('compare.options.ignoreVolatile') }}</span>
          <span class="block text-[10px] text-light leading-snug">{{ volatileLabel }}</span>
        </span>
      </label>

      <label class="flex items-start gap-3 p-3 bg-base border border-base rounded-md cursor-pointer hover:bg-secondary">
        <input
          :checked="diffStore.diffOptions.arrayOrderMatters === false"
          type="checkbox"
          class="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          @change="setOption('arrayOrderMatters', !($event.target as HTMLInputElement).checked)"
        />
        <span>
          <span class="block text-[10px] font-bold uppercase text-base">{{ t('compare.options.ignoreArrayOrder') }}</span>
          <span class="block text-[10px] text-light leading-snug">{{ t('compare.options.ignoreArrayOrderHint') }}</span>
        </span>
      </label>

      <label class="block space-y-1">
        <span class="text-[10px] font-bold uppercase text-muted">{{ t('compare.options.compareByKey') }}</span>
        <select
          :value="diffStore.diffOptions.compareArrayByKey || ''"
          class="w-full px-3 py-2 bg-base border border-base rounded-md text-xs text-base focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          @change="setOption('compareArrayByKey', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('common.off') }}</option>
          <option value="auto">{{ t('compare.options.autoByKey') }}</option>
          <option value="id">id</option>
          <option value="uuid">uuid</option>
          <option value="name">name</option>
        </select>
      </label>

      <label class="flex items-start gap-3 p-3 bg-base border border-base rounded-md cursor-pointer hover:bg-secondary">
        <input
          :checked="diffStore.diffOptions.ignoreTypeDiff"
          type="checkbox"
          class="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          @change="setOption('ignoreTypeDiff', ($event.target as HTMLInputElement).checked)"
        />
        <span>
          <span class="block text-[10px] font-bold uppercase text-base">{{ t('compare.options.ignoreType') }}</span>
          <span class="block text-[10px] text-light leading-snug">{{ t('compare.options.ignoreTypeHint') }}</span>
        </span>
      </label>

      <label class="flex items-start gap-3 p-3 bg-base border border-base rounded-md cursor-pointer hover:bg-secondary">
        <input
          :checked="diffStore.diffOptions.normalizeDates"
          type="checkbox"
          class="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          @change="setOption('normalizeDates', ($event.target as HTMLInputElement).checked)"
        />
        <span>
          <span class="block text-[10px] font-bold uppercase text-base">{{ t('compare.options.normalizeDates') }}</span>
          <span class="block text-[10px] text-light leading-snug">{{ t('compare.options.normalizeDatesHint') }}</span>
        </span>
      </label>
    </div>

    <button
      class="w-full flex items-center justify-center gap-2 py-2 px-4 bg-base border border-base hover:bg-secondary text-muted rounded-md text-xs font-bold transition-all shadow-sm"
      @click="handleReset"
    >
      <div class="i-carbon-reset" />
      {{ t('compare.options.reset') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiffStore } from '@/stores/diffStore';
import useClipboard from '@/composables/useClipboard';
import { DEFAULT_VOLATILE_KEYS } from '@/utils/diff-algorithms/semantic-utils';
import type { TDiffOptions } from '@/types/diff';
import useI18n from '@/composables/useI18n';

const diffStore = useDiffStore();
const { showToast } = useClipboard();
const { t } = useI18n();

const volatileLabel = DEFAULT_VOLATILE_KEYS.join(', ');

const ignoreKeysText = computed({
  get: () => (diffStore.diffOptions.ignoreKeys ?? []).join(', '),
  set: (value: string) => {
    diffStore.setDiffOptions({
      ignoreKeys: value.split(',').map(item => item.trim()).filter(Boolean),
    });
  },
});

const setOption = <K extends keyof TDiffOptions>(key: K, value: TDiffOptions[K]) => {
  diffStore.setDiffOptions({ [key]: value });
};

const handleReset = () => {
  diffStore.setLeftRaw('');
  diffStore.setRightRaw('');
  diffStore.resetDiffOptions();
  showToast(t('toast.comparisonReset'), 'info');
};
</script>
