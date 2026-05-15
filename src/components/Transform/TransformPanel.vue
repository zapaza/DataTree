<template>
  <div class="p-4 space-y-4">
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider">{{ t('transform.studio') }}</h3>
        <span class="text-[10px] uppercase font-bold text-muted">{{ documentStore.format }}</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="group in toolGroups"
          :key="group.id"
          class="space-y-1.5"
        >
          <div class="text-[10px] font-bold uppercase tracking-wider text-light">{{ group.label }}</div>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="tool in group.tools"
              :key="tool.id"
              class="min-h-14 rounded border px-2 py-2 text-left transition-colors"
              :class="transformStore.selectedTool === tool.id ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'border-base bg-base text-muted hover:text-blue-600'"
              @click="transformStore.setTool(tool.id)"
            >
              <div class="flex items-center gap-2">
                <div :class="tool.icon" class="text-base shrink-0" />
                <div class="min-w-0">
                  <div class="text-[10px] font-bold uppercase leading-tight">{{ tool.label }}</div>
                  <div class="mt-0.5 text-[9px] opacity-70 leading-tight">{{ tool.hint }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="usesXmlOptions"
      class="space-y-2 border-t border-base pt-4"
    >
      <h4 class="text-[10px] font-bold uppercase tracking-wider text-light">{{ t('transform.xmlOptions') }}</h4>
      <label class="block space-y-1">
        <span class="text-[10px] font-bold uppercase text-light">{{ t('transform.rootElement') }}</span>
        <input
          v-model="transformStore.xmlOptions.rootName"
          class="w-full rounded border border-base bg-base px-2 py-1.5 text-xs text-base outline-none focus:border-blue-300"
          placeholder="root"
        >
      </label>
      <div class="grid grid-cols-2 gap-2">
        <label class="block space-y-1">
          <span class="text-[10px] font-bold uppercase text-light">{{ t('transform.attributePrefix') }}</span>
          <input
            v-model="transformStore.xmlOptions.attributePrefix"
            class="w-full rounded border border-base bg-base px-2 py-1.5 text-xs font-mono text-base outline-none focus:border-blue-300"
            placeholder="@_"
          >
        </label>
        <label class="block space-y-1">
          <span class="text-[10px] font-bold uppercase text-light">{{ t('transform.textNode') }}</span>
          <input
            v-model="transformStore.xmlOptions.textNodeName"
            class="w-full rounded border border-base bg-base px-2 py-1.5 text-xs font-mono text-base outline-none focus:border-blue-300"
            placeholder="#text"
          >
        </label>
      </div>
      <label class="flex items-center justify-between rounded border border-base bg-base px-3 py-2">
        <span class="text-xs text-muted">{{ t('transform.prettyXml') }}</span>
        <input
          v-model="transformStore.xmlOptions.format"
          type="checkbox"
          class="h-4 w-4 accent-blue-600"
        >
      </label>
    </section>

    <section
      v-if="transformStore.selectedTool === 'redact'"
      class="space-y-2 border-t border-base pt-4"
    >
      <h4 class="text-[10px] font-bold uppercase tracking-wider text-light">{{ t('transform.redactionRules') }}</h4>
      <label class="flex items-center justify-between rounded border border-base bg-base px-3 py-2">
        <span class="text-xs text-muted">{{ t('transform.commonSecrets') }}</span>
        <input
          v-model="transformStore.redactOptions.commonKeys"
          type="checkbox"
          class="h-4 w-4 accent-blue-600"
        >
      </label>
      <label class="block space-y-1">
        <span class="text-[10px] font-bold uppercase text-light">{{ t('transform.customKeys') }}</span>
        <textarea
          v-model="transformStore.redactOptions.customKeys"
          class="h-20 w-full rounded border border-base bg-base px-2 py-1.5 text-xs font-mono text-base outline-none focus:border-blue-300 resize-none"
          :placeholder="t('transform.customKeysPlaceholder')"
        />
      </label>
      <label class="block space-y-1">
        <span class="text-[10px] font-bold uppercase text-light">{{ t('transform.maskValue') }}</span>
        <input
          v-model="transformStore.redactOptions.mask"
          class="w-full rounded border border-base bg-base px-2 py-1.5 text-xs font-mono text-base outline-none focus:border-blue-300"
          placeholder="[REDACTED]"
        >
      </label>
    </section>

    <section class="rounded border border-light bg-base p-3 text-[11px] text-light leading-relaxed">
      {{ t('transform.previewHint') }}
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { useTransformStore } from '@/stores/transformStore';
import { useI18n } from '@/composables/useI18n';
import type { TTransformTool } from '@/utils/transformers/transform-tools';

type TToolItem = {
  id: TTransformTool;
  label: string;
  hint: string;
  icon: string;
};

const documentStore = useDocumentStore();
const transformStore = useTransformStore();
const { t } = useI18n();

const toolGroups = computed<Array<{ id: string; label: string; tools: TToolItem[] }>>(() => [
  {
    id: 'formats',
    label: t('transform.groups.formats'),
    tools: [
      { id: 'formatJson', label: t('transform.tools.formatJson'), hint: t('transform.hints.formatJson'), icon: 'i-carbon-center-to-fit' },
      { id: 'minifyJson', label: t('transform.tools.minifyJson'), hint: t('transform.hints.minifyJson'), icon: 'i-carbon-bring-to-front' },
      { id: 'sortKeys', label: t('transform.tools.sortKeys'), hint: t('transform.hints.sortKeys'), icon: 'i-carbon-sort-ascending' },
      { id: 'jsonToXml', label: t('transform.tools.jsonToXml'), hint: t('transform.hints.jsonToXml'), icon: 'i-carbon-code' },
      { id: 'xmlToJson', label: t('transform.tools.xmlToJson'), hint: t('transform.hints.xmlToJson'), icon: 'i-carbon-document-import' },
      { id: 'flattenCsv', label: t('transform.tools.flattenCsv'), hint: t('transform.hints.flattenCsv'), icon: 'i-carbon-table' },
    ],
  },
  {
    id: 'privacy',
    label: t('transform.groups.privacy'),
    tools: [
      { id: 'redact', label: t('transform.tools.redact'), hint: t('transform.hints.redact'), icon: 'i-carbon-security' },
    ],
  },
  {
    id: 'codegen',
    label: t('transform.groups.codegen'),
    tools: [
      { id: 'typescript', label: t('transform.tools.typescript'), hint: t('transform.hints.typescript'), icon: 'i-carbon-code' },
      { id: 'zod', label: t('transform.tools.zod'), hint: t('transform.hints.zod'), icon: 'i-carbon-script' },
      { id: 'jsonSchema', label: t('transform.tools.jsonSchema'), hint: t('transform.hints.jsonSchema'), icon: 'i-carbon-rule' },
      { id: 'fetchSnippet', label: t('transform.tools.fetchSnippet'), hint: t('transform.hints.fetchSnippet'), icon: 'i-carbon-api' },
    ],
  },
]);

const usesXmlOptions = computed(() => {
  return ['jsonToXml', 'xmlToJson', 'redact'].includes(transformStore.selectedTool);
});
</script>
