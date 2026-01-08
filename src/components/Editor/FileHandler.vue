<template>
  <div class="flex items-center gap-1 border-l border-base pl-2 ml-2">
    <input
      ref="fileInput"
      type="file"
      accept=".json,.xml"
      class="hidden"
      @change="onFileChange"
    />

    <button
      class="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-1"
      title="Import file (JSON/XML)"
      @click="triggerFileInput"
    >
      <div class="i-carbon-upload text-sm" />
      <span class="text-[10px] font-medium hidden sm:inline">Import</span>
    </button>

    <button
      class="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-1"
      title="Export to file"
      @click="handleExport"
    >
      <div class="i-carbon-download text-sm" />
      <span class="text-[10px] font-medium hidden sm:inline">Export</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import useFileHandler from '@/composables/useFileHandler';

const { handleImport, handleExport } = useFileHandler();
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleImport(file);
    target.value = '';
  }
};
</script>
