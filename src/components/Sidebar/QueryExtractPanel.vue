<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="i-carbon-query text-blue-500" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-muted">{{ t('inspect.queryExtract') }}</h3>
      </div>
      <span class="text-[10px] text-light font-mono">{{ documentStore.format === 'xml' ? 'XPath' : 'JSONPath' }}</span>
    </div>

    <div class="space-y-2">
      <div class="flex gap-1">
        <input
          v-model="query"
          class="min-w-0 flex-1 rounded border border-base bg-base px-2 py-1.5 text-xs font-mono outline-none focus:border-blue-300 dark:focus:border-blue-800"
          :placeholder="placeholder"
          @keydown.enter="runQuery"
        >
        <button
          class="rounded border border-base bg-secondary px-2 py-1.5 text-xs font-bold text-muted hover:text-blue-600 transition-colors disabled:opacity-40"
          :disabled="!documentStore.parsedData || !query.trim()"
          @click="runQuery"
        >
          {{ t('inspect.runQuery') }}
        </button>
      </div>

      <div class="flex gap-1">
        <button
          class="flex-1 rounded border border-base bg-base px-2 py-1 text-[10px] font-bold uppercase text-muted hover:text-blue-600 transition-colors disabled:opacity-40"
          :disabled="!query.trim()"
          @click="pinCurrentQuery"
        >
          {{ t('inspect.pinQuery') }}
        </button>
        <button
          class="flex-1 rounded border border-base bg-base px-2 py-1 text-[10px] font-bold uppercase text-muted hover:text-blue-600 transition-colors disabled:opacity-40"
          :disabled="results.length === 0"
          @click="copyJson"
        >
          JSON
        </button>
        <button
          class="flex-1 rounded border border-base bg-base px-2 py-1 text-[10px] font-bold uppercase text-muted hover:text-blue-600 transition-colors disabled:opacity-40"
          :disabled="results.length === 0"
          @click="copyCsv"
        >
          CSV
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:bg-red-900/10 dark:border-red-900/40 dark:text-red-300">
      {{ error }}
    </div>

    <div v-if="hasRun && !error" class="rounded border border-light overflow-hidden">
      <div class="grid grid-cols-[1fr_72px] bg-secondary text-[10px] font-bold uppercase text-light">
        <div class="px-2 py-1">{{ t('common.path') }}</div>
        <div class="px-2 py-1 border-l border-light">{{ t('common.value') }}</div>
      </div>
      <div v-if="results.length === 0" class="px-2 py-2 text-xs text-light italic">
        {{ t('inspect.noMatches') }}
      </div>
      <div
        v-for="result in visibleResults"
        :key="`${result.path}:${result.key}`"
        class="grid grid-cols-[1fr_72px] border-t border-light text-[11px]"
      >
        <div class="px-2 py-1 font-mono truncate" :title="result.queryPath">
          {{ result.queryPath }}
        </div>
        <div class="px-2 py-1 border-l border-light font-mono truncate text-muted" :title="result.valuePreview">
          {{ result.valuePreview }}
        </div>
      </div>
      <div v-if="results.length > 12" class="border-t border-light px-2 py-1 text-[10px] text-light">
        {{ t('inspect.moreResults', { count: results.length - 12 }) }}
      </div>
    </div>

    <div v-if="queryStore.pinnedQueries.length" class="space-y-1.5">
      <div class="text-[10px] font-bold uppercase tracking-wider text-light">{{ t('inspect.pinnedQueries') }}</div>
      <div class="space-y-1">
        <div
          v-for="item in queryStore.pinnedQueries.slice(0, 5)"
          :key="item.id"
          class="flex items-center gap-1 rounded border border-light bg-base px-2 py-1"
        >
          <button
            class="min-w-0 flex-1 truncate text-left text-[11px] font-mono text-muted hover:text-blue-600"
            :title="item.query"
            @click="runPinnedQuery(item.query)"
          >
            {{ item.query }}
          </button>
          <span class="text-[9px] uppercase text-light">{{ item.format }}</span>
          <button
            class="text-light hover:text-red-500"
            :title="t('inspect.removePinned')"
            @click="queryStore.removePinnedQuery(item.id)"
          >
            <div class="i-carbon-close text-xs" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { useQueryStore } from '@/stores/queryStore';
import useClipboard from '@/composables/useClipboard';
import { executeQuery, queryResultsToCsv, type TQueryResult } from '@/utils/query-extract';
import useI18n from '@/composables/useI18n';

type TVisibleQueryResult = {
  path: string;
  key: string;
  queryPath: string;
  valuePreview: string;
};

const documentStore = useDocumentStore();
const queryStore = useQueryStore();
const { copy, showToast } = useClipboard();
const { t } = useI18n();

const query = ref('');
const results = ref<TQueryResult[]>([]);
const error = ref<string | null>(null);
const hasRun = ref(false);

const placeholder = computed(() => documentStore.format === 'xml' ? '//item' : '$..id');
const visibleResults = computed<TVisibleQueryResult[]>(() => results.value.slice(0, 12).map(result => ({
  path: result.path,
  key: result.key,
  queryPath: result.queryPath,
  valuePreview: formatValue(result.value as unknown),
})));

const runQuery = () => {
  hasRun.value = true;
  const execution = executeQuery(documentStore.parsedData, documentStore.format, query.value);
  results.value = execution.results;
  error.value = execution.error ?? null;
};

const runPinnedQuery = (pinnedQuery: string) => {
  query.value = pinnedQuery;
  runQuery();
};

const pinCurrentQuery = () => {
  queryStore.pinQuery(query.value, documentStore.format);
  showToast(t('toast.queryPinned'), 'success');
};

const copyJson = () => {
  void copy(JSON.stringify(results.value.map(result => ({
    path: result.queryPath,
    type: result.type,
    value: result.value,
  })), null, 2), t('inspect.resultsJson'));
};

const copyCsv = () => {
  void copy(queryResultsToCsv(results.value), t('inspect.resultsCsv'));
};

const formatValue = (value: unknown): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (!text) return '';
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
};

watch(() => [documentStore.parsedData, documentStore.format], () => {
  if (hasRun.value) runQuery();
});
</script>
