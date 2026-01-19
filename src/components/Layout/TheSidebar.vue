
<template>
  <aside class="flex h-full border-r border-base bg-sidebar transition-all duration-300 overflow-hidden w-72 flex-col">
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div :key="route.path">
        <template v-if="route.path === '/'">
          <!-- Обычный режим -->
          <FileImportButtons />
          <ExamplesPanel :embedded="true" />
        </template>

        <template v-else-if="route.path === '/diff'">
          <!-- Diff режим -->
          <DiffControls />
          <div class="h-px bg-base mx-4 my-2" />
          <DiffSessions />
          <div class="h-px bg-base mx-4 my-2" />
          <DiffStatistics />
          <div class="h-px bg-base mx-4 my-2" />
          <DiffExport />
        </template>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="p-4 border-t border-base bg-secondary flex flex-col gap-2">
      <div class="flex gap-2">
        <button
          v-if="route.path === '/'"
          class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-muted hover:bg-base hover:text-blue-600 transition-all border border-transparent hover:border-base"
          title="View History"
          @click="$emit('toggle-history')"
        >
          <div class="i-carbon-time text-lg" />
          <span class="text-[10px] font-bold uppercase">History</span>
        </button>
        <button
          class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-muted hover:bg-base hover:text-blue-600 transition-all border border-transparent hover:border-base"
          title="Settings"
          @click="$emit('toggle-settings')"
        >
          <div class="i-carbon-settings text-lg" />
          <span class="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import FileImportButtons from '@/components/Sidebar/FileImportButtons.vue';
import ExamplesPanel from '@/components/Sidebar/ExamplesPanel.vue';
import DiffControls from '@/components/Sidebar/DiffControls.vue';
import DiffSessions from '@/components/Sidebar/DiffSessions.vue';
import DiffStatistics from '@/components/Sidebar/DiffStatistics.vue';
import DiffExport from '@/components/Sidebar/DiffExport.vue';

const route = useRoute();
defineEmits(['toggle-history', 'toggle-settings']);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
}
</style>
