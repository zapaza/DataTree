<template>
  <div
    class="flex flex-col h-full bg-base overflow-hidden transition-all duration-300"
    :class="{ 'w-80 shadow-xl border-r border-base animate-fade-in-left': !embedded }"
  >
    <div v-if="!embedded" class="p-4 border-b border-light flex items-center justify-between bg-secondary">
      <div class="flex items-center gap-2">
        <div class="i-carbon-template text-blue-600 dark:text-blue-400 text-xl" />
        <h2 class="font-bold text-base">Examples</h2>
      </div>
      <button
        class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-light hover:text-muted"
        @click="$emit('close')"
      >
        <div class="i-carbon-close text-xl" />
      </button>
    </div>

    <!-- Поиск -->
    <div class="p-4 border-b border-light" :class="{ 'p-3': embedded }">
      <div class="relative group">
        <div class="absolute left-2.5 top-1/2 -translate-y-1/2 i-carbon-search text-light group-focus-within:text-blue-500 transition-colors" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search examples..."
          class="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 transition-all text-base"
          :class="{ 'text-xs py-1.5 pl-8': embedded }"
        />
      </div>
    </div>

    <div class="p-4 border-b border-light flex gap-2 overflow-x-auto custom-scrollbar pb-2" :class="{ 'p-3 gap-1': embedded }">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all shrink-0 min-w-[70px]"
        :class="[
          selectedCategory === cat.id
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm'
            : 'bg-base border-base text-light hover:border-gray-300 dark:hover:border-gray-600 hover:bg-secondary',
          embedded ? 'px-2 py-1 min-w-[50px]' : ''
        ]"
        @click="selectCategory(cat.id)"
      >
        <div :class="[cat.icon, { 'text-sm': embedded }]" class="text-lg" />
        <span class="text-[10px] font-medium whitespace-nowrap" :class="{ 'text-[8px]': embedded }">{{ cat.label }}</span>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" :class="{ 'p-3 space-y-2': embedded }">
      <div v-if="filteredExamples.length === 0" class="flex flex-col items-center justify-center py-10 text-light text-center">
        <div class="i-carbon-search-locate text-4xl mb-2 opacity-20" />
        <p class="text-sm italic">No examples found</p>
      </div>

      <button
        v-for="example in filteredExamples"
        :key="example.id"
        class="w-full text-left p-3 rounded-xl border border-light hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group relative overflow-hidden bg-base"
        :class="{ 'p-2 rounded-lg': embedded }"
        @click="loadExample(example)"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-base group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors" :class="{ 'text-xs': embedded }">{{ example.name }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted font-mono uppercase border border-light" :class="{ 'text-[8px] px-1': embedded }">
            {{ example.format }}
          </span>
        </div>
        <p class="text-xs text-muted line-clamp-2 leading-relaxed" :class="{ 'text-[10px]': embedded }">
          {{ example.description }}
        </p>

        <!-- Hover indicator -->
        <div class="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
          <div class="i-carbon-arrow-right text-blue-500" :class="{ 'text-xs': embedded }" />
        </div>
      </button>
    </div>

    <div class="p-4 bg-secondary border-t border-light" :class="{ 'p-2': embedded }">
      <p class="text-[10px] text-light text-center uppercase tracking-widest font-bold" :class="{ 'text-[8px]': embedded }">
        {{ filteredExamples.length }} examples available
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { EXAMPLES, type TExample } from '@/data/examples';
import { useAppStore } from '@/stores/appStore';
import useClipboard from '@/composables/useClipboard';

defineProps<{
  embedded?: boolean;
}>();

const emit = defineEmits(['close']);
const appStore = useAppStore();
const { showToast } = useClipboard();

const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);

const categories = [
  { id: 'simple', label: 'Simple', icon: 'i-carbon-user' },
  { id: 'api', label: 'API Responses', icon: 'i-carbon-cloud-service-management' },
  { id: 'config', label: 'Configs', icon: 'i-carbon-settings' },
  { id: 'nested', label: 'Nested Structures', icon: 'i-carbon-tree-view' },
  { id: 'xml', label: 'XML Examples', icon: 'i-carbon-xml' }
];

const filteredExamples = computed(() => {
  return EXAMPLES.filter(example => {
    const matchesSearch = example.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      example.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = !selectedCategory.value || example.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

const loadExample = (example: TExample) => {
  appStore.setFormat(example.format);
  appStore.setRawInput(example.content);

  showToast(`Example "${example.name}" loaded successfully`, 'success');

  emit('close');
};

const selectCategory = (categoryId: string | null) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId;
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

@keyframes fade-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in-left {
  animation: fade-in-left 0.3s ease-out;
}
</style>
