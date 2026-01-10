<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="min-h-10 md:h-8 bg-secondary border-b border-light flex items-center px-4 justify-between gap-2 flex-wrap md:flex-nowrap py-1 md:py-0">
      <div class="flex gap-2 items-center flex-wrap">
        <div class="flex gap-1 mr-2">
          <button
            class="px-3 py-1 md:px-2 md:py-0.5 text-sm md:text-xs rounded transition-colors"
            :class="appStore.format === 'json' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'"
            @click="appStore.setFormat('json')"
          >
            JSON
          </button>
          <button
            class="px-3 py-1 md:px-2 md:py-0.5 text-sm md:text-xs rounded transition-colors"
            :class="appStore.format === 'xml' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'"
            @click="appStore.setFormat('xml')"
          >
            XML
          </button>
        </div>

        <div class="flex gap-1 mr-2 border-l border-base pl-2">
          <button
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-muted"
            :disabled="!historyStore.canUndo"
            title="Undo (Ctrl+Z)"
            v-tooltip="'Undo (Ctrl+Z)'"
            @click="handleUndo"
          >
            <div class="i-carbon-undo text-base md:text-sm" />
          </button>
          <button
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-muted"
            :disabled="!historyStore.canRedo"
            title="Redo (Ctrl+Shift+Z)"
            v-tooltip="'Redo (Ctrl+Shift+Z)'"
            @click="handleRedo"
          >
            <div class="i-carbon-redo text-base md:text-sm" />
          </button>
        </div>

        <button
          v-if="hasError && appStore.format === 'json'"
          class="flex items-center gap-1 px-3 py-1 md:px-2 md:py-0.5 text-sm md:text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/40 rounded transition-colors border border-amber-200 dark:border-amber-800"
          title="Try to auto-fix JSON errors"
          v-tooltip="'Try to auto-fix JSON errors'"
          @click="applyFix"
        >
          <div class="i-carbon-magic-wand text-xs md:text-[10px]" />
          <span>Auto-fix</span>
        </button>

        <div v-if="appStore.isValid" class="flex gap-1 ml-2 border-l border-base pl-2">
          <button
            v-if="appStore.format === 'json'"
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            title="Format JSON"
            v-tooltip="'Format JSON'"
            @click="handleFormat"
          >
            <div class="i-carbon-center-to-fit text-base md:text-sm" />
          </button>
          <button
            v-if="appStore.format === 'json'"
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            title="Minify JSON"
            v-tooltip="'Minify JSON'"
            @click="handleMinify"
          >
            <div class="i-carbon-bring-to-front text-base md:text-sm" />
          </button>
          <button
            v-if="appStore.format === 'json'"
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            title="Sort Keys Alphabetically"
            v-tooltip="'Sort Keys Alphabetically'"
            @click="handleSort"
          >
            <div class="i-carbon-sort-ascending text-base md:text-sm" />
          </button>
          <button
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            :title="appStore.format === 'json' ? 'Convert to XML' : 'Convert to JSON'"
            v-tooltip="appStore.format === 'json' ? 'Convert to XML' : 'Convert to JSON'"
            @click="handleConvert"
          >
            <div class="i-carbon-arrows-horizontal text-base md:text-sm" />
          </button>
        </div>

        <FileHandler />
      </div>

      <div class="flex items-center gap-3">
        <div
          v-if="hasError"
          class="flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400 font-medium animate-pulse"
        >
          <div class="i-carbon-error text-[12px]" />
          <span>Invalid {{ appStore.format.toUpperCase() }}</span>
        </div>

        <div class="text-[10px] text-light font-mono">
          {{ appStore.rawInput.length }} chars
        </div>
      </div>
    </div>

    <div
      ref="editorContainer"
      class="flex-1 min-h-0 relative group"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div
        v-if="isDragging"
        class="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 flex flex-col items-center justify-center backdrop-blur-[2px] pointer-events-none transition-all"
      >
        <div class="i-carbon-document-import text-5xl text-blue-600 mb-2 animate-bounce" />
        <span class="text-blue-700 font-bold bg-white/80 px-4 py-2 rounded-full shadow-lg border border-blue-200">
          Drop file here to import
        </span>
      </div>

      <ErrorPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import type * as monaco from 'monaco-editor';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import useFormatDetector from '@/composables/useFormatDetector';
import useMonaco from '@/composables/useMonaco';
import useFileHandler from '@/composables/useFileHandler';
import useAnalytics from '@/composables/useAnalytics';
import SafeJsonParser from '@/utils/parsers/json-parser';
import FileHandler from './FileHandler.vue';
import ErrorPanel from './ErrorPanel.vue';

const appStore = useAppStore();
const historyStore = useHistoryStore();
const settingsStore = useSettingsStore();
const { detectFormat } = useFormatDetector();
const { initMonaco, monacoInstance } = useMonaco();
const { handleImport } = useFileHandler();
const { trackEvent } = useAnalytics();

const editorContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const hasError = computed(() => !appStore.isValid);

const handleFormat = () => {
  appStore.formatJson();
  if (editor) {
    editor.setValue(appStore.rawInput);
  }
};

const handleMinify = () => {
  appStore.minifyJson();
  if (editor) {
    editor.setValue(appStore.rawInput);
  }
};

const handleSort = () => {
  appStore.sortKeys();
  if (editor) {
    editor.setValue(appStore.rawInput);
  }
};

const handleConvert = () => {
  const oldFormat = appStore.format;
  appStore.convertFormat();
  if (editor) {
    editor.setValue(appStore.rawInput);
    // Обновляем маркеры так как формат мог измениться
    validateContent();
    trackEvent('format_convert', { from: oldFormat, to: appStore.format });
  }
};

const validateContent = () => {
  appStore.parseInput();
};

watch(() => appStore.errors, (newErrors) => {
  if (newErrors.length > 0 && newErrors[0]) {
    const err = newErrors[0];
    updateMarkers(err.message, { line: err.line, column: err.column });
  } else {
    updateMarkers(null, null);
  }
}, { deep: true });

const updateMarkers = (message: string | null, position: { line: number, column: number } | null) => {
  if (!editor || !monacoInstance.value) return;
  const model = editor.getModel();
  if (!model) return;

  const owner = appStore.format === 'json' ? 'json-parser' : 'xml-parser';

  if (message && position) {
    monacoInstance.value.editor.setModelMarkers(model, owner, [{
      startLineNumber: position.line,
      startColumn: position.column,
      endLineNumber: position.line,
      endColumn: model.getLineMaxColumn(position.line),
      message: message,
      severity: monacoInstance.value.MarkerSeverity.Error
    }]);
  } else {
    monacoInstance.value.editor.setModelMarkers(model, 'json-parser', []);
    monacoInstance.value.editor.setModelMarkers(model, 'xml-parser', []);
  }
};

const applyFix = () => {
  if (appStore.format === 'json') {
    const fixed = SafeJsonParser.fix(appStore.rawInput);
    if (fixed !== appStore.rawInput) {
      editor?.setValue(fixed);
    }
  }
};

const handleUndo = () => {
  const previous = historyStore.undo();
  if (previous !== null) {
    editor?.setValue(previous);
  }
};

const handleRedo = () => {
  const next = historyStore.redo();
  if (next !== null) {
    editor?.setValue(next);
  }
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;

  const file = e.dataTransfer?.files[0];
  if (file) {
    handleImport(file);
  }
};

onMounted(async () => {
  if (editorContainer.value) {
    const monacoStuff = await initMonaco(editorContainer.value, {
      value: appStore.rawInput,
      language: appStore.format,
      theme: settingsStore.settings.theme === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: settingsStore.settings.editor.minimap },
      scrollBeyondLastLine: true,
      fontSize: settingsStore.settings.editor.fontSize,
      fontFamily: settingsStore.settings.editor.fontFamily,
      lineNumbers: settingsStore.settings.editor.showLineNumbers ? 'on' : 'off',
      tabSize: settingsStore.settings.editor.tabSize,
      renderWhitespace: settingsStore.settings.editor.renderWhitespace,
      cursorStyle: settingsStore.settings.editor.cursorStyle,
      padding: { bottom: 200 }
    });

    editor = monacoStuff.editor;

    historyStore.pushState(appStore.rawInput);

    editor?.onDidChangeModelContent(() => {
      const value = editor?.getValue() || '';
      appStore.setRawInput(value);
      historyStore.pushState(value);

      const newFormat = detectFormat(value);
      if (newFormat !== appStore.format) {
        appStore.setFormat(newFormat);
      }

      validateContent();
    });
  }
});

watch(() => appStore.format, (newFormat) => {
  if (editor && monacoInstance.value) {
    const model = editor.getModel();
    if (model) {
      monacoInstance.value.editor.setModelLanguage(model, newFormat);
    }
  }
});

watch(() => appStore.rawInput, (newInput) => {
  if (editor && editor.getValue() !== newInput) {
    editor.setValue(newInput);
    validateContent();
  }
});

watch(() => settingsStore.settings, (newSettings) => {
  if (editor && monacoInstance.value) {
    editor.updateOptions({
      fontSize: newSettings.editor.fontSize,
      fontFamily: newSettings.editor.fontFamily,
      lineNumbers: newSettings.editor.showLineNumbers ? 'on' : 'off',
      minimap: { enabled: newSettings.editor.minimap },
      tabSize: newSettings.editor.tabSize,
      renderWhitespace: newSettings.editor.renderWhitespace,
      cursorStyle: newSettings.editor.cursorStyle,
      padding: { bottom: 200 }
    });

    monacoInstance.value.editor.setTheme(newSettings.theme === 'dark' ? 'vs-dark' : 'vs');
  }
}, { deep: true });

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});
</script>


<style scoped>
:deep(.monaco-editor) {
  padding-top: 8px;
}
</style>
