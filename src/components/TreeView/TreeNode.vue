<template>
  <div class="tree-node font-mono text-sm" :style="{ paddingLeft: depth > 0 ? '1.25rem' : '0' }" :data-path="path">
    <div
      class="node-header flex items-center gap-1.5 py-0.5 rounded cursor-pointer group select-none transition-colors"
      :class="[
        isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800 shadow-sm' : 'hover:bg-gray-100/50 dark:hover:bg-white/5',
        isCurrentSearchMatch ? 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : (isSearchMatch ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''),
        { 'transition-all duration-200': settingsStore.settings.tree.animate }
      ]"
      @click="toggle"
      @contextmenu="handleContextMenu"
    >
      <!-- Стрелочка развертывания -->
      <div class="w-4 h-4 flex items-center justify-center">
        <div
          v-if="isExpandable"
          class="i-carbon-chevron-right text-[10px] text-light"
          :class="[
            { 'transition-transform duration-200': settingsStore.settings.tree.animate },
            { 'rotate-90': isExpanded }
          ]"
        />
      </div>

      <!-- Иконка типа -->
      <div v-if="settingsStore.settings.tree.showIcons" :class="[iconClass, isSelected ? 'text-blue-500' : 'text-light', 'text-sm']" />

      <!-- Ключ -->
      <span class="font-medium" :class="isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-base'">
        {{ node.key }}<span :class="isSelected ? 'text-blue-300 dark:text-blue-700' : 'text-light'">:</span>
      </span>

      <!-- Значение (если не раскрываемый узел) -->
      <span v-if="!isExpandable" :class="[isSelected ? 'text-blue-600 dark:text-blue-400' : valueColorClass, 'truncate']">
        {{ formattedValue }}
      </span>

      <span v-else-if="!isExpanded" :class="isSelected ? 'text-blue-400' : 'text-muted'" class="italic text-[11px]">
        {{ node.type === 'array' ? '[' + (node.children?.length || 0) + ']' : '{' + (node.children?.length || 0) + '}' }}
      </span>
    </div>

    <!-- Дочерние узлы -->
    <div
      v-if="isExpandable && isExpanded"
      class="children border-l border-light ml-2"
    >
      <TreeNode
        v-for="child in node.children"
        :key="getChildPath(child.key)"
        :node="child"
        :depth="depth + 1"
        :path="getChildPath(child.key)"
      />
    </div>

    <!-- Контекстное меню -->
    <Teleport to="body">
      <TreeNodeContextMenu
        v-if="contextMenu"
        :node="node"
        :path="path"
        :x="contextMenu.x"
        :y="contextMenu.y"
        @close="closeContextMenu"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TTreeNode } from '@/types/store';
import useTreeNode from '@/composables/useTreeNode';
import { useTreeStore } from '@/stores/treeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import TreeNodeContextMenu from './TreeNodeContextMenu.vue';

interface Props {
  node: TTreeNode;
  depth?: number;
  path?: string;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  path: 'root',
});

const treeStore = useTreeStore();
const settingsStore = useSettingsStore();
const { isExpandable, iconClass, valueColorClass, formattedValue } = useTreeNode(() => props.node, () => props.path);

const isExpanded = computed(() => treeStore.isExpanded(props.path));
const isSelected = computed(() => treeStore.selectedPath === props.path);

const contextMenu = ref<{ x: number, y: number } | null>(null);

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  treeStore.setSelectedPath(props.path);
  contextMenu.value = { x: e.clientX, y: e.clientY };
};

const closeContextMenu = () => {
  contextMenu.value = null;
};

const isSearchMatch = computed(() => {
  if (!treeStore.searchQuery) return false;
  return treeStore.searchResults.includes(props.path);
});

const isCurrentSearchMatch = computed(() => {
  if (!treeStore.searchQuery || treeStore.currentSearchIndex === -1) return false;
  return treeStore.searchResults[treeStore.currentSearchIndex] === props.path;
});

const toggle = () => {
  treeStore.setSelectedPath(props.path);
  if (isExpandable.value) {
    treeStore.toggleNode(props.path);
  }
};

const getChildPath = (childKey: string) => {
  return `${props.path}.${childKey}`;
};
</script>

<style scoped>
.tree-node {
  width: 100%;
}
</style>
