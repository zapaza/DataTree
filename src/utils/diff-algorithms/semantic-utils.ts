import type { TArrayCompareKey, TDiffOptions, TDiffRisk, TDiffRiskSummary } from '@/types/diff';
import type { JsonArray, JsonObject, JsonPrimitive, JsonValue } from '@/types/json';
import { isJsonObject } from '@/types/json';

export const DEFAULT_VOLATILE_KEYS = ['timestamp', 'updatedAt', 'requestId'];
export const ARRAY_KEY_CANDIDATES = ['id', 'uuid', 'name'];

export const getDiffValueType = (value: JsonValue | undefined): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value) && typeof value === 'number') return 'integer';
  return typeof value;
};

export const escapeJsonPointerSegment = (segment: string): string => {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
};

const isPrimitive = (value: JsonValue): value is JsonPrimitive => {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
};

const normalizeScalarForTypeDiff = (value: JsonValue): JsonValue => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  return value;
};

const datePatterns = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
];

export const normalizeDateValue = (value: JsonValue): JsonValue => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!datePatterns.some(pattern => pattern.test(trimmed))) return value;
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toISOString();
};

export const normalizePrimitive = (value: JsonValue, options: TDiffOptions): JsonValue => {
  const dateNormalized = options.normalizeDates ? normalizeDateValue(value) : value;
  return options.ignoreTypeDiff ? normalizeScalarForTypeDiff(dateNormalized) : dateNormalized;
};

export const stableStringify = (value: JsonValue): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isJsonObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key]!)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

export const shouldIgnoreKey = (key: string, options: TDiffOptions): boolean => {
  const ignored = new Set(options.ignoreKeys ?? []);
  if (ignored.has(key)) return true;

  if (options.ignoreVolatileFields) {
    const volatileKeys = new Set(options.volatileKeys ?? DEFAULT_VOLATILE_KEYS);
    return volatileKeys.has(key);
  }

  return false;
};

const scalarKey = (value: JsonValue | undefined): string | null => {
  if (value === undefined || !isPrimitive(value) || value === null) return null;
  return String(value);
};

export const resolveArrayCompareKey = (
  left: JsonArray,
  right: JsonArray,
  configuredKey?: TArrayCompareKey
): string | null => {
  if (!configuredKey) return null;

  const candidates = configuredKey === 'auto' ? ARRAY_KEY_CANDIDATES : [configuredKey];
  for (const key of candidates) {
    const allItems = [...left, ...right];
    if (
      allItems.length > 0 &&
      allItems.every(item => isJsonObject(item) && scalarKey(item[key]) !== null)
    ) {
      return key;
    }
  }

  return null;
};

export const getArrayItemKey = (item: JsonValue, key: string): string | null => {
  if (!isJsonObject(item)) return null;
  return scalarKey(item[key]);
};

export const normalizeForDiff = (value: JsonValue, options: TDiffOptions = {}): JsonValue => {
  if (Array.isArray(value)) {
    const normalizedItems = value.map(item => normalizeForDiff(item, options));
    const key = resolveArrayCompareKey(normalizedItems, normalizedItems, options.compareArrayByKey);
    if (key) {
      return [...normalizedItems].sort((a, b) => String(getArrayItemKey(a, key)).localeCompare(String(getArrayItemKey(b, key))));
    }
    if (options.arrayOrderMatters === false) {
      return [...normalizedItems].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
    }
    return normalizedItems;
  }

  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !shouldIgnoreKey(key, options))
        .map(([key, childValue]) => [key, normalizeForDiff(childValue, options)])
    );
  }

  return normalizePrimitive(value, options);
};

export const valuesEquivalent = (left: JsonValue, right: JsonValue, options: TDiffOptions = {}): boolean => {
  const normalizedLeft = normalizePrimitive(left, options);
  const normalizedRight = normalizePrimitive(right, options);

  if (normalizedLeft === normalizedRight) return true;
  if (isPrimitive(normalizedLeft) && isPrimitive(normalizedRight)) return false;
  if (typeof normalizedLeft !== typeof normalizedRight) return false;

  if (Array.isArray(normalizedLeft) && Array.isArray(normalizedRight)) {
    const leftArray = normalizeForDiff(normalizedLeft, options) as JsonArray;
    const rightArray = normalizeForDiff(normalizedRight, options) as JsonArray;
    if (leftArray.length !== rightArray.length) return false;
    return leftArray.every((item, index) => valuesEquivalent(item, rightArray[index]!, options));
  }

  if (isJsonObject(normalizedLeft) && isJsonObject(normalizedRight)) {
    const leftObject = normalizeForDiff(normalizedLeft, options) as JsonObject;
    const rightObject = normalizeForDiff(normalizedRight, options) as JsonObject;
    const keysA = Object.keys(leftObject);
    const keysB = Object.keys(rightObject);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => Object.prototype.hasOwnProperty.call(rightObject, key) && valuesEquivalent(leftObject[key]!, rightObject[key]!, options));
  }

  return false;
};

export const classifyDiffChange = (
  type: 'added' | 'removed' | 'modified',
  oldValue: JsonValue | undefined,
  newValue: JsonValue | undefined
): { risk: TDiffRisk; reason: string } => {
  if (type === 'removed') {
    return { risk: 'breaking', reason: 'Removed data may break consumers that depend on this path.' };
  }

  if (type === 'added') {
    return { risk: 'non-breaking', reason: 'Additive change; existing consumers can usually ignore it.' };
  }

  const oldType = getDiffValueType(oldValue);
  const newType = getDiffValueType(newValue);
  if (oldType !== newType) {
    return { risk: 'breaking', reason: `Type changed from ${oldType} to ${newType}.` };
  }

  if (oldValue !== null && newValue === null) {
    return { risk: 'warning', reason: 'Value became nullable; consumers may need null handling.' };
  }

  if (oldValue === null && newValue !== null) {
    return { risk: 'non-breaking', reason: 'Null was replaced by a concrete value.' };
  }

  return { risk: 'neutral', reason: 'Value changed without an obvious contract shape change.' };
};

export const emptyRiskSummary = (): TDiffRiskSummary => ({
  breaking: 0,
  nonBreaking: 0,
  warnings: 0,
  neutral: 0,
});
