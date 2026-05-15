
<template>
  <aside class="flex h-full border-r border-base bg-sidebar transition-all duration-300 overflow-hidden w-72 flex-col">
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="p-4 border-b border-base bg-secondary">
        <div class="flex items-center gap-2">
          <div :class="activeMode.icon" class="text-lg text-blue-500" />
          <div class="min-w-0">
            <h2 class="text-xs font-bold uppercase tracking-wider text-muted">{{ t(activeMode.labelKey) }}</h2>
            <p class="text-[10px] text-light truncate">{{ modeSubtitle }}</p>
          </div>
        </div>
      </div>

      <div :key="route.path">
        <template v-if="activeMode.id === 'inspect'">
          <FileImportButtons />
          <ExamplesPanel :embedded="true" />
        </template>

        <template v-else-if="activeMode.id === 'validate'">
          <FileImportButtons />
        </template>

        <template v-else-if="activeMode.id === 'compare'">
          <DiffControls />
          <div class="h-px bg-base mx-4 my-2" />
          <DiffSessions />
          <div class="h-px bg-base mx-4 my-2" />
          <DiffExport />
        </template>

        <template v-else-if="activeMode.id === 'transform'">
          <FileImportButtons />
          <ExamplesPanel :embedded="true" />
        </template>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="p-4 border-t border-base bg-secondary flex flex-col gap-2">
      <div class="flex gap-2">
        <button
          v-if="activeMode.id !== 'compare'"
          class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-muted hover:bg-base hover:text-blue-600 transition-all border border-transparent hover:border-base"
          :title="t('sidebar.viewHistory')"
          @click="$emit('toggle-history')"
        >
          <div class="i-carbon-time text-lg" />
          <span class="text-[10px] font-bold uppercase">{{ t('common.history') }}</span>
        </button>
        <button
          class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-muted hover:bg-base hover:text-blue-600 transition-all border border-transparent hover:border-base"
          :title="t('common.settings')"
          @click="$emit('toggle-settings')"
        >
          <div class="i-carbon-settings text-lg" />
          <span class="text-[10px] font-bold uppercase">{{ t('common.settings') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import FileImportButtons from '@/components/Sidebar/FileImportButtons.vue';
import ExamplesPanel from '@/components/Sidebar/ExamplesPanel.vue';
import DiffControls from '@/components/Sidebar/DiffControls.vue';
import DiffSessions from '@/components/Sidebar/DiffSessions.vue';
import DiffExport from '@/components/Sidebar/DiffExport.vue';
import { getProductModeByPath } from '@/config/product-modes';
import useI18n from '@/composables/useI18n';

const route = useRoute();
const { t } = useI18n();
const activeMode = computed(() => getProductModeByPath(route.path));
const modeSubtitle = computed(() => {
  switch (activeMode.value.id) {
    case 'inspect':
      return t('modes.inspect.subtitle');
    case 'validate':
      return t('modes.validate.subtitle');
    case 'compare':
      return t('modes.compare.subtitle');
    case 'transform':
      return t('modes.transform.subtitle');
    default:
      return '';
  }
});
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
