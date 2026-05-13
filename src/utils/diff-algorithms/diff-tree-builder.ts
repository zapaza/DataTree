import type { TDiffTreeNode } from '@/types/diff';
import type { TTreeNodeType } from '@/types/store';
import type { JsonValue } from '@/types/json';
import { isJsonObject } from '@/types/json';

type TDiffTreeInput = JsonValue | undefined;

/**
 * Определяет тип узла на основе значения.
 */
function getNodeType(val: JsonValue): TTreeNodeType {
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
function getChildKeys(value: JsonValue): string[] {
  if (Array.isArray(value)) {
    return value.map((_, index) => String(index));
  }
  if (isJsonObject(value)) {
    return Object.keys(value);
  }
  return [];
}

function getChildValue(value: TDiffTreeInput, key: string): TDiffTreeInput {
  if (Array.isArray(value)) {
    return value[Number(key)];
  }
  if (isJsonObject(value)) {
    return value[key];
  }
  return undefined;
}

function areEqual(a: JsonValue, b: JsonValue): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areEqual(a[i]!, b[i]!)) return false;
    }
    return true;
  }
  if (isJsonObject(a) && isJsonObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !areEqual(a[key]!, b[key]!)) return false;
    }
    return true;
  }
  return false;
}

/**
 * Строит иерархическое дерево различий между двумя объектами.
 */
export function buildDiffTree(left: TDiffTreeInput, right: TDiffTreeInput, key: string = 'root', path: string = ''): TDiffTreeNode {
  const nodeTypeL = left !== undefined ? getNodeType(left) : undefined;
  const nodeTypeR = right !== undefined ? getNodeType(right) : undefined;

  const currentPath = path;

  if (left === undefined && right === undefined) {
    return {
      key,
      path: currentPath,
      type: 'null',
      diffType: 'unchanged',
      value: null,
      isExpanded: false
    };
  }

  // 1. Узел только в левой части (удален)
  if (right === undefined) {
    const removedValue = left as JsonValue;
    const node: TDiffTreeNode = {
      key,
      path: currentPath,
      type: nodeTypeL!,
      diffType: 'removed',
      value: removedValue,
      isExpanded: false
    };
    if (nodeTypeL === 'object' || nodeTypeL === 'array') {
      node.children = getChildKeys(removedValue).map(k =>
        buildDiffTree(getChildValue(removedValue, k), undefined, k, `${currentPath}/${k}`)
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
      node.children = getChildKeys(right).map(k =>
        buildDiffTree(undefined, getChildValue(right, k), k, `${currentPath}/${k}`)
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
      const keys = getChildKeys(left);
      node.children = keys.map(k =>
        buildDiffTree(getChildValue(left, k), getChildValue(right, k), k, `${currentPath}/${k}`)
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
    const keysL = getChildKeys(left);
    const keysR = getChildKeys(right);
    const allKeys = Array.from(new Set([...keysL, ...keysR]));

    // Для массивов сохраняем порядок индексов
    if (nodeTypeL === 'array') {
      // Здесь простая реализация по индексам.
      // В идеале использовать LCS для красивого отображения в дереве,
      // но для начала сделаем по индексам.
    }

    node.children = allKeys.map(k =>
      buildDiffTree(getChildValue(left, k), getChildValue(right, k), k, `${currentPath}/${k}`)
    );
  }

  return node;
}

export default buildDiffTree;
