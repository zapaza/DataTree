import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import type * as monaco from 'monaco-editor';

/**
 * Composable for centralizing Monaco Editor settings.
 * Synchronizes editor options with the global settings store.
 *
 * @returns Object with reactive editor options.
 */
export default function useMonacoSettings() {
  const settingsStore = useSettingsStore();

  const editorOptions = computed<monaco.editor.IStandaloneEditorConstructionOptions>(() => ({
    fontSize: settingsStore.settings.editor.fontSize,
    fontFamily: settingsStore.settings.editor.fontFamily,
    lineNumbers: settingsStore.settings.editor.showLineNumbers ? 'on' : 'off',
    minimap: { enabled: settingsStore.settings.editor.minimap },
    tabSize: settingsStore.settings.editor.tabSize,
    renderWhitespace: settingsStore.settings.editor.renderWhitespace,
    cursorStyle: settingsStore.settings.editor.cursorStyle,
    theme: settingsStore.settings.theme === 'dark' ? 'vs-dark' : 'vs',
    automaticLayout: true,
    scrollBeyondLastLine: true,
    folding: true,
    bracketPairColorization: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
  }));

  return {
    editorOptions,
  };
}
