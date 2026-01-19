<template>
  <div class="p-4 space-y-4">
    <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
      <div class="i-carbon-settings-adjust" />
      Diff Controls
    </h3>

    <div class="space-y-2">
      <button
        class="w-full flex items-center justify-center gap-2 py-2 px-4 bg-base border border-base hover:bg-secondary text-muted rounded-lg text-xs font-bold transition-all shadow-sm"
        @click="handleReset"
      >
        <div class="i-carbon-reset" />
        Reset Comparison
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiffStore } from '@/stores/diffStore';
import useClipboard from '@/composables/useClipboard';

const diffStore = useDiffStore();
const { showToast } = useClipboard();

const handleReset = () => {
  diffStore.setLeftRaw('');
  diffStore.setRightRaw('');
  showToast('Comparison reset', 'info');
};

</script>
