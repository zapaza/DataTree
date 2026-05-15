import type { TContractDiffChange, TContractDiffResult, TDiffRisk } from '@/types/diff';
import type { TJsonSchema } from '@/types/contracts';
import type { JsonValue } from '@/types/json';
import { generateJsonSchema } from '@/utils/contracts/schema-generator';
import { emptyRiskSummary, escapeJsonPointerSegment } from './semantic-utils';

const schemaTypes = (schema: TJsonSchema): string[] => {
  if (!schema.type) {
    if (schema.anyOf?.length) return [...new Set(schema.anyOf.flatMap(schemaTypes))];
    return [];
  }
  return Array.isArray(schema.type) ? schema.type : [schema.type];
};

const concreteTypes = (schema: TJsonSchema) => schemaTypes(schema).filter(type => type !== 'null').sort();
const isNullable = (schema: TJsonSchema) => schemaTypes(schema).includes('null') || !!schema.anyOf?.some(item => schemaTypes(item).includes('null'));
const typeLabel = (schema: TJsonSchema) => concreteTypes(schema).join(' | ') || 'unknown';

const childPath = (path: string, key: string) => `${path}/properties/${escapeJsonPointerSegment(key)}`;
const childDisplayPath = (path: string, key: string) => `${path}/${key}`;

const toJsonValue = (value: unknown): JsonValue | undefined => {
  if (value === undefined) return undefined;
  return value as JsonValue;
};

const push = (
  changes: TContractDiffChange[],
  path: string,
  displayPath: string,
  risk: TDiffRisk,
  title: string,
  detail: string,
  oldValue?: unknown,
  newValue?: unknown
) => {
  changes.push({
    path,
    displayPath,
    risk,
    title,
    detail,
    oldValue: toJsonValue(oldValue),
    newValue: toJsonValue(newValue),
  });
};

const sameTypes = (left: TJsonSchema, right: TJsonSchema) => {
  const leftTypes = concreteTypes(left);
  const rightTypes = concreteTypes(right);
  return leftTypes.length === rightTypes.length && leftTypes.every((type, index) => type === rightTypes[index]);
};

const compareSchemaNodes = (
  left: TJsonSchema,
  right: TJsonSchema,
  path: string,
  displayPath: string,
  changes: TContractDiffChange[]
) => {
  if (!sameTypes(left, right)) {
    push(
      changes,
      `${path}/type`,
      displayPath,
      'breaking',
      'Type changed',
      `Type changed from ${typeLabel(left)} to ${typeLabel(right)}.`,
      left.type,
      right.type
    );
    return;
  }

  const leftNullable = isNullable(left);
  const rightNullable = isNullable(right);
  if (leftNullable !== rightNullable) {
    push(
      changes,
      `${path}/type`,
      displayPath,
      leftNullable && !rightNullable ? 'breaking' : 'warning',
      'Nullable contract changed',
      leftNullable && !rightNullable
        ? 'Field no longer accepts null; stricter contracts can break producers/tests.'
        : 'Field may now be null; consumers may need null handling.',
      left.type,
      right.type
    );
  }

  if (left.format !== right.format) {
    push(
      changes,
      `${path}/format`,
      displayPath,
      'warning',
      'Format hint changed',
      `Format changed from ${left.format || 'none'} to ${right.format || 'none'}.`,
      left.format || null,
      right.format || null
    );
  }

  if (concreteTypes(left).includes('object') && concreteTypes(right).includes('object')) {
    compareObjectSchemas(left, right, path, displayPath, changes);
  }

  if (concreteTypes(left).includes('array') && concreteTypes(right).includes('array')) {
    compareSchemaNodes(left.items ?? {}, right.items ?? {}, `${path}/items`, `${displayPath}[]`, changes);
  }
};

const compareObjectSchemas = (
  left: TJsonSchema,
  right: TJsonSchema,
  path: string,
  displayPath: string,
  changes: TContractDiffChange[]
) => {
  const leftProperties = left.properties ?? {};
  const rightProperties = right.properties ?? {};
  const leftRequired = new Set(left.required ?? []);
  const rightRequired = new Set(right.required ?? []);
  const allKeys = [...new Set([...Object.keys(leftProperties), ...Object.keys(rightProperties)])].sort();

  allKeys.forEach((key) => {
    const leftSchema = leftProperties[key];
    const rightSchema = rightProperties[key];
    const currentPath = childPath(path, key);
    const currentDisplayPath = childDisplayPath(displayPath, key);

    if (leftSchema && !rightSchema) {
      const required = leftRequired.has(key);
      push(
        changes,
        currentPath,
        currentDisplayPath,
        required ? 'breaking' : 'warning',
        required ? 'Removed required field' : 'Removed optional field',
        required
          ? 'A required field disappeared from the contract.'
          : 'Optional field disappeared; consumers using it may need a fallback.',
        leftSchema,
        undefined
      );
      return;
    }

    if (!leftSchema && rightSchema) {
      const required = rightRequired.has(key);
      push(
        changes,
        currentPath,
        currentDisplayPath,
        required ? 'breaking' : 'non-breaking',
        required ? 'Added required field' : 'Added optional field',
        required
          ? 'A new required field makes the contract stricter.'
          : 'Optional additive fields are usually safe for existing consumers.',
        undefined,
        rightSchema
      );
      return;
    }

    if (leftSchema && rightSchema) {
      if (leftRequired.has(key) !== rightRequired.has(key)) {
        push(
          changes,
          `${currentPath}/required`,
          currentDisplayPath,
          leftRequired.has(key) ? 'warning' : 'breaking',
          'Required flag changed',
          leftRequired.has(key)
            ? 'Field became optional.'
            : 'Field became required; stricter contracts can break producers.',
          leftRequired.has(key),
          rightRequired.has(key)
        );
      }
      compareSchemaNodes(leftSchema, rightSchema, currentPath, currentDisplayPath, changes);
    }
  });
};

export const diffJsonSchemas = (left: TJsonSchema, right: TJsonSchema): TContractDiffResult => {
  const changes: TContractDiffChange[] = [];
  compareSchemaNodes(left, right, '', '$', changes);

  const summary = emptyRiskSummary();
  changes.forEach((change) => {
    if (change.risk === 'non-breaking') summary.nonBreaking++;
    else if (change.risk === 'warning') summary.warnings++;
    else summary[change.risk]++;
  });

  return { changes, summary };
};

export const diffGeneratedContracts = (left: JsonValue, right: JsonValue): TContractDiffResult => {
  return diffJsonSchemas(generateJsonSchema(left, 'SourceA'), generateJsonSchema(right, 'SourceB'));
};
