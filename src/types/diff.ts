import type { TTreeNodeType } from './store';

export type TDiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface TDiffNode {
  type: TDiffChangeType;
  path: string;
  oldValue?: any;
  newValue?: any;
}

export interface TDiffTreeNode {
  key: string;
  path: string;
  type: TTreeNodeType;
  diffType: TDiffChangeType;
  value?: any;
  oldValue?: any;
  newValue?: any;
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
  value?: any;
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
