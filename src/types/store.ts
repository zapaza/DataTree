import type { TDataType } from './editor';

export type TTreeNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface TTreeNode {
  type: TTreeNodeType;
  key: string;
  value: any;
  children?: TTreeNode[];
}

export interface TErrorSuggestion {
  label: string;
  fix: () => string;
}

export interface TParseError {
  message: string;
  line: number;
  column: number;
  snippet?: string;
  severity: 'error' | 'warning';
  suggestion?: TErrorSuggestion;
}

export interface TAppSettings {
  theme: 'light' | 'dark';
  editor: {
    fontSize: number;
    fontFamily: string;
    showLineNumbers: boolean;
    minimap: boolean;
    tabSize: number;
    renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
    cursorStyle: 'block' | 'line' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  };
  tree: {
    showIcons: boolean;
    animate: boolean;
    indentSize: number;
    compactMode: boolean;
  };
  diffPersistence?: {
    retentionDays: number; // default 30
    maxSessions: number; // default 100
  };
}

export interface TTreeFilters {
  hideNull: boolean;
  hideEmptyArrays: boolean;
  hideEmptyObjects: boolean;
  hideTypes: TTreeNodeType[];
  maxDepth: number;
}

export interface TTypeDistribution {
  object: number;
  array: number;
  string: number;
  number: number;
  boolean: number;
  null: number;
}

export interface TDocumentStatistics {
  size: number;
  nodes: number;
  depth: number;
  maxWidth: number;
  format: string;
  isValid: boolean;
  parseTime: number;
  typeDistribution: TTypeDistribution;
}
