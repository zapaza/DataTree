<template>
  <div class="flex flex-col h-full bg-base border-r border-base w-80 shadow-xl overflow-hidden animate-fade-in-left">
    <div class="p-4 border-b border-light flex items-center justify-between bg-secondary">
      <div class="flex items-center gap-2">
        <div class="i-carbon-settings text-blue-600 dark:text-blue-400 text-xl" />
        <h2 class="font-bold text-base">{{ t('settings.title') }}</h2>
      </div>
      <button
        class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-light hover:text-muted"
        @click="$emit('close')"
      >
        <div class="i-carbon-close text-xl" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
      <!-- Theme -->
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-color-palette" />
          {{ t('settings.appearance') }}
        </h3>
        <div class="flex items-center justify-between p-3 rounded-xl border border-light bg-secondary">
          <span class="text-sm text-base font-medium">{{ t('settings.darkMode') }}</span>
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="settingsStore.settings.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'"
            @click="settingsStore.toggleTheme"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="settingsStore.settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
        <div class="p-3 rounded-xl border border-light bg-secondary space-y-2">
          <label class="text-sm text-base font-medium" for="locale-select">{{ t('settings.language') }}</label>
          <select
            id="locale-select"
            :value="locale"
            class="w-full p-2 text-xs bg-base border border-base rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-base"
            @change="setLocale(($event.target as HTMLSelectElement).value as TLocale)"
          >
            <option value="en">{{ t('locale.english') }}</option>
            <option value="ru">{{ t('locale.russian') }}</option>
          </select>
          <p class="text-[10px] text-light leading-snug">
            {{ t('settings.languageHint') }}
          </p>
        </div>
      </section>

      <!-- Privacy -->
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-security" />
          {{ t('settings.privacy') }}
        </h3>
        <div class="p-3 rounded-xl border border-light bg-secondary space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <span class="text-sm text-base font-medium">{{ t('settings.anonymousAnalytics') }}</span>
              <p class="text-[10px] text-light leading-snug mt-1">
                {{ t('settings.analyticsHint') }}
              </p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              :class="settingsStore.settings.privacy.analyticsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'"
              :aria-label="settingsStore.settings.privacy.analyticsEnabled ? t('settings.disableAnalytics') : t('settings.enableAnalytics')"
              @click="settingsStore.updatePrivacySettings({ analyticsEnabled: !settingsStore.settings.privacy.analyticsEnabled })"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="settingsStore.settings.privacy.analyticsEnabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
      </section>

      <!-- Editor Settings -->
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-code" />
          {{ t('settings.editor') }}
        </h3>
        <div class="space-y-2">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted font-medium ml-1">{{ t('settings.fontSize', { size: settingsStore.settings.editor.fontSize }) }}</label>
            <input
              type="range"
              min="10"
              max="24"
              v-model.number="settingsStore.settings.editor.fontSize"
              class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">{{ t('settings.lineNumbers') }}</span>
            <input type="checkbox" v-model="settingsStore.settings.editor.showLineNumbers" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">{{ t('settings.minimap') }}</span>
            <input type="checkbox" v-model="settingsStore.settings.editor.minimap" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex flex-col gap-1.5 pt-1">
            <label class="text-xs text-muted font-medium ml-1">{{ t('settings.renderWhitespace') }}</label>
            <select
              v-model="settingsStore.settings.editor.renderWhitespace"
              class="w-full p-2 text-xs bg-secondary border border-base rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-base"
            >
              <option value="none">{{ t('settings.whitespace.none') }}</option>
              <option value="boundary">{{ t('settings.whitespace.boundary') }}</option>
              <option value="selection">{{ t('settings.whitespace.selection') }}</option>
              <option value="trailing">{{ t('settings.whitespace.trailing') }}</option>
              <option value="all">{{ t('settings.whitespace.all') }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Tree Settings -->
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-tree-view" />
          {{ t('settings.tree') }}
        </h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">{{ t('settings.showIcons') }}</span>
            <input type="checkbox" v-model="settingsStore.settings.tree.showIcons" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">{{ t('settings.animations') }}</span>
            <input type="checkbox" v-model="settingsStore.settings.tree.animate" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted font-medium ml-1">{{ t('settings.indentSize', { size: settingsStore.settings.tree.indentSize }) }}</label>
            <input
              type="range"
              min="10"
              max="40"
              step="4"
              v-model.number="settingsStore.settings.tree.indentSize"
              class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </section>

      <!-- Advanced -->
      <section class="space-y-3 pt-4">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-data-base" />
          {{ t('settings.diffSessions') }}
        </h3>

        <div class="flex flex-col gap-1">
          <label class="text-xs text-muted font-medium ml-1">{{ t('settings.retention', { days: settingsStore.settings.diffPersistence?.retentionDays ?? 30 }) }}</label>
          <input
            type="range"
            min="1"
            max="90"
            v-model.number="settingsStore.settings.diffPersistence!.retentionDays"
            class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p class="text-[10px] text-light leading-snug mt-1">
            {{ t('settings.retentionHint') }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-base rounded-lg text-xs font-bold transition-colors shadow-sm"
            @click="handleExport"
          >
            <div class="i-carbon-export" />
            {{ t('common.export') }}
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-base rounded-lg text-xs font-bold transition-colors shadow-sm"
            @click="triggerImport"
          >
            <div class="i-carbon-document-import" />
            {{ t('common.import') }}
          </button>
        </div>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />

        <button
          class="w-full flex items-center justify-center gap-2 py-2 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          @click="settingsStore.resetSettings"
        >
          <div class="i-carbon-reset" />
          {{ t('settings.resetDefault') }}
        </button>
      </section>
    </div>

    <div class="p-4 bg-secondary border-t border-light">
      <p class="text-[10px] text-light text-center uppercase tracking-widest font-bold">
        {{ appDisplayVersion }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import useClipboard from '@/composables/useClipboard';
import { APP_DISPLAY_VERSION } from '@/config/app-meta';
import useI18n from '@/composables/useI18n';
import type { TLocale } from '@/types/store';

defineEmits(['close']);
const settingsStore = useSettingsStore();
const { showToast } = useClipboard();
const { locale, setLocale, t } = useI18n();
const appDisplayVersion = APP_DISPLAY_VERSION;

const fileInput = ref<HTMLInputElement | null>(null);

const handleExport = () => {
  const settings = settingsStore.exportSettings();
  const blob = new Blob([settings], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `datatree-settings-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('toast.settingsExported'), 'success');
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleImport = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (settingsStore.importSettings(content)) {
        showToast(t('toast.settingsImported'), 'success');
      } else {
        showToast(t('toast.settingsImportFailed'), 'error');
      }
    };
    reader.readAsText(file);
  }
};
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
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

@keyframes fade-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in-left {
  animation: fade-in-left 0.3s ease-out;
}
</style>
