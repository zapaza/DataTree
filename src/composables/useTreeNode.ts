import { computed } from 'vue';
import type { TTreeNode } from '../types/store';

export default function useTreeNode(node: TTreeNode, path: string) {
  const isExpandable = computed(() => {
    return (node.type === 'object' || node.type === 'array') && (node.children?.length ?? 0) > 0;
  });

  const iconClass = computed(() => {
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
    switch (node.type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'null': return 'text-gray-400';
      default: return 'text-gray-800';
    }
  });

  const formattedValue = computed(() => {
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
