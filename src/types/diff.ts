import type { TTreeNodeType } from './store';
import type { JsonValue } from './json';

export type TDiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';
export type TDiffRisk = 'breaking' | 'non-breaking' | 'warning' | 'neutral';
export type TDiffChangeCategory = 'value' | 'type' | 'shape' | 'array' | 'contract';

export type TArrayCompareKey = '' | 'auto' | 'id' | 'uuid' | 'name' | string;

export interface TDiffNode {
  type: TDiffChangeType;
  path: string;
  displayPath?: string;
  oldValue?: JsonValue;
  newValue?: JsonValue;
  risk?: TDiffRisk;
  reason?: string;
  category?: TDiffChangeCategory;
  oldType?: string;
  newType?: string;
}

export interface TDiffTreeNode {
  key: string;
  path: string;
  type: TTreeNodeType;
  diffType: TDiffChangeType;
  value?: JsonValue;
  oldValue?: JsonValue;
  newValue?: JsonValue;
  children?: TDiffTreeNode[];
  isExpanded?: boolean;
}

export interface TFlatDiffNode {
  id: string; // путь
  node: TDiffTreeNode;
  depth: number;
  path: string;
}

export type TJsonPatchOp = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

export interface TJsonPatchOperation {
  op: TJsonPatchOp;
  path: string;
  value?: JsonValue;
  from?: string;
}

export interface TDiffPathSummary {
  path: string;
  displayPath: string;
  total: number;
  added: number;
  removed: number;
  modified: number;
  breaking: number;
  nonBreaking: number;
  warnings: number;
}

export interface TDiffRiskSummary {
  breaking: number;
  nonBreaking: number;
  warnings: number;
  neutral: number;
}

export interface TContractDiffChange {
  path: string;
  displayPath: string;
  risk: TDiffRisk;
  title: string;
  detail: string;
  oldValue?: JsonValue;
  newValue?: JsonValue;
}

export interface TContractDiffResult {
  changes: TContractDiffChange[];
  summary: TDiffRiskSummary;
}

export interface TDiffResult {
  changes: TDiffNode[];
  stats: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  riskSummary: TDiffRiskSummary;
  pathSummary: TDiffPathSummary[];
  contractDiff?: TContractDiffResult;
  patch: TJsonPatchOperation[];
}

export interface TDiffOptions {
  /**
   * Сравнение массивов с учетом порядка элементов (используется LCS)
   */
  arrayOrderMatters?: boolean;
  /**
   * Игнорировать различия в типах, если значения эквивалентны (например, "1" и 1)
   */
  ignoreTypeDiff?: boolean;
  /**
   * Игнорировать ключи объектов по точному имени.
   */
  ignoreKeys?: string[];
  /**
   * Игнорировать типичные volatile-поля API payload.
   */
  ignoreVolatileFields?: boolean;
  /**
   * Список volatile-полей, которые можно скрыть отдельной опцией.
   */
  volatileKeys?: string[];
  /**
   * Сопоставлять массивы объектов по стабильному ключу вместо позиции.
   */
  compareArrayByKey?: TArrayCompareKey;
  /**
   * Нормализовать date-like строки перед сравнением.
   */
  normalizeDates?: boolean;
  /**
   * Сохранять unchanged-узлы в подробном списке changes.
   */
  includeUnchanged?: boolean;
  /**
   * Ограничить количество подробных changes, которые возвращаются в UI.
   */
  maxDetailedChanges?: number;
  /**
   * Ограничить количество JSON Patch операций.
   */
  maxPatchOperations?: number;
}
