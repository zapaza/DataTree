import type { JsonPrimitive } from '@/types/json';
import type { TTreeNode, TTreeNodeType } from '@/types/store';
import PathUtils from '@/utils/path-utils';

export type TInsightSeverity = 'risk' | 'warn' | 'info';

export interface TInsightPathItem {
  path: string;
  jsonPath: string;
  key: string;
  type: TTreeNodeType;
  valuePreview?: string;
}

export interface TMixedArrayInsight {
  path: string;
  jsonPath: string;
  types: TTreeNodeType[];
}

export interface TDuplicateIdInsight {
  value: string;
  count: number;
  paths: string[];
}

export interface TBranchInsight {
  path: string;
  jsonPath: string;
  nodes: number;
  depth: number;
}

export interface TDateFieldInsight extends TInsightPathItem {
  format: string;
}

export interface TSmartInsights {
  suspiciousFields: TInsightPathItem[];
  nullableFields: TInsightPathItem[];
  emptyCollections: TInsightPathItem[];
  mixedTypeArrays: TMixedArrayInsight[];
  duplicateIds: TDuplicateIdInsight[];
  deepestPaths: TBranchInsight[];
  largestBranches: TBranchInsight[];
  dateFields: TDateFieldInsight[];
  dateFormats: Array<{ format: string; count: number }>;
}

const SUSPICIOUS_FIELD_RE = /(token|secret|password|authorization)/i;
const DATE_KEY_RE = /(date|time|timestamp|created|updated|expires|expired|birth)/i;

const previewValue = (value: JsonPrimitive | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return 'null';
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
};

const makePathItem = (
  node: TTreeNode,
  path: string,
  pathSegments: string[]
): TInsightPathItem => ({
  path,
  jsonPath: PathUtils.getNodePath(pathSegments, 'jsonpath'),
  key: node.key,
  type: node.type,
  valuePreview: node.type === 'object' || node.type === 'array'
    ? undefined
    : previewValue(node.value as JsonPrimitive),
});

type TNodeMetrics = {
  nodes: number;
  maxDepth: number;
};

const detectDateFormat = (node: TTreeNode): string | null => {
  if (typeof node.value === 'string') {
    const value = node.value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'ISO date';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'ISO datetime';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'US date';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return 'EU dotted date';
    if (/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/.test(value)) return 'RFC 2822';
  }

  if (typeof node.value === 'number' && DATE_KEY_RE.test(node.key)) {
    if (node.value > 1_000_000_000_000 && node.value < 10_000_000_000_000) return 'Unix milliseconds';
    if (node.value > 1_000_000_000 && node.value < 10_000_000_000) return 'Unix seconds';
  }

  return null;
};

export const analyzeSmartInsights = (root: TTreeNode | null): TSmartInsights => {
  const insights: TSmartInsights = {
    suspiciousFields: [],
    nullableFields: [],
    emptyCollections: [],
    mixedTypeArrays: [],
    duplicateIds: [],
    deepestPaths: [],
    largestBranches: [],
    dateFields: [],
    dateFormats: [],
  };

  if (!root) return insights;

  const idPathsByValue = new Map<string, string[]>();
  const dateFormatCounts = new Map<string, number>();
  const deepestCandidates: TBranchInsight[] = [];
  const branchCandidates: TBranchInsight[] = [];

  const visit = (node: TTreeNode, path: string, pathSegments: string[], depth: number): TNodeMetrics => {
    const pathItem = makePathItem(node, path, pathSegments);

    if (SUSPICIOUS_FIELD_RE.test(node.key)) {
      insights.suspiciousFields.push(pathItem);
    }

    if (node.type === 'null') {
      insights.nullableFields.push(pathItem);
    }

    if ((node.type === 'array' || node.type === 'object') && !node.children?.length) {
      insights.emptyCollections.push(pathItem);
    }

    if (node.type === 'array' && node.children?.length) {
      const types = [...new Set(node.children.map(child => child.type))];
      if (types.length > 1) {
        insights.mixedTypeArrays.push({
          path,
          jsonPath: PathUtils.getNodePath(pathSegments, 'jsonpath'),
          types,
        });
      }
    }

    if (node.key.toLowerCase() === 'id' && node.value !== null && (typeof node.value === 'string' || typeof node.value === 'number')) {
      const value = String(node.value);
      idPathsByValue.set(value, [...(idPathsByValue.get(value) ?? []), PathUtils.getNodePath(pathSegments, 'jsonpath')]);
    }

    const dateFormat = detectDateFormat(node);
    if (dateFormat) {
      insights.dateFields.push({ ...pathItem, format: dateFormat });
      dateFormatCounts.set(dateFormat, (dateFormatCounts.get(dateFormat) ?? 0) + 1);
    } else if (DATE_KEY_RE.test(node.key) && (node.type === 'string' || node.type === 'number')) {
      insights.dateFields.push({ ...pathItem, format: 'Unrecognized date-like value' });
      dateFormatCounts.set('Unrecognized date-like value', (dateFormatCounts.get('Unrecognized date-like value') ?? 0) + 1);
    }

    if (!node.children?.length) {
      deepestCandidates.push({
        path,
        jsonPath: PathUtils.getNodePath(pathSegments, 'jsonpath'),
        nodes: 1,
        depth,
      });
      return { nodes: 1, maxDepth: depth };
    } else {
      let nodes = 1;
      let maxDepth = depth;

      node.children.forEach((child) => {
        const childMetrics = visit(child, `${path}.${child.key}`, [...pathSegments, child.key], depth + 1);
        nodes += childMetrics.nodes;
        maxDepth = Math.max(maxDepth, childMetrics.maxDepth);
      });

      branchCandidates.push({
        path,
        jsonPath: PathUtils.getNodePath(pathSegments, 'jsonpath'),
        nodes,
        depth,
      });
      return { nodes, maxDepth };
    }
  };

  visit(root, 'root', [], 0);

  insights.duplicateIds = [...idPathsByValue.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([value, paths]) => ({ value, count: paths.length, paths }))
    .sort((a, b) => b.count - a.count);

  insights.deepestPaths = deepestCandidates
    .sort((a, b) => b.depth - a.depth)
    .slice(0, 5);

  insights.largestBranches = branchCandidates
    .sort((a, b) => b.nodes - a.nodes)
    .slice(0, 5);

  insights.dateFormats = [...dateFormatCounts.entries()]
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);

  return insights;
};
