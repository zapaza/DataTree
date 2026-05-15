<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="i-carbon-ai-status text-blue-500" />
        <h3 class="text-xs font-bold uppercase tracking-wider text-muted">{{ t('inspect.smartInsights') }}</h3>
      </div>
      <span v-if="documentStore.parsedData" class="text-[10px] text-light font-mono">{{ t('inspect.signals', { count: totalSignals }) }}</span>
    </div>

    <div v-if="!documentStore.parsedData" class="text-xs text-light italic">
      {{ t('inspect.parseForInsights') }}
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-1.5">
        <div
          v-for="metric in metrics"
          :key="metric.label"
          class="rounded border border-light bg-base px-2 py-1.5"
          :class="metric.count > 0 ? metric.tone : 'text-light'"
        >
          <div class="text-sm font-bold leading-none">{{ metric.count }}</div>
          <div class="text-[9px] uppercase font-bold truncate">{{ metric.label }}</div>
        </div>
      </div>

      <div v-if="totalSignals === 0" class="flex items-center gap-2 rounded border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/10 dark:border-green-900/40 dark:text-green-300">
        <div class="i-carbon-checkmark-outline" />
        <span>{{ t('inspect.noRisks') }}</span>
      </div>

      <InsightSection
        :title="t('inspect.suspiciousFields')"
        icon="i-carbon-security"
        :items="insights.suspiciousFields"
        tone="risk"
      />
      <InsightSection
        :title="t('inspect.nullableFields')"
        icon="i-carbon-unknown"
        :items="insights.nullableFields"
        tone="warn"
      />
      <InsightSection
        :title="t('inspect.emptyCollections')"
        icon="i-carbon-container-software"
        :items="insights.emptyCollections"
        tone="info"
      />

      <div v-if="insights.mixedTypeArrays.length" class="space-y-1.5">
        <SectionTitle icon="i-carbon-data-categorical" :title="t('inspect.mixedArrays')" tone="warn" />
        <InsightRow
          v-for="item in insights.mixedTypeArrays.slice(0, 4)"
          :key="item.path"
          :path="item.jsonPath"
          :meta="item.types.join(', ')"
        />
      </div>

      <div v-if="insights.duplicateIds.length" class="space-y-1.5">
        <SectionTitle icon="i-carbon-warning-alt" :title="t('inspect.duplicateIds')" tone="risk" />
        <InsightRow
          v-for="item in insights.duplicateIds.slice(0, 4)"
          :key="item.value"
          :path="`id = ${item.value}`"
          :meta="t('inspect.occurrences', { count: item.count })"
        />
      </div>

      <div v-if="insights.dateFields.length" class="space-y-1.5">
        <SectionTitle icon="i-carbon-calendar" :title="t('inspect.dateFields')" tone="info" />
        <div class="flex flex-wrap gap-1">
          <span
            v-for="format in insights.dateFormats"
            :key="format.format"
            class="rounded bg-secondary border border-light px-1.5 py-0.5 text-[10px] text-muted font-mono"
          >
            {{ format.format }} · {{ format.count }}
          </span>
        </div>
        <InsightRow
          v-for="item in insights.dateFields.slice(0, 4)"
          :key="item.path"
          :path="item.jsonPath"
          :meta="item.format"
        />
      </div>

      <div class="space-y-1.5">
        <SectionTitle icon="i-carbon-tree-view-alt" :title="t('inspect.deepestPaths')" tone="info" />
        <InsightRow
          v-for="item in insights.deepestPaths"
          :key="item.path"
          :path="item.jsonPath"
          :meta="t('inspect.depth', { depth: item.depth })"
        />
      </div>

      <div class="space-y-1.5">
        <SectionTitle icon="i-carbon-chart-relationship" :title="t('inspect.largestBranches')" tone="info" />
        <InsightRow
          v-for="item in insights.largestBranches"
          :key="item.path"
          :path="item.jsonPath"
          :meta="t('inspect.nodes', { count: item.nodes })"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type PropType } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { analyzeSmartInsights, type TInsightPathItem } from '@/utils/smart-insights';
import useI18n from '@/composables/useI18n';

const documentStore = useDocumentStore();
const { t } = useI18n();

const insights = computed(() => analyzeSmartInsights(documentStore.parsedData));
const totalSignals = computed(() => {
  const value = insights.value;
  return value.suspiciousFields.length
    + value.nullableFields.length
    + value.emptyCollections.length
    + value.mixedTypeArrays.length
    + value.duplicateIds.length
    + value.dateFields.length;
});

const metrics = computed(() => [
  { label: t('inspect.metrics.secrets'), count: insights.value.suspiciousFields.length, tone: 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/10' },
  { label: t('inspect.metrics.nullable'), count: insights.value.nullableFields.length, tone: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/10' },
  { label: t('inspect.metrics.empty'), count: insights.value.emptyCollections.length, tone: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' },
  { label: t('inspect.metrics.mixed'), count: insights.value.mixedTypeArrays.length, tone: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/10' },
]);

const toneClass = (tone: string) => {
  if (tone === 'risk') return 'text-red-600 dark:text-red-300';
  if (tone === 'warn') return 'text-amber-700 dark:text-amber-300';
  return 'text-blue-600 dark:text-blue-300';
};

const SectionTitle = defineComponent({
  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    tone: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: ['flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide', toneClass(props.tone)] }, [
      h('div', { class: props.icon }),
      h('span', props.title),
    ]);
  },
});

const InsightRow = defineComponent({
  props: {
    path: { type: String, required: true },
    meta: { type: String, required: true },
  },
  setup(props) {
    return () => h('div', { class: 'rounded border border-light bg-base px-2 py-1.5' }, [
      h('div', { class: 'truncate text-[11px] font-mono text-base', title: props.path }, props.path),
      h('div', { class: 'truncate text-[10px] text-light', title: props.meta }, props.meta),
    ]);
  },
});

const InsightSection = defineComponent({
  props: {
    title: { type: String, required: true },
    icon: { type: String, required: true },
    items: { type: Array as PropType<TInsightPathItem[]>, required: true },
    tone: { type: String, required: true },
  },
  setup(props) {
    return () => props.items.length
      ? h('div', { class: 'space-y-1.5' }, [
        h(SectionTitle, { icon: props.icon, title: props.title, tone: props.tone }),
        ...props.items.slice(0, 4).map(item => h(InsightRow, {
          key: item.path,
          path: item.jsonPath,
          meta: item.valuePreview ?? item.type,
        })),
      ])
      : null;
  },
});
</script>
