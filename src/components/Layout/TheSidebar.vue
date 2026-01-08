
<template>
  <aside class="w-12 md:w-14 border-r border-base bg-sidebar flex flex-col items-center py-4 gap-4">
    <button
      class="p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
      title="Files"
      @click="triggerImport"
    >
      <div class="i-carbon-document text-2xl" />
    </button>
    <button
      class="p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
      title="Examples"
      @click="$emit('toggle-examples')"
    >
      <div class="i-carbon-template text-2xl" />
    </button>
    <button
      class="p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
      title="History"
      @click="$emit('toggle-history')"
    >
      <div class="i-carbon-time text-2xl" />
    </button>

    <div class="mt-auto flex flex-col gap-4">
      <button
        class="p-2 rounded-lg text-muted hover:bg-base hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
        title="Settings"
        @click="$emit('toggle-settings')"
      >
        <div class="i-carbon-settings text-2xl" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">

const emit = defineEmits(['toggle-examples', 'toggle-history', 'toggle-settings']);

const triggerImport = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  input?.click();
};
</script>
