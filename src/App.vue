<template>
  <router-view />

  <!-- Global Toast Notification -->
  <Transition name="toast">
    <div
      v-if="toast.show"
      class="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl border transition-all"
      :class="[
        toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
        toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
        'bg-blue-50 border-blue-200 text-blue-800'
      ]"
    >
      <div :class="[
        toast.type === 'success' ? 'i-carbon-checkmark-filled' :
        toast.type === 'error' ? 'i-carbon-error-filled' :
        'i-carbon-information-filled'
      ]" class="text-xl" />
      <span class="text-sm font-medium">{{ toast.message }}</span>
    </div>
  </Transition>

  <ReloadPrompt />
</template>

<script setup lang="ts">
import ReloadPrompt from '@/components/PWA/ReloadPrompt.vue'
import useClipboard from '@/composables/useClipboard'
import useHistory from '@/composables/useHistory'
import useSettings from '@/composables/useSettings'
import '@/assets/styles/layout.css'
import '@/assets/styles/responsive.css'

const { toast } = useClipboard()
useHistory()
useSettings()
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
