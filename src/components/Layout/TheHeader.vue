<template>
  <header class="h-14 border-b border-base bg-base px-4 flex items-center justify-between sticky top-0 z-10">
    <div class="flex items-center gap-2">
      <button
        v-if="isMobile"
        class="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
        aria-label="Toggle menu"
        @click="$emit('toggle-menu')"
      >
        <div class="i-carbon-menu text-xl" />
      </button>

      <div class="i-carbon-data-base text-2xl text-blue-600 dark:text-blue-400" />
      <div class="flex items-baseline gap-1">
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400">
          DataTree
        </span>
        <span class="text-xs item font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400">- alfa</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button
        v-if="!isMobile"
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
        :aria-label="settingsStore.settings.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'"
        @click="settingsStore.toggleTheme"
      >
        <div v-if="settingsStore.settings.theme === 'light'" class="i-carbon-sun text-xl" />
        <div v-else class="i-carbon-moon text-xl text-blue-400" />
      </button>
      <a
        v-if="!isMobile"
        href="https://github.com/zapaza/DataTree"
        target="_blank"
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors text-base"
        aria-label="GitHub repository"
      >
        <div class="i-carbon-logo-github text-xl" />
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore';
import { useBreakpoints } from '@/composables/useBreakpoints';

const settingsStore = useSettingsStore();
const { isMobile } = useBreakpoints();

defineEmits(['toggle-menu']);
</script>
