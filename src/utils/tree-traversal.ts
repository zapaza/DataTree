import type { TTreeNode } from '@/types/store';

export interface ITraversalNode {
  path: string;
  node: TTreeNode;
  depth: number;
  parentPath: string | null;
  pathSegments: string[];
}

export class TreeTraversal {
  public static getVisibleNodes(
    root: TTreeNode | null,
    expandedNodes: Set<string>
  ): ITraversalNode[] {
    if (!root) return [];

    const visibleNodes: ITraversalNode[] = [];
    const stack: ITraversalNode[] = [
      { node: root, path: 'root', depth: 0, parentPath: null, pathSegments: [] }
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;

      visibleNodes.push(current);

      if (!expandedNodes.has(current.path) || !current.node.children?.length) {
        continue;
      }

      for (let i = current.node.children.length - 1; i >= 0; i--) {
        const child = current.node.children[i];
        if (!child) continue;

        stack.push({
          node: child,
          path: `${current.path}.${child.key}`,
          depth: current.depth + 1,
          parentPath: current.path,
          pathSegments: [...current.pathSegments, child.key]
        });
      }
    }

    return visibleNodes;
  }
}
