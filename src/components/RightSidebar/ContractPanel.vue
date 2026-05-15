<template>
  <div class="p-4 space-y-4">
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider">{{ t('validate.contractStudio') }}</h3>
        <span class="text-[10px] uppercase font-bold text-muted">{{ documentStore.format }}</span>
      </div>

      <div class="grid grid-cols-3 gap-1">
        <button
          v-for="option in outputOptions"
          :key="option.id"
          class="rounded border border-base px-2 py-1.5 text-[10px] font-bold uppercase transition-colors"
          :class="selectedOutput === option.id ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' : 'bg-base text-muted hover:text-blue-600'"
          @click="selectedOutput = option.id"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="flex gap-1">
        <button
          class="flex-1 rounded border border-base bg-base px-2 py-1.5 text-[10px] font-bold uppercase text-muted hover:text-blue-600 transition-colors disabled:opacity-40"
          :disabled="!generatedOutput"
          @click="copyGenerated"
        >
          {{ t('common.copy') }}
        </button>
        <button
          class="flex-1 rounded border border-base bg-base px-2 py-1.5 text-[10px] font-bold uppercase text-muted hover:text-blue-600 transition-colors disabled:opacity-40"
          :disabled="!generatedOutput"
          @click="downloadGenerated"
        >
          {{ t('common.download') }}
        </button>
        <button
          class="flex-1 rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-[10px] font-bold uppercase text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-40 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          :disabled="!generatedContract"
          @click="useGeneratedSchema"
        >
          {{ t('validate.useGenerated') }}
        </button>
      </div>

      <textarea
        class="h-36 w-full rounded border border-base bg-base p-2 text-[11px] font-mono text-base outline-none resize-none"
        :value="generatedOutput || t('validate.generationHint')"
        readonly
      />
    </section>

    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-[10px] font-bold uppercase tracking-wider text-light">{{ t('validate.jsonSchemaValidation') }}</h4>
        <button
          class="rounded border border-base bg-base px-2 py-1 text-[10px] font-bold uppercase text-muted hover:text-blue-600 transition-colors"
          @click="documentStore.validateSchema"
        >
          {{ t('validate.useForValidation') }}
        </button>
      </div>
      <textarea
        v-model="documentStore.validationSchema"
        class="h-32 w-full rounded border border-base bg-base p-2 text-[11px] font-mono text-base outline-none focus:border-blue-300 resize-none"
        placeholder='{ "type": "object", "properties": { "id": { "type": "integer" } }, "required": ["id"] }'
      />

      <div v-if="documentStore.validationSchema" class="space-y-2">
        <div
          v-if="documentStore.contractIssues.length === 0"
          class="flex items-center gap-2 rounded border border-green-100 bg-green-50 p-2 text-xs text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
        >
          <div class="i-carbon-checkmark-filled" />
          <span>{{ t('validate.validationPassed') }}</span>
        </div>

        <div v-else class="space-y-1.5">
          <button
            v-for="issue in documentStore.contractIssues"
            :key="issue.id"
            class="w-full rounded border p-2 text-left transition-colors"
            :class="issueClasses(issue.severity, documentStore.activeContractIssue?.id === issue.id)"
            @click="jumpToIssue(issue)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold">{{ issue.title }}</span>
              <span class="text-[9px] uppercase">{{ issue.severity }}</span>
            </div>
            <div class="mt-1 font-mono text-[10px]">{{ issue.jsonPath }}</div>
            <div class="mt-1 text-[10px] opacity-80">{{ issue.message }}</div>
          </button>
        </div>
      </div>
    </section>

    <section class="space-y-2">
      <h4 class="text-[10px] font-bold uppercase tracking-wider text-light">{{ t('validate.contractChecks') }}</h4>
      <div v-if="contractChecks.length" class="space-y-1.5">
        <button
          v-for="check in contractChecks.slice(0, 12)"
          :key="check.id"
          class="w-full rounded border p-2 text-left transition-colors"
          :class="issueClasses(check.severity, false)"
          @click="jumpToPath(check.path)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-bold">{{ check.title }}</span>
            <span class="text-[9px] uppercase">{{ check.severity }}</span>
          </div>
          <div class="mt-1 font-mono text-[10px]">{{ check.jsonPath }}</div>
          <div class="mt-1 text-[10px] opacity-80">{{ check.detail }}</div>
        </button>
      </div>
      <div v-else class="rounded border border-light bg-base p-2 text-[11px] text-light">
        {{ t('validate.noHints') }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { useTreeStore } from '@/stores/treeStore';
import useClipboard from '@/composables/useClipboard';
import FileUtils from '@/utils/file-utils';
import { analyzeContract } from '@/utils/contracts/contract-analyzer';
import { generateContract } from '@/utils/contracts/schema-generator';
import { treeNodeToValue } from '@/utils/tree-node-utils';
import type { TContractIssue, TContractSeverity } from '@/types/contracts';
import useI18n from '@/composables/useI18n';

type TOutputId = 'jsonSchema' | 'typescript' | 'zod';

const documentStore = useDocumentStore();
const treeStore = useTreeStore();
const { copy, showToast } = useClipboard();
const { t } = useI18n();
const selectedOutput = ref<TOutputId>('jsonSchema');

const outputOptions: Array<{ id: TOutputId; label: string; extension: string; mime: string }> = [
  { id: 'jsonSchema', label: 'Schema', extension: 'schema.json', mime: 'application/json' },
  { id: 'typescript', label: 'TS', extension: 'types.ts', mime: 'text/typescript' },
  { id: 'zod', label: 'Zod', extension: 'schema.ts', mime: 'text/typescript' },
];

const currentValue = computed(() => documentStore.parsedData ? treeNodeToValue(documentStore.parsedData) : null);
const generatedContract = computed(() => currentValue.value === null ? null : generateContract(currentValue.value, 'ApiPayload'));
const generatedOutput = computed(() => generatedContract.value?.[selectedOutput.value] ?? '');
const contractChecks = computed(() => analyzeContract(currentValue.value));

const issueClasses = (severity: TContractSeverity, active: boolean) => {
  const base = active ? 'ring-2 ring-blue-300 dark:ring-blue-700 ' : '';
  if (severity === 'error') return `${base}border-red-100 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300`;
  if (severity === 'warning') return `${base}border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300`;
  return `${base}border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
};

const useGeneratedSchema = () => {
  if (!generatedContract.value) return;
  documentStore.setValidationSchema(generatedContract.value.jsonSchema);
  showToast(t('validate.generatedApplied'), 'success');
};

const copyGenerated = () => {
  if (!generatedOutput.value) return;
  void copy(generatedOutput.value, t('validate.generatedCopied'));
};

const downloadGenerated = () => {
  if (!generatedOutput.value) return;
  const option = outputOptions.find(item => item.id === selectedOutput.value)!;
  FileUtils.saveFile(generatedOutput.value, `datatree-${option.extension}`, option.mime);
};

const jumpToPath = (path: string) => {
  treeStore.expandToPath(path);
  treeStore.setSelectedPath(path);
};

const jumpToIssue = (issue: TContractIssue) => {
  documentStore.selectContractIssue(issue);
  jumpToPath(issue.path);
};
</script>
