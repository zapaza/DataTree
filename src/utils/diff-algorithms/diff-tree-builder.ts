import type { TDiffTreeNode } from '@/types/diff';
import type { TTreeNodeType } from '@/types/store';

/**
 * Определяет тип узла на основе значения.
 */
function getNodeType(val: any): TTreeNodeType {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  const type = typeof val;
  if (type === 'object') return 'object';
  if (type === 'string' || type === 'number' || type === 'boolean') return type;
  return 'string';
}

/**
 * Проверяет глубокое равенство для определения unchanged.
 */
function areEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !areEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Строит иерархическое дерево различий между двумя объектами.
 */
export function buildDiffTree(left: any, right: any, key: string = 'root', path: string = ''): TDiffTreeNode {
  const nodeTypeL = left !== undefined ? getNodeType(left) : undefined;
  const nodeTypeR = right !== undefined ? getNodeType(right) : undefined;

  const currentPath = path;

  // 1. Узел только в левой части (удален)
  if (right === undefined) {
    const node: TDiffTreeNode = {
      key,
      path: currentPath,
      type: nodeTypeL!,
      diffType: 'removed',
      value: left,
      isExpanded: false
    };
    if (nodeTypeL === 'object' || nodeTypeL === 'array') {
      node.children = Object.keys(left).map(k =>
        buildDiffTree(left[k], undefined, k, `${currentPath}/${k}`)
      );
    }
    return node;
  }

  // 2. Узел только в правой части (добавлен)
  if (left === undefined) {
    const node: TDiffTreeNode = {
      key,
      path: currentPath,
      type: nodeTypeR!,
      diffType: 'added',
      value: right,
      isExpanded: false
    };
    if (nodeTypeR === 'object' || nodeTypeR === 'array') {
      node.children = Object.keys(right).map(k =>
        buildDiffTree(undefined, right[k], k, `${currentPath}/${k}`)
      );
    }
    return node;
  }

  // 3. Узел в обеих частях
  if (areEqual(left, right)) {
    const node: TDiffTreeNode = {
      key,
      path: currentPath,
      type: nodeTypeL!,
      diffType: 'unchanged',
      value: left,
      isExpanded: false
    };
    if (nodeTypeL === 'object' || nodeTypeL === 'array') {
      const keys = Object.keys(left);
      node.children = keys.map(k =>
        buildDiffTree(left[k], right[k], k, `${currentPath}/${k}`)
      );
    }
    return node;
  }

  // 4. Узел изменен
  const node: TDiffTreeNode = {
    key,
    path: currentPath,
    type: nodeTypeR!, // используем новый тип
    diffType: 'modified',
    oldValue: left,
    newValue: right,
    isExpanded: true // По умолчанию разворачиваем изменения
  };

  // Если оба - объекты или оба - массивы, сравниваем детей
  if (
    (nodeTypeL === 'object' && nodeTypeR === 'object') ||
    (nodeTypeL === 'array' && nodeTypeR === 'array')
  ) {
    const keysL = Object.keys(left);
    const keysR = Object.keys(right);
    const allKeys = Array.from(new Set([...keysL, ...keysR]));

    // Для массивов сохраняем порядок индексов
    if (nodeTypeL === 'array') {
      // Здесь простая реализация по индексам.
      // В идеале использовать LCS для красивого отображения в дереве,
      // но для начала сделаем по индексам.
    }

    node.children = allKeys.map(k =>
      buildDiffTree(left[k], right[k], k, `${currentPath}/${k}`)
    );
  }

  return node;
}

export default buildDiffTree;
