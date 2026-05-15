import type * as Monaco from 'monaco-editor';
import { shallowRef, onBeforeUnmount, onUnmounted } from 'vue';

type TWorkerConstructor = new () => Worker;

type MonacoWorkerEnvironment = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: (_moduleId: string, label: string) => Worker;
  };
};

type MonacoJsonDefaults = typeof Monaco & {
  languages?: typeof Monaco.languages & {
    json?: {
      jsonDefaults?: {
        setDiagnosticsOptions: (options: {
          validate: boolean;
          allowComments?: boolean;
          trailingCommas?: 'error' | 'warning' | 'ignore';
        }) => void;
      };
    };
  };
};

const disableJsonDiagnosticsIfAvailable = (monacoNamespace: typeof Monaco) => {
  try {
    const jsonDefaults = (monacoNamespace as unknown as MonacoJsonDefaults).languages?.json?.jsonDefaults;
    jsonDefaults?.setDiagnosticsOptions({
      validate: false,
      allowComments: true,
      trailingCommas: 'ignore',
    });
  } catch {
    // Some Monaco ESM entrypoints expose JSON language support without jsonDefaults.
    // Parser markers are managed by DataTree, so this optimization is optional.
  }
};

let monacoLoader: Promise<typeof Monaco> | null = null;

const loadMonaco = async (): Promise<typeof Monaco> => {
  if (!monacoLoader) {
    monacoLoader = Promise.all([
      import('monaco-editor/esm/vs/editor/edcore.main.js'),
      import('monaco-editor/esm/vs/language/json/monaco.contribution.js'),
      import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js'),
      import('monaco-editor/esm/vs/editor/editor.worker?worker'),
      import('monaco-editor/esm/vs/language/json/json.worker?worker'),
    ]).then(([monacoNamespace, , , editorWorkerModule, jsonWorkerModule]) => {
      const EditorWorker = editorWorkerModule.default as TWorkerConstructor;
      const JsonWorker = jsonWorkerModule.default as TWorkerConstructor;

      (globalThis as MonacoWorkerEnvironment).MonacoEnvironment = {
        getWorker(_moduleId: string, label: string) {
          if (label === 'json') {
            return new JsonWorker();
          }

          return new EditorWorker();
        },
      };

      disableJsonDiagnosticsIfAvailable(monacoNamespace as unknown as typeof Monaco);

      return monacoNamespace as unknown as typeof Monaco;
    });
  }

  return monacoLoader;
};

/**
 * Composable for initializing and managing a Monaco Editor instance.
 * Handles lazy loading of the local Monaco bundle and automatic resource cleanup.
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
      const monacoNamespace = await loadMonaco();

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
