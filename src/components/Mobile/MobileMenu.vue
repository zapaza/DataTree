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
          <h3 class="text-[10px] font-bold uppercase text-light tracking-widest mb-2 px-2">{{ t('sidebar.navigation') }}</h3>
          <div class="space-y-1">
            <router-link
              v-for="mode in productModes"
              :key="mode.id"
              :to="mode.path"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary text-base transition-colors"
              active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
              @click="$emit('close')"
            >
              <div :class="mode.icon" class="text-xl" />
              <span>{{ t(mode.labelKey) }}</span>
            </router-link>
          </div>
        </div>

        <!-- Tools -->
        <div class="px-4 mb-6">
          <h3 class="text-[10px] font-bold uppercase text-light tracking-widest mb-2 px-2">{{ t('sidebar.toolsData') }}</h3>
          <div class="space-y-1">
            <button
              v-for="item in actionItems"
              :key="item.id"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary text-base transition-colors"
              @click="emitAction(item.emit)"
            >
              <div :class="item.icon" class="text-xl text-blue-500" />
              <span class="font-medium">{{ t(item.labelKey) }}</span>
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
          <span>{{ t('sidebar.switchTheme') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PRODUCT_MODES } from '@/config/product-modes';
import useI18n from '@/composables/useI18n';

type TMenuEmit = 'toggle-examples' | 'toggle-history' | 'toggle-settings' | 'toggle-inspect-tools';

const emit = defineEmits<{
  close: [];
  'toggle-examples': [];
  'toggle-inspect-tools': [];
  'toggle-history': [];
  'toggle-settings': [];
  'toggle-theme': [];
}>();

const { t } = useI18n();

const actionItems: Array<{ id: string; icon: string; labelKey: string; emit: TMenuEmit }> = [
  { id: 'examples', icon: 'i-carbon-template', labelKey: 'sidebar.examples', emit: 'toggle-examples' },
  { id: 'inspect-tools', icon: 'i-carbon-data-view-alt', labelKey: 'sidebar.sidePanels', emit: 'toggle-inspect-tools' },
  { id: 'history', icon: 'i-carbon-time', labelKey: 'sidebar.history', emit: 'toggle-history' },
  { id: 'settings', icon: 'i-carbon-settings', labelKey: 'sidebar.settings', emit: 'toggle-settings' },
];
const productModes = PRODUCT_MODES;

const emitAction = (eventName: TMenuEmit) => {
  switch (eventName) {
    case 'toggle-examples':
      emit('toggle-examples');
      break;
    case 'toggle-history':
      emit('toggle-history');
      break;
    case 'toggle-inspect-tools':
      emit('toggle-inspect-tools');
      break;
    case 'toggle-settings':
      emit('toggle-settings');
      break;
  }
  emit('close');
};
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
