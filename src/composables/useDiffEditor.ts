import { ref } from 'vue';
import type * as monaco from 'monaco-editor';
import { calculateRange } from '../utils/diff-algorithms/editor-utils';
import type { TDiffNode } from '../types/diff';

/**
 * Composable for managing diff-related logic in Monaco Editor.
 * Handles decorations for changes and scroll synchronization.
 */
export default function useDiffEditor() {
  const leftDecorations = ref<string[]>([]);
  const rightDecorations = ref<string[]>([]);

  /**
   * Applies decorations to the editor based on the diff results.
   */
  const applyDiffDecorations = (
    editor: monaco.editor.IStandaloneCodeEditor,
    diffs: TDiffNode[],
    side: 'left' | 'right',
    monacoInstance: typeof monaco
  ) => {
    const model = editor.getModel();
    if (!model) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];

    diffs.forEach(diff => {
      // Determine if this change should be highlighted on the current side
      let shouldHighlight = false;
      let type = diff.type;

      if (side === 'left') {
        shouldHighlight = diff.type === 'removed' || diff.type === 'modified';
      } else {
        shouldHighlight = diff.type === 'added' || diff.type === 'modified';
      }

      if (shouldHighlight) {
        const range = calculateRange(model, diff.path, monacoInstance);
        if (range) {
          decorations.push({
            range,
            options: {
              isWholeLine: true,
              className: `diff-line-${type}`,
              linesDecorationsClassName: `diff-gutter-${type}`,
              // marginClassName is for the line numbers area
              marginClassName: `diff-gutter-${type}`,
              hoverMessage: { value: `**${type.toUpperCase()}**: ${diff.path}` }
            }
          });
        }
      }
    });

    if (side === 'left') {
      leftDecorations.value = editor.deltaDecorations(leftDecorations.value, decorations);
    } else {
      rightDecorations.value = editor.deltaDecorations(rightDecorations.value, decorations);
    }
  };

  /**
   * Synchronizes scrolling between two editor instances.
   * Returns a function to dispose the synchronization.
   */
  const syncScrolling = (
    editor1: monaco.editor.IStandaloneCodeEditor,
    editor2: monaco.editor.IStandaloneCodeEditor
  ) => {
    let isSyncingLeft = false;
    let isSyncingRight = false;

    const onScroll1 = editor1.onDidScrollChange((e) => {
      if (isSyncingRight) return;
      isSyncingLeft = true;
      editor2.setScrollTop(e.scrollTop);
      editor2.setScrollLeft(e.scrollLeft);
      isSyncingLeft = false;
    });

    const onScroll2 = editor2.onDidScrollChange((e) => {
      if (isSyncingLeft) return;
      isSyncingRight = true;
      editor1.setScrollTop(e.scrollTop);
      editor1.setScrollLeft(e.scrollLeft);
      isSyncingRight = false;
    });

    return () => {
      onScroll1.dispose();
      onScroll2.dispose();
    };
  };

  /**
   * Clears all decorations from both editors.
   */
  const clearDecorations = (
    leftEditor: monaco.editor.IStandaloneCodeEditor | null,
    rightEditor: monaco.editor.IStandaloneCodeEditor | null
  ) => {
    if (leftEditor) {
      leftDecorations.value = leftEditor.deltaDecorations(leftDecorations.value, []);
    }
    if (rightEditor) {
      rightDecorations.value = rightEditor.deltaDecorations(rightDecorations.value, []);
    }
  };

  return {
    applyDiffDecorations,
    syncScrolling,
    clearDecorations
  };
}
