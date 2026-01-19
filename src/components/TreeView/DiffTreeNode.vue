<template>
  <div
    class="diff-tree-node flex items-center h-6 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] group cursor-pointer transition-colors"
    :style="{ paddingLeft: `${depth * 16 + 4}px` }"
    @click="$emit('toggle-expand', node.path)"
  >
    <!-- Expand/Collapse Icon -->
    <div class="w-4 flex items-center justify-center mr-0.5">
      <div
        v-if="hasChildren"
        class="i-carbon-chevron-right text-xs transition-transform duration-200 text-muted group-hover:text-base"
        :class="{ 'rotate-90': isExpanded }"
      />
    </div>

    <!-- Diff Type Icon -->
    <div class="mr-2 flex items-center">
      <div v-if="node.diffType === 'added'" class="i-carbon-add-alt text-green-500 text-sm" title="Added" />
      <div v-else-if="node.diffType === 'removed'" class="i-carbon-subtract-alt text-red-500 text-sm" title="Removed" />
      <div v-else-if="node.diffType === 'modified'" class="i-carbon-renew text-amber-500 text-sm" title="Modified" />
      <div v-else class="i-carbon-dot-mark text-gray-300 dark:text-gray-600 text-[10px]" />
    </div>

    <!-- Node Content -->
    <div class="flex items-center gap-1.5 min-w-0 flex-1">
      <span class="text-xs font-mono font-medium text-base truncate">{{ node.key }}:</span>

      <!-- Value Display -->
      <div class="flex items-center gap-1 overflow-hidden min-w-0">
        <template v-if="node.diffType === 'modified'">
          <span class="text-[10px] font-mono text-red-400 line-through truncate opacity-70">
            {{ formatValue(node.oldValue) }}
          </span>
          <div class="i-carbon-arrow-right text-[10px] text-muted shrink-0" />
          <span class="text-[10px] font-mono text-green-500 truncate">
            {{ formatValue(node.newValue) }}
          </span>
        </template>
        <template v-else-if="node.diffType !== 'unchanged' || !hasChildren">
          <span
            class="text-[10px] font-mono truncate"
            :class="[
              node.diffType === 'added' ? 'text-green-500' :
              node.diffType === 'removed' ? 'text-red-400' :
              'text-muted'
            ]"
          >
            {{ formatValue(node.value !== undefined ? node.value : (node.diffType === 'added' ? node.newValue : node.oldValue)) }}
          </span>
        </template>
        <span v-if="hasChildren" class="text-[10px] text-light shrink-0">
          {{ node.type === 'array' ? '[' + node.children?.length + ']' : '{' + node.children?.length + '}' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TDiffTreeNode } from '@/types/diff';

const props = defineProps<{
  node: TDiffTreeNode;
  depth: number;
  isExpanded: boolean;
}>();

defineEmits(['toggle-expand']);

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);

/**
 * Formats value for display in the tree.
 */
const formatValue = (val: any): string => {
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'object') return Array.isArray(val) ? '[...]' : '{...}';
  return String(val);
};
</script>

<style scoped>
.diff-tree-node {
  user-select: none;
}
</style>
