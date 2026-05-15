import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { findNodeAtLocation, parseTree, type Node as JsonAstNode } from 'jsonc-parser';
import type { JsonValue } from '@/types/json';
import type { TContractIssue, TJsonSchema } from '@/types/contracts';
import { jsonPointerToSegments, makeIssueId, segmentsToJsonPath, segmentsToTreePath } from '@/utils/contracts/path';

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
});

addFormats(ajv);

const normalizeSegmentsForAst = (segments: string[]): Array<string | number> => {
  return segments.map((segment) => {
    const arrayMatch = segment.match(/^\[(\d+)]$/);
    return arrayMatch ? Number(arrayMatch[1]) : segment;
  });
};

const offsetToLineColumn = (content: string, offset: number) => {
  const before = content.slice(0, offset);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
};

const findLocation = (content: string, segments: string[]) => {
  if (!content.trim()) return {};
  const ast = parseTree(content);
  if (!ast) return {};

  const normalizedSegments = normalizeSegmentsForAst(segments);
  const node = findNodeAtLocation(ast, normalizedSegments) ?? findClosestParentNode(ast, normalizedSegments);
  if (!node) return {};

  return offsetToLineColumn(content, node.offset);
};

const findClosestParentNode = (ast: JsonAstNode, segments: Array<string | number>) => {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const parent = findNodeAtLocation(ast, segments.slice(0, index));
    if (parent) return parent;
  }
  return ast;
};

const errorSegments = (error: ErrorObject): string[] => {
  const segments = jsonPointerToSegments(error.instancePath);

  if (error.keyword === 'required' && typeof error.params.missingProperty === 'string') {
    return [...segments, error.params.missingProperty];
  }

  if (error.keyword === 'additionalProperties' && typeof error.params.additionalProperty === 'string') {
    return [...segments, error.params.additionalProperty];
  }

  return segments;
};

const errorTitle = (error: ErrorObject) => {
  switch (error.keyword) {
    case 'required':
      return 'Missing required field';
    case 'type':
      return 'Invalid type';
    case 'format':
      return 'Invalid format';
    case 'additionalProperties':
      return 'Unexpected field';
    case 'enum':
      return 'Invalid enum value';
    default:
      return 'Schema violation';
  }
};

export const validateJsonSchema = (
  data: JsonValue | null,
  schemaText: string,
  rawInput: string
): TContractIssue[] => {
  if (!schemaText.trim() || data === null) return [];

  let schema: TJsonSchema;
  try {
    schema = JSON.parse(schemaText) as TJsonSchema;
  } catch (error: unknown) {
    return [{
      id: 'schema:parse-error',
      severity: 'error',
      title: 'Invalid schema JSON',
      message: error instanceof Error ? error.message : 'Schema is not valid JSON.',
      path: 'root',
      jsonPath: '$',
      pathSegments: [],
      keyword: 'schema-parse',
    }];
  }

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (error: unknown) {
    return [{
      id: 'schema:compile-error',
      severity: 'error',
      title: 'Invalid JSON Schema',
      message: error instanceof Error ? error.message : 'Schema cannot be compiled.',
      path: 'root',
      jsonPath: '$',
      pathSegments: [],
      keyword: 'schema-compile',
    }];
  }

  const valid = validate(data);
  if (valid) return [];

  return (validate.errors ?? []).map((error, index) => {
    const pathSegments = errorSegments(error);
    const location = findLocation(rawInput, pathSegments);
    return {
      id: makeIssueId('schema', pathSegments, `${error.keyword}-${index}`),
      severity: 'error',
      title: errorTitle(error),
      message: error.message || 'Schema validation failed.',
      path: segmentsToTreePath(pathSegments),
      jsonPath: segmentsToJsonPath(pathSegments),
      pathSegments,
      keyword: error.keyword,
      ...location,
    };
  });
};
