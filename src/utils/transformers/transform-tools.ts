import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import SafeJsonParser from '@/utils/parsers/json-parser';
import { generateContract } from '@/utils/contracts/schema-generator';
import JsonFormatter from '@/utils/transformers/json-formatters';
import type { TDataType } from '@/types/editor';
import type { JsonArray, JsonObject, JsonValue } from '@/types/json';
import { isJsonObject } from '@/types/json';

export type TTransformTool =
  | 'formatJson'
  | 'minifyJson'
  | 'sortKeys'
  | 'jsonToXml'
  | 'xmlToJson'
  | 'flattenCsv'
  | 'redact'
  | 'jsonSchema'
  | 'typescript'
  | 'zod'
  | 'fetchSnippet';

export type TXmlTransformOptions = {
  rootName: string;
  attributePrefix: string;
  textNodeName: string;
  format: boolean;
};

export type TRedactOptions = {
  commonKeys: boolean;
  customKeys: string;
  mask: string;
};

export type TTransformOptions = {
  xml: TXmlTransformOptions;
  redact: TRedactOptions;
};

export type TTablePreview = {
  sourcePath: string;
  columns: string[];
  rows: Record<string, string>[];
};

export type TRedactionMatch = {
  path: string;
  jsonPath: string;
  key: string;
  valueType: string;
};

export type TTransformResult = {
  ok: boolean;
  tool: TTransformTool;
  title: string;
  output: string;
  outputFormat: 'json' | 'xml' | 'csv' | 'typescript' | 'text';
  mime: string;
  fileName: string;
  error?: string;
  table?: TTablePreview;
  redactions?: TRedactionMatch[];
};

const COMMON_SECRET_KEYS = [
  'authorization',
  'password',
  'passwd',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'client_secret',
  'private_key',
  'cookie',
  'set-cookie',
  'session',
  'jwt',
];

const ensureRootedXmlValue = (value: JsonValue, rootName: string): JsonObject => {
  if (isJsonObject(value) && Object.keys(value).length === 1) {
    return value;
  }

  return { [rootName || 'root']: value };
};

const createXmlParser = (options: TXmlTransformOptions) => new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: options.attributePrefix,
  textNodeName: options.textNodeName,
  allowBooleanAttributes: true,
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  processEntities: false,
});

const createXmlBuilder = (options: TXmlTransformOptions) => new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: options.attributePrefix,
  textNodeName: options.textNodeName,
  format: options.format,
  indentBy: '  ',
});

export const parseTransformInput = (
  rawInput: string,
  format: TDataType,
  xmlOptions: TXmlTransformOptions
): { ok: true; value: JsonValue } | { ok: false; error: string } => {
  if (!rawInput.trim()) {
    return { ok: false, error: 'Paste JSON or XML to transform.' };
  }

  if (format === 'json') {
    const result = SafeJsonParser.parse(rawInput);
    return result.success
      ? { ok: true, value: result.data ?? null }
      : { ok: false, error: result.error?.message ?? 'Invalid JSON input.' };
  }

  try {
    return {
      ok: true,
      value: createXmlParser(xmlOptions).parse(rawInput) as JsonValue,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid XML input.',
    };
  }
};

export const jsonToXml = (value: JsonValue, options: TXmlTransformOptions): string => {
  return createXmlBuilder(options).build(ensureRootedXmlValue(value, options.rootName));
};

export const xmlToJson = (rawInput: string, options: TXmlTransformOptions): string => {
  const parsed = createXmlParser(options).parse(rawInput) as JsonValue;
  return JSON.stringify(parsed, null, 2);
};

const valueType = (value: JsonValue) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const stringifyCell = (value: JsonValue): string => {
  if (value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const flattenRecord = (value: JsonValue, prefix = '', output: Record<string, string> = {}) => {
  if (isJsonObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      flattenRecord(child, prefix ? `${prefix}.${key}` : key, output);
    });
    return output;
  }

  if (Array.isArray(value)) {
    if (value.every(item => !isJsonObject(item) && !Array.isArray(item))) {
      output[prefix || 'value'] = value.map(stringifyCell).join(', ');
      return output;
    }

    output[prefix || 'value'] = JSON.stringify(value);
    return output;
  }

  output[prefix || 'value'] = stringifyCell(value);
  return output;
};

const findRows = (value: JsonValue): { rows: JsonArray; sourcePath: string } => {
  if (Array.isArray(value)) return { rows: value, sourcePath: '$' };

  if (!isJsonObject(value)) return { rows: [value], sourcePath: '$' };

  const queue: Array<{ value: JsonValue; path: string; depth: number }> = [{ value, path: '$', depth: 0 }];
  let fallback: { rows: JsonArray; sourcePath: string } | null = null;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (Array.isArray(current.value)) {
      const candidate = { rows: current.value, sourcePath: current.path };
      if (current.value.some(isJsonObject)) return candidate;
      fallback ??= candidate;
      continue;
    }

    if (isJsonObject(current.value) && current.depth < 4) {
      Object.entries(current.value).forEach(([key, child]) => {
        queue.push({ value: child, path: `${current.path}.${key}`, depth: current.depth + 1 });
      });
    }
  }

  return fallback ?? { rows: [value], sourcePath: '$' };
};

export const flattenToTable = (value: JsonValue): TTablePreview => {
  const { rows, sourcePath } = findRows(value);
  const flattenedRows = rows.map(row => flattenRecord(row));
  const columns = [...new Set(flattenedRows.flatMap(row => Object.keys(row)))].sort();

  return {
    sourcePath,
    columns: columns.length ? columns : ['value'],
    rows: flattenedRows,
  };
};

const escapeCsv = (value: string): string => {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

export const tableToCsv = (table: TTablePreview): string => {
  const header = table.columns.map(escapeCsv).join(',');
  const rows = table.rows.map(row => table.columns.map(column => escapeCsv(row[column] ?? '')).join(','));
  return [header, ...rows].join('\n');
};

const jsonPathSegment = (key: string) => (/^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`);

const parseCustomKeys = (value: string): string[] => {
  return value
    .split(/[\n,]+/)
    .map(key => key.trim().toLowerCase())
    .filter(Boolean);
};

const shouldRedactKey = (key: string, options: TRedactOptions): boolean => {
  const normalized = key.toLowerCase();
  const commonMatch = options.commonKeys && COMMON_SECRET_KEYS.some(secretKey => normalized.includes(secretKey));
  const customMatch = parseCustomKeys(options.customKeys).some(secretKey => normalized === secretKey || normalized.includes(secretKey));
  return commonMatch || customMatch;
};

export const redactValue = (value: JsonValue, options: TRedactOptions): { value: JsonValue; matches: TRedactionMatch[] } => {
  const matches: TRedactionMatch[] = [];

  const visit = (current: JsonValue, path: string, jsonPath: string): JsonValue => {
    if (Array.isArray(current)) {
      return current.map((item, index) => visit(item, `${path}[${index}]`, `${jsonPath}[${index}]`));
    }

    if (!isJsonObject(current)) {
      return current;
    }

    const output: JsonObject = {};
    Object.entries(current).forEach(([key, child]) => {
      const nextPath = path ? `${path}.${key}` : key;
      const nextJsonPath = `${jsonPath}${jsonPathSegment(key)}`;

      if (shouldRedactKey(key, options)) {
        output[key] = options.mask;
        matches.push({
          path: nextPath,
          jsonPath: nextJsonPath,
          key,
          valueType: valueType(child),
        });
        return;
      }

      output[key] = visit(child, nextPath, nextJsonPath);
    });

    return output;
  };

  return {
    value: visit(value, '', '$'),
    matches,
  };
};

export const generateFetchSnippet = (rootName = 'ApiPayload') => {
  return `import type { AxiosInstance } from 'axios';\nimport type { ${rootName} } from './types';\n\nexport async function fetch${rootName}(url: string, init?: RequestInit): Promise<${rootName}> {\n  const response = await fetch(url, init);\n\n  if (!response.ok) {\n    throw new Error(\`Request failed: \${response.status} \${response.statusText}\`);\n  }\n\n  return response.json() as Promise<${rootName}>;\n}\n\nexport async function get${rootName}(client: AxiosInstance, url: string): Promise<${rootName}> {\n  const { data } = await client.get<${rootName}>(url);\n  return data;\n}`;
};

const emptyResult = (tool: TTransformTool, error: string): TTransformResult => ({
  ok: false,
  tool,
  title: 'Transform unavailable',
  output: '',
  outputFormat: 'text',
  mime: 'text/plain',
  fileName: 'datatree-transform.txt',
  error,
});

export const runTransform = (
  tool: TTransformTool,
  rawInput: string,
  format: TDataType,
  options: TTransformOptions
): TTransformResult => {
  if (tool === 'formatJson' || tool === 'minifyJson' || tool === 'sortKeys') {
    if (format !== 'json') return emptyResult(tool, 'Switch input format to JSON to use this transform.');
    if (!rawInput.trim()) return emptyResult(tool, 'Paste JSON to transform.');
    const parseCheck = SafeJsonParser.parse(rawInput);
    if (!parseCheck.success) return emptyResult(tool, parseCheck.error?.message ?? 'Invalid JSON input.');

    const output = tool === 'formatJson'
      ? JsonFormatter.format(rawInput)
      : tool === 'minifyJson'
        ? JsonFormatter.minify(rawInput)
        : JsonFormatter.sortKeys(rawInput);

    return {
      ok: true,
      tool,
      title: tool === 'formatJson' ? 'Format JSON' : tool === 'minifyJson' ? 'Minify JSON' : 'Sort JSON keys',
      output,
      outputFormat: 'json',
      mime: 'application/json',
      fileName: tool === 'minifyJson' ? 'datatree-minified.json' : 'datatree-formatted.json',
    };
  }

  if (tool === 'xmlToJson') {
    if (!rawInput.trim()) return emptyResult(tool, 'Paste XML to transform.');
    if (format !== 'xml') return emptyResult(tool, 'Switch input format to XML to convert XML to JSON.');

    try {
      return {
        ok: true,
        tool,
        title: 'XML to JSON',
        output: xmlToJson(rawInput, options.xml),
        outputFormat: 'json',
        mime: 'application/json',
        fileName: 'datatree-from-xml.json',
      };
    } catch (error: unknown) {
      return emptyResult(tool, error instanceof Error ? error.message : 'XML conversion failed.');
    }
  }

  const parsed = parseTransformInput(rawInput, format, options.xml);
  if (!parsed.ok) return emptyResult(tool, parsed.error);

  if (tool === 'jsonToXml') {
    return {
      ok: true,
      tool,
      title: 'JSON to XML',
      output: jsonToXml(parsed.value, options.xml),
      outputFormat: 'xml',
      mime: 'application/xml',
      fileName: 'datatree-payload.xml',
    };
  }

  if (tool === 'flattenCsv') {
    const table = flattenToTable(parsed.value);
    return {
      ok: true,
      tool,
      title: 'Flatten to CSV',
      output: tableToCsv(table),
      outputFormat: 'csv',
      mime: 'text/csv',
      fileName: 'datatree-table.csv',
      table,
    };
  }

  if (tool === 'redact') {
    const redacted = redactValue(parsed.value, options.redact);
    const output = format === 'xml'
      ? jsonToXml(redacted.value, options.xml)
      : JSON.stringify(redacted.value, null, 2);

    return {
      ok: true,
      tool,
      title: 'Redacted payload',
      output,
      outputFormat: format === 'xml' ? 'xml' : 'json',
      mime: format === 'xml' ? 'application/xml' : 'application/json',
      fileName: format === 'xml' ? 'datatree-sanitized.xml' : 'datatree-sanitized.json',
      redactions: redacted.matches,
    };
  }

  const contract = generateContract(parsed.value, 'ApiPayload');

  if (tool === 'jsonSchema') {
    return {
      ok: true,
      tool,
      title: 'JSON Schema',
      output: contract.jsonSchema,
      outputFormat: 'json',
      mime: 'application/schema+json',
      fileName: 'datatree-schema.json',
    };
  }

  if (tool === 'typescript') {
    return {
      ok: true,
      tool,
      title: 'TypeScript types',
      output: contract.typescript,
      outputFormat: 'typescript',
      mime: 'text/typescript',
      fileName: 'datatree-types.ts',
    };
  }

  if (tool === 'zod') {
    return {
      ok: true,
      tool,
      title: 'Zod schema',
      output: contract.zod,
      outputFormat: 'typescript',
      mime: 'text/typescript',
      fileName: 'datatree-zod-schema.ts',
    };
  }

  return {
    ok: true,
    tool,
    title: 'Fetch and Axios snippet',
    output: generateFetchSnippet('ApiPayload'),
    outputFormat: 'typescript',
    mime: 'text/typescript',
    fileName: 'datatree-api-client.ts',
  };
};
