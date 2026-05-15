import SafeJsonParser from '@/utils/parsers/json-parser';
import XmlParser from '@/utils/parsers/xml-parser';
import XmlToJsonConverter from '@/utils/parsers/xml-to-json';
import TreeTransformer from '@/utils/tree-transformer';
import type { TDataType, IParseResult } from '@/types/editor';
import type { TDocumentStatistics, TParseError, TTreeNode } from '@/types/store';
import type { JsonValue } from '@/types/json';
import { createDocumentStatistics } from '@/utils/statistics';

export type TDocumentParseResult = {
  success: boolean;
  parsed: JsonValue | null;
  tree: TTreeNode | null;
  error: TParseError | null;
  parseTime: number;
  statistics: TDocumentStatistics;
};

const now = () => globalThis.performance?.now?.() ?? Date.now();

export const parsePayload = (content: string, format: TDataType): IParseResult => {
  return format === 'json'
    ? SafeJsonParser.parse(content)
    : XmlParser.parse(content);
};

export const normalizeParseError = (error: IParseResult['error'] | undefined): TParseError | null => {
  if (!error) return null;
  return {
    message: error.message,
    line: error.line,
    column: error.column,
    snippet: error.snippet,
    severity: 'error',
  };
};

export const parsedPayloadToTree = (parsed: JsonValue, format: TDataType): TTreeNode => {
  return format === 'json'
    ? TreeTransformer.transform(parsed)
    : XmlToJsonConverter.convert(parsed);
};

export const parseDocumentToTree = (content: string, format: TDataType): TDocumentParseResult => {
  if (!content.trim()) {
    return {
      success: true,
      parsed: null,
      tree: null,
      error: null,
      parseTime: 0,
      statistics: createDocumentStatistics(null, content.length, format, true, 0),
    };
  }

  const startTime = now();
  const result = parsePayload(content, format);
  const parseTime = Number((now() - startTime).toFixed(2));

  if (!result.success) {
    return {
      success: false,
      parsed: null,
      tree: null,
      error: normalizeParseError(result.error),
      parseTime,
      statistics: createDocumentStatistics(null, content.length, format, false, parseTime),
    };
  }

  const parsed = result.data ?? null;
  const tree = parsedPayloadToTree(parsed, format);

  return {
    success: true,
    parsed,
    tree,
    error: null,
    parseTime,
    statistics: createDocumentStatistics(tree, content.length, format, true, parseTime),
  };
};
