import type { TTreeNodeType } from './store';
import type { JsonValue } from './json';

export type TDiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface TDiffNode {
  type: TDiffChangeType;
  path: string;
  oldValue?: JsonValue;
  newValue?: JsonValue;
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

export interface TDiffResult {
  changes: TDiffNode[];
  stats: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
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
}
