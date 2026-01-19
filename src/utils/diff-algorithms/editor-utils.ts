import * as json from 'jsonc-parser';
import type * as monaco from 'monaco-editor';

/**
 * Parses a JSON pointer into an array of segments.
 * Example: "/a/b/0" -> ["a", "b", 0]
 */
function parsePath(path: string): (string | number)[] {
  if (!path || path === '/') return [];
  return path
    .split('/')
    .filter(s => s !== '')
    .map(s => {
      // Unescape JSON pointer tokens
      const unescaped = s.replace(/~1/g, '/').replace(/~0/g, '~');
      const num = Number(unescaped);
      return !isNaN(num) && String(num) === unescaped ? num : unescaped;
    });
}

/**
 * Calculates the Monaco Range for a given JSON path in the editor model.
 *
 * @param model - Monaco editor text model
 * @param path - JSON pointer path
 * @param monacoInstance - typeof monaco
 * @returns Monaco Range or null if path not found
 */
export function calculateRange(
  model: monaco.editor.ITextModel,
  path: string,
  monacoInstance: typeof monaco
): monaco.Range | null {
  const text = model.getValue();
  if (!text) return null;

  const segments = parsePath(path);
  const root = json.parseTree(text);

  if (!root) return null;

  const node = json.findNodeAtLocation(root, segments);
  if (!node) {
    // If not found exactly, try to find parent to at least show something
    return null;
  }

  const startPos = model.getPositionAt(node.offset);
  const endPos = model.getPositionAt(node.offset + node.length);

  const lineCount = model.getLineCount();
  if (startPos.lineNumber > lineCount || endPos.lineNumber > lineCount) {
    return null;
  }

  return new monacoInstance.Range(
    startPos.lineNumber,
    startPos.column,
    endPos.lineNumber,
    endPos.column
  );
}

/**
 * Checks if a path is present in the model.
 */
export function hasPath(text: string, path: string): boolean {
  const segments = parsePath(path);
  const root = json.parseTree(text);
  if (!root) return false;
  return !!json.findNodeAtLocation(root, segments);
}
