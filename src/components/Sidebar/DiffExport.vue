<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-export" />
      Export Diff
    </h3>

    <div class="grid grid-cols-1 gap-2">
      <button
        v-for="format in exportFormats"
        :key="format.id"
        class="flex items-center gap-3 px-3 py-2 bg-base border border-base rounded-lg hover:bg-secondary transition-all group disabled:opacity-50 disabled:hover:bg-base"
        :disabled="!diffStore.diffResult"
        @click="format.action"
      >
        <div :class="format.icon" class="text-xl text-blue-500 group-hover:scale-110 transition-transform" />
        <div class="flex flex-col items-start">
          <span class="text-[10px] font-bold text-base uppercase tracking-tight">{{ format.label }}</span>
          <span class="text-[9px] text-light leading-none">{{ format.description }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiffStore } from '@/stores/diffStore';
import useDiffExporter from '@/composables/useDiffExporter';

const diffStore = useDiffStore();
const { exportAsJsonPatch, exportAsCSV, exportAsUnifiedDiff, exportAsHTML } = useDiffExporter();

const exportFormats = [
  {
    id: 'json-patch',
    label: 'JSON Patch',
    description: 'RFC 6902 Standard',
    icon: 'i-carbon-json',
    action: exportAsJsonPatch
  },
  {
    id: 'unified-diff',
    label: 'Unified Diff',
    description: 'Git-style .patch file',
    icon: 'i-carbon-script',
    action: exportAsUnifiedDiff
  },
  {
    id: 'html-report',
    label: 'HTML Report',
    description: 'Visual standalone report',
    icon: 'i-carbon-document-pdf',
    action: exportAsHTML
  },
  {
    id: 'csv-stats',
    label: 'CSV Statistics',
    description: 'Raw data for Excel',
    icon: 'i-carbon-table',
    action: exportAsCSV
  }
];

</script>
