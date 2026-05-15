import type { JsonArray, JsonObject, JsonValue } from '@/types/json';
import type { TTreeNode } from '@/types/store';

export const treeNodeToValue = (node: TTreeNode): JsonValue => {
  const createValue = (currentNode: TTreeNode): JsonValue => {
    if (currentNode.type === 'object') return {};
    if (currentNode.type === 'array') return [];
    return currentNode.value;
  };

  const rootValue = createValue(node);
  if (node.type !== 'object' && node.type !== 'array') return rootValue;

  const stack: Array<{ source: TTreeNode; target: JsonObject | JsonArray }> = [
    { source: node, target: rootValue as JsonObject | JsonArray },
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    current.source.children?.forEach((child, fallbackIndex) => {
      const childValue = createValue(child);

      if (Array.isArray(current.target)) {
        const match = child.key.match(/^\[(\d+)\]$/);
        const index = match?.[1] ? Number.parseInt(match[1], 10) : fallbackIndex;
        current.target[index] = childValue;
      } else {
        current.target[child.key] = childValue;
      }

      if ((child.type === 'object' || child.type === 'array') && childValue !== null) {
        stack.push({ source: child, target: childValue as JsonObject | JsonArray });
      }
    });
  }

  return rootValue;
};

export const stringifyTreeNodeValue = (node: TTreeNode): string => {
  const value = treeNodeToValue(node);
  if (node.type === 'string') return String(value ?? '');
  if (node.type === 'object' || node.type === 'array') return JSON.stringify(value, null, 2);
  return String(value);
};

export const stringifyTreeNodeAsJson = (node: TTreeNode, path: string, pathSegments: string[]): string => {
  return JSON.stringify({
    key: node.key,
    path,
    segments: pathSegments,
    type: node.type,
    value: treeNodeToValue(node),
  }, null, 2);
};

export type TExpandDepth = 1 | 2 | 3 | 'all';

export const collectExpandablePaths = (
  node: TTreeNode | null,
  maxDepth: TExpandDepth,
  currentPath = 'root',
  currentDepth = 0,
  paths: string[] = []
): string[] => {
  if (!node?.children?.length) return paths;

  const stack: Array<{ currentNode: TTreeNode; path: string; depth: number }> = [
    { currentNode: node, path: currentPath, depth: currentDepth },
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current?.currentNode.children?.length) continue;

    if (maxDepth !== 'all' && current.depth >= maxDepth) continue;

    paths.push(current.path);

    for (let index = current.currentNode.children.length - 1; index >= 0; index--) {
      const child = current.currentNode.children[index];
      if (child?.children?.length) {
        stack.push({
          currentNode: child,
          path: `${current.path}.${child.key}`,
          depth: current.depth + 1,
        });
      }
    }
  }

  return paths;
};
