import type { TDiffResult, TDiffOptions, TDiffNode, TJsonPatchOperation } from '@/types/diff';
import LCS from './lcs';

/**
 * Основная функция для сравнения двух JSON структур.
 */
export function diffJson(left: any, right: any, options: TDiffOptions = {}): TDiffResult {
  const { arrayOrderMatters = true, ignoreTypeDiff = false } = options;
  const changes: TDiffNode[] = [];
  const patch: TJsonPatchOperation[] = [];
  const stats = {
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
  };

  /**
   * Рекурсивное сравнение значений.
   */
  function compare(a: any, b: any, path: string) {
    // Проверка на идентичность
    if (isEqual(a, b, ignoreTypeDiff)) {
      stats.unchanged++;
      changes.push({ type: 'unchanged', path });
      return;
    }

    // Если типы разные или один из них не объект/массив
    if (typeof a !== typeof b || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) {
      stats.modified++;
      changes.push({ type: 'modified', path, oldValue: a, newValue: b });
      patch.push({ op: 'replace', path, value: b });
      return;
    }

    // Сравнение массивов
    if (Array.isArray(a)) {
      if (arrayOrderMatters) {
        compareArraysOrdered(a, b, path);
      } else {
        compareArraysUnordered(a, b, path);
      }
      return;
    }

    // Сравнение объектов
    if (typeof a === 'object') {
      compareObjects(a, b, path);
      return;
    }

    // Примитивы (уже проверены isEqual в начале, но для надежности)
    stats.modified++;
    changes.push({ type: 'modified', path, oldValue: a, newValue: b });
    patch.push({ op: 'replace', path, value: b });
  }

  /**
   * Сравнение объектов по ключам.
   */
  function compareObjects(a: Record<string, any>, b: Record<string, any>, path: string) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);

    allKeys.forEach(key => {
      const currentPath = path === '' ? `/${key}` : `${path}/${key}`;

      if (!(key in b)) {
        stats.removed++;
        changes.push({ type: 'removed', path: currentPath, oldValue: a[key] });
        patch.push({ op: 'remove', path: currentPath });
      } else if (!(key in a)) {
        stats.added++;
        changes.push({ type: 'added', path: currentPath, newValue: b[key] });
        patch.push({ op: 'add', path: currentPath, value: b[key] });
      } else {
        compare(a[key], b[key], currentPath);
      }
    });
  }

  /**
   * Сравнение массивов с учетом порядка (LCS).
   */
  function compareArraysOrdered(a: any[], b: any[], path: string) {
    // Оптимизация: если массивы идентичны, пропускаем LCS
    if (a.length === b.length) {
      let identical = true;
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i], ignoreTypeDiff)) {
          identical = false;
          break;
        }
      }
      if (identical) {
        for (let i = 0; i < a.length; i++) {
          stats.unchanged++;
          changes.push({ type: 'unchanged', path: `${path}/${i}` });
        }
        return;
      }
    }

    const lcsResult = LCS.diff(a, b, (x, y) => isEqual(x, y, ignoreTypeDiff));

    // В упрощенном виде для TDiffNode и JSON Patch:
    // JSON Patch для массивов сложнее, так как индексы смещаются.
    // Для простоты мы будем использовать базовые операции,
    // но в реальном приложении может потребоваться более сложная логика индексов.

    let offset = 0;
    lcsResult.forEach((res, idx) => {
      const currentPath = `${path}/${res.indexB !== -1 ? res.indexB : res.indexA}`;

      if (res.type === 'unchanged') {
        // Рекурсивно проверяем вложенные структуры, если это объекты/массивы
        if (typeof res.item === 'object' && res.item !== null) {
          // Нам нужно заново запустить сравнение для вложенных структур,
          // так как они могут быть "одинаковыми" по верхнему уровню, но иметь отличия внутри
          // Хотя LCS.diff с isEqual уже гарантирует полное равенство.
          stats.unchanged++;
          changes.push({ type: 'unchanged', path: `${path}/${res.indexB}` });
        } else {
          stats.unchanged++;
          changes.push({ type: 'unchanged', path: `${path}/${res.indexB}` });
        }
      } else if (res.type === 'added') {
        stats.added++;
        changes.push({ type: 'added', path: `${path}/${res.indexB}`, newValue: res.item });
        patch.push({ op: 'add', path: `${path}/${res.indexB}`, value: res.item });
      } else if (res.type === 'removed') {
        stats.removed++;
        changes.push({ type: 'removed', path: `${path}/${res.indexA + offset}`, oldValue: res.item });
        patch.push({ op: 'remove', path: `${path}/${res.indexA + offset}` });
        offset--;
      }
    });
  }

  /**
   * Сравнение массивов без учета порядка.
   */
  function compareArraysUnordered(a: any[], b: any[], path: string) {
    // Упрощенная логика: считаем количество вхождений каждого элемента.
    // Для сложных объектов это может быть дорого.
    const remainingB = [...b];
    const usedIndicesB = new Set<number>();

    a.forEach((itemA, indexA) => {
      const currentPathA = `${path}/${indexA}`;
      let found = false;

      for (let indexB = 0; indexB < b.length; indexB++) {
        if (!usedIndicesB.has(indexB) && isEqual(itemA, b[indexB], ignoreTypeDiff)) {
          usedIndicesB.add(indexB);
          stats.unchanged++;
          changes.push({ type: 'unchanged', path: currentPathA });
          found = true;
          break;
        }
      }

      if (!found) {
        stats.removed++;
        changes.push({ type: 'removed', path: currentPathA, oldValue: itemA });
        patch.push({ op: 'remove', path: currentPathA });
      }
    });

    b.forEach((itemB, indexB) => {
      if (!usedIndicesB.has(indexB)) {
        stats.added++;
        const currentPathB = `${path}/${indexB}`; // Это не совсем корректно для patch, но для статистики ок
        changes.push({ type: 'added', path: currentPathB, newValue: itemB });
        patch.push({ op: 'add', path: `${path}/-`, value: itemB });
      }
    });
  }

  compare(left, right, '');

  return {
    changes,
    stats,
    patch
  };
}

/**
 * Глубокое сравнение на равенство.
 */
function isEqual(a: any, b: any, ignoreTypeDiff: boolean): boolean {
  if (a === b) return true;

  if (ignoreTypeDiff) {
    // eslint-disable-next-line eqeqeq
    if (a == b && typeof a !== 'object' && typeof b !== 'object') return true;
  }

  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i], ignoreTypeDiff)) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !isEqual(a[key], b[key], ignoreTypeDiff)) return false;
    }
    return true;
  }

  return false;
}

export default diffJson;
