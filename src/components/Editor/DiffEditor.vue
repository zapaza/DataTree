<template>
  <div
    class="flex-1 h-full grid grid-cols-1 lg:grid-cols-[var(--diff-left-width)_auto_1fr] overflow-hidden"
    :style="{ '--diff-left-width': `${leftWidth}%` }"
  >
    <!-- Left Editor -->
    <section class="flex flex-col min-w-0 min-h-0 border-r border-base">
      <slot name="left-header" />
      <div class="flex-1 bg-base relative min-h-0">
        <div ref="leftContainer" class="absolute inset-0" />
      </div>
    </section>

    <!-- Resizer -->
    <div
      class="hidden lg:block w-1 bg-gray-200 dark:bg-[#333333] h-full cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors z-10"
      @mousedown="startResizing"
    />

    <!-- Right Editor -->
    <section class="flex flex-col min-w-0 min-h-0">
      <slot name="right-header" />
      <div class="flex-1 bg-base relative min-h-0">
        <div ref="rightContainer" class="absolute inset-0" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import type * as monaco from 'monaco-editor';
import debounce from '@/utils/debounce';
import useMonaco from '@/composables/useMonaco';
import useMonacoSettings from '@/composables/useMonacoSettings';
import useDiffEditor from '@/composables/useDiffEditor';
import useResizable from '@/composables/useResizable';
import { calculateRange } from '@/utils/diff-algorithms/editor-utils';
import { useDiffStore } from '@/stores/diffStore';
import { useSettingsStore } from '@/stores/settingsStore';

const props = defineProps<{
  leftValue: string;
  rightValue: string;
  showOnlyChanges?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:leftValue', value: string): void;
  (e: 'update:rightValue', value: string): void;
}>();

const diffStore = useDiffStore();
const settingsStore = useSettingsStore();
const { editorOptions } = useMonacoSettings();
const { leftWidth, startResizing } = useResizable(50);

const { initMonaco: initLeft } = useMonaco();
const { initMonaco: initRight } = useMonaco();
const { applyDiffDecorations, syncScrolling, clearDecorations } = useDiffEditor();

const leftContainer = ref<HTMLElement | null>(null);
const rightContainer = ref<HTMLElement | null>(null);

let leftEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let rightEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let scrollDispose: (() => void) | null = null;
let monacoInstance: typeof monaco | null = null;

const createEditorOptions = (value: string, format: string): monaco.editor.IStandaloneEditorConstructionOptions => ({
  ...editorOptions.value,
  value,
  language: format,
});

onMounted(async () => {
  if (leftContainer.value && rightContainer.value) {
    const [resLeft, resRight] = await Promise.all([
      initLeft(leftContainer.value, createEditorOptions(props.leftValue, diffStore.left.format)),
      initRight(rightContainer.value, createEditorOptions(props.rightValue, diffStore.right.format))
    ]);

    // Если компонент уже размонтирован, не продолжаем
    if (!resLeft.editor || !resRight.editor) return;

    leftEditor = resLeft.editor;
    rightEditor = resRight.editor;
    monacoInstance = resLeft.monaco;

    // Listen for changes
    if (leftEditor) {
      leftEditor.onDidChangeModelContent(() => {
        if (leftEditor) {
          emit('update:leftValue', leftEditor.getValue());
        }
      });
    }

    if (rightEditor) {
      rightEditor.onDidChangeModelContent(() => {
        if (rightEditor) {
          emit('update:rightValue', rightEditor.getValue());
        }
      });
    }

  // Synchronize scrolling
    if (leftEditor && rightEditor) {
      scrollDispose = syncScrolling(leftEditor, rightEditor);
    }

    // Initial markers and decorations
    updateMarkers(leftEditor, diffStore.left.error, diffStore.left.format);
    updateMarkers(rightEditor, diffStore.right.error, diffStore.right.format);
    updateDecorations();
  }
});

/**
 * Updates Monaco markers for parsing errors.
 */
const updateMarkers = (editor: monaco.editor.IStandaloneCodeEditor | null, error: any, format: string) => {
  if (!editor || !monacoInstance) return;
  const model = editor.getModel();
  if (!model) return;

  const owner = format === 'json' ? 'json-parser' : 'xml-parser';

  if (error) {
    const lineCount = model.getLineCount();
    const line = error.line || 1;
    if (line > lineCount) {
       monacoInstance.editor.setModelMarkers(model, owner, []);
       return;
    }

    monacoInstance.editor.setModelMarkers(model, owner, [{
      startLineNumber: line,
      startColumn: error.column || 1,
      endLineNumber: line,
      endColumn: model.getLineMaxColumn(line),
      message: error.message,
      severity: monacoInstance.MarkerSeverity.Error
    }]);
  } else {
    monacoInstance.editor.setModelMarkers(model, owner, []);
  }
};

/**
 * Updates decorations in both editors based on diff store results.
 */
const updateDecorations = () => {
  if (!leftEditor || !rightEditor || !diffStore.diffResult || !monacoInstance) {
    if (leftEditor || rightEditor) {
      clearDecorations(leftEditor, rightEditor);
    }
    return;
  }

  // Ensure models exist and match current content
  const leftModel = leftEditor.getModel();
  const rightModel = rightEditor.getModel();
  if (!leftModel || !rightModel) return;

  // For very large diffs, applying decorations for every change is expensive.
  // Cap decorations to keep the editor responsive.
  const DECORATION_LIMIT = 1000;
  const changedOnly = diffStore.diffResult.changes.filter(c => c.type !== 'unchanged');
  const changes = changedOnly.length > DECORATION_LIMIT
    ? changedOnly.slice(0, DECORATION_LIMIT)
    : changedOnly;

  applyDiffDecorations(leftEditor, changes, 'left', monacoInstance);
  applyDiffDecorations(rightEditor, changes, 'right', monacoInstance);
  updateHiddenAreas();
};

/**
 * Hides unchanged lines with context if showOnlyChanges is enabled.
 */
const updateHiddenAreas = () => {
  if (!leftEditor || !rightEditor || !monacoInstance) return;

  if (!props.showOnlyChanges) {
    (leftEditor as any).setHiddenAreas([]);
    (rightEditor as any).setHiddenAreas([]);
    return;
  }

  const changedLinesLeft = new Set<number>();
  const changedLinesRight = new Set<number>();

  diffStore.diffResult?.changes.forEach(diff => {
    if (diff.type === 'removed' || diff.type === 'modified') {
      const model = leftEditor?.getModel();
      if (model) {
        const range = calculateRange(model, diff.path, monacoInstance!);
        if (range) {
          for (let i = range.startLineNumber; i <= range.endLineNumber; i++) changedLinesLeft.add(i);
        }
      }
    }
    if (diff.type === 'added' || diff.type === 'modified') {
      const model = rightEditor?.getModel();
      if (model) {
        const range = calculateRange(model, diff.path, monacoInstance!);
        if (range) {
          for (let i = range.startLineNumber; i <= range.endLineNumber; i++) changedLinesRight.add(i);
        }
      }
    }
  });

  const getHiddenRanges = (editor: monaco.editor.IStandaloneCodeEditor, changedLines: Set<number>) => {
    const model = editor.getModel();
    if (!model) return [];

    const lineCount = model.getLineCount();
    const hiddenRanges: monaco.Range[] = [];
    let startHidden = 0;
    const contextLines = 2; // Number of lines to show around changes

    for (let i = 1; i <= lineCount; i++) {
      let isNearChange = false;
      for (let j = -contextLines; j <= contextLines; j++) {
        if (changedLines.has(i + j)) {
          isNearChange = true;
          break;
        }
      }

      if (!isNearChange) {
        if (startHidden === 0) startHidden = i;
      } else {
        if (startHidden !== 0) {
          hiddenRanges.push(new monacoInstance!.Range(startHidden, 1, i - 1, 1));
          startHidden = 0;
        }
      }
    }
    if (startHidden !== 0) {
      hiddenRanges.push(new monacoInstance!.Range(startHidden, 1, lineCount, 1));
    }
    return hiddenRanges;
  };

  (leftEditor as any).setHiddenAreas(getHiddenRanges(leftEditor, changedLinesLeft));
  (rightEditor as any).setHiddenAreas(getHiddenRanges(rightEditor, changedLinesRight));
};

const throttledUpdateDecorations = debounce(() => {
  updateDecorations();
}, 50);

const throttledUpdateHiddenAreas = debounce(() => {
  updateHiddenAreas();
}, 50);

// Watch for errors change
watch(() => diffStore.left.error, (newErr) => {
  updateMarkers(leftEditor, newErr, diffStore.left.format);
});

watch(() => diffStore.right.error, (newErr) => {
  updateMarkers(rightEditor, newErr, diffStore.right.format);
});

// Watch for diff results change
watch(() => diffStore.diffResult, () => {
  throttledUpdateDecorations();
}, { deep: true });

// Watch for showOnlyChanges prop
watch(() => props.showOnlyChanges, () => {
  throttledUpdateHiddenAreas();
});

// Watch for formats change
watch(() => diffStore.left.format, (newFormat) => {
  if (leftEditor && monacoInstance) {
    const model = leftEditor.getModel();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, newFormat);
    }
  }
});

watch(() => diffStore.right.format, (newFormat) => {
  if (rightEditor && monacoInstance) {
    const model = rightEditor.getModel();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, newFormat);
    }
  }
});

// Watch for external value changes (e.g. file import)
watch(() => props.leftValue, (newVal) => {
  if (leftEditor && leftEditor.getValue() !== newVal) {
    leftEditor.setValue(newVal);
  }
});

watch(() => props.rightValue, (newVal) => {
  if (rightEditor && rightEditor.getValue() !== newVal) {
    rightEditor.setValue(newVal);
  }
});

// Watch for settings changes
watch(editorOptions, (newOptions) => {
  leftEditor?.updateOptions(newOptions);
  rightEditor?.updateOptions(newOptions);

  if (newOptions.theme && monacoInstance) {
    monacoInstance.editor.setTheme(newOptions.theme);
  }
}, { deep: true });

onBeforeUnmount(() => {
  if (scrollDispose) scrollDispose();
});
</script>

<style scoped>
.cursor-col-resize {
  z-index: 10;
}
</style>
