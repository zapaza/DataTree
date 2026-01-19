import { computed, unref, type Ref, ref, watch } from 'vue';
import type { TDiffTreeNode, TFlatDiffNode } from '../types/diff';

/**
 * Composable for managing a virtualized diff tree.
 * Handles flattening, expansion, and filtering of diff nodes.
 */
export function useDiffVirtualTree(
  rootNodeRef: Ref<TDiffTreeNode | null>,
  showOnlyChanges: Ref<boolean>
) {
  const expandedPaths = ref<Set<string>>(new Set(['']));

  const isExpanded = (path: string) => expandedPaths.value.has(path);

  const toggleExpand = (path: string) => {
    if (expandedPaths.value.has(path)) {
      expandedPaths.value.delete(path);
    } else {
      expandedPaths.value.add(path);
    }
  };

  const expandAll = () => {
    const root = unref(rootNodeRef);
    if (!root) return;

    const paths = new Set<string>();
    const traverse = (node: TDiffTreeNode) => {
      if (node.children && node.children.length > 0) {
        paths.add(node.path);
        node.children.forEach(traverse);
      }
    };
    traverse(root);
    expandedPaths.value = paths;
  };

  const collapseAll = () => {
    expandedPaths.value = new Set(['']);
  };

  /**
   * Checks if a node or any of its descendants have changes.
   */
  const hasChangesDeep = (node: TDiffTreeNode): boolean => {
    if (node.diffType !== 'unchanged') return true;
    if (node.children) {
      return node.children.some(hasChangesDeep);
    }
    return false;
  };

  const flatList = computed(() => {
    const rootNode = unref(rootNodeRef);
    if (!rootNode) return [];

    const result: TFlatDiffNode[] = [];
    const onlyChanges = unref(showOnlyChanges);

    const flatten = (node: TDiffTreeNode, depth: number) => {
      if (onlyChanges && !hasChangesDeep(node)) {
        return;
      }

      result.push({
        id: node.path,
        node,
        depth,
        path: node.path
      });

      if (isExpanded(node.path) && node.children) {
        node.children.forEach(child => {
          flatten(child, depth + 1);
        });
      }
    };

    flatten(rootNode, 0);
    return result;
  });

  // Automatically expand nodes with changes when root changes
  watch(rootNodeRef, (newRoot) => {
    if (newRoot) {
      const paths = new Set<string>(['']);
      const traverse = (node: TDiffTreeNode) => {
        if (node.diffType !== 'unchanged' && node.children) {
          paths.add(node.path);
        }
        // Also expand parents of changed nodes
        if (node.children?.some(hasChangesDeep)) {
            paths.add(node.path);
        }
        node.children?.forEach(traverse);
      };
      traverse(newRoot);
      expandedPaths.value = paths;
    }
  }, { immediate: true });

  return {
    flatList,
    expandedPaths,
    isExpanded,
    toggleExpand,
    expandAll,
    collapseAll
  };
}

export default useDiffVirtualTree;
