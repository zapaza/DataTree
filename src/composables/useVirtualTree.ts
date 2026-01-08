import { computed, unref, type Ref } from 'vue';
import type { TTreeNode } from '../types/store';
import { useTreeStore } from '../stores/treeStore';

/**
 * Interface representing a node in the flattened virtual tree.
 */
export interface TVirtualNode {
  /** The original tree node data */
  node: TTreeNode;
  /** Full path to the node (dot notation) */
  path: string;
  /** Depth level in the tree (0 for root) */
  depth: number;
  /** Path to the parent node */
  parentPath: string | null;
}

/**
 * Composable that transforms a hierarchical tree structure into a flat list for virtualization.
 * Only includes nodes that are currently visible (i.e., their parents are expanded).
 *
 * @param rootNodeRef - Reactive reference to the root of the tree.
 * @returns An object containing the flattened list of visible nodes.
 */
export function useVirtualTree(rootNodeRef: TTreeNode | null | Ref<TTreeNode | null>) {
  const treeStore = useTreeStore();

  const flatList = computed(() => {
    const rootNode = unref(rootNodeRef);
    if (!rootNode) return [];

    const result: TVirtualNode[] = [];

    const flatten = (node: TTreeNode, path: string, depth: number, parentPath: string | null) => {
      result.push({ node, path, depth, parentPath });

      if (treeStore.isExpanded(path) && node.children) {
        node.children.forEach(child => {
          flatten(child, `${path}.${child.key}`, depth + 1, path);
        });
      }
    };

    flatten(rootNode, 'root', 0, null);
    return result;
  });

  return {
    flatList
  };
}
