<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="min-h-10 bg-secondary border-b border-light flex items-center px-4 justify-between gap-2 flex-wrap md:flex-nowrap py-1 md:py-0">
      <div class="flex gap-2 items-center flex-wrap">
        <div class="flex gap-1 mr-2">
          <button
            class="px-3 py-1 md:px-2 md:py-0.5 text-sm md:text-xs rounded transition-colors"
            :class="documentStore.format === 'json' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'"
            @click="documentStore.setFormat('json')"
          >
            JSON
          </button>
          <button
            class="px-3 py-1 md:px-2 md:py-0.5 text-sm md:text-xs rounded transition-colors"
            :class="documentStore.format === 'xml' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'"
            @click="documentStore.setFormat('xml')"
          >
            XML
          </button>
        </div>

        <div class="flex gap-1 mr-2 border-l border-base pl-2">
          <button
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-muted"
            :disabled="!historyStore.canUndo"
            :title="t('editor.undo')"
            v-tooltip="t('editor.undo')"
            @click="handleUndo"
          >
            <div class="i-carbon-undo text-base md:text-sm" />
          </button>
          <button
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-muted"
            :disabled="!historyStore.canRedo"
            :title="t('editor.redo')"
            v-tooltip="t('editor.redo')"
            @click="handleRedo"
          >
            <div class="i-carbon-redo text-base md:text-sm" />
          </button>
        </div>

        <button
          v-if="hasError && documentStore.format === 'json'"
          class="flex items-center gap-1 px-3 py-1 md:px-2 md:py-0.5 text-sm md:text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/40 rounded transition-colors border border-amber-200 dark:border-amber-800"
          :title="t('editor.autoFixTitle')"
          v-tooltip="t('editor.autoFixTitle')"
          @click="applyFix"
        >
          <div class="i-carbon-magic-wand text-xs md:text-[10px]" />
          <span>{{ t('editor.autoFix') }}</span>
        </button>

        <div v-if="documentStore.isValid" class="flex gap-1 ml-2 border-l border-base pl-2">
          <button
            v-if="documentStore.format === 'json'"
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            :title="t('editor.formatJson')"
            v-tooltip="t('editor.formatJson')"
            @click="handleFormat"
          >
            <div class="i-carbon-center-to-fit text-base md:text-sm" />
          </button>
          <button
            v-if="documentStore.format === 'json'"
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            :title="t('editor.minifyJson')"
            v-tooltip="t('editor.minifyJson')"
            @click="handleMinify"
          >
            <div class="i-carbon-bring-to-front text-base md:text-sm" />
          </button>
          <button
            v-if="documentStore.format === 'json'"
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            :title="t('editor.sortKeys')"
            v-tooltip="t('editor.sortKeys')"
            @click="handleSort"
          >
            <div class="i-carbon-sort-ascending text-base md:text-sm" />
          </button>
          <button
            class="p-2 md:p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted transition-colors"
            :title="documentStore.format === 'json' ? t('editor.convertToXml') : t('editor.convertToJson')"
            v-tooltip="documentStore.format === 'json' ? t('editor.convertToXml') : t('editor.convertToJson')"
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
          <span>{{ t('common.invalid') }} {{ documentStore.format.toUpperCase() }}</span>
        </div>

        <div class="text-[10px] text-light font-mono">
          {{ documentStore.rawInput.length }} chars
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
          {{ t('file.import') }}
        </span>
      </div>

      <ErrorPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import type * as monaco from 'monaco-editor';
import { useDocumentStore } from '@/stores/documentStore';
import { useHistoryStore } from '@/stores/historyStore';
import useFormatDetector from '@/composables/useFormatDetector';
import useMonaco from '@/composables/useMonaco';
import useMonacoSettings from '@/composables/useMonacoSettings';
import useFileHandler from '@/composables/useFileHandler';
import useAnalytics from '@/composables/useAnalytics';
import SafeJsonParser from '@/utils/parsers/json-parser';
import FileHandler from './FileHandler.vue';
import ErrorPanel from './ErrorPanel.vue';
import type { TContractIssue } from '@/types/contracts';
import useI18n from '@/composables/useI18n';

const documentStore = useDocumentStore();
const historyStore = useHistoryStore();
const { editorOptions } = useMonacoSettings();
const { detectFormat } = useFormatDetector();
const { initMonaco, monacoInstance } = useMonaco();
const { handleImport } = useFileHandler();
const { trackEvent } = useAnalytics();
const { t } = useI18n();

const editorContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const hasError = computed(() => !documentStore.isValid);

const handleFormat = () => {
  documentStore.formatJson();
  if (editor) {
    editor.setValue(documentStore.rawInput);
  }
};

const handleMinify = () => {
  documentStore.minifyJson();
  if (editor) {
    editor.setValue(documentStore.rawInput);
  }
};

const handleSort = () => {
  documentStore.sortKeys();
  if (editor) {
    editor.setValue(documentStore.rawInput);
  }
};

const handleConvert = () => {
  const oldFormat = documentStore.format;
  documentStore.convertFormat();
  if (editor) {
    editor.setValue(documentStore.rawInput);
    trackEvent('format_convert', { from: oldFormat, to: documentStore.format });
  }
};

watch(() => documentStore.errors, (newErrors) => {
  if (newErrors.length > 0 && newErrors[0]) {
    const err = newErrors[0];
    updateParseMarkers(err.message, { line: err.line, column: err.column });
  } else {
    updateParseMarkers(null, null);
  }
}, { deep: true });

watch(() => documentStore.contractIssues, (issues) => {
  updateContractMarkers(issues);
}, { deep: true });

watch(() => documentStore.activeContractIssue, (issue) => {
  if (!editor || !issue?.line) return;
  editor.revealLineInCenter(issue.line);
  editor.setPosition({ lineNumber: issue.line, column: issue.column || 1 });
  editor.focus();
});

const updateParseMarkers = (message: string | null, position: { line: number, column: number } | null) => {
  if (!editor || !monacoInstance.value) return;
  const model = editor.getModel();
  if (!model) return;

  const owner = documentStore.format === 'json' ? 'json-parser' : 'xml-parser';

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

const markerSeverity = (severity: TContractIssue['severity']) => {
  if (!monacoInstance.value) return 8;
  if (severity === 'error') return monacoInstance.value.MarkerSeverity.Error;
  if (severity === 'warning') return monacoInstance.value.MarkerSeverity.Warning;
  return monacoInstance.value.MarkerSeverity.Info;
};

const updateContractMarkers = (issues: TContractIssue[]) => {
  if (!editor || !monacoInstance.value) return;
  const model = editor.getModel();
  if (!model) return;

  monacoInstance.value.editor.setModelMarkers(model, 'contract-validator', issues
    .filter(issue => issue.line)
    .map(issue => ({
      startLineNumber: issue.line!,
      startColumn: issue.column || 1,
      endLineNumber: issue.line!,
      endColumn: model.getLineMaxColumn(issue.line!),
      message: `${issue.title}: ${issue.message}`,
      severity: markerSeverity(issue.severity),
    })));
};

const applyFix = () => {
  if (documentStore.format === 'json') {
    const fixed = SafeJsonParser.fix(documentStore.rawInput);
    if (fixed !== documentStore.rawInput) {
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
      ...editorOptions.value,
      value: documentStore.rawInput,
      language: documentStore.format,
      padding: { bottom: 200 }
    });

    editor = monacoStuff.editor;

    historyStore.pushState(documentStore.rawInput);
    updateContractMarkers(documentStore.contractIssues);
    if (documentStore.errors[0]) {
      updateParseMarkers(documentStore.errors[0].message, { line: documentStore.errors[0].line, column: documentStore.errors[0].column });
    }

    editor?.onDidChangeModelContent(() => {
      const value = editor?.getValue() || '';
      documentStore.setRawInput(value);
      historyStore.pushState(value);

      const newFormat = detectFormat(value);
      if (newFormat !== documentStore.format) {
        documentStore.setFormat(newFormat);
      }
    });
  }
});

watch(() => documentStore.format, (newFormat) => {
  if (editor && monacoInstance.value) {
    const model = editor.getModel();
    if (model) {
      monacoInstance.value.editor.setModelLanguage(model, newFormat);
    }
  }
});

watch(() => documentStore.rawInput, (newInput) => {
  if (editor && editor.getValue() !== newInput) {
    editor.setValue(newInput);
  }
});

watch(editorOptions, (newOptions) => {
  if (editor && monacoInstance.value) {
    editor.updateOptions({
      ...newOptions,
      padding: { bottom: 200 }
    });

    if (newOptions.theme) {
      monacoInstance.value.editor.setTheme(newOptions.theme);
    }
  }
}, { deep: true });
</script>


<style scoped>
:deep(.monaco-editor) {
  padding-top: 8px;
}
</style>
