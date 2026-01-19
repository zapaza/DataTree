<template>
  <div class="fixed inset-0 z-[100] flex overflow-hidden pointer-events-none">
    <!-- Overlay -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity"
      @click="$emit('close')"
    />

    <!-- Menu Content -->
    <div class="relative w-72 max-w-[80vw] h-full bg-base shadow-2xl pointer-events-auto flex flex-col transform transition-transform animate-slide-in-left">
      <div class="p-4 border-b border-light flex items-center justify-between bg-secondary">
        <div class="flex items-center gap-2">
          <div class="i-carbon-data-base text-2xl text-blue-600 dark:text-blue-400" />
          <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400">DataTree</span>
        </div>
        <button
          class="p-2 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded-lg text-muted transition-colors"
          @click="$emit('close')"
        >
          <div class="i-carbon-close text-xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto py-4">
        <!-- Navigation -->
        <div class="px-4 mb-6">
          <h3 class="text-[10px] font-bold uppercase text-light tracking-widest mb-2 px-2">Navigation</h3>
          <div class="space-y-1">
            <router-link
              to="/"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary text-base transition-colors"
              exact-active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
              @click="$emit('close')"
            >
              <div class="i-carbon-edit text-xl" />
              <span>Editor</span>
            </router-link>
            <router-link
              to="/diff"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary text-base transition-colors"
              active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
              @click="$emit('close')"
            >
              <div class="i-carbon-compare text-xl" />
              <span>Diff</span>
            </router-link>
          </div>
        </div>

        <!-- Tools -->
        <div class="px-4 mb-6">
          <h3 class="text-[10px] font-bold uppercase text-light tracking-widest mb-2 px-2">Tools & Data</h3>
          <div class="space-y-1">
            <button
              v-for="item in actionItems"
              :key="item.id"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary text-base transition-colors"
              @click="$emit(item.emit as any); $emit('close')"
            >
              <div :class="item.icon" class="text-xl text-blue-500" />
              <span class="font-medium">{{ item.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="p-4 bg-secondary border-t border-light mt-auto">
        <button
          class="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-base border border-base shadow-sm font-medium text-base hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
          @click="$emit('toggle-theme')"
        >
          <div class="i-carbon-sun dark:hidden text-xl" />
          <div class="i-carbon-moon hidden dark:block text-xl text-blue-400" />
          <span>Switch Theme</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['close', 'toggle-examples', 'toggle-history', 'toggle-settings', 'toggle-theme']);

const actionItems = [
  { id: 'examples', icon: 'i-carbon-template', label: 'Examples', emit: 'toggle-examples' },
  { id: 'history', icon: 'i-carbon-time', label: 'History', emit: 'toggle-history' },
  { id: 'settings', icon: 'i-carbon-settings', label: 'Settings', emit: 'toggle-settings' },
];
</script>

<style scoped>
@keyframes slide-in-left {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
