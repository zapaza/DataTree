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
          {{ offlineReady ? 'App Ready Offline' : 'New Content Available' }}
        </h4>
        <p class="text-xs text-muted mt-1">
          {{ offlineReady ? 'You can now use DataTree even without internet connection.' : 'A new version of DataTree is available. Reload to update.' }}
        </p>
      </div>
    </div>

    <div class="flex gap-2 justify-end">
      <button
        class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-base transition-colors"
        @click="close"
      >
        Close
      </button>
      <button
        v-if="needRefresh"
        class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-blue-200 dark:shadow-none"
        @click="updateServiceWorker()"
      >
        Reload & Update
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

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
