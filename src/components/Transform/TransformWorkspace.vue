<template>
  <div class="h-full min-h-0 flex flex-col bg-secondary">
    <div class="shrink-0 border-b border-light bg-base px-4 py-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <div :class="activeTool?.icon" class="text-lg text-blue-500" />
            <h3 class="text-sm font-bold text-base">{{ activeTool?.label }}</h3>
            <span
              class="rounded border border-base bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted"
            >
              {{ result.outputFormat }}
            </span>
          </div>
          <p class="mt-1 text-xs text-light truncate">{{ activeTool?.description }}</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="inline-flex h-8 items-center gap-1.5 rounded border border-base bg-secondary px-3 text-xs font-bold text-muted transition-colors hover:text-blue-600 disabled:opacity-40"
            :disabled="!result.ok"
            @click="copyOutput"
          >
            <div class="i-carbon-copy" />
            {{ t('common.copy') }}
          </button>
          <button
            class="inline-flex h-8 items-center gap-1.5 rounded border border-base bg-secondary px-3 text-xs font-bold text-muted transition-colors hover:text-blue-600 disabled:opacity-40"
            :disabled="!result.ok"
            @click="downloadOutput"
          >
            <div class="i-carbon-download" />
            {{ t('common.export') }}
          </button>
          <button
            class="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-40 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            :disabled="!canApply"
            @click="applyOutput"
          >
            <div class="i-carbon-checkmark" />
            {{ t('common.apply') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!result.ok" class="flex-1 flex flex-col items-center justify-center p-8 text-center text-light">
      <div class="i-carbon-warning-alt text-5xl opacity-25 mb-4" />
      <p class="text-sm font-medium text-muted">{{ localizedError }}</p>
    </div>

    <div v-else class="flex-1 min-h-0 overflow-auto p-4 space-y-4 custom-scrollbar">
      <section
        v-if="result.table"
        class="space-y-2"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-light">{{ t('transform.tablePreview') }}</h4>
          <span class="text-[10px] font-mono text-light">{{ result.table.sourcePath }} · {{ t('transform.rows', { count: result.table.rows.length }) }}</span>
        </div>
        <div class="overflow-auto rounded border border-base bg-base max-h-72 custom-scrollbar">
          <table class="min-w-full text-left text-xs">
            <thead class="sticky top-0 bg-secondary text-[10px] uppercase text-light">
              <tr>
                <th
                  v-for="column in result.table.columns"
                  :key="column"
                  class="border-b border-base px-3 py-2 font-bold"
                >
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in result.table.rows.slice(0, 50)"
                :key="index"
                class="border-b border-light last:border-b-0"
              >
                <td
                  v-for="column in result.table.columns"
                  :key="column"
                  class="max-w-64 truncate px-3 py-2 font-mono text-[11px] text-muted"
                  :title="row[column]"
                >
                  {{ row[column] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-if="result.redactions"
        class="space-y-2"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-light">{{ t('transform.redactionPreview') }}</h4>
          <span class="text-[10px] font-bold uppercase text-muted">{{ t('transform.matches', { count: result.redactions.length }) }}</span>
        </div>
        <div
          v-if="result.redactions.length"
          class="grid gap-1.5 sm:grid-cols-2"
        >
          <div
            v-for="match in result.redactions.slice(0, 12)"
            :key="match.jsonPath"
            class="rounded border border-amber-100 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
          >
            <div class="font-mono">{{ match.jsonPath }}</div>
            <div class="mt-0.5 text-[10px] opacity-75">{{ t('transform.maskedBy', { type: match.valueType, key: match.key }) }}</div>
          </div>
        </div>
        <div v-else class="rounded border border-light bg-base p-2 text-xs text-light">
          {{ t('transform.noMatchingSecrets') }}
        </div>
      </section>

      <section class="min-h-[24rem] flex flex-col space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-light">{{ t('transform.output') }}</h4>
          <span class="text-[10px] font-mono text-light">{{ outputSize }}</span>
        </div>
        <textarea
          class="min-h-[24rem] flex-1 rounded border border-base bg-base p-3 font-mono text-xs leading-relaxed text-base outline-none resize-none"
          :value="result.output"
          readonly
          spellcheck="false"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { useTransformStore } from '@/stores/transformStore';
import useClipboard from '@/composables/useClipboard';
import { useI18n } from '@/composables/useI18n';
import FileUtils from '@/utils/file-utils';
import { runTransform, type TTransformTool } from '@/utils/transformers/transform-tools';

const documentStore = useDocumentStore();
const transformStore = useTransformStore();
const { copy, showToast } = useClipboard();
const { t } = useI18n();

const toolMeta: Record<TTransformTool, { icon: string; labelKey: string; descriptionKey: string }> = {
  formatJson: { icon: 'i-carbon-center-to-fit', labelKey: 'transform.tools.formatJson', descriptionKey: 'transform.descriptions.formatJson' },
  minifyJson: { icon: 'i-carbon-bring-to-front', labelKey: 'transform.tools.minifyJson', descriptionKey: 'transform.descriptions.minifyJson' },
  sortKeys: { icon: 'i-carbon-sort-ascending', labelKey: 'transform.tools.sortKeys', descriptionKey: 'transform.descriptions.sortKeys' },
  jsonToXml: { icon: 'i-carbon-code', labelKey: 'transform.tools.jsonToXml', descriptionKey: 'transform.descriptions.jsonToXml' },
  xmlToJson: { icon: 'i-carbon-document-import', labelKey: 'transform.tools.xmlToJson', descriptionKey: 'transform.descriptions.xmlToJson' },
  flattenCsv: { icon: 'i-carbon-table', labelKey: 'transform.tools.flattenCsv', descriptionKey: 'transform.descriptions.flattenCsv' },
  redact: { icon: 'i-carbon-security', labelKey: 'transform.tools.redact', descriptionKey: 'transform.descriptions.redact' },
  jsonSchema: { icon: 'i-carbon-rule', labelKey: 'transform.tools.jsonSchema', descriptionKey: 'transform.descriptions.jsonSchema' },
  typescript: { icon: 'i-carbon-code', labelKey: 'transform.tools.typescript', descriptionKey: 'transform.descriptions.typescript' },
  zod: { icon: 'i-carbon-script', labelKey: 'transform.tools.zod', descriptionKey: 'transform.descriptions.zod' },
  fetchSnippet: { icon: 'i-carbon-api', labelKey: 'transform.tools.fetchSnippet', descriptionKey: 'transform.descriptions.fetchSnippet' },
};

const result = computed(() => runTransform(
  transformStore.selectedTool,
  documentStore.rawInput,
  documentStore.format,
  {
    xml: transformStore.xmlOptions,
    redact: transformStore.redactOptions,
  }
));

const activeTool = computed(() => {
  const meta = toolMeta[transformStore.selectedTool];
  return {
    icon: meta.icon,
    label: t(meta.labelKey),
    description: t(meta.descriptionKey),
  };
});
const canApply = computed(() => result.value.ok && ['json', 'xml'].includes(result.value.outputFormat));
const outputSize = computed(() => `${new Blob([result.value.output]).size.toLocaleString()} bytes`);
const localizedError = computed(() => {
  const error = result.value.error ?? '';
  const knownErrors: Record<string, string> = {
    'Paste JSON or XML to transform.': t('transform.errors.pasteJsonXml'),
    'Invalid JSON input.': t('transform.errors.invalidJson'),
    'Invalid XML input.': t('transform.errors.invalidXml'),
    'Switch input format to JSON to use this transform.': t('transform.errors.switchJson'),
    'Paste JSON to transform.': t('transform.errors.pasteJson'),
    'Paste XML to transform.': t('transform.errors.pasteXml'),
    'Switch input format to XML to convert XML to JSON.': t('transform.errors.switchXml'),
    'XML conversion failed.': t('transform.errors.xmlFailed'),
  };
  return knownErrors[error] ?? error;
});

const copyOutput = () => {
  if (!result.value.ok) return;
  void copy(result.value.output, t('transform.copied'));
};

const downloadOutput = () => {
  if (!result.value.ok) return;
  FileUtils.saveFile(result.value.output, result.value.fileName, result.value.mime);
};

const applyOutput = () => {
  if (!canApply.value) return;
  documentStore.setRawInput(result.value.output);
  if (result.value.outputFormat === 'json' || result.value.outputFormat === 'xml') {
    documentStore.setFormat(result.value.outputFormat);
  }
  showToast(t('transform.applied'), 'success');
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
}
</style>
