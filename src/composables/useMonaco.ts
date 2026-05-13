import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import type * as Monaco from 'monaco-editor';
import { shallowRef, onBeforeUnmount, onUnmounted } from 'vue';

type MonacoWorkerEnvironment = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: (_moduleId: string, label: string) => Worker;
  };
};

(globalThis as MonacoWorkerEnvironment).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    if (label === 'json') {
      return new JsonWorker();
    }

    return new EditorWorker();
  },
};

/**
 * Composable for initializing and managing a Monaco Editor instance.
 * Handles lazy loading of Monaco from CDN and automatic resource cleanup.
 *
 * @returns Object with init function and a reactive reference to the monaco namespace.
 */
export default function useMonaco() {
  const monacoInstance = shallowRef<typeof Monaco | null>(null);
  let editorInstance: Monaco.editor.IStandaloneCodeEditor | null = null;
  let isUnmounted = false;

  /**
   * Initializes Monaco Editor in the given container with provided options.
   * @param container - DOM element to host the editor.
   * @param options - Initial editor configuration.
   * @returns The created editor instance and the monaco namespace.
   */
  const initMonaco = async (
    container: HTMLElement,
    options: Monaco.editor.IStandaloneEditorConstructionOptions
  ) => {
    try {
      const monacoNamespace = monaco as unknown as typeof Monaco;

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
