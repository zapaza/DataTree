<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-document-import" />
      Data Import
    </h3>

    <div class="grid grid-cols-1 gap-2">
      <input
        ref="fileInput"
        type="file"
        accept=".json,.xml"
        class="hidden"
        @change="onFileChange"
      />

      <button
        class="flex items-center gap-3 px-3 py-3 bg-base border border-base rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
        @click="triggerFileInput"
      >
        <div class="i-carbon-upload text-2xl text-blue-500 group-hover:scale-110 transition-transform" />
        <div class="flex flex-col items-start">
          <span class="text-xs font-bold text-base">Import File</span>
          <span class="text-[10px] text-light">JSON or XML</span>
        </div>
      </button>

      <button
        class="flex items-center gap-3 px-3 py-3 bg-base border border-base rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/10 hover:border-teal-200 dark:hover:border-teal-800 transition-all group"
        @click="handleExport"
      >
        <div class="i-carbon-download text-2xl text-teal-500 group-hover:scale-110 transition-transform" />
        <div class="flex flex-col items-start">
          <span class="text-xs font-bold text-base">Export File</span>
          <span class="text-[10px] text-light">Save to disk</span>
        </div>
      </button>
    </div>
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
