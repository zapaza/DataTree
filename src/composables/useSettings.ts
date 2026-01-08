import { watch, onMounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

export default function useSettings() {
  const settingsStore = useSettingsStore();

  const applyTheme = (theme: 'light' | 'dark') => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Также обновляем CSS переменные если нужно
    updateCSSVariables(theme);
  };

  const updateCSSVariables = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#1e1e1e');
      root.style.setProperty('--bg-secondary', '#252526');
      root.style.setProperty('--text-primary', '#cccccc');
      root.style.setProperty('--border-color', '#333333');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--border-color', '#e5e7eb');
    }
  };

  const applyTreeSettings = () => {
    const root = document.documentElement;
    root.style.setProperty('--tree-indent', `${settingsStore.settings.tree.indentSize}px`);
  };

  onMounted(() => {
    applyTheme(settingsStore.settings.theme);
    applyTreeSettings();
  });

  // Следим за изменением темы
  watch(() => settingsStore.settings.theme, (newTheme) => {
    applyTheme(newTheme);
  });

  // Следим за настройками дерева
  watch(() => settingsStore.settings.tree.indentSize, () => {
    applyTreeSettings();
  });

  return {
    applyTheme,
    applyTreeSettings
  };
}
