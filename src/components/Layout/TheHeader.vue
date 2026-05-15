<template>
  <header class="min-h-16 border-b border-base bg-base px-4 sticky top-0 z-10 py-2">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <button
          v-if="isMobile"
          class="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
          :aria-label="t('header.menu')"
          @click="$emit('toggle-menu')"
        >
          <div class="i-carbon-menu text-xl" />
        </button>

        <div class="i-carbon-data-base text-2xl text-blue-600 dark:text-blue-400" />
        <div class="flex flex-col leading-tight min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400">
              DataTree
            </span>
            <span class="text-[10px] font-bold text-light uppercase tracking-wide">{{ appDisplayVersion }}</span>
          </div>
          <span class="text-[11px] text-light font-medium truncate">{{ t('header.subtitle') }}</span>
        </div>

        <nav v-if="!isCompactHeader" class="flex items-center gap-1 px-1 py-1 bg-secondary rounded-lg border border-base ml-3">
          <router-link
            v-for="mode in productModes"
            :key="mode.id"
            :to="mode.path"
            class="px-3 py-1 text-xs rounded-md transition-all"
            active-class="bg-base shadow-sm font-semibold text-blue-600 dark:text-blue-400"
            :class="{ 'text-muted hover:text-base': $route.path !== mode.path }"
          >
            {{ t(mode.labelKey) }}
          </router-link>
        </nav>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          class="hidden sm:flex items-center gap-2 rounded-md border border-base bg-secondary px-2 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-blue-600"
          :title="t('header.commandPalette')"
          @click="openCommandPalette"
        >
          <div class="i-carbon-search text-sm" />
          <span v-if="!isCompactHeader">{{ t('common.commands') }}</span>
          <kbd class="rounded border border-base bg-base px-1 py-0.5 text-[9px] font-bold text-light">Cmd K</kbd>
        </button>
        <div v-if="!isCompactHeader" class="flex items-center gap-1">
          <div
            v-for="status in privacyStatuses"
            :key="status.label"
            class="flex items-center gap-1.5 px-2 py-1 rounded border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 text-[10px] font-bold uppercase text-green-700 dark:text-green-300"
            :title="status.title"
          >
            <div :class="status.icon" class="text-xs" />
            <span>{{ status.label }}</span>
          </div>
        </div>
        <div
          v-if="!isOnline"
          class="px-2 py-1 rounded border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-200"
          :title="t('header.offlineTitle')"
        >
          {{ t('header.offline') }}
        </div>
        <button
          v-if="!isMobile"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
          :aria-label="settingsStore.settings.theme === 'light' ? t('header.switchToDark') : t('header.switchToLight')"
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
          :aria-label="t('header.github')"
        >
          <div class="i-carbon-logo-github text-xl" />
        </a>
      </div>
    </div>

    <div v-if="isCompactHeader" class="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <nav class="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:gap-1" :aria-label="t('header.productModes')">
        <router-link
          v-for="mode in productModes"
          :key="mode.id"
          :to="mode.path"
          class="min-w-0 flex items-center justify-center gap-1 rounded-md border border-transparent px-1.5 py-1.5 text-[10px] font-bold uppercase transition-colors md:px-2"
          active-class="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
          :class="{ 'text-muted bg-secondary': $route.path !== mode.path }"
        >
          <div :class="mode.icon" class="text-sm shrink-0" />
          <span class="truncate">{{ t(mode.labelKey) }}</span>
        </router-link>
      </nav>

      <div class="flex flex-wrap gap-1 md:justify-end" :aria-label="t('header.privacyStatus')">
        <div
          v-for="status in privacyStatuses"
          :key="status.label"
          class="flex items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 py-1 text-[9px] font-bold uppercase text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-300"
          :title="status.title"
        >
          <div :class="status.icon" class="text-xs" />
          <span>{{ status.label }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBreakpoints } from '@/composables/useBreakpoints';
import useOnlineStatus from '@/composables/useOnlineStatus';
import { APP_DISPLAY_VERSION } from '@/config/app-meta';
import { PRODUCT_MODES } from '@/config/product-modes';
import useI18n from '@/composables/useI18n';

const settingsStore = useSettingsStore();
const { isMobile, width } = useBreakpoints();
const { isOnline } = useOnlineStatus();
const { t } = useI18n();
const appDisplayVersion = APP_DISPLAY_VERSION;
const productModes = PRODUCT_MODES;
const isCompactHeader = computed(() => width.value < 1100);
const privacyStatuses = computed(() => [
  {
    label: t('header.privacy.local'),
    icon: 'i-carbon-security',
    title: t('header.privacy.localTitle'),
  },
  {
    label: t('header.privacy.offlineReady'),
    icon: 'i-carbon-wifi-off',
    title: t('header.privacy.offlineReadyTitle'),
  },
  {
    label: t('header.privacy.noUpload'),
    icon: 'i-carbon-cloud-offline',
    title: t('header.privacy.noUploadTitle'),
  },
]);

const openCommandPalette = () => {
  window.dispatchEvent(new Event('datatree:open-command-palette'));
};

defineEmits(['toggle-menu']);
</script>
