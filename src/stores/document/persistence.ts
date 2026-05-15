import type { TDataType } from '@/types/editor';
import type { TTreeFilters } from '@/types/store';
import { detectPayloadFormat, isPayloadFormat } from '@/utils/format-detector';

const STORAGE_KEY_INPUT = 'datatree_raw_input';
const STORAGE_KEY_FORMAT = 'datatree_format';
const STORAGE_KEY_FILTERS = 'datatree_filters';
const PERSISTED_INPUT_MAX_CHARS = 1_000_000;

export const DEFAULT_TREE_FILTERS: TTreeFilters = {
  hideNull: false,
  hideEmptyArrays: false,
  hideEmptyObjects: false,
  hideTypes: [],
  maxDepth: 20,
};

export type TStoredDocumentState = {
  rawInput: string;
  format: TDataType;
};

const parseStoredFilters = (value: string | null): TTreeFilters => {
  if (!value) return { ...DEFAULT_TREE_FILTERS };

  try {
    return { ...DEFAULT_TREE_FILTERS, ...JSON.parse(value) as Partial<TTreeFilters> };
  } catch {
    return { ...DEFAULT_TREE_FILTERS };
  }
};

export const readStoredDocumentState = (): TStoredDocumentState => {
  const rawInput = localStorage.getItem(STORAGE_KEY_INPUT) || '';
  const storedFormat = localStorage.getItem(STORAGE_KEY_FORMAT);

  return {
    rawInput,
    format: isPayloadFormat(storedFormat) ? storedFormat : detectPayloadFormat(rawInput),
  };
};

export const persistDocumentState = (state: TStoredDocumentState) => {
  try {
    if (state.rawInput.length > PERSISTED_INPUT_MAX_CHARS) {
      localStorage.removeItem(STORAGE_KEY_INPUT);
    } else {
      localStorage.setItem(STORAGE_KEY_INPUT, state.rawInput);
    }
    localStorage.setItem(STORAGE_KEY_FORMAT, state.format);
  } catch {
    localStorage.removeItem(STORAGE_KEY_INPUT);
    localStorage.setItem(STORAGE_KEY_FORMAT, state.format);
  }
};

export const readStoredTreeFilters = (): TTreeFilters => {
  return parseStoredFilters(localStorage.getItem(STORAGE_KEY_FILTERS));
};

export const persistTreeFilters = (filters: TTreeFilters) => {
  localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
};
