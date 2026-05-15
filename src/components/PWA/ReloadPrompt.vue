<template>
  <div
    v-if="offlineReady || needRefresh"
    class="fixed bottom-6 left-6 z-[120] p-4 bg-base border border-blue-200 dark:border-blue-800 rounded-xl shadow-2xl flex flex-col gap-3 max-w-xs animate-slide-up"
  >
    <div class="flex items-start gap-3">
      <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
        <div v-if="offlineReady" class="i-carbon-cloud-offline text-xl" />
        <div v-else class="i-carbon-update-now text-xl" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-base">
          {{ offlineReady ? t('pwa.ready') : t('pwa.update') }}
        </h4>
        <p class="text-xs text-muted mt-1">
          {{ offlineReady ? t('pwa.readyDescription') : t('pwa.updateDescription') }}
        </p>
      </div>
    </div>

    <div class="flex gap-2 justify-end">
      <button
        class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-base transition-colors"
        @click="close"
      >
        {{ t('common.close') }}
      </button>
      <button
        v-if="needRefresh"
        class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-blue-200 dark:shadow-none"
        @click="updateServiceWorker()"
      >
        {{ t('common.reloadUpdate') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import useI18n from '@/composables/useI18n'

const { t } = useI18n()

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<style scoped>
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

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
