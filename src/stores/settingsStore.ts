import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { TAppSettings } from '@/types/store';

const STORAGE_KEY = 'datatree_settings_v2';

const DEFAULT_SETTINGS: TAppSettings = {
  theme: 'light',
  editor: {
    fontSize: 14,
    fontFamily: 'Fira Code, monospace',
    showLineNumbers: true,
    minimap: false,
    tabSize: 2,
    renderWhitespace: 'selection',
    cursorStyle: 'line',
  },
  tree: {
    showIcons: true,
    animate: true,
    indentSize: 20,
    compactMode: false,
  },
};

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<TAppSettings>(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_SETTINGS))
  );

  const updateSettings = (newSettings: Partial<TAppSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  const updateEditorSettings = (newSettings: Partial<TAppSettings['editor']>) => {
    settings.value.editor = { ...settings.value.editor, ...newSettings };
  };

  const updateTreeSettings = (newSettings: Partial<TAppSettings['tree']>) => {
    settings.value.tree = { ...settings.value.tree, ...newSettings };
  };

  const toggleTheme = () => {
    settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light';
  };

  const resetSettings = () => {
    settings.value = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  };

  const exportSettings = () => {
    return JSON.stringify(settings.value, null, 2);
  };

  const importSettings = (json: string) => {
    try {
      const imported = JSON.parse(json);
      // Простая валидация структуры (можно добавить Zod для надежности)
      if (imported.theme && imported.editor && imported.tree) {
        settings.value = imported;
        return true;
      }
    } catch (e) {
      console.error('Failed to import settings:', e);
    }
    return false;
  };

  // Сохранение в localStorage при изменениях
  watch(
    settings,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    },
    { deep: true }
  );

  return {
    settings,
    updateSettings,
    updateEditorSettings,
    updateTreeSettings,
    toggleTheme,
    resetSettings,
    exportSettings,
    importSettings,
  };
});
