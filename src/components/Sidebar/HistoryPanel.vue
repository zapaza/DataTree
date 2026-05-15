<template>
  <div class="flex flex-col h-full bg-base border-r border-base w-80 shadow-xl overflow-hidden animate-fade-in-left">
    <div class="p-4 border-b border-light flex items-center justify-between bg-secondary">
      <div class="flex items-center gap-2">
        <div class="i-material-symbols-history-rounded text-blue-600 dark:text-blue-400 text-xl" />
        <h2 class="font-bold text-base">{{ t('history.title') }}</h2>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="historyStore.historyItems.length > 0"
          class="p-1 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 hover:text-red-600 rounded transition-colors"
          :title="t('history.clearAll')"
          @click="clearAll"
        >
          <div class="i-carbon-trash-can text-lg" />
        </button>
        <button
          class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-light hover:text-muted"
          @click="$emit('close')"
        >
          <div class="i-carbon-close text-xl" />
        </button>
      </div>
    </div>

    <!-- Список истории -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
      <div v-if="historyStore.isLoading" class="flex flex-col items-center justify-center py-10 text-light">
        <div class="i-carbon-progress-bar-round animate-spin text-4xl mb-2" />
        <p class="text-sm">{{ t('history.loading') }}</p>
      </div>

      <div v-else-if="historyStore.historyItems.length === 0" class="flex flex-col items-center justify-center py-10 text-light text-center">
        <div class="i-carbon-time text-4xl mb-2 opacity-20" />
        <p class="text-sm italic">{{ t('history.none') }}</p>
        <p class="text-[10px] mt-2 max-w-[200px]">{{ t('history.hint') }}</p>
      </div>

      <div
        v-for="item in historyStore.historyItems"
        :key="item.id"
        class="w-full text-left p-3 rounded-xl border border-light hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group relative cursor-pointer bg-base shadow-sm"
        @click="restoreState(item)"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-bold text-light uppercase tracking-tight">
            {{ formatDate(item.timestamp) }}
          </span>
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
              :class="item.isValid ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'"
            >
              {{ item.isValid ? t('stats.valid') : t('stats.invalid') }}
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted font-mono uppercase border border-light">
              {{ item.format }}
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-mono uppercase border border-blue-100 dark:border-blue-900/40">
              {{ item.mode || 'inspect' }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-xs text-base line-clamp-1 font-mono opacity-80">
            {{ item.content.trim().substring(0, 50) }}...
          </p>
          <span class="text-[10px] text-light">
            {{ item.operationType || t('history.autosave') }} · {{ t('history.nodes', { count: item.nodesCount }) }}
          </span>
        </div>

        <!-- Кнопка удаления -->
        <button
          class="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1 bg-base border border-base rounded-full shadow-md text-light hover:text-red-500 transition-all z-10"
          @click="deleteItem(item.id!, $event)"
        >
          <div class="i-carbon-close text-[12px]" />
        </button>
      </div>
    </div>

    <div class="p-4 bg-secondary border-t border-light">
      <p class="text-[10px] text-light text-center uppercase tracking-widest font-bold">
        {{ t('history.operationsStored', { count: historyStore.historyItems.length }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useDocumentStore } from '@/stores/documentStore';
import { useOperationsHistoryStore } from '@/stores/operationsHistoryStore';
import { type THistoryItem } from '@/utils/history-db';
import useClipboard from '@/composables/useClipboard';
import { useI18n } from '@/composables/useI18n';
import { getProductModeByPath, PRODUCT_MODES } from '@/config/product-modes';

const emit = defineEmits(['close']);
const documentStore = useDocumentStore();
const historyStore = useOperationsHistoryStore();
const router = useRouter();
const { showToast } = useClipboard();
const { t, locale } = useI18n();

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const restoreState = (item: THistoryItem) => {
  const mode = PRODUCT_MODES.find(productMode => productMode.id === (item.mode || 'inspect'));
  if (mode && getProductModeByPath(router.currentRoute.value.path).id !== mode.id) {
    void router.push(mode.path);
  }
  documentStore.setFormat(item.format);
  documentStore.setRawInput(item.content);
  showToast(t('toast.historyRestored'), 'success');
  emit('close');
};

const deleteItem = (id: number, e: Event) => {
  e.stopPropagation();
  historyStore.removeItem(id);
};

const clearAll = () => {
  if (confirm(t('history.clearConfirm'))) {
    historyStore.clearHistory();
    showToast(t('toast.historyCleared'), 'info');
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
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
</style>
