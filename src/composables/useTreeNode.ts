import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { TTreeNode } from '../types/store';

/**
 * Composable for tree node logic.
 * Handles expandable state, icons, colors and value formatting.
 *
 * @param nodeRef - Reactive reference or getter for the node data.
 * @param pathRef - Reactive reference or getter for the node path.
 */
export default function useTreeNode(
  nodeRef: MaybeRefOrGetter<TTreeNode>,
  pathRef: MaybeRefOrGetter<string>
) {
  const isExpandable = computed(() => {
    const node = toValue(nodeRef);
    return (node.type === 'object' || node.type === 'array') && (node.children?.length ?? 0) > 0;
  });

  const iconClass = computed(() => {
    const node = toValue(nodeRef);
    switch (node.type) {
      case 'object': return 'i-carbon-json';
      case 'array': return 'i-carbon-list-boxes';
      case 'string': return 'i-carbon-string-text';
      case 'number': return 'i-carbon-hashtag';
      case 'boolean': return 'i-carbon-boolean';
      case 'null': return 'i-carbon-undefined';
      default: return 'i-carbon-document';
    }
  });

  const valueColorClass = computed(() => {
    const node = toValue(nodeRef);
    switch (node.type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'null': return 'text-gray-400';
      default: return 'text-gray-800';
    }
  });

  const formattedValue = computed(() => {
    const node = toValue(nodeRef);
    if (node.type === 'object') return '{}';
    if (node.type === 'array') return '[]';
    if (node.type === 'string') return `"${node.value}"`;
    return String(node.value);
  });

  return {
    isExpandable,
    iconClass,
    valueColorClass,
    formattedValue
  };
}
