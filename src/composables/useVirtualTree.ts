import { shallowRef, unref, watch, type Ref } from 'vue';
import type { TTreeNode } from '../types/store';
import { useTreeStore } from '../stores/treeStore';
import { TreeTraversal, type ITraversalNode } from '../utils/tree-traversal';

/**
 * Interface representing a node in the flattened virtual tree.
 */
export type TVirtualNode = ITraversalNode;

/**
 * Composable that transforms a hierarchical tree structure into a flat list for virtualization.
 * Only includes nodes that are currently visible (i.e., their parents are expanded).
 *
 * @param rootNodeRef - Reactive reference to the root of the tree.
 * @returns An object containing the flattened list of visible nodes.
 */
export function useVirtualTree(rootNodeRef: TTreeNode | null | Ref<TTreeNode | null>) {
  const treeStore = useTreeStore();
  const flatList = shallowRef<TVirtualNode[]>([]);
  let previousExpandedNodes = new Set(treeStore.expandedNodes);

  const rebuildFlatList = () => {
    const rootNode = unref(rootNodeRef);
    flatList.value = rootNode
      ? TreeTraversal.getVisibleNodes(rootNode, treeStore.expandedNodes)
      : [];
  };

  const isDescendant = (node: TVirtualNode, parent: TVirtualNode) => {
    return node.pathSegments.length > parent.pathSegments.length
      && parent.pathSegments.every((segment, index) => node.pathSegments[index] === segment);
  };

  const getVisibleChildren = (parent: TVirtualNode, expandedNodes: Set<string>): TVirtualNode[] => {
    const children = parent.node.children;
    if (!children?.length) return [];

    const result: TVirtualNode[] = [];
    const stack: TVirtualNode[] = [];

    for (let index = children.length - 1; index >= 0; index--) {
      const child = children[index];
      if (!child) continue;
      stack.push({
        node: child,
        path: `${parent.path}.${child.key}`,
        depth: parent.depth + 1,
        parentPath: parent.path,
        pathSegments: [...parent.pathSegments, child.key],
      });
    }

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      result.push(current);

      if (!expandedNodes.has(current.path) || !current.node.children?.length) {
        continue;
      }

      for (let index = current.node.children.length - 1; index >= 0; index--) {
        const child = current.node.children[index];
        if (!child) continue;
        stack.push({
          node: child,
          path: `${current.path}.${child.key}`,
          depth: current.depth + 1,
          parentPath: current.path,
          pathSegments: [...current.pathSegments, child.key],
        });
      }
    }

    return result;
  };

  const applySingleExpand = (path: string) => {
    const parentIndex = flatList.value.findIndex(item => item.path === path);
    const parent = flatList.value[parentIndex];
    if (parentIndex === -1 || !parent?.node.children?.length) {
      rebuildFlatList();
      return;
    }

    const visibleChildren = getVisibleChildren(parent, treeStore.expandedNodes);
    flatList.value = [
      ...flatList.value.slice(0, parentIndex + 1),
      ...visibleChildren,
      ...flatList.value.slice(parentIndex + 1),
    ];
  };

  const applySingleCollapse = (path: string) => {
    const parentIndex = flatList.value.findIndex(item => item.path === path);
    const parent = flatList.value[parentIndex];
    if (parentIndex === -1 || !parent) {
      rebuildFlatList();
      return;
    }

    let removeCount = 0;
    for (let index = parentIndex + 1; index < flatList.value.length; index++) {
      const current = flatList.value[index];
      if (!current || !isDescendant(current, parent)) break;
      removeCount++;
    }

    if (removeCount === 0) return;

    flatList.value = [
      ...flatList.value.slice(0, parentIndex + 1),
      ...flatList.value.slice(parentIndex + 1 + removeCount),
    ];
  };

  watch(
    () => unref(rootNodeRef),
    () => {
      rebuildFlatList();
      previousExpandedNodes = new Set(treeStore.expandedNodes);
    },
    { immediate: true }
  );

  watch(() => treeStore.expandedNodes, (expandedNodes) => {
    const added = [...expandedNodes].filter(path => !previousExpandedNodes.has(path));
    const removed = [...previousExpandedNodes].filter(path => !expandedNodes.has(path));

    if (added.length === 1 && removed.length === 0) {
      const path = added[0];
      if (path) applySingleExpand(path);
    } else if (removed.length === 1 && added.length === 0) {
      const path = removed[0];
      if (path) applySingleCollapse(path);
    } else {
      rebuildFlatList();
    }

    previousExpandedNodes = new Set(expandedNodes);
  });

  return {
    flatList
  };
}
