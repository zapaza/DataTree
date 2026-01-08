import type { TTreeNode } from '@/types/store';

export interface ITraversalNode {
  path: string;
  node: TTreeNode;
  depth: number;
  parentPath: string | null;
}

export class TreeTraversal {
  public static getVisibleNodes(
    root: TTreeNode | null,
    expandedNodes: Set<string>
  ): ITraversalNode[] {
    if (!root) return [];

    const visibleNodes: ITraversalNode[] = [];

    const traverse = (
      node: TTreeNode,
      path: string,
      depth: number,
      parentPath: string | null
    ) => {
      visibleNodes.push({ path, node, depth, parentPath });

      // Если узел развернут и у него есть дети, идем глубже
      if (expandedNodes.has(path) && node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          traverse(child, `${path}.${child.key}`, depth + 1, path);
        });
      }
    };

    traverse(root, 'root', 0, null);

    return visibleNodes;
  }
}
