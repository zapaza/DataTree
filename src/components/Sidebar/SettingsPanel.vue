<template>
  <div class="flex flex-col h-full bg-base border-r border-base w-80 shadow-xl overflow-hidden animate-fade-in-left">
    <div class="p-4 border-b border-light flex items-center justify-between bg-secondary">
      <div class="flex items-center gap-2">
        <div class="i-carbon-settings text-blue-600 dark:text-blue-400 text-xl" />
        <h2 class="font-bold text-base">Settings</h2>
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
          Appearance
        </h3>
        <div class="flex items-center justify-between p-3 rounded-xl border border-light bg-secondary">
          <span class="text-sm text-base font-medium">Dark Mode</span>
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
      </section>

      <!-- Editor Settings -->
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-code" />
          Editor
        </h3>
        <div class="space-y-2">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted font-medium ml-1">Font Size: {{ settingsStore.settings.editor.fontSize }}px</label>
            <input
              type="range"
              min="10"
              max="24"
              v-model.number="settingsStore.settings.editor.fontSize"
              class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">Line Numbers</span>
            <input type="checkbox" v-model="settingsStore.settings.editor.showLineNumbers" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">Minimap</span>
            <input type="checkbox" v-model="settingsStore.settings.editor.minimap" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex flex-col gap-1.5 pt-1">
            <label class="text-xs text-muted font-medium ml-1">Render Whitespace</label>
            <select
              v-model="settingsStore.settings.editor.renderWhitespace"
              class="w-full p-2 text-xs bg-secondary border border-base rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-base"
            >
              <option value="none">None</option>
              <option value="boundary">Boundary</option>
              <option value="selection">Selection</option>
              <option value="trailing">Trailing</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Tree Settings -->
      <section class="space-y-3">
        <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
          <div class="i-carbon-tree-view" />
          Tree Visualization
        </h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">Show Icons</span>
            <input type="checkbox" v-model="settingsStore.settings.tree.showIcons" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex items-center justify-between py-2 border-b border-light">
            <span class="text-sm text-base">Animations</span>
            <input type="checkbox" v-model="settingsStore.settings.tree.animate" class="rounded border-base text-blue-600 focus:ring-blue-500 bg-base" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted font-medium ml-1">Indent Size: {{ settingsStore.settings.tree.indentSize }}px</label>
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
        <div class="flex items-center gap-2">
          <button
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-base rounded-lg text-xs font-bold transition-colors shadow-sm"
            @click="handleExport"
          >
            <div class="i-carbon-export" />
            Export
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] text-base rounded-lg text-xs font-bold transition-colors shadow-sm"
            @click="triggerImport"
          >
            <div class="i-carbon-import" />
            Import
          </button>
        </div>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />

        <button
          class="w-full flex items-center justify-center gap-2 py-2 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          @click="settingsStore.resetSettings"
        >
          <div class="i-carbon-reset" />
          Reset to Default
        </button>
      </section>
    </div>

    <div class="p-4 bg-secondary border-t border-light">
      <p class="text-[10px] text-light text-center uppercase tracking-widest font-bold">
        Version 1.0.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import useClipboard from '@/composables/useClipboard';

const emit = defineEmits(['close']);
const settingsStore = useSettingsStore();
const { showToast } = useClipboard();

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
  showToast('Settings exported successfully', 'success');
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
        showToast('Settings imported successfully', 'success');
      } else {
        showToast('Failed to import settings. Invalid format.', 'error');
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
