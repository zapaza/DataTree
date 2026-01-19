import loader from '@monaco-editor/loader';
import type * as monaco from 'monaco-editor';
import { shallowRef, onBeforeUnmount, onUnmounted } from 'vue';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs'
  }
});

/**
 * Composable for initializing and managing a Monaco Editor instance.
 * Handles lazy loading of Monaco from CDN and automatic resource cleanup.
 *
 * @returns Object with init function and a reactive reference to the monaco namespace.
 */
export default function useMonaco() {
  const monacoInstance = shallowRef<typeof monaco | null>(null);
  let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
  let isUnmounted = false;

  /**
   * Initializes Monaco Editor in the given container with provided options.
   * @param container - DOM element to host the editor.
   * @param options - Initial editor configuration.
   * @returns The created editor instance and the monaco namespace.
   */
  const initMonaco = async (
    container: HTMLElement,
    options: monaco.editor.IStandaloneEditorConstructionOptions
  ) => {
    try {
      // Загружаем Monaco через loader
      const monacoNamespace = await loader.init();

      if (isUnmounted) {
        return { monaco: monacoNamespace, editor: null };
      }

      monacoInstance.value = monacoNamespace;

      // Создаем инстанс редактора
      editorInstance = monacoNamespace.editor.create(container, {
        ...options,
        automaticLayout: true,
      });

      return {
        monaco: monacoNamespace,
        editor: editorInstance,
      };
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      throw error;
    }
  };

  const destroyMonaco = () => {
    if (editorInstance) {
      editorInstance.dispose();
      editorInstance = null;
    }
  };

  onBeforeUnmount(() => {
    isUnmounted = true;
    destroyMonaco();
  });

  onUnmounted(() => {
    isUnmounted = true;
    destroyMonaco();
  });

  return {
    monacoInstance,
    initMonaco,
    destroyMonaco,
  };
}
