
<template>
  <aside class="w-12 md:w-14 border-r border-base bg-sidebar flex flex-col items-center py-4 gap-4">
    <button
      ref="filesBtn"
      class="p-3 md:p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
      @click="triggerImport"
    >
      <div class="i-carbon-document text-2xl" />
    </button>
    <Tooltip :target="filesBtn" text="Import Files" position="right" />

    <button
      class="p-3 md:p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
      v-tooltip.right="'Browse Examples'"
      @click="$emit('toggle-examples')"
    >
      <div class="i-carbon-template text-2xl" />
    </button>
    <button
      class="p-3 md:p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
      v-tooltip.right="'View History'"
      @click="$emit('toggle-history')"
    >
      <div class="i-carbon-time text-2xl" />
    </button>

    <div class="mt-auto flex flex-col gap-4">
      <button
        class="p-3 md:p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
        v-tooltip.right="'Application Settings'"
        @click="$emit('toggle-settings')"
      >
        <div class="i-carbon-settings text-2xl" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Tooltip from '@/components/UI/Tooltip.vue';

const emit = defineEmits(['toggle-examples', 'toggle-history', 'toggle-settings']);
const filesBtn = ref<HTMLElement | null>(null);

const triggerImport = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  input?.click();
};
</script>
