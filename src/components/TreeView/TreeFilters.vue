<template>
  <div class="p-3 border-b border-light bg-base space-y-3">
    <!-- Основные чекбоксы -->
    <div class="flex flex-wrap gap-x-4 gap-y-2">
      <label class="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          :checked="appStore.filters.hideNull"
          class="w-4 h-4 rounded border-base text-blue-600 focus:ring-blue-500 bg-base"
          @change="appStore.updateFilters({ hideNull: !appStore.filters.hideNull })"
        >
        <span class="text-xs text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Hide Nulls</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          :checked="appStore.filters.hideEmptyObjects"
          class="w-4 h-4 rounded border-base text-blue-600 focus:ring-blue-500 bg-base"
          @change="appStore.updateFilters({ hideEmptyObjects: !appStore.filters.hideEmptyObjects })"
        >
        <span class="text-xs text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Hide Empty {}</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          :checked="appStore.filters.hideEmptyArrays"
          class="w-4 h-4 rounded border-base text-blue-600 focus:ring-blue-500 bg-base"
          @change="appStore.updateFilters({ hideEmptyArrays: !appStore.filters.hideEmptyArrays })"
        >
        <span class="text-xs text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Hide Empty []</span>
      </label>
    </div>

    <!-- Фильтры по типам -->
    <div class="flex flex-col gap-1.5">
      <span class="text-[10px] font-bold text-light uppercase tracking-wider">Hide by type</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in availableTypes"
          :key="type.value"
          class="px-2 py-0.5 text-[10px] rounded-full border transition-all"
          :class="appStore.filters.hideTypes.includes(type.value)
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold'
            : 'bg-secondary border-base text-muted hover:bg-gray-100 dark:hover:bg-[#2d2d2d]'
          "
          @click="toggleType(type.value)"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Слайдер глубины -->
    <div class="flex flex-col gap-1.5">
      <div class="flex justify-between items-center">
        <span class="text-[10px] font-bold text-light uppercase tracking-wider">Max Depth</span>
        <span class="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">{{ appStore.filters.maxDepth }}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        :value="appStore.filters.maxDepth"
        class="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
        @input="handleDepthChange"
      >
    </div>

    <!-- Кнопки управления -->
    <div class="flex justify-end gap-2 pt-1">
      <button
        class="flex items-center gap-1 text-[10px] text-light hover:text-red-500 dark:hover:text-red-400 transition-colors"
        @click="appStore.resetFilters"
      >
        <div class="i-carbon-reset text-xs" />
        <span>Reset Filters</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore';
import type { TTreeNodeType } from '@/types/store';

const appStore = useAppStore();

const availableTypes: { label: string, value: TTreeNodeType }[] = [
  { label: 'Strings', value: 'string' },
  { label: 'Numbers', value: 'number' },
  { label: 'Booleans', value: 'boolean' },
];

const toggleType = (type: TTreeNodeType) => {
  const current = [...appStore.filters.hideTypes];
  const index = current.indexOf(type);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(type);
  }
  appStore.updateFilters({ hideTypes: current });
};

const handleDepthChange = (e: Event) => {
  const value = parseInt((e.target as HTMLInputElement).value, 10);
  appStore.updateFilters({ maxDepth: value });
};
</script>

<style scoped>
/* Кастомные стили для range input если нужно */
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #2563eb;
  border-radius: 50%;
  cursor: pointer;
}
</style>
