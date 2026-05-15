import type { TDataType } from '@/types/editor';
import type { TTreeNode, TTreeNodeType } from '@/types/store';
import PathUtils from '@/utils/path-utils';
import { treeNodeToValue } from '@/utils/tree-node-utils';

export interface TQueryResult {
  path: string;
  queryPath: string;
  key: string;
  type: TTreeNodeType;
  value: unknown;
}

export interface TQueryExecutionResult {
  success: boolean;
  results: TQueryResult[];
  error?: string;
}

type TNodeMatch = {
  node: TTreeNode;
  path: string;
  segments: string[];
};

type TJsonPathToken =
  | { type: 'child'; key: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }
  | { type: 'recursive'; key: string | '*' };

type TXPathToken =
  | { type: 'child'; key: string; index?: number }
  | { type: 'wildcard'; index?: number }
  | { type: 'recursive'; key: string | '*' };

const makeResult = (match: TNodeMatch): TQueryResult => ({
  path: match.path,
  queryPath: PathUtils.getNodePath(match.segments, 'jsonpath'),
  key: match.node.key,
  type: match.node.type,
  value: treeNodeToValue(match.node),
});

const childPath = (parent: TNodeMatch, child: TTreeNode): TNodeMatch => ({
  node: child,
  path: `${parent.path}.${child.key}`,
  segments: [...parent.segments, child.key],
});

const descendants = (match: TNodeMatch): TNodeMatch[] => {
  const items: TNodeMatch[] = [];
  const visit = (current: TNodeMatch) => {
    current.node.children?.forEach((child) => {
      const next = childPath(current, child);
      items.push(next);
      visit(next);
    });
  };
  visit(match);
  return items;
};

const normalizeXmlKey = (key: string): string => key.replace(/\[\d+\]$/, '');

const parseJsonPath = (query: string): TJsonPathToken[] => {
  const input = query.trim();
  if (!input.startsWith('$')) {
    throw new Error('JSONPath must start with $');
  }

  const tokens: TJsonPathToken[] = [];
  let index = 1;

  while (index < input.length) {
    const char = input[index];

    if (char === '.') {
      if (input[index + 1] === '.') {
        index += 2;
        if (input[index] === '*') {
          tokens.push({ type: 'recursive', key: '*' });
          index += 1;
          continue;
        }
        const match = input.slice(index).match(/^[$A-Z_a-z][$\w]*/);
        if (!match) throw new Error('Invalid recursive JSONPath segment');
        tokens.push({ type: 'recursive', key: match[0] });
        index += match[0].length;
        continue;
      }

      index += 1;
      if (input[index] === '*') {
        tokens.push({ type: 'wildcard' });
        index += 1;
        continue;
      }
      const match = input.slice(index).match(/^[$A-Z_a-z][$\w]*/);
      if (!match) throw new Error('Invalid JSONPath property segment');
      tokens.push({ type: 'child', key: match[0] });
      index += match[0].length;
      continue;
    }

    if (char === '[') {
      const closeIndex = input.indexOf(']', index);
      if (closeIndex === -1) throw new Error('Unclosed JSONPath bracket');
      const body = input.slice(index + 1, closeIndex).trim();

      if (body === '*') {
        tokens.push({ type: 'wildcard' });
      } else if (/^\d+$/.test(body)) {
        tokens.push({ type: 'index', index: Number.parseInt(body, 10) });
      } else {
        const quote = body[0];
        if ((quote !== '"' && quote !== "'") || body[body.length - 1] !== quote) {
          throw new Error('Bracket properties must be quoted');
        }
        tokens.push({ type: 'child', key: body.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\') });
      }
      index = closeIndex + 1;
      continue;
    }

    throw new Error(`Unexpected JSONPath token "${char}"`);
  }

  return tokens;
};

const parseXPathSegment = (segment: string): TXPathToken => {
  const indexMatch = segment.match(/^(.*)\[(\d+)\]$/);
  const rawKey = indexMatch?.[1] || segment;
  const xmlIndex = indexMatch?.[2] ? Number.parseInt(indexMatch[2], 10) - 1 : undefined;

  if (rawKey === '*') return { type: 'wildcard', index: xmlIndex };
  return { type: 'child', key: rawKey === 'text()' ? 'text' : rawKey, index: xmlIndex };
};

const parseXPath = (query: string): TXPathToken[] => {
  const input = query.trim();
  if (!input.startsWith('/')) {
    throw new Error('XPath must start with /');
  }
  if (input === '/') return [];

  const tokens: TXPathToken[] = [];
  let index = 0;

  while (index < input.length) {
    if (input.startsWith('//', index)) {
      index += 2;
      const nextSlash = input.indexOf('/', index);
      const segment = input.slice(index, nextSlash === -1 ? undefined : nextSlash);
      if (!segment) throw new Error('Recursive XPath segment is empty');
      tokens.push(segment === '*' ? { type: 'recursive', key: '*' } : { type: 'recursive', key: segment === 'text()' ? 'text' : segment });
      index = nextSlash === -1 ? input.length : nextSlash;
      continue;
    }

    if (input[index] !== '/') throw new Error('Invalid XPath separator');
    index += 1;
    const nextSlash = input.indexOf('/', index);
    const segment = input.slice(index, nextSlash === -1 ? undefined : nextSlash);
    if (!segment) throw new Error('XPath segment is empty');
    tokens.push(parseXPathSegment(segment));
    index = nextSlash === -1 ? input.length : nextSlash;
  }

  return tokens;
};

const executeJsonPath = (root: TTreeNode, query: string): TQueryResult[] => {
  const tokens = parseJsonPath(query);
  let current: TNodeMatch[] = [{ node: root, path: 'root', segments: [] }];

  tokens.forEach((token) => {
    if (token.type === 'child') {
      current = current.flatMap(match => match.node.children?.filter(child => child.key === token.key).map(child => childPath(match, child)) ?? []);
    } else if (token.type === 'index') {
      current = current.flatMap(match => match.node.children?.filter(child => child.key === `[${token.index}]`).map(child => childPath(match, child)) ?? []);
    } else if (token.type === 'wildcard') {
      current = current.flatMap(match => match.node.children?.map(child => childPath(match, child)) ?? []);
    } else {
      current = current.flatMap((match) => {
        return descendants(match).filter(item => token.key === '*' || item.node.key === token.key);
      });
    }
  });

  return current.map(makeResult);
};

const executeXPath = (root: TTreeNode, query: string): TQueryResult[] => {
  const tokens = parseXPath(query);
  let current: TNodeMatch[] = [{ node: root, path: 'root', segments: [] }];

  tokens.forEach((token) => {
    if (token.type === 'recursive') {
      current = current.flatMap((match) => {
        return descendants(match).filter(item => token.key === '*' || normalizeXmlKey(item.node.key) === token.key);
      });
      return;
    }

    current = current.flatMap((match) => {
      const children = match.node.children ?? [];
      const matchingChildren = token.type === 'wildcard'
        ? children
        : children.filter(child => normalizeXmlKey(child.key) === token.key);

      const selected: TTreeNode[] = token.index === undefined
        ? matchingChildren
        : matchingChildren[token.index] ? [matchingChildren[token.index]!] : [];

      return selected.map(child => childPath(match, child));
    });
  });

  return current.map((match) => ({
    ...makeResult(match),
    queryPath: PathUtils.getNodePath(match.segments, 'xpath'),
  }));
};

export const executeQuery = (root: TTreeNode | null, format: TDataType, query: string): TQueryExecutionResult => {
  if (!root) {
    return { success: false, results: [], error: 'No parsed payload' };
  }
  if (!query.trim()) {
    return { success: true, results: [] };
  }

  try {
    const results = format === 'xml'
      ? executeXPath(root, query)
      : executeJsonPath(root, query);

    return { success: true, results };
  } catch (error: unknown) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Invalid query',
    };
  }
};

export const queryResultsToCsv = (results: TQueryResult[]): string => {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    ['path', 'type', 'value'].map(escape).join(','),
    ...results.map(result => [
      result.queryPath,
      result.type,
      typeof result.value === 'string' ? result.value : JSON.stringify(result.value),
    ].map(value => escape(String(value))).join(',')),
  ].join('\n');
};
