import type { JsonObject, JsonPrimitive, JsonValue } from '@/types/json';
import type { TContractCheck, TContractSeverity } from '@/types/contracts';
import { makeIssueId, segmentsToJsonPath, segmentsToTreePath } from '@/utils/contracts/path';

const isObject = (value: JsonValue): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const typeOf = (value: JsonValue) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const formatHint = (value: string): string | null => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
  if (/^https?:\/\/[^\s]+$/i.test(value)) return 'url';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return 'date-time';
  return null;
};

const makeCheck = (
  severity: TContractSeverity,
  title: string,
  detail: string,
  pathSegments: string[],
  keyword: string
): TContractCheck => ({
  id: makeIssueId('contract', pathSegments, keyword),
  severity,
  title,
  detail,
  path: segmentsToTreePath(pathSegments),
  jsonPath: segmentsToJsonPath(pathSegments),
  pathSegments,
});

const primitiveKey = (value: JsonPrimitive) => `${typeof value}:${String(value)}`;

export const analyzeContract = (value: JsonValue | null): TContractCheck[] => {
  if (value === null) return [];

  const checks: TContractCheck[] = [];

  const visit = (current: JsonValue, pathSegments: string[]) => {
    if (Array.isArray(current)) {
      if (current.length === 0) {
        checks.push(makeCheck('info', 'Empty array', 'No items available to infer item shape.', pathSegments, 'empty-array'));
        return;
      }

      const itemTypes = [...new Set(current.map(typeOf))];
      if (itemTypes.length > 1) {
        checks.push(makeCheck('warning', 'Mixed array item types', `Array contains multiple item types: ${itemTypes.join(', ')}.`, pathSegments, 'mixed-array'));
      }

      const objectItems = current.filter(isObject);
      if (objectItems.length > 1) {
        const allKeys = [...new Set(objectItems.flatMap(item => Object.keys(item)))];
        const required = allKeys.filter(key => objectItems.every(item => Object.prototype.hasOwnProperty.call(item, key)));
        const optional = allKeys.filter(key => !required.includes(key));
        if (required.length) {
          checks.push(makeCheck('info', 'Required fields', required.join(', '), pathSegments, 'required-fields'));
        }
        if (optional.length) {
          checks.push(makeCheck('warning', 'Optional fields', optional.join(', '), pathSegments, 'optional-fields'));
        }

        allKeys.forEach((key) => {
          const values = objectItems
            .filter(item => Object.prototype.hasOwnProperty.call(item, key))
            .map(item => item[key]);
          const hasNull = values.some(item => item === null);
          if (hasNull) {
            checks.push(makeCheck('warning', 'Nullable field', `${key} can be null.`, [...pathSegments, key], 'nullable'));
          }

          const primitiveValues = values.filter((item): item is JsonPrimitive => item === null || ['string', 'number', 'boolean'].includes(typeof item));
          const nonNullPrimitiveValues = primitiveValues.filter((item): item is Exclude<JsonPrimitive, null> => item !== null);
          const unique = [...new Map(nonNullPrimitiveValues.map(item => [primitiveKey(item), item])).values()];
          if (unique.length >= 2 && unique.length <= 8 && unique.length < nonNullPrimitiveValues.length) {
            checks.push(makeCheck('info', 'Enum candidate', `${key}: ${unique.map(String).join(', ')}`, [...pathSegments, key], 'enum'));
          }
        });
      }

      current.forEach((item, index) => visit(item, [...pathSegments, `[${index}]`]));
      return;
    }

    if (isObject(current)) {
      Object.entries(current).forEach(([key, childValue]) => {
        if (childValue === null) {
          checks.push(makeCheck('warning', 'Nullable field', `${key} is null in this payload.`, [...pathSegments, key], 'nullable'));
        }
        visit(childValue, [...pathSegments, key]);
      });
      return;
    }

    if (typeof current === 'string') {
      const hint = formatHint(current);
      if (hint) {
        checks.push(makeCheck('info', 'Format hint', `Looks like ${hint}.`, pathSegments, `format-${hint}`));
      }
    }
  };

  visit(value, []);
  return checks;
};
