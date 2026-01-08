<template>
  <div v-if="enhancedErrors.length > 0" class="error-panel absolute bottom-0 left-0 right-0 z-20 max-h-48 overflow-y-auto animate-slide-up">
    <div class="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800/50 shadow-2xl">
      <div v-for="(error, index) in enhancedErrors" :key="index" class="p-3 border-b border-red-100 dark:border-red-800/30 last:border-0">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="i-carbon-error-filled text-red-500 text-lg mt-0.5 shrink-0" />
            <div class="space-y-1">
              <p class="text-sm font-bold text-red-800 dark:text-red-300 leading-tight">
                {{ error.message }}
              </p>
              <div class="flex items-center gap-3 text-[10px] text-red-600 dark:text-red-400 font-mono">
                <span>Line: {{ error.line }}, Col: {{ error.column }}</span>
                <button
                  class="hover:underline flex items-center gap-1"
                  @click="copyError(`${error.message} (Line: ${error.line}, Col: ${error.column})`)"
                >
                  <div class="i-carbon-copy" />
                  Copy error
                </button>
              </div>
              <div v-if="error.snippet" class="mt-2 p-1.5 bg-red-100/50 dark:bg-red-900/40 rounded font-mono text-[11px] text-red-900 dark:text-red-200 overflow-x-auto">
                {{ error.snippet }}
              </div>
            </div>
          </div>

          <button
            v-if="error.suggestion"
            class="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
            @click="applyFix(error)"
          >
            <div class="i-carbon-magic-wand" />
            {{ error.suggestion.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useErrorHandler from '@/composables/useErrorHandler';
import useClipboard from '@/composables/useClipboard';

const { enhancedErrors, applyFix } = useErrorHandler();
const { copy } = useClipboard();

const copyError = (msg: string) => {
  copy(msg, 'Error message copied to clipboard');
};
</script>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.error-panel::-webkit-scrollbar {
  width: 4px;
}
.error-panel::-webkit-scrollbar-track {
  background: transparent;
}
.error-panel::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.2);
  border-radius: 10px;
}
</style>
