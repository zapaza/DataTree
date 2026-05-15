import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { TAppSettings, TLocale } from '@/types/store';

const STORAGE_KEY = 'datatree_settings_v2';

const detectLocale = (): TLocale => {
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru')) {
    return 'ru';
  }
  return 'en';
};

const DEFAULT_SETTINGS: TAppSettings = {
  theme: 'light',
  locale: detectLocale(),
  editor: {
    fontSize: 14,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
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
  diffPersistence: {
    retentionDays: 30,
    maxSessions: 100,
  },
  privacy: {
    analyticsEnabled: false,
  },
};

const mergeWithDefaults = (settings: Partial<TAppSettings>): TAppSettings => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  editor: {
    ...DEFAULT_SETTINGS.editor,
    ...settings.editor,
  },
  tree: {
    ...DEFAULT_SETTINGS.tree,
    ...settings.tree,
  },
  diffPersistence: {
    ...DEFAULT_SETTINGS.diffPersistence!,
    ...settings.diffPersistence,
  },
  privacy: {
    ...DEFAULT_SETTINGS.privacy,
    ...settings.privacy,
  },
});

const loadSettings = (): TAppSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    return mergeWithDefaults(JSON.parse(saved));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
};

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<TAppSettings>(loadSettings());

  const updateSettings = (newSettings: Partial<TAppSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  const updateLocale = (locale: TLocale) => {
    settings.value.locale = locale;
  };

  const updateEditorSettings = (newSettings: Partial<TAppSettings['editor']>) => {
    settings.value.editor = { ...settings.value.editor, ...newSettings };
  };

  const updateTreeSettings = (newSettings: Partial<TAppSettings['tree']>) => {
    settings.value.tree = { ...settings.value.tree, ...newSettings };
  };

  const updatePrivacySettings = (newSettings: Partial<TAppSettings['privacy']>) => {
    settings.value.privacy = { ...settings.value.privacy, ...newSettings };
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
        settings.value = mergeWithDefaults(imported);
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
    updateLocale,
    updateEditorSettings,
    updateTreeSettings,
    updatePrivacySettings,
    toggleTheme,
    resetSettings,
    exportSettings,
    importSettings,
  };
});
