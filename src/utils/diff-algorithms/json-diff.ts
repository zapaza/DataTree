import type {
  TDiffNode,
  TDiffOptions,
  TDiffPathSummary,
  TDiffResult,
  TJsonPatchOperation,
} from '@/types/diff';
import type { JsonArray, JsonObject, JsonValue } from '@/types/json';
import { isJsonObject } from '@/types/json';
import LCS from './lcs';
import {
  classifyDiffChange,
  emptyRiskSummary,
  escapeJsonPointerSegment,
  getArrayItemKey,
  getDiffValueType,
  resolveArrayCompareKey,
  shouldIgnoreKey,
  valuesEquivalent,
} from './semantic-utils';

type TMutableStats = TDiffResult['stats'];

const childPath = (path: string, key: string | number): string => {
  return `${path}/${escapeJsonPointerSegment(String(key))}`;
};

const childDisplayPath = (path: string, key: string | number): string => {
  return `${path}/${String(key)}`;
};

const parentDisplayPath = (path: string): string => {
  if (!path || path === '/') return '/';
  const clean = path.endsWith('/') ? path.slice(0, -1) : path;
  const lastSlash = clean.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return clean.slice(0, lastSlash);
};

const buildRiskSummary = (changes: TDiffNode[]) => {
  const summary = emptyRiskSummary();
  changes.filter(change => change.type !== 'unchanged').forEach((change) => {
    const risk = change.risk ?? 'neutral';
    if (risk === 'non-breaking') summary.nonBreaking++;
    else if (risk === 'warning') summary.warnings++;
    else summary[risk]++;
  });
  return summary;
};

const buildPathSummary = (changes: TDiffNode[]): TDiffPathSummary[] => {
  const groups = new Map<string, TDiffPathSummary>();

  changes.filter(change => change.type !== 'unchanged').forEach((change) => {
    const displayPath = parentDisplayPath(change.displayPath ?? change.path);
    const key = displayPath;
    const group = groups.get(key) ?? {
      path: parentDisplayPath(change.path),
      displayPath,
      total: 0,
      added: 0,
      removed: 0,
      modified: 0,
      breaking: 0,
      nonBreaking: 0,
      warnings: 0,
    };

    group.total++;
    if (change.type === 'added') group.added++;
    if (change.type === 'removed') group.removed++;
    if (change.type === 'modified') group.modified++;
    if (change.risk === 'breaking') group.breaking++;
    if (change.risk === 'non-breaking') group.nonBreaking++;
    if (change.risk === 'warning') group.warnings++;

    groups.set(key, group);
  });

  return [...groups.values()].sort((a, b) => b.total - a.total || a.displayPath.localeCompare(b.displayPath));
};

const pathGroupsToSummary = (groups: Map<string, TDiffPathSummary>): TDiffPathSummary[] => {
  return [...groups.values()].sort((a, b) => b.total - a.total || a.displayPath.localeCompare(b.displayPath));
};

/**
 * Compares two JSON-compatible structures and classifies changes by integration risk.
 */
export function diffJson(left: JsonValue, right: JsonValue, options: TDiffOptions = {}): TDiffResult {
  const { arrayOrderMatters = true } = options;
  const includeUnchanged = options.includeUnchanged ?? true;
  const maxDetailedChanges = options.maxDetailedChanges ?? Number.POSITIVE_INFINITY;
  const maxPatchOperations = options.maxPatchOperations ?? Number.POSITIVE_INFINITY;
  const changes: TDiffNode[] = [];
  const patch: TJsonPatchOperation[] = [];
  const stats: TMutableStats = {
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
  };
  const riskSummary = emptyRiskSummary();
  const pathGroups = new Map<string, TDiffPathSummary>();

  const updatePathGroup = (change: TDiffNode) => {
    if (change.type === 'unchanged') return;

    const displayPath = parentDisplayPath(change.displayPath ?? change.path);
    const key = displayPath;
    const group = pathGroups.get(key) ?? {
      path: parentDisplayPath(change.path),
      displayPath,
      total: 0,
      added: 0,
      removed: 0,
      modified: 0,
      breaking: 0,
      nonBreaking: 0,
      warnings: 0,
    };

    group.total++;
    if (change.type === 'added') group.added++;
    if (change.type === 'removed') group.removed++;
    if (change.type === 'modified') group.modified++;
    if (change.risk === 'breaking') group.breaking++;
    if (change.risk === 'non-breaking') group.nonBreaking++;
    if (change.risk === 'warning') group.warnings++;

    pathGroups.set(key, group);
  };

  const pushChange = (
    type: TDiffNode['type'],
    path: string,
    oldValue?: JsonValue,
    newValue?: JsonValue,
    displayPath = path
  ) => {
    stats[type]++;
    if (type === 'unchanged') {
      if (includeUnchanged && changes.length < maxDetailedChanges) {
        changes.push({ type, path, displayPath });
      }
      return;
    }

    const classification = classifyDiffChange(type, oldValue, newValue);
    const change: TDiffNode = {
      type,
      path,
      displayPath,
      oldValue,
      newValue,
      risk: classification.risk,
      reason: classification.reason,
      category: type === 'modified' && getDiffValueType(oldValue) !== getDiffValueType(newValue) ? 'type' : type === 'modified' ? 'value' : 'shape',
      oldType: getDiffValueType(oldValue),
      newType: getDiffValueType(newValue),
    };

    if (classification.risk === 'non-breaking') riskSummary.nonBreaking++;
    else if (classification.risk === 'warning') riskSummary.warnings++;
    else riskSummary[classification.risk]++;
    updatePathGroup(change);

    if (changes.length < maxDetailedChanges) {
      changes.push(change);
    }
  };

  const addPatch = (operation: TJsonPatchOperation) => {
    if (patch.length >= maxPatchOperations) return;
    patch.push(operation);
  };

  const compare = (a: JsonValue, b: JsonValue, path: string, displayPath = path) => {
    if (valuesEquivalent(a, b, options)) {
      if (Array.isArray(a) && Array.isArray(b)) {
        compareArrays(a, b, path, displayPath);
        return;
      }
      if (isJsonObject(a) && isJsonObject(b)) {
        compareObjects(a, b, path, displayPath);
        return;
      }
      pushChange('unchanged', path, undefined, undefined, displayPath);
      return;
    }

    if (typeof a !== typeof b || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) {
      pushChange('modified', path, a, b, displayPath);
      addPatch({ op: 'replace', path, value: b });
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      compareArrays(a, b, path, displayPath);
      return;
    }

    if (isJsonObject(a) && isJsonObject(b)) {
      compareObjects(a, b, path, displayPath);
      return;
    }

    pushChange('modified', path, a, b, displayPath);
    addPatch({ op: 'replace', path, value: b });
  };

  const compareObjects = (a: JsonObject, b: JsonObject, path: string, displayPath: string) => {
    const keysA = Object.keys(a).filter(key => !shouldIgnoreKey(key, options));
    const keysB = Object.keys(b).filter(key => !shouldIgnoreKey(key, options));
    const allKeys = new Set([...keysA, ...keysB]);

    allKeys.forEach((key) => {
      const currentPath = childPath(path, key);
      const currentDisplayPath = childDisplayPath(displayPath, key);

      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        pushChange('removed', currentPath, a[key], undefined, currentDisplayPath);
        addPatch({ op: 'remove', path: currentPath });
      } else if (!Object.prototype.hasOwnProperty.call(a, key)) {
        pushChange('added', currentPath, undefined, b[key]!, currentDisplayPath);
        addPatch({ op: 'add', path: currentPath, value: b[key]! });
      } else {
        compare(a[key]!, b[key]!, currentPath, currentDisplayPath);
      }
    });
  };

  const compareArrays = (a: JsonArray, b: JsonArray, path: string, displayPath: string) => {
    const key = resolveArrayCompareKey(a, b, options.compareArrayByKey);
    if (key) {
      compareArraysByKey(a, b, path, displayPath, key);
      return;
    }

    if (arrayOrderMatters) {
      compareArraysOrdered(a, b, path, displayPath);
    } else {
      compareArraysUnordered(a, b, path, displayPath);
    }
  };

  const compareArraysOrdered = (a: JsonArray, b: JsonArray, path: string, displayPath: string) => {
    if (a.length === b.length) {
      a.forEach((item, index) => {
        compare(item, b[index]!, childPath(path, index), childDisplayPath(displayPath, index));
      });
      return;
    }

    const lcsResult = LCS.diff(a, b, (x, y) => valuesEquivalent(x, y, options));
    let offset = 0;

    lcsResult.forEach((res) => {
      if (res.type === 'unchanged') {
        pushChange('unchanged', childPath(path, res.indexB), undefined, undefined, childDisplayPath(displayPath, res.indexB));
      } else if (res.type === 'added') {
        const currentPath = childPath(path, res.indexB);
        pushChange('added', currentPath, undefined, res.item, childDisplayPath(displayPath, res.indexB));
        addPatch({ op: 'add', path: currentPath, value: res.item });
      } else if (res.type === 'removed') {
        const currentPath = childPath(path, res.indexA + offset);
        pushChange('removed', currentPath, res.item, undefined, childDisplayPath(displayPath, res.indexA));
        addPatch({ op: 'remove', path: currentPath });
        offset--;
      }
    });
  };

  const compareArraysUnordered = (a: JsonArray, b: JsonArray, path: string, displayPath: string) => {
    const usedIndicesB = new Set<number>();

    a.forEach((itemA, indexA) => {
      let found = false;
      for (let indexB = 0; indexB < b.length; indexB++) {
        if (!usedIndicesB.has(indexB) && valuesEquivalent(itemA, b[indexB]!, options)) {
          usedIndicesB.add(indexB);
          pushChange('unchanged', childPath(path, indexA), undefined, undefined, childDisplayPath(displayPath, indexA));
          found = true;
          break;
        }
      }

      if (!found) {
        const currentPath = childPath(path, indexA);
        pushChange('removed', currentPath, itemA, undefined, childDisplayPath(displayPath, indexA));
        addPatch({ op: 'remove', path: currentPath });
      }
    });

    b.forEach((itemB, indexB) => {
      if (!usedIndicesB.has(indexB)) {
        const currentPath = childPath(path, indexB);
        pushChange('added', currentPath, undefined, itemB, childDisplayPath(displayPath, indexB));
        addPatch({ op: 'add', path: `${path}/-`, value: itemB });
      }
    });
  };

  const compareArraysByKey = (a: JsonArray, b: JsonArray, path: string, displayPath: string, key: string) => {
    const leftByKey = new Map<string, { item: JsonValue; index: number }>();
    const rightByKey = new Map<string, { item: JsonValue; index: number }>();

    a.forEach((item, index) => {
      const itemKey = getArrayItemKey(item, key);
      if (itemKey !== null) leftByKey.set(itemKey, { item, index });
    });
    b.forEach((item, index) => {
      const itemKey = getArrayItemKey(item, key);
      if (itemKey !== null) rightByKey.set(itemKey, { item, index });
    });

    const allKeys = [...new Set([...leftByKey.keys(), ...rightByKey.keys()])].sort();
    allKeys.forEach((itemKey) => {
      const leftItem = leftByKey.get(itemKey);
      const rightItem = rightByKey.get(itemKey);
      const keyedDisplayPath = `${displayPath}[${key}=${itemKey}]`;

      if (!rightItem && leftItem) {
        const currentPath = childPath(path, leftItem.index);
        pushChange('removed', currentPath, leftItem.item, undefined, keyedDisplayPath);
        addPatch({ op: 'remove', path: currentPath });
        return;
      }

      if (!leftItem && rightItem) {
        const currentPath = childPath(path, rightItem.index);
        pushChange('added', currentPath, undefined, rightItem.item, keyedDisplayPath);
        addPatch({ op: 'add', path: currentPath, value: rightItem.item });
        return;
      }

      if (leftItem && rightItem) {
        compare(leftItem.item, rightItem.item, childPath(path, rightItem.index), keyedDisplayPath);
      }
    });
  };

  compare(left, right, '', '');

  return {
    changes,
    stats,
    riskSummary: changes.length < maxDetailedChanges && includeUnchanged ? buildRiskSummary(changes) : riskSummary,
    pathSummary: changes.length < maxDetailedChanges && includeUnchanged ? buildPathSummary(changes) : pathGroupsToSummary(pathGroups),
    patch,
  };
}

export default diffJson;
